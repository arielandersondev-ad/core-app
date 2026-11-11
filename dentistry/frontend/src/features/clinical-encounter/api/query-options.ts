import { keepPreviousData, mutationOptions, queryOptions, type QueryClient } from "@tanstack/react-query";
import { patientQueryKeys } from "@/features/patient/api/query-options";
import { ClinicalEncounterPartialCreateError } from "@/features/clinical-encounter/services/clinical-encounter.error";
import { getClinicalEncounterDataSource } from "@/features/clinical-encounter/services/clinical-encounter.service";
import { fetchCurrentSession } from "@/infrastructure/auth/client-session";
import { assertSameSessionContext } from "@/infrastructure/auth/session-context";
import type { CurrentSession } from "@/infrastructure/auth/session";
import type {
  AddClinicalEncounterProceduresVariables,
  AddClinicalFileInput,
  ClinicalEncounterListFilters,
  CompleteClinicalEncounterVariables,
  CreateClinicalEncounterWithProceduresInput,
  PatientHealthProfileInput,
  VoidClinicalEncounterVariables,
} from "@/features/clinical-encounter/types/clinical-encounter";

const ROOT = "clinical-encounters";

export const clinicalEncounterQueryKeys = {
  all: (patientId: string) => [ROOT, patientId] as const,
  lists: (patientId: string) => [ROOT, patientId, "list"] as const,
  list: (patientId: string, filters?: ClinicalEncounterListFilters) =>
    [ROOT, patientId, "list", filters ?? {}] as const,
  detail: (patientId: string, encounterId: string) => [ROOT, patientId, "detail", encounterId] as const,
  healthProfile: (patientId: string) => [ROOT, patientId, "health-profile"] as const,
  files: (patientId: string, encounterId?: string) =>
    [ROOT, patientId, "files", encounterId ?? "all"] as const,
  filesRoot: (patientId: string) => [ROOT, patientId, "files"] as const,
  referenceData: (patientId: string) => [ROOT, patientId, "reference-data"] as const,
};

/** Evita guardar con una sesión distinta de la que abrió el formulario. */
async function assertSessionUnchanged(session: CurrentSession): Promise<void> {
  assertSameSessionContext(session, await fetchCurrentSession());
}

function invalidatePatientDetail(client: QueryClient, patientId: string) {
  return client.invalidateQueries({ queryKey: patientQueryKeys.detail(patientId) });
}

export function clinicalEncounterListOptions(patientId: string, filters?: ClinicalEncounterListFilters) {
  return queryOptions({
    queryKey: clinicalEncounterQueryKeys.list(patientId, filters),
    queryFn: () => getClinicalEncounterDataSource().list(patientId, filters),
    placeholderData: keepPreviousData,
  });
}

export function clinicalEncounterDetailOptions(patientId: string, encounterId: string) {
  return queryOptions({
    queryKey: clinicalEncounterQueryKeys.detail(patientId, encounterId),
    queryFn: () => getClinicalEncounterDataSource().get(patientId, encounterId),
    // Un 404 debe mostrarse de inmediato, sin reintentos que retrasen el mensaje.
    retry: false,
  });
}

export function patientHealthProfileOptions(patientId: string) {
  return queryOptions({
    queryKey: clinicalEncounterQueryKeys.healthProfile(patientId),
    queryFn: () => getClinicalEncounterDataSource().getHealthProfile(patientId),
  });
}

export function clinicalFilesOptions(patientId: string, encounterId?: string) {
  return queryOptions({
    queryKey: clinicalEncounterQueryKeys.files(patientId, encounterId),
    queryFn: () => getClinicalEncounterDataSource().listFiles(patientId, encounterId),
    // Los archivos de una atención inexistente no deben reintentarse en vano.
    retry: false,
  });
}

export function encounterReferenceDataOptions(patientId: string) {
  return queryOptions({
    queryKey: clinicalEncounterQueryKeys.referenceData(patientId),
    queryFn: () => getClinicalEncounterDataSource().getReferenceData(patientId),
  });
}

export function clinicalEncounterCreateOptions(client: QueryClient, session: CurrentSession) {
  return mutationOptions({
    mutationFn: async ({ encounter, procedures }: CreateClinicalEncounterWithProceduresInput) => {
      await assertSessionUnchanged(session);
      const source = getClinicalEncounterDataSource();
      const created = await source.create(encounter);
      const detailKey = clinicalEncounterQueryKeys.detail(encounter.patientId, created.id);

      // El detalle queda disponible aunque falle el registro posterior de procedimientos.
      client.setQueryData(detailKey, created);

      if (procedures.length === 0) return created;

      try {
        const createdProcedures = await source.addProcedures(
          encounter.patientId,
          created.id,
          procedures,
        );
        return { ...created, procedures: createdProcedures };
      } catch (error) {
        await Promise.all([
          client.invalidateQueries({
            queryKey: clinicalEncounterQueryKeys.lists(encounter.patientId),
          }),
          client.invalidateQueries({ queryKey: detailKey }),
          invalidatePatientDetail(client, encounter.patientId),
        ]);
        throw new ClinicalEncounterPartialCreateError(
          "La atención se creó, pero no se pudieron registrar los procedimientos. Revisa el detalle antes de reintentar.",
          created.id,
          { cause: error },
        );
      }
    },
    retry: false,
    onSuccess: async (encounter) => {
      client.setQueryData(
        clinicalEncounterQueryKeys.detail(encounter.patientId, encounter.id),
        encounter,
      );
      await Promise.all([
        client.invalidateQueries({
          queryKey: clinicalEncounterQueryKeys.lists(encounter.patientId),
        }),
        invalidatePatientDetail(client, encounter.patientId),
      ]);
    },
  });
}

export function clinicalEncounterCompleteOptions(
  client: QueryClient,
  session: CurrentSession,
  patientId: string,
) {
  return mutationOptions({
    mutationFn: async ({ encounterId, input }: CompleteClinicalEncounterVariables) => {
      await assertSessionUnchanged(session);
      return getClinicalEncounterDataSource().complete(patientId, encounterId, input);
    },
    retry: false,
    onSuccess: async (_encounter, { encounterId }) => {
      await Promise.all([
        client.invalidateQueries({
          queryKey: clinicalEncounterQueryKeys.detail(patientId, encounterId),
        }),
        client.invalidateQueries({
          queryKey: clinicalEncounterQueryKeys.lists(patientId),
        }),
        invalidatePatientDetail(client, patientId),
      ]);
    },
  });
}

export function clinicalEncounterVoidOptions(
  client: QueryClient,
  session: CurrentSession,
  patientId: string,
) {
  return mutationOptions({
    mutationFn: async ({ encounterId, input }: VoidClinicalEncounterVariables) => {
      await assertSessionUnchanged(session);
      return getClinicalEncounterDataSource().void(patientId, encounterId, input);
    },
    retry: false,
    onSuccess: async (_encounter, { encounterId }) => {
      await Promise.all([
        client.invalidateQueries({
          queryKey: clinicalEncounterQueryKeys.detail(patientId, encounterId),
        }),
        client.invalidateQueries({
          queryKey: clinicalEncounterQueryKeys.lists(patientId),
        }),
        invalidatePatientDetail(client, patientId),
      ]);
    },
  });
}

export function clinicalEncounterAddProceduresOptions(
  client: QueryClient,
  session: CurrentSession,
  patientId: string,
) {
  return mutationOptions({
    mutationFn: async ({ encounterId, procedures }: AddClinicalEncounterProceduresVariables) => {
      await assertSessionUnchanged(session);
      return getClinicalEncounterDataSource().addProcedures(patientId, encounterId, procedures);
    },
    retry: false,
    onSuccess: async (_procedures, { encounterId }) => {
      await Promise.all([
        client.invalidateQueries({
          queryKey: clinicalEncounterQueryKeys.detail(patientId, encounterId),
        }),
        client.invalidateQueries({
          queryKey: clinicalEncounterQueryKeys.lists(patientId),
        }),
        invalidatePatientDetail(client, patientId),
      ]);
    },
  });
}

export function patientHealthProfileSaveOptions(
  client: QueryClient,
  session: CurrentSession,
  patientId: string,
) {
  return mutationOptions({
    mutationFn: async (input: PatientHealthProfileInput) => {
      await assertSessionUnchanged(session);
      return getClinicalEncounterDataSource().saveHealthProfile(patientId, input);
    },
    retry: false,
    onSuccess: async (profile) => {
      // La respuesta ya trae el perfil autoritativo con updatedAt/rowVersion.
      client.setQueryData(clinicalEncounterQueryKeys.healthProfile(patientId), profile);
      await invalidatePatientDetail(client, patientId);
    },
  });
}

export function clinicalFileAddOptions(
  client: QueryClient,
  session: CurrentSession,
  patientId: string,
) {
  return mutationOptions({
    mutationFn: async (input: AddClinicalFileInput) => {
      await assertSessionUnchanged(session);
      return getClinicalEncounterDataSource().addFile(patientId, input);
    },
    retry: false,
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({
          queryKey: clinicalEncounterQueryKeys.filesRoot(patientId),
        }),
        invalidatePatientDetail(client, patientId),
      ]);
    },
  });
}

export function clinicalFileRemoveOptions(
  client: QueryClient,
  session: CurrentSession,
  patientId: string,
) {
  return mutationOptions({
    mutationFn: async (fileId: string) => {
      await assertSessionUnchanged(session);
      return getClinicalEncounterDataSource().removeFile(patientId, fileId);
    },
    retry: false,
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({
          queryKey: clinicalEncounterQueryKeys.filesRoot(patientId),
        }),
        invalidatePatientDetail(client, patientId),
      ]);
    },
  });
}
