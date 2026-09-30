"use client";

export default function CreateAppointment({ onBack }: { patientId?: string; onBack: () => void }) {
  return (
    <div className="p-4 sm:p-8 max-w-xl mx-auto pt-12">
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-xs flex flex-col gap-4">
        <h2 className="font-display text-xl font-bold text-[var(--foreground)]">Nueva cita</h2>
        <p role="status" className="text-sm text-[var(--muted)]">
          Para agendar una cita necesitamos seleccionar un paciente y un servicio del catálogo real de la clínica.
          Esa consulta aún no está disponible; la creación de citas se habilitará cuando ambos catálogos estén conectados.
        </p>
        <button type="button" disabled className="h-11 px-6 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] opacity-50 cursor-not-allowed text-sm font-semibold">
          Confirmar y agendar cita
        </button>
        <button type="button" onClick={onBack} className="h-11 px-4 border border-[var(--border)] rounded-xl text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)]">
          Volver a la agenda
        </button>
      </div>
    </div>
  );
}
