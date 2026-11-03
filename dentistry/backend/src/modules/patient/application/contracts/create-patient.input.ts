import type { Patient } from '../../domain/entities/patient.entity.js';

export type CreatePatientInput = Pick<
  Patient,
  'organizationId' | 'firstName' | 'lastName' | 'createdByMembershipId'
> &
  Partial<
    Pick<
      Patient,
      | 'phone'
      | 'email'
      | 'birthDate'
      | 'sex'
      | 'documentType'
      | 'documentNumber'
      | 'address'
      | 'notes'
      | 'status'
    >
  >;
