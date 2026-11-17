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
  currency?: string | null;
  durationMinutes?: number | null;
  notes?: string | null;
}

export interface AppointmentProps {
  id?: string;
  organizationId: string;
  branchId: string;
  patientId?: string;
  personId?: string;
  practitionerMembershipId?: string | null;
  serviceId?: string;
  serviceIds?: string[];
  treatmentId?: string | null;
  scheduledStartAt: Date;
  scheduledEndAt: Date;
  status?: AppointmentStatus;
  reason?: string | null;
  notes?: string | null;
  createdByMembershipId: string;
  updatedByMembershipId?: string | null;
  rowVersion?: number;
  canceledAt?: Date | null;
  canceledByMembershipId?: string | null;
  cancellationReason?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  services?: AppointmentServiceItem[];
  patientName?: string | null;
  patientPhone?: string | null;
  personName?: string | null;
  personPhone?: string | null;
  serviceName?: string | null;
}

export class Appointment {
  readonly id: string;
  readonly organizationId: string;
  readonly branchId: string;
  readonly patientId: string | null;
  readonly personId: string | null;
  readonly practitionerMembershipId: string | null;
  readonly serviceId: string;
  readonly serviceIds: string[];
  readonly treatmentId: string | null;
  readonly scheduledStartAt: Date;
  readonly scheduledEndAt: Date;
  readonly patientName: string | null;
  readonly patientPhone: string | null;
  readonly personName: string | null;
  readonly personPhone: string | null;
  readonly serviceName: string | null;
  private _status: AppointmentStatus;
  private _reason: string | null;
  private _notes: string | null;
  readonly createdByMembershipId: string;
  updatedByMembershipId: string | null;
  readonly rowVersion: number;
  private _canceledAt: Date | null;
  private _canceledByMembershipId: string | null;
  private _cancellationReason: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly services: AppointmentServiceItem[];

  constructor(props: AppointmentProps) {
    if (
      Number.isNaN(props.scheduledStartAt?.getTime()) ||
      Number.isNaN(props.scheduledEndAt?.getTime()) ||
      props.scheduledStartAt >= props.scheduledEndAt
    ) {
      throw new Error('La hora de inicio debe ser anterior a la hora de fin.');
    }
    if (!props.patientId && !props.personId) {
      throw new Error('Debe tener asociado un paciente o una persona de contacto.');
    }

    this.id = props.id ?? '';
    this.organizationId = props.organizationId;
    this.branchId = props.branchId;
    this.patientId = props.patientId ?? null;
    this.personId = props.personId ?? null;
    this.practitionerMembershipId = props.practitionerMembershipId ?? null;

    const sIds =
      props.serviceIds && props.serviceIds.length > 0
        ? props.serviceIds
        : props.serviceId
          ? [props.serviceId]
          : [];
    this.serviceIds = [...new Set(sIds)];
    // Compatibility projection for existing clients; AppointmentService owns persistence.
    this.serviceId = this.serviceIds[0] ?? '';
    this.services = props.services || [];
    this.treatmentId = props.treatmentId ?? null;
    this.scheduledStartAt = props.scheduledStartAt;
    this.scheduledEndAt = props.scheduledEndAt;
    this._status = props.status ?? 'SCHEDULED';
    this._reason = props.reason ?? null;
    this._notes = props.notes ?? null;
    this.createdByMembershipId = props.createdByMembershipId;
    this.updatedByMembershipId = props.updatedByMembershipId ?? null;
    this.rowVersion = props.rowVersion ?? 1;
    this._canceledAt = props.canceledAt ?? null;
    this._canceledByMembershipId = props.canceledByMembershipId ?? null;
    this._cancellationReason = props.cancellationReason ?? null;
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
    this.patientName = props.patientName ?? null;
    this.patientPhone = props.patientPhone ?? null;
    this.personName = props.personName ?? null;
    this.personPhone = props.personPhone ?? null;
    this.serviceName =
      props.serviceName ?? props.services?.[0]?.serviceName ?? null;
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
    if (!reason.trim())
      throw new Error('El motivo de cancelación es obligatorio.');
    if (this._status === 'COMPLETED') {
      throw new Error('No se puede cancelar una cita completada.');
    }
    this._status = 'CANCELED';
    this._canceledAt = new Date();
    this._canceledByMembershipId = canceledByMembershipId;
    this._cancellationReason = reason.trim();
  }

  updateNotes(notes: string): void {
    this._notes = notes;
  }

  toJSON() {
    return {
      id: this.id,
      organizationId: this.organizationId,
      branchId: this.branchId,
      patientId: this.patientId,
      personId: this.personId,
      practitionerMembershipId: this.practitionerMembershipId,
      serviceId: this.serviceId,
      serviceIds: this.serviceIds,
      treatmentId: this.treatmentId,
      scheduledStartAt: this.scheduledStartAt,
      scheduledEndAt: this.scheduledEndAt,
      status: this.status,
      reason: this.reason,
      notes: this.notes,
      createdByMembershipId: this.createdByMembershipId,
      updatedByMembershipId: this.updatedByMembershipId,
      rowVersion: this.rowVersion,
      canceledAt: this.canceledAt,
      canceledByMembershipId: this.canceledByMembershipId,
      cancellationReason: this.cancellationReason,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      services: this.services,
      patientName: this.patientName,
      patientPhone: this.patientPhone,
      personName: this.personName,
      personPhone: this.personPhone,
      serviceName: this.serviceName,
    };
  }
}
