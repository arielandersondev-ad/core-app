export type AppointmentStatus =
  | 'SCHEDULED'
  | 'CONFIRMED'
  | 'WAITING_ROOM'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'NO_SHOW'
  | 'CANCELED';

export interface AppointmentServiceItem {
  id?: string;
  serviceId: string;
  serviceName?: string;
  priceMinor?: number | null;
  durationMinutes?: number | null;
  notes?: string | null;
}

export interface AppointmentProps {
  id?: string;
  organizationId: string;
  branchId: string;
  patientId: string;
  practitionerMembershipId: string;
  serviceId?: string;
  serviceIds?: string[];
  treatmentId?: string | null;
  scheduledStartAt: Date;
  scheduledEndAt: Date;
  status?: AppointmentStatus;
  reason?: string | null;
  notes?: string | null;
  createdByMembershipId: string;
  canceledAt?: Date | null;
  canceledByMembershipId?: string | null;
  cancellationReason?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  services?: AppointmentServiceItem[];
}

export class Appointment {
  readonly id: string;
  readonly organizationId: string;
  readonly branchId: string;
  readonly patientId: string;
  readonly practitionerMembershipId: string;
  readonly serviceId: string;
  readonly serviceIds: string[];
  readonly treatmentId: string | null;
  readonly scheduledStartAt: Date;
  readonly scheduledEndAt: Date;
  private _status: AppointmentStatus;
  private _reason: string | null;
  private _notes: string | null;
  readonly createdByMembershipId: string;
  private _canceledAt: Date | null;
  private _canceledByMembershipId: string | null;
  private _cancellationReason: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly services: AppointmentServiceItem[];

  constructor(props: AppointmentProps) {
    if (props.scheduledStartAt >= props.scheduledEndAt) {
      throw new Error('La hora de inicio debe ser anterior a la hora de fin.');
    }

    this.id = props.id ?? '';
    this.organizationId = props.organizationId;
    this.branchId = props.branchId;
    this.patientId = props.patientId;
    this.practitionerMembershipId = props.practitionerMembershipId;

    const sIds =
      props.serviceIds && props.serviceIds.length > 0
        ? props.serviceIds
        : props.serviceId
          ? [props.serviceId]
          : [];
    this.serviceIds = sIds;
    this.serviceId = sIds[0] || props.serviceId || '';
    this.services = props.services || [];
    this.treatmentId = props.treatmentId ?? null;
    this.scheduledStartAt = props.scheduledStartAt;
    this.scheduledEndAt = props.scheduledEndAt;
    this._status = props.status ?? 'SCHEDULED';
    this._reason = props.reason ?? null;
    this._notes = props.notes ?? null;
    this.createdByMembershipId = props.createdByMembershipId;
    this._canceledAt = props.canceledAt ?? null;
    this._canceledByMembershipId = props.canceledByMembershipId ?? null;
    this._cancellationReason = props.cancellationReason ?? null;
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
  }

  get status(): AppointmentStatus {
    return this._status;
  }

  get reason(): string | null {
    return this._reason;
  }

  get notes(): string | null {
    return this._notes;
  }

  get canceledAt(): Date | null {
    return this._canceledAt;
  }

  get canceledByMembershipId(): string | null {
    return this._canceledByMembershipId;
  }

  get cancellationReason(): string | null {
    return this._cancellationReason;
  }

  confirm(): void {
    if (this._status === 'CANCELED') {
      throw new Error('No se puede confirmar una cita cancelada.');
    }
    if (this._status === 'COMPLETED') {
      throw new Error('No se puede confirmar una cita ya completada.');
    }
    this._status = 'CONFIRMED';
  }

  markInWaitingRoom(): void {
    if (this._status === 'CANCELED') {
      throw new Error('No se puede marcar en sala una cita cancelada.');
    }
    if (this._status === 'COMPLETED') {
      throw new Error('No se puede marcar en sala una cita ya completada.');
    }
    this._status = 'WAITING_ROOM';
  }

  start(): void {
    if (this._status === 'CANCELED') {
      throw new Error('No se puede iniciar una cita cancelada.');
    }
    if (this._status === 'COMPLETED') {
      throw new Error('No se puede iniciar una cita ya completada.');
    }
    this._status = 'IN_PROGRESS';
  }

  complete(): void {
    if (this._status === 'CANCELED') {
      throw new Error('No se puede completar una cita cancelada.');
    }
    this._status = 'COMPLETED';
  }

  markNoShow(): void {
    if (this._status === 'COMPLETED') {
      throw new Error(
        'No se puede marcar como no asistió una cita ya completada.',
      );
    }
    this._status = 'NO_SHOW';
  }

  schedule(): void {
    if (this._status === 'COMPLETED') {
      throw new Error(
        'No se puede reprogramar como pendiente una cita ya completada.',
      );
    }
    this._status = 'SCHEDULED';
  }

  cancel(canceledByMembershipId: string, reason: string): void {
    if (this._status === 'COMPLETED') {
      throw new Error('No se puede cancelar una cita completada.');
    }
    this._status = 'CANCELED';
    this._canceledAt = new Date();
    this._canceledByMembershipId = canceledByMembershipId;
    this._cancellationReason = reason;
  }

  updateNotes(notes: string): void {
    this._notes = notes;
  }
}
