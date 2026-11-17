export interface PersonProps {
  id?: string;
  organizationId: string;
  nombreCompleto?: string;
  firstName?: string;
  lastName?: string | null;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  convertedToPatientId?: string | null;
  convertedAt?: Date | null;
  createdByMembershipId: string;
  updatedByMembershipId?: string | null;
  deletedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Person {
  readonly id: string;
  readonly organizationId: string;
  private _firstName: string;
  private _lastName: string | null;
  private _phone: string | null;
  private _email: string | null;
  private _notes: string | null;
  private _convertedToPatientId: string | null;
  private _convertedAt: Date | null;
  readonly createdByMembershipId: string;
  private _updatedByMembershipId: string | null;
  private _deletedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: PersonProps) {
    const rawName =
      props.nombreCompleto?.trim() ||
      `${props.firstName ?? ''} ${props.lastName ?? ''}`.trim();

    if (!rawName) {
      throw new Error('El nombre de la persona es obligatorio.');
    }

    let fName = props.firstName?.trim();
    let lName =
      props.lastName !== undefined ? props.lastName?.trim() || null : undefined;

    if (!fName) {
      const parts = rawName.split(/\s+/);
      fName = parts[0];
      lName = parts.length > 1 ? parts.slice(1).join(' ') : null;
    }

    this.id = props.id ?? '';
    this.organizationId = props.organizationId;
    this._firstName = fName;
    this._lastName = lName ?? null;
    this._phone = props.phone?.trim() || null;
    this._email = props.email?.trim() || null;
    this._notes = props.notes?.trim() || null;
    this._convertedToPatientId = props.convertedToPatientId ?? null;
    this._convertedAt = props.convertedAt ?? null;
    this.createdByMembershipId = props.createdByMembershipId;
    this._updatedByMembershipId = props.updatedByMembershipId ?? null;
    this._deletedAt = props.deletedAt ?? null;
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
  }

  get firstName(): string {
    return this._firstName;
  }

  get lastName(): string {
    return this._lastName ?? '';
  }

  get fullName(): string {
    return this._lastName
      ? `${this._firstName} ${this._lastName}`.trim()
      : this._firstName;
  }

  get nombreCompleto(): string {
    return this.fullName;
  }

  get phone(): string | null {
    return this._phone;
  }

  get email(): string | null {
    return this._email;
  }

  get notes(): string | null {
    return this._notes;
  }

  get convertedToPatientId(): string | null {
    return this._convertedToPatientId;
  }

  get convertedAt(): Date | null {
    return this._convertedAt;
  }

  get isConverted(): boolean {
    return this._convertedToPatientId !== null;
  }

  get updatedByMembershipId(): string | null {
    return this._updatedByMembershipId;
  }

  get deletedAt(): Date | null {
    return this._deletedAt;
  }

  markAsConverted(
    patientId: string,
    updatedByMembershipId: string,
    convertedAt = new Date(),
  ): void {
    if (this._convertedToPatientId) {
      throw new Error(
        'La persona ya ha sido convertida a paciente anteriormente.',
      );
    }
    this._convertedToPatientId = patientId;
    this._convertedAt = convertedAt;
    this._updatedByMembershipId = updatedByMembershipId;
  }

  updateDetails(props: {
    nombreCompleto?: string;
    firstName?: string;
    lastName?: string | null;
    phone?: string | null;
    email?: string | null;
    notes?: string | null;
    updatedByMembershipId: string;
  }): void {
    if (props.nombreCompleto !== undefined) {
      const trimmed = props.nombreCompleto.trim();
      if (!trimmed) throw new Error('El nombre no puede estar vacío.');
      const parts = trimmed.split(/\s+/);
      this._firstName = parts[0];
      this._lastName = parts.length > 1 ? parts.slice(1).join(' ') : null;
    } else {
      if (props.firstName !== undefined) {
        if (!props.firstName.trim())
          throw new Error('El nombre no puede estar vacío.');
        this._firstName = props.firstName.trim();
      }
      if (props.lastName !== undefined) {
        this._lastName = props.lastName?.trim() || null;
      }
    }
    if (props.phone !== undefined) {
      this._phone = props.phone?.trim() || null;
    }
    if (props.email !== undefined) {
      this._email = props.email?.trim() || null;
    }
    if (props.notes !== undefined) {
      this._notes = props.notes?.trim() || null;
    }
    this._updatedByMembershipId = props.updatedByMembershipId;
  }
}
