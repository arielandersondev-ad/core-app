import { BadRequestException } from '@nestjs/common';
import type { Patient } from '../domain/entities/patient.entity.js';

export function validatePatient(patient: Patient): void {
  if ((patient.documentType === null) !== (patient.documentNumber === null)) {
    throw new BadRequestException(
      'documentType y documentNumber deben informarse juntos.',
    );
  }
  if (
    patient.sex !== null &&
    !['MALE', 'FEMALE', 'OTHER'].includes(patient.sex)
  ) {
    throw new BadRequestException('El sexo del paciente no es válido.');
  }
}
