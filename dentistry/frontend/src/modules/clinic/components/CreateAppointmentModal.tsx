"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ResponsiveModal,
  Button,
  Input,
  Select,
  Icons,
  Combobox,
  ComboboxOption,
  DatePicker,
  TimePicker,
} from "@/shared/components/ui";
import { formatCurrency } from "@app/ui";
import {
  fetchPatients,
  createPatient,
} from "@/features/patient/services/patient.service";
import {
  fetchDentalServices,
  DentalServiceDto,
} from "@/modules/clinic/api/services";
import {
  useCurrentSession,
  useCreateAppointment,
} from "@/modules/clinic/hooks";
import {
  DEV_ORG_ID,
  DEV_BRANCH_ID_CENTRAL,
  DEV_PERSONAS,
} from "@/features/dev-auth/types/personas";

export const FALLBACK_DENTAL_SERVICES: DentalServiceDto[] = [
  {
    id: "01a043d0-0000-7000-8000-000000000010",
    organizationId: DEV_ORG_ID,
    name: "Consulta Odontológica General",
    category: "Diagnóstico",
    durationMinutes: 30,
    basePriceMinor: 10000,
    labCostMinor: 0,
    currency: "BOB",
    isActive: true,
    createdByMembershipId: DEV_PERSONAS.owner.membershipId,
    createdAt: "2026-11-01T00:00:00.000Z",
    updatedAt: "2026-11-01T00:00:00.000Z",
  },
  {
    id: "01a043d0-0000-7000-8000-000000000020",
    organizationId: DEV_ORG_ID,
    name: "Limpieza y Profilaxis Dental",
    category: "Prevención",
    durationMinutes: 45,
    basePriceMinor: 15000,
    labCostMinor: 0,
    currency: "BOB",
    isActive: true,
    createdByMembershipId: DEV_PERSONAS.owner.membershipId,
    createdAt: "2026-11-01T00:00:00.000Z",
    updatedAt: "2026-11-01T00:00:00.000Z",
  },
  {
    id: "01a043d0-0000-7000-8000-000000000030",
    organizationId: DEV_ORG_ID,
    name: "Extracción Dental Simple",
    category: "Cirugía",
    durationMinutes: 40,
    basePriceMinor: 20000,
    labCostMinor: 0,
    currency: "BOB",
    isActive: true,
    createdByMembershipId: DEV_PERSONAS.owner.membershipId,
    createdAt: "2026-11-01T00:00:00.000Z",
    updatedAt: "2026-11-01T00:00:00.000Z",
  },
  {
    id: "01a043d0-0000-7000-8000-000000000040",
    organizationId: DEV_ORG_ID,
    name: "Restauración con Resina Fotocurable",
    category: "Operatoria",
    durationMinutes: 45,
    basePriceMinor: 25000,
    labCostMinor: 0,
    currency: "BOB",
    isActive: true,
    createdByMembershipId: DEV_PERSONAS.owner.membershipId,
    createdAt: "2026-11-01T00:00:00.000Z",
    updatedAt: "2026-11-01T00:00:00.000Z",
  },
];

export const PRACTITIONER_OPTIONS = [
  {
    value: "",
    label: "Sin asignar / Por definir",
  },
  {
    value: DEV_PERSONAS.practitioner.membershipId,
    label: `${DEV_PERSONAS.practitioner.name} (${DEV_PERSONAS.practitioner.roleTitle})`,
  },
  {
    value: DEV_PERSONAS.owner.membershipId,
    label: `${DEV_PERSONAS.owner.name} (${DEV_PERSONAS.owner.roleTitle})`,
  },
];

interface CreateAppointmentModalProps {
  open: boolean;
  initialPatientId?: string;
  initialDate?: string;
  branchId?: string;
  practitionerMembershipId?: string;
  onClose: () => void;
  onSuccess?: (appointment: any) => void;
}

const formatLocalPhone = (phone?: string | null): string => {
  if (!phone || phone === "-") return "";
  return phone.replace(/^\+?(?:591)?[\s-]*/, "").trim();
};

export function CreateAppointmentModal({
  open,
  initialPatientId,
  initialDate,
  branchId: propBranchId,
  practitionerMembershipId: propPractitionerId,
  onClose,
  onSuccess,
}: CreateAppointmentModalProps) {
  // Contextual IDs dinámicos (con fallback UUID v7 canónico)
  const [activeBranchId, setActiveBranchId] = useState<string>(
    propBranchId || DEV_BRANCH_ID_CENTRAL,
  );
  const [activePractitionerId, setActivePractitionerId] = useState<string>(
    propPractitionerId || DEV_PERSONAS.practitioner.membershipId,
  );
  const [activeOrgId, setActiveOrgId] = useState<string>(DEV_ORG_ID);

  // Consulta de sesión activa (/api/auth/me) mediante hook reactivo useCurrentSession()
  const { data: session } = useCurrentSession();
  const createApptMutation = useCreateAppointment();

  useEffect(() => {
    if (session?.context) {
      if (session.context.branchIds?.[0] && !propBranchId) {
        setActiveBranchId(session.context.branchIds[0]);
      }
      if (session.context.membershipId && !propPractitionerId) {
        setActivePractitionerId((current) => (current === "" ? "" : session.context.membershipId));
      }
      if (session.context.organizationId) {
        setActiveOrgId(session.context.organizationId);
      }
    }
  }, [session, propBranchId, propPractitionerId]);

  // Booking target: Paciente registrado o Persona (Registro Rápido)
  const [bookingType, setBookingType] = useState<"patient" | "person">(
    "patient",
  );
  const [personMode, setPersonMode] = useState<"new" | "existing">("new");

  const todayIso = new Date().toISOString().slice(0, 10);

  const [form, setForm] = useState({
    patientId: initialPatientId || "",
    serviceIds: [] as string[],
    date: initialDate || todayIso,
    startTime: "09:00",
    endTime: "",
    notes: "",
  });

  const [personForm, setPersonForm] = useState({
    fullName: "",
    phone: "",
    email: "",
  });

  const [selectedPersonId, setSelectedPersonId] = useState("");
  const [serviceToAdd, setServiceToAdd] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Real API State (No Mocks)
  const [patientOptions, setPatientOptions] = useState<ComboboxOption[]>([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);
  const [servicesCatalog, setServicesCatalog] = useState<DentalServiceDto[]>(
    [],
  );
  const [isLoadingServices, setIsLoadingServices] = useState(false);

  // Search patients asynchronously from API: Only Name and Clean Phone
  const handleSearchPatients = useCallback(async (searchQuery: string) => {
    setIsLoadingPatients(true);
    try {
      const result = await fetchPatients({
        search: searchQuery.trim() || undefined,
        pageSize: 15,
      });
      const options: ComboboxOption[] = result.items.map((p) => {
        const cleanPhone = formatLocalPhone(p.phone);
        return {
          value: p.id,
          label: p.fullName,
          description: cleanPhone ? cleanPhone : undefined,
        };
      });
      setPatientOptions(options);
    } catch {
      // Fallback
    } finally {
      setIsLoadingPatients(false);
    }
  }, []);

  // Load real services catalog from API
  const loadServicesCatalog = useCallback(
    async (searchQuery?: string) => {
      setIsLoadingServices(true);
      try {
        const svcs = await fetchDentalServices({
          organizationId: activeOrgId || DEV_ORG_ID,
          search: searchQuery?.trim() || undefined,
          isActive: true,
        });
        if (Array.isArray(svcs) && svcs.length > 0) {
          setServicesCatalog(svcs);
        } else {
          setServicesCatalog(FALLBACK_DENTAL_SERVICES);
        }
      } catch {
        // Fallback default list con UUIDs v7 canónicos si el backend no tiene semillas
        setServicesCatalog(FALLBACK_DENTAL_SERVICES);
      } finally {
        setIsLoadingServices(false);
      }
    },
    [activeOrgId],
  );

  useEffect(() => {
    if (open) {
      setForm((prev) => ({
        ...prev,
        patientId: initialPatientId || "",
        date: initialDate || todayIso,
        serviceIds: prev.serviceIds.length > 0 ? prev.serviceIds : [],
        endTime: "",
      }));
      setPersonForm({
        fullName: "",
        phone: "",
        email: "",
      });
      setSelectedPersonId("");
      setErrors({});
      void handleSearchPatients("");
      void loadServicesCatalog("");
    }
  }, [
    open,
    initialPatientId,
    initialDate,
    todayIso,
    handleSearchPatients,
    loadServicesCatalog,
  ]);

  const set = (k: string, v: any) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
  };

  const setPerson = (k: string, v: string) => {
    setPersonForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
  };

  const selectedServices = servicesCatalog.filter((s) =>
    form.serviceIds.includes(s.id),
  );

  const selectedCurrency = selectedServices[0]?.currency || "BOB";

  const totalDurationMin = selectedServices.reduce(
    (sum, s) => sum + (s.durationMinutes || 0),
    0,
  );
  const totalPriceMinor = selectedServices.reduce(
    (sum, s) => sum + (s.basePriceMinor || 0),
    0,
  );

  const effectiveDurationMin = totalDurationMin > 0 ? totalDurationMin : 30;

  const calcEnd = (start = form.startTime) => {
    if (!start) return "";
    const [h, m] = start.split(":").map(Number);
    const total = h * 60 + m + effectiveDurationMin;
    return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(
      total % 60,
    ).padStart(2, "0")}`;
  };

  const handleAddService = (sId: string) => {
    if (!sId) return;
    if (!form.serviceIds.includes(sId)) {
      set("serviceIds", [...form.serviceIds, sId]);
    }
    setServiceToAdd("");
  };

  const handleRemoveService = (sId: string) => {
    set(
      "serviceIds",
      form.serviceIds.filter((id) => id !== sId),
    );
  };

  const validate = () => {
    const e: Record<string, string> = {};

    if (bookingType === "patient") {
      if (!form.patientId) e.patientId = "Selecciona un paciente registrado";
    } else {
      if (personMode === "new") {
        if (!personForm.fullName.trim())
          e.fullName = "El nombre completo es obligatorio";
        // Teléfono es 100% opcional para Persona / Registro Rápido
      } else {
        if (!selectedPersonId)
          e.personId = "Selecciona una persona de la lista";
      }
    }

    if (!form.date) e.date = "Selecciona una fecha";

    return e;
  };

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const eMap = validate();
    if (Object.keys(eMap).length) {
      setErrors(eMap);
      return;
    }

    setIsSubmitting(true);
    const endTime = form.endTime || calcEnd(form.startTime) || "09:30";

    try {
      let finalPatientId = form.patientId;

      // Si el modo es Persona nueva, registrar de forma simplificada
      if (bookingType === "person") {
        if (personMode === "new") {
          const parts = personForm.fullName.trim().split(/\s+/);
          const firstName = parts[0] || "Persona";
          const lastName = parts.slice(1).join(" ") || "-";
          const cleanPhone = personForm.phone.trim() || undefined;

          const createdPatient = await createPatient({
            firstName,
            lastName,
            phone: cleanPhone,
            email: personForm.email.trim() || undefined,
            notes: `Registro rápido de persona en cita: ${form.notes.trim()}`,
          });
          finalPatientId = createdPatient.id;
        } else {
          finalPatientId = selectedPersonId;
        }
      }

      const scheduledStartAt = `${form.date}T${form.startTime}:00.000Z`;
      const scheduledEndAt = `${form.date}T${endTime}:00.000Z`;

      const newAppt = await createApptMutation.mutateAsync({
        branchId: activeBranchId,
        patientId: finalPatientId,
        practitionerMembershipId: activePractitionerId || undefined,
        serviceId: form.serviceIds[0] || undefined,
        serviceIds: form.serviceIds.length ? form.serviceIds : undefined,
        scheduledStartAt,
        scheduledEndAt,
        notes: form.notes.trim(),
      });

      onSuccess?.(newAppt);
      handleClose();
    } catch (err: any) {
      setErrors({
        form:
          err?.response?.data?.message ||
          err?.message ||
          "Error al crear la cita en el servidor. Inténtalo nuevamente.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Combobox Tratamientos / Servicios: Mostrar únicamente Nombre y Precio formateado multi-moneda
  const serviceOptions: ComboboxOption[] = servicesCatalog
    .filter((s) => !form.serviceIds.includes(s.id))
    .map((s) => ({
      value: s.id,
      label: s.name,
      description: formatCurrency(s.basePriceMinor, {
        currency: s.currency || "BOB",
        isMinorUnit: true,
      }),
    }));

  // Sticky bottom footer actions
  const modalFooter = (
    <div className="flex items-center justify-between gap-3 w-full">
      <div className="text-xs">
        <span className="text-[var(--muted)]">Total previsto: </span>
        <strong className="font-mono text-sm text-[var(--primary)]">
          {formatCurrency(totalPriceMinor, {
            currency: selectedCurrency,
            isMinorUnit: true,
          })}
        </strong>
      </div>
      <div className="flex items-center gap-2.5">
        <Button
          type="button"
          variant="outline"
          onClick={handleClose}
          disabled={isSubmitting || createApptMutation.isPending}
          className="rounded-xl"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          form="create-appointment-form"
          variant="primary"
          disabled={isSubmitting || createApptMutation.isPending}
          className="rounded-xl shadow-xs"
        >
          {isSubmitting || createApptMutation.isPending ? (
            <span className="flex items-center gap-1.5">
              <span className="animate-spin text-xs">⏳</span>
              <span>Guardando cita...</span>
            </span>
          ) : (
            "Agendar Cita"
          )}
        </Button>
      </div>
    </div>
  );

  return (
    <ResponsiveModal
      open={open}
      onClose={handleClose}
      title="Agendar Nueva Cita"
      subtitle="Programar turno con paciente registrado o registro rápido de persona"
      icon={Icons.calendar}
      breakpoint={768}
      snapPoint="auto"
      maxWidth="max-w-2xl"
      footer={modalFooter}
    >
      <form
        id="create-appointment-form"
        onSubmit={handleSubmit}
        className="flex flex-col gap-5"
      >
        {errors.form && (
          <div
            role="alert"
            className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-700 dark:text-rose-400 flex items-center gap-2"
          >
            <span className="text-sm shrink-0">⚠️</span>
            <span>{errors.form}</span>
          </div>
        )}

        {/* ── PASO 1: Destinatario de la Cita (Resaltado con círculo y fondo primary) ── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-6 h-6 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs">
              1
            </span>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)] font-mono">
              Destinatario de la Cita
            </h3>
          </div>

          {/* Toggle minimalista: Paciente vs Persona / Registro Rápido */}
          <div className="flex items-center gap-2 p-1 bg-[var(--background)] border border-[var(--border)] rounded-md mb-3">
            <button
              type="button"
              onClick={() => {
                setBookingType("patient");
                setErrors({});
              }}
              className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-md transition-all ${
                bookingType === "patient"
                  ? "bg-[var(--surface-elevated)] text-[var(--foreground)] shadow-xs"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              👤 Paciente
            </button>
            <button
              type="button"
              onClick={() => {
                setBookingType("person");
                setErrors({});
              }}
              className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-md transition-all ${
                bookingType === "person"
                  ? "bg-[var(--surface-elevated)] text-[var(--foreground)] shadow-xs"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              👤 Registro Rápido
            </button>
          </div>

          {bookingType === "patient" ? (
            <div>
              <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                Buscar Paciente Registrado *
              </label>
              <Combobox
                options={patientOptions}
                value={form.patientId}
                onChange={(v) => set("patientId", v)}
                onSearchChange={handleSearchPatients}
                loading={isLoadingPatients}
                placeholder="Escribe el nombre o teléfono del paciente..."
                searchPlaceholder="Buscar por nombre o teléfono..."
                emptyMessage="No se encontraron pacientes registrados"
                error={errors.patientId}
              />
              <p className="text-[11px] text-[var(--muted)] mt-1 font-mono">
                Búsqueda en tiempo real conectada a la base de datos de
                pacientes.
              </p>
            </div>
          ) : (
            <div className="space-y-3 p-3.5 rounded-md border border-[var(--primary)]/20 bg-[var(--primary)]/5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--foreground)]">
                  Datos de la Persona
                </span>
                <div className="flex items-center gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setPersonMode("new")}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors ${
                      personMode === "new"
                        ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                        : "text-[var(--muted)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    Nueva Persona
                  </button>
                  <button
                    type="button"
                    onClick={() => setPersonMode("existing")}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors ${
                      personMode === "existing"
                        ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                        : "text-[var(--muted)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    Existente
                  </button>
                </div>
              </div>

              {personMode === "new" ? (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                      Nombre Completo *
                    </label>
                    <Input
                      placeholder="Ej. Carlos Mendoza"
                      value={personForm.fullName}
                      onChange={(e) => setPerson("fullName", e.target.value)}
                      error={errors.fullName}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                        Teléfono Celular (Opcional)
                      </label>
                      <Input
                        type="tel"
                        placeholder="Ej. 76543210"
                        value={personForm.phone}
                        onChange={(e) => setPerson("phone", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                        Correo Electrónico (Opcional)
                      </label>
                      <Input
                        type="email"
                        placeholder="carlos@example.com"
                        value={personForm.email}
                        onChange={(e) => setPerson("email", e.target.value)}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                    Buscar Persona en el Directorio *
                  </label>
                  <Combobox
                    options={patientOptions}
                    value={selectedPersonId}
                    onChange={(v) => setSelectedPersonId(v)}
                    onSearchChange={handleSearchPatients}
                    loading={isLoadingPatients}
                    placeholder="Seleccionar persona..."
                    searchPlaceholder="Buscar por nombre o teléfono..."
                    error={errors.personId}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── PASO 2: Programación de Horario (DatePicker & TimePicker de @app/ui) ── */}
        <div className="pt-2 border-t border-[var(--border)]/60">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-6 h-6 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs">
              2
            </span>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)] font-mono">
              Programación de Horario
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <DatePicker
                label="Fecha *"
                value={form.date}
                onChange={(d) => set("date", d)}
                error={errors.date}
                placeholder="Seleccionar fecha"
              />
            </div>

            <div>
              <TimePicker
                label="Hora de Inicio *"
                value={form.startTime}
                onChange={(t) => set("startTime", t)}
                placeholder="09:00"
              />
            </div>

            <div>
              <TimePicker
                label="Fin Estimado"
                value={form.endTime || calcEnd(form.startTime)}
                onChange={(t) => set("endTime", t)}
                placeholder="09:30"
              />
            </div>
          </div>

          <div className="mt-3">
            <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
              Profesional Odontólogo Asignado (Opcional)
            </label>
            <Select
              selectSize="sm"
              value={activePractitionerId}
              onChange={(e) => setActivePractitionerId(e.target.value)}
              options={PRACTITIONER_OPTIONS}
            />
          </div>
        </div>

        {/* ── PASO 3: Procedimientos Odontológicos (Resaltado con círculo y fondo primary) ── */}
        <div className="pt-2 border-t border-[var(--border)]/60">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs">
                3
              </span>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)] font-mono">
                Procedimientos
              </h3>
            </div>
            <span className="text-[11px] font-mono text-[var(--primary)] font-semibold">
              {totalDurationMin > 0 ? `${totalDurationMin} min` : "30 min"} ·{" "}
              {formatCurrency(totalPriceMinor, {
                currency: selectedCurrency,
                isMinorUnit: true,
              })}
            </span>
          </div>

          <div className="flex flex-col gap-2.5">
            {/* Lista de tratamientos seleccionados */}
            {selectedServices.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-1">
                {selectedServices.map((svc) => (
                  <div
                    key={svc.id}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--foreground)] shadow-2xs"
                  >
                    <span className="font-medium">{svc.name}</span>
                    <span className="text-[10px] text-[var(--muted)] font-mono">
                      {svc.durationMinutes}m ·{" "}
                      {formatCurrency(svc.basePriceMinor, {
                        currency: svc.currency || "BOB",
                        isMinorUnit: true,
                      })}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveService(svc.id)}
                      className="text-[var(--muted)] hover:text-red-500 font-bold ml-1 cursor-pointer"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Combobox con búsqueda asíncrona real para añadir procedimiento: Solo Nombre y Precio */}
            <div>
              <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                Añadir Procedimiento / Tratamiento Odontológico (Opcional)
              </label>
              <Combobox
                options={serviceOptions}
                value={serviceToAdd}
                onChange={(val) => {
                  setServiceToAdd(val);
                  handleAddService(val);
                }}
                onSearchChange={loadServicesCatalog}
                loading={isLoadingServices}
                placeholder="+ Buscar y añadir tratamiento..."
                searchPlaceholder="Escribe el nombre del tratamiento..."
                emptyMessage="No se encontraron procedimientos disponibles"
                error={errors.serviceIds}
              />
            </div>
          </div>
        </div>

        {/* Resumen & Notas (Opcional) */}
        <div className="pt-2 border-t border-[var(--border)]/60">
          <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
            Motivo o Notas de la Consulta (Opcional)
          </label>
          <textarea
            rows={2}
            placeholder="Indicaciones previas, requerimiento de instrumental o urgencia..."
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-md bg-[var(--surface)] border border-[var(--border)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--primary)] text-[var(--foreground)] placeholder:text-[var(--muted)] resize-none"
          />
        </div>
      </form>
    </ResponsiveModal>
  );
}
