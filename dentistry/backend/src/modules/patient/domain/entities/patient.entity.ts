export type PatientStatus = 'ACTIVE' | 'INACTIVE';
export type PatientSex = 'MALE' | 'FEMALE' | 'OTHER';

export type Patient = {
  id: string;
  organizationId: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  birthDate: Date | null;
  sex: PatientSex | null;
  documentType: string | null;
  documentNumber: string | null;
  address: string | null;
  notes: string | null;
  status: PatientStatus;
  createdByMembershipId: string;
  updatedByMembershipId: string | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};
