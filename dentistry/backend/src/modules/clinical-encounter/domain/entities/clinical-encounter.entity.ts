export type ClinicalEncounterStatus = 'IN_PROGRESS' | 'COMPLETED';

export interface ClinicalEncounterProps {
  id?: string;
  organizationId: string;
  branchId: string;
  patientId: string;
  appointmentId?: string | null;
  treatmentId?: string | null;
  professionalMembershipId: string;
  startedAt: Date;
  endedAt?: Date | null;
  chiefComplaint?: string | null;
  diagnosis?: string | null;
  procedurePerformed?: string | null;
  evolution?: string | null;
  recommendations?: string | null;
  notes?: string | null;
  createdByMembershipId: string;
  updatedByMembershipId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

// El contrato de ClinicalEncounter no tiene columna `status`: el estado se
// deriva de `endedAt`. Una consulta con endedAt nulo sigue abierta.
export class ClinicalEncounter {
  readonly id: string;
  readonly organizationId: string;
  readonly branchId: string;
  readonly patientId: string;
  readonly appointmentId: string | null;
  readonly treatmentId: string | null;
  readonly professionalMembershipId: string;
  readonly startedAt: Date;
  readonly createdByMembershipId: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  private _endedAt: Date | null;
  private _chiefComplaint: string | null;
  private _diagnosis: string | null;
  private _procedurePerformed: string | null;
  private _evolution: string | null;
  private _recommendations: string | null;
  private _notes: string | null;
  private _updatedByMembershipId: string | null;

  constructor(props: ClinicalEncounterProps) {
    this.id = props.id ?? '';
    this.organizationId = props.organizationId;
    this.branchId = props.branchId;
    this.patientId = props.patientId;
    this.appointmentId = props.appointmentId ?? null;
    this.treatmentId = props.treatmentId ?? null;
    this.professionalMembershipId = props.professionalMembershipId;
    this.startedAt = props.startedAt;
    this._endedAt = props.endedAt ?? null;
    this._chiefComplaint = props.chiefComplaint ?? null;
    this._diagnosis = props.diagnosis ?? null;
    this._procedurePerformed = props.procedurePerformed ?? null;
    this._evolution = props.evolution ?? null;
    this._recommendations = props.recommendations ?? null;
    this._notes = props.notes ?? null;
    this.createdByMembershipId = props.createdByMembershipId;
    this._updatedByMembershipId = props.updatedByMembershipId ?? null;
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
  }

  get status(): ClinicalEncounterStatus {
    return this._endedAt === null ? 'IN_PROGRESS' : 'COMPLETED';
  }

  get endedAt(): Date | null {
    return this._endedAt;
  }

  get chiefComplaint(): string | null {
    return this._chiefComplaint;
  }

  get diagnosis(): string | null {
    return this._diagnosis;
  }

  get procedurePerformed(): string | null {
    return this._procedurePerformed;
  }

  get evolution(): string | null {
    return this._evolution;
  }

  get recommendations(): string | null {
    return this._recommendations;
  }

  get notes(): string | null {
    return this._notes;
  }

  get updatedByMembershipId(): string | null {
    return this._updatedByMembershipId;
  }

  get isOpen(): boolean {
    return this._endedAt === null;
  }

  recordChiefComplaint(chiefComplaint: string): void {
    this.assertOpen('El motivo de consulta');
    this._chiefComplaint = chiefComplaint;
  }

  recordDiagnosis(diagnosis: string): void {
    this.assertOpen('El diagnóstico');
    this._diagnosis = diagnosis;
  }

  recordProcedure(procedurePerformed: string): void {
    this.assertOpen('El procedimiento realizado');
    this._procedurePerformed = procedurePerformed;
  }

  recordEvolution(evolution: string): void {
    this.assertOpen('La evolución');
    this._evolution = evolution;
  }

  recordRecommendations(recommendations: string): void {
    this.assertOpen('Las recomendaciones');
    this._recommendations = recommendations;
  }

  updateNotes(notes: string): void {
    this.assertOpen('Las notas');
    this._notes = notes;
  }

  complete(updatedByMembershipId: string, endedAt?: Date): void {
    if (!this.isOpen) {
      throw new Error('La consulta ya fue completada.');
    }
    if (!this._diagnosis) {
      throw new Error('No se puede completar una consulta sin diagnóstico.');
    }
    if (!this._procedurePerformed) {
      throw new Error('No se puede completar una consulta sin procedimiento realizado.');
    }

    const end = endedAt ?? new Date();
    if (end < this.startedAt) {
      throw new Error('La hora de cierre no puede ser anterior al inicio de la consulta.');
    }

    this._endedAt = end;
    this._updatedByMembershipId = updatedByMembershipId;
  }

  private assertOpen(fieldLabel: string): void {
    if (!this.isOpen) {
      throw new Error(`${fieldLabel} no puede modificarse en una consulta ya completada.`);
    }
  }
}