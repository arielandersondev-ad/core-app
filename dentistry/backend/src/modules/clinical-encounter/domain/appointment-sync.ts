/**
 * Sincronización del estado de la cita con su atención clínica.
 *
 * - Iniciar la atención pasa la cita a `IN_PROGRESS`.
 * - Completarla (o registrar una atención rápida) la pasa a `COMPLETED`.
 * - Nunca se retrocede: una cita ya completada, cancelada o ausente queda como
 *   está, y anular la atención no toca la cita.
 */
export type EncounterAppointmentEvent = 'STARTED' | 'COMPLETED';

export type AppointmentStatusSync = {
  appointmentId: string;
  /** Estados desde los que se avanza; con cualquier otro la cita no cambia. */
  fromStatuses: readonly string[];
  toStatus: 'IN_PROGRESS' | 'COMPLETED';
};

const PENDING_STATUSES = ['SCHEDULED', 'CONFIRMED', 'WAITING_ROOM'] as const;

const SYNC_RULES: Record<
  EncounterAppointmentEvent,
  Omit<AppointmentStatusSync, 'appointmentId'>
> = {
  STARTED: { fromStatuses: PENDING_STATUSES, toStatus: 'IN_PROGRESS' },
  COMPLETED: {
    fromStatuses: [...PENDING_STATUSES, 'IN_PROGRESS'],
    toStatus: 'COMPLETED',
  },
};

/** Cambio de estado de la cita para el evento, o null si no hay cita. */
export function appointmentSyncFor(
  event: EncounterAppointmentEvent,
  appointmentId: string | null | undefined,
): AppointmentStatusSync | null {
  return appointmentId ? { appointmentId, ...SYNC_RULES[event] } : null;
}

/** Estado al que pasa la cita, o null si debe quedar como está. */
export function nextAppointmentStatus(
  sync: AppointmentStatusSync,
  currentStatus: string,
): AppointmentStatusSync['toStatus'] | null {
  return sync.fromStatuses.includes(currentStatus) ? sync.toStatus : null;
}
