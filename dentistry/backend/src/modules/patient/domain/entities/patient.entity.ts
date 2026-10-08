export type PatientStatus = 'ACTIVE' | 'INACTIVE';
export type PatientSex = 'MALE' | 'FEMALE' | 'OTHER';

export interface PatientProps {
  id?: string;
  organizationId: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  email?: string | null;
  birthDate?: Date | null;
  sex?: PatientSex | string | null;
  documentType?: string | null;
  documentNumber?: string | null;
  address?: string | null;
  notes?: string | null;
  status?: PatientStatus;
  createdByMembershipId: string;
  updatedByMembershipId?: string | null;
  deleted?: boolean;
  deletedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Patient {
  readonly id: string;
  readonly organizationId: string;
  private _firstName: string;
  private _lastName: string;
  private _phone: string | null;
  private _email: string | null;
  private _birthDate: Date | null;
  private _sex: string | null;
  private _documentType: string | null;
  private _documentNumber: string | null;
  private _address: string | null;
  private _notes: string | null;
  private _status: PatientStatus;
  readonly createdByMembershipId: string;
  private _updatedByMembershipId: string | null;
  private _deleted: boolean;
  private _deletedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: PatientProps) {
    if (!props.firstName || !props.firstName.trim()) {
      throw new Error('El nombre del paciente es obligatorio.');
    }
    if (!props.lastName || !props.lastName.trim()) {
      throw new Error('El apellido del paciente es obligatorio.');
    }

    this.id = props.id ?? '';
    this.organizationId = props.organizationId;
    this._firstName = props.firstName.trim();
    this._lastName = props.lastName.trim();
    this._phone = props.phone?.trim() ?? null;
    this._email = props.email?.trim() ?? null;
    this._birthDate = props.birthDate ?? null;
    this._sex = props.sex ?? null;
    this._documentType = props.documentType?.trim() ?? null;
    this._documentNumber = props.documentNumber?.trim() ?? null;
    this._address = props.address?.trim() ?? null;
    this._notes = props.notes?.trim() ?? null;
    this._status = props.status ?? 'ACTIVE';
    this.createdByMembershipId = props.createdByMembershipId;
    this._updatedByMembershipId = props.updatedByMembershipId ?? null;
    this._deleted = props.deleted ?? false;
    this._deletedAt = props.deletedAt ?? null;
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
  }

  get firstName(): string {
    return this._firstName;
  }

  get lastName(): string {
    return this._lastName;
  }

  get fullName(): string {
    return `${this._firstName} ${this._lastName}`;
  }

  get phone(): string | null {
    return this._phone;
  }

  get email(): string | null {
    return this._email;
  }

  get birthDate(): Date | null {
    return this._birthDate;
  }

  get sex(): string | null {
    return this._sex;
  }

  get documentType(): string | null {
    return this._documentType;
  }

  get documentNumber(): string | null {
    return this._documentNumber;
  }

  get address(): string | null {
    return this._address;
  }

  get notes(): string | null {
    return this._notes;
  }

  get status(): PatientStatus {
    return this._status;
  }

  get updatedByMembershipId(): string | null {
    return this._updatedByMembershipId;
  }

  get deleted(): boolean {
    return this._deleted;
  }

  get deletedAt(): Date | null {
    return this._deletedAt;
  }

  updateDetails(props: {
    firstName?: string;
    lastName?: string;
    phone?: string | null;
    email?: string | null;
    birthDate?: Date | null;
    sex?: string | null;
    documentType?: string | null;
    documentNumber?: string | null;
    address?: string | null;
    notes?: string | null;
    updatedByMembershipId: string;
  }): void {
    if (props.firstName !== undefined) {
      if (!props.firstName.trim())
        throw new Error('El nombre no puede estar vacío.');
      this._firstName = props.firstName.trim();
    }
    if (props.lastName !== undefined) {
      if (!props.lastName.trim())
        throw new Error('El apellido no puede estar vacío.');
      this._lastName = props.lastName.trim();
    }
    if (props.phone !== undefined) this._phone = props.phone?.trim() ?? null;
    if (props.email !== undefined) this._email = props.email?.trim() ?? null;
    if (props.birthDate !== undefined) this._birthDate = props.birthDate;
    if (props.sex !== undefined) this._sex = props.sex;
    if (props.documentType !== undefined)
      this._documentType = props.documentType?.trim() ?? null;
    if (props.documentNumber !== undefined)
      this._documentNumber = props.documentNumber?.trim() ?? null;
    if (props.address !== undefined)
      this._address = props.address?.trim() ?? null;
    if (props.notes !== undefined) this._notes = props.notes?.trim() ?? null;
    this._updatedByMembershipId = props.updatedByMembershipId;
  }

  softDelete(updatedByMembershipId: string): void {
    this._deleted = true;
    this._deletedAt = new Date();
    this._updatedByMembershipId = updatedByMembershipId;
  }
}
