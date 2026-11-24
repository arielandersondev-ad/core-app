import { Injectable } from '@nestjs/common';
import {
  FDI_TOOTH_PATTERN,
  type ClinicalEncounterProcedure,
  type ProcedureTargetType,
} from '../../domain/entities/clinical-encounter.entity.js';
import {
  ClinicalEncounterRepository,
  type EncounterScope,
  type ProcedureCreateData,
} from '../../domain/repositories/clinical-encounter.repository.js';
import {
  ClinicalEncounterAccess,
  normalizeText,
} from '../clinical-encounter-access.js';
import { ClinicalErrors } from '../clinical-encounter.errors.js';

export type ProcedureDraft = {
  targetType: ProcedureTargetType;
  toothNumber?: string | null;
  targetDescription?: string | null;
  description: string;
  treatmentProcedureId?: string | null;
  /** Precio nominal opcional; con precio, la moneda es obligatoria. */
  priceMinor?: number | null;
  currency?: string | null;
};

export type AddClinicalEncounterProceduresCommand = EncounterScope & {
  encounterId: string;
  authorizedBranchIds: string[];
  procedures: ProcedureDraft[];
  actorMembershipId: string;
};

@Injectable()
export class AddClinicalEncounterProceduresUseCase {
  constructor(
    private readonly access: ClinicalEncounterAccess,
    private readonly encounterRepository: ClinicalEncounterRepository,
  ) {}

  async execute(
    command: AddClinicalEncounterProceduresCommand,
  ): Promise<ClinicalEncounterProcedure[]> {
    const scope: EncounterScope = {
      organizationId: command.organizationId,
      patientId: command.patientId,
    };
    const procedures = command.procedures.map(toCreateData);
    assertSingleCurrency(procedures);
    const encounter = await this.access.loadEncounter(
      scope,
      command.encounterId,
      command.authorizedBranchIds,
    );
    if (encounter.status !== 'IN_PROGRESS') {
      throw ClinicalErrors.notInProgress('registrar procedimientos');
    }
    // El total de la atención se propone como cobro: una sola moneda.
    assertSingleCurrency([
      ...encounter.procedures.filter(
        (procedure) => procedure.status !== 'VOIDED',
      ),
      ...procedures,
    ]);

    const plannedIds = [
      ...new Set(
        procedures
          .map((procedure) => procedure.treatmentProcedureId)
          .filter((id): id is string => id !== null),
      ),
    ];
    if (plannedIds.length > 0) {
      const planned = await this.encounterRepository.findTreatmentProcedures(
        scope,
        plannedIds,
      );
      if (planned.length !== plannedIds.length) {
        throw ClinicalErrors.treatmentProcedureNotFound();
      }
      const mismatch = planned.some(
        (item) =>
          item.status === 'CANCELED' ||
          (encounter.treatmentId !== null &&
            item.treatmentId !== encounter.treatmentId),
      );
      if (mismatch) throw ClinicalErrors.treatmentProcedureMismatch();
    }

    const created = await this.encounterRepository.addProcedures(
      scope,
      encounter.id,
      encounter.rowVersion,
      procedures,
      command.actorMembershipId,
    );
    if (!created) throw ClinicalErrors.encounterChanged();
    return created;
  }
}

/** Regla de objetivo: pieza FDI solo y siempre para `TOOTH`. */
export function toCreateData(draft: ProcedureDraft): ProcedureCreateData {
  const toothNumber = normalizeText(draft.toothNumber);
  const description = normalizeText(draft.description);
  if (!description) {
    throw ClinicalErrors.invalidProcedureTarget(
      'La descripción del procedimiento es obligatoria.',
    );
  }
  if (draft.targetType === 'TOOTH') {
    if (!toothNumber || !FDI_TOOTH_PATTERN.test(toothNumber)) {
      throw ClinicalErrors.invalidProcedureTarget(
        'La pieza dental debe ser un número FDI válido.',
      );
    }
  } else if (toothNumber) {
    throw ClinicalErrors.invalidProcedureTarget(
      'Solo los procedimientos sobre una pieza (TOOTH) admiten número de pieza.',
    );
  }
  return {
    targetType: draft.targetType,
    toothNumber,
    targetDescription: normalizeText(draft.targetDescription),
    description,
    treatmentProcedureId: draft.treatmentProcedureId ?? null,
    ...resolvePrice(draft),
  };
}

/** Importe en unidades menores (`int4`). */
const MAX_PRICE_MINOR = 2_147_483_647;

/** Sin precio, ambos nulos; con precio, entero >= 0 y moneda de tres letras. */
function resolvePrice(
  draft: Pick<ProcedureDraft, 'priceMinor' | 'currency'>,
): Pick<ProcedureCreateData, 'priceMinor' | 'currency'> {
  const currency = normalizeText(draft.currency);
  if (draft.priceMinor === undefined || draft.priceMinor === null) {
    if (currency) {
      throw ClinicalErrors.invalidProcedurePrice(
        'La moneda solo se indica junto con el precio.',
      );
    }
    return { priceMinor: null, currency: null };
  }
  if (
    !Number.isInteger(draft.priceMinor) ||
    draft.priceMinor < 0 ||
    draft.priceMinor > MAX_PRICE_MINOR
  ) {
    throw ClinicalErrors.invalidProcedurePrice(
      'El precio debe ser un entero en unidades menores, mayor o igual a cero.',
    );
  }
  if (!currency || !/^[A-Z]{3}$/.test(currency)) {
    throw ClinicalErrors.invalidProcedurePrice(
      'La moneda es obligatoria con el precio: tres letras mayúsculas (ej. BOB).',
    );
  }
  return { priceMinor: draft.priceMinor, currency };
}

/** Los precios de una atención se suman, así que comparten moneda. */
export function assertSingleCurrency(
  procedures: { currency: string | null }[],
): void {
  let first: string | null = null;
  for (const procedure of procedures) {
    if (procedure.currency === null) continue;
    first ??= procedure.currency;
    if (procedure.currency !== first) {
      throw ClinicalErrors.procedureCurrencyMismatch(first);
    }
  }
}
