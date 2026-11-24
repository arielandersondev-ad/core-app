import { keepPreviousData, mutationOptions, queryOptions, type QueryClient } from "@tanstack/react-query";
import { billingQueryKeys } from "@/features/billing/api/query-options";
import { patientQueryKeys } from "@/features/patient/api/query-options";
import { appointmentQueryKeys } from "@/modules/clinic/hooks/use-appointments";
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
  UpdateClinicalFileInput,
  RegisterQuickProcedureInput,
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
  fileAccessUrl: (patientId: string, fileId: string, disposition: "inline" | "attachment") =>
    [ROOT, patientId, "files", "access-url", fileId, disposition] as const,
  fileQuota: () => [ROOT, "files-quota"] as const,
  referenceData: (patientId: string) => [ROOT, patientId, "reference-data"] as const,
};

/** Evita guardar con una sesión distinta de la que abrió el formulario. */
async function assertSessionUnchanged(session: CurrentSession): Promise<void> {
  assertSameSessionContext(session, await fetchCurrentSession());
}

function invalidatePatientDetail(client: QueryClient, patientId: string) {
  return client.invalidateQueries({ queryKey: patientQueryKeys.detail(patientId) });
}

/**
 * La propuesta de cobro depende de los procedimientos y del estado de la atención: sin esto el
 * cobro abre con la propuesta vieja (sin total) tras agregar procedimientos o completar.
 */
function invalidateBilling(client: QueryClient, patientId: string) {
  return client.invalidateQueries({ queryKey: billingQueryKeys.all(patientId) });
}

/** El backend avanza el estado de la cita vinculada junto con la atención. */
function invalidateAppointments(client: QueryClient) {
  return client.invalidateQueries({ queryKey: appointmentQueryKeys.all });
}

export function clinicalEncounterListOptions(patientId: string, filters?: ClinicalEncounterListFilters) {
  return queryOptions({
    queryKey: clinicalEncounterQueryKeys.list(patientId, filters),
    queryFn: () => getClinicalEncounterDataSource().list(patientId, filters),
    placeholderData: keepPreviousData,
  });
}

/**
 * Atención vinculada a una cita, o null si todavía no tiene. Vive bajo las
 * listas del paciente, así que se refresca con cada alta, cierre o anulación.
 */
export function appointmentEncounterOptions(patientId: string, appointmentId: string) {
  const filters: ClinicalEncounterListFilters = { appointmentId, pageSize: 1 };
  return queryOptions({
    queryKey: clinicalEncounterQueryKeys.list(patientId, filters),
    queryFn: async () => {
      const page = await getClinicalEncounterDataSource().list(patientId, filters);
      return page.items[0] ?? null;
    },
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

/**
 * Enlace firmado de lectura (vigencia 2 min). Se renueva antes de vencer y no se
 * conserva en caché al cerrar la vista previa.
 */
export function clinicalFileAccessUrlOptions(
  patientId: string,
  fileId: string,
  disposition: "inline" | "attachment" = "inline",
) {
  return queryOptions({
    queryKey: clinicalEncounterQueryKeys.fileAccessUrl(patientId, fileId, disposition),
    queryFn: () => getClinicalEncounterDataSource().getFileAccessUrl(patientId, fileId, disposition),
    staleTime: 60_000,
    gcTime: 0,
    retry: false,
  });
}

export function clinicalFileQuotaOptions() {
  return queryOptions({
    queryKey: clinicalEncounterQueryKeys.fileQuota(),
    queryFn: () => getClinicalEncounterDataSource().getFileQuota(),
    staleTime: 30_000,
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
        ...(encounter.appointmentId ? [invalidateAppointments(client)] : []),
      ]);
    },
  });
}

export function clinicalEncounterQuickProcedureOptions(
  client: QueryClient,
  session: CurrentSession,
  patientId: string,
) {
  return mutationOptions({
    mutationFn: async (input: RegisterQuickProcedureInput) => {
      await assertSessionUnchanged(session);
      return getClinicalEncounterDataSource().registerQuickProcedure(patientId, input);
    },
    retry: false,
    onSuccess: async (encounter) => {
      client.setQueryData(clinicalEncounterQueryKeys.detail(patientId, encounter.id), encounter);
      await Promise.all([
        client.invalidateQueries({ queryKey: clinicalEncounterQueryKeys.lists(patientId) }),
        // Una cita vinculada deja de estar disponible para otra atención.
        client.invalidateQueries({ queryKey: clinicalEncounterQueryKeys.referenceData(patientId) }),
        invalidatePatientDetail(client, patientId),
        ...(encounter.appointmentId ? [invalidateAppointments(client)] : []),
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
    onSuccess: async (encounter, { encounterId }) => {
      await Promise.all([
        client.invalidateQueries({
          queryKey: clinicalEncounterQueryKeys.detail(patientId, encounterId),
        }),
        client.invalidateQueries({
          queryKey: clinicalEncounterQueryKeys.lists(patientId),
        }),
        invalidatePatientDetail(client, patientId),
        invalidateBilling(client, patientId),
        ...(encounter.appointmentId ? [invalidateAppointments(client)] : []),
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
        invalidateBilling(client, patientId),
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
        invalidateBilling(client, patientId),
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
        client.invalidateQueries({ queryKey: clinicalEncounterQueryKeys.fileQuota() }),
      ]);
    },
  });
}

export function clinicalFileUpdateOptions(
  client: QueryClient,
  session: CurrentSession,
  patientId: string,
) {
  return mutationOptions({
    mutationFn: async ({ fileId, input }: { fileId: string; input: UpdateClinicalFileInput }) => {
      await assertSessionUnchanged(session);
      return getClinicalEncounterDataSource().updateFile(patientId, fileId, input);
    },
    retry: false,
    // También tras un conflicto: así se edita sobre la versión vigente.
    onSettled: async () => {
      await client.invalidateQueries({
        queryKey: clinicalEncounterQueryKeys.filesRoot(patientId),
      });
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
        client.invalidateQueries({ queryKey: clinicalEncounterQueryKeys.fileQuota() }),
      ]);
    },
  });
}
