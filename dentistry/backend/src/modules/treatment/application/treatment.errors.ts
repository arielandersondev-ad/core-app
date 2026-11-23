import { HttpStatus } from '@nestjs/common';
import { CodedHttpException } from '../../../common/presentation/http/coded-http-exception.js';

/** Catálogo de errores estables del módulo de tratamientos. */
export const TreatmentErrors = {
  patientNotFound: () =>
    new CodedHttpException(
      HttpStatus.NOT_FOUND,
      'PATIENT_NOT_FOUND',
      'No se encontró el paciente en tu organización.',
    ),
  treatmentNotFound: () =>
    new CodedHttpException(
      HttpStatus.NOT_FOUND,
      'TREATMENT_NOT_FOUND',
      'No se encontró el tratamiento para este paciente.',
    ),
  serviceNotFound: () =>
    new CodedHttpException(
      HttpStatus.NOT_FOUND,
      'SERVICE_NOT_FOUND',
      'No se encontró el servicio en tu organización.',
    ),
  invalidBudget: (message: string) =>
    new CodedHttpException(
      HttpStatus.BAD_REQUEST,
      'INVALID_TREATMENT_BUDGET',
      message,
    ),
  closed: () =>
    new CodedHttpException(
      HttpStatus.CONFLICT,
      'TREATMENT_CLOSED',
      'El tratamiento está finalizado, rechazado o cancelado y no admite cambios.',
    ),
  budgetBelowPaid: (paidMinor: number) =>
    new CodedHttpException(
      HttpStatus.CONFLICT,
      'BUDGET_BELOW_PAID',
      `El presupuesto no puede ser menor a lo ya cobrado (${paidMinor}).`,
    ),
  currencyLocked: () =>
    new CodedHttpException(
      HttpStatus.CONFLICT,
      'TREATMENT_CURRENCY_LOCKED',
      'No se puede cambiar la moneda de un tratamiento que ya tiene pagos.',
    ),
} as const;
