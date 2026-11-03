import { BadRequestException } from '@nestjs/common';
import type { Patient } from '../domain/entities/patient.entity.js';

export function validatePatient(patient: Pick<Patient, 'documentType' | 'documentNumber'>): void {
  if ((patient.documentType === null) !== (patient.documentNumber === null)) {
    throw new BadRequestException(
      'documentType y documentNumber deben informarse juntos.',
    );
  }
}
