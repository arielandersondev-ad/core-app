import type { PaginationParams } from "@/shared/types/pagination";

export type PatientSex = "MALE" | "FEMALE" | "OTHER";
export type PatientStatus = "ACTIVE" | "INACTIVE";

export type PatientDto = {
  id: string;
  organizationId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  birthDate: string | null;
  sex: PatientSex | null;
  documentType: string | null;
  documentNumber: string | null;
  address: string | null;
  notes: string | null;
  status: PatientStatus;
  createdAt: string;
  updatedAt: string;
};

export type CreatePatientRequest = Pick<PatientDto, "firstName" | "lastName"> &
  Partial<Pick<PatientDto, "phone" | "email" | "birthDate" | "sex" | "documentType" | "documentNumber" | "address" | "notes">>;

export type UpdatePatientRequest = Partial<Pick<PatientDto, "firstName" | "lastName" | "phone" | "email" | "birthDate" | "sex" | "documentType" | "documentNumber" | "address" | "notes">>;

export type ListPatientsParams = PaginationParams & {
  search?: string;
  status?: PatientStatus;
};
