export type AppointmentStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface AppointmentProps {
  id?: string;
  organizationId: string;
  branchId: string;
  patientId: string;
  professionalMembershipId: string;
  serviceId: string;
  treatmentId?: string | null;
  startsAt: Date;
  endsAt: Date;
  status?: AppointmentStatus;
  reason?: string | null;
  notes?: string | null;
  createdByMembershipId: string;
  cancelledAt?: Date | null;
  cancelledByMembershipId?: string | null;
  cancellationReason?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Appointment {
  readonly id: string;
  readonly organizationId: string;
  readonly branchId: string;
  readonly patientId: string;
  readonly professionalMembershipId: string;
  readonly serviceId: string;
  readonly treatmentId: string | null;
  readonly startsAt: Date;
  readonly endsAt: Date;
  private _status: AppointmentStatus;
  private _reason: string | null;
  private _notes: string | null;
  readonly createdByMembershipId: string;
  private _cancelledAt: Date | null;
  private _cancelledByMembershipId: string | null;
  private _cancellationReason: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: AppointmentProps) {
    if (props.startsAt >= props.endsAt) {
      throw new Error('La hora de inicio debe ser anterior a la hora de fin.');
    }

    this.id = props.id ?? '';
    this.organizationId = props.organizationId;
    this.branchId = props.branchId;
    this.patientId = props.patientId;
    this.professionalMembershipId = props.professionalMembershipId;
    this.serviceId = props.serviceId;
    this.treatmentId = props.treatmentId ?? null;
    this.startsAt = props.startsAt;
    this.endsAt = props.endsAt;
    this._status = props.status ?? 'SCHEDULED';
    this._reason = props.reason ?? null;
    this._notes = props.notes ?? null;
    this.createdByMembershipId = props.createdByMembershipId;
    this._cancelledAt = props.cancelledAt ?? null;
    this._cancelledByMembershipId = props.cancelledByMembershipId ?? null;
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

  get cancelledAt(): Date | null {
    return this._cancelledAt;
  }

  get cancelledByMembershipId(): string | null {
    return this._cancelledByMembershipId;
  }

  get cancellationReason(): string | null {
    return this._cancellationReason;
  }

  start(): void {
    if (this._status === 'CANCELLED') {
      throw new Error('No se puede iniciar una cita cancelada.');
    }
    if (this._status === 'COMPLETED') {
      throw new Error('No se puede iniciar una cita ya completada.');
    }
    this._status = 'IN_PROGRESS';
  }

  complete(): void {
    if (this._status === 'CANCELLED') {
      throw new Error('No se puede completar una cita cancelada.');
    }
    this._status = 'COMPLETED';
  }

  cancel(cancelledByMembershipId: string, reason: string): void {
    if (this._status === 'COMPLETED') {
      throw new Error('No se puede cancelar una cita completada.');
    }
    this._status = 'CANCELLED';
    this._cancelledAt = new Date();
    this._cancelledByMembershipId = cancelledByMembershipId;
    this._cancellationReason = reason;
  }

  updateNotes(notes: string): void {
    this._notes = notes;
  }
}
