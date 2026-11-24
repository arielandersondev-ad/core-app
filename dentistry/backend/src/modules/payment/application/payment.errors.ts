import { HttpStatus } from '@nestjs/common';
import { CodedHttpException } from '../../../common/presentation/http/coded-http-exception.js';

/** Catálogo de errores estables del módulo de pagos. */
export const PaymentErrors = {
  patientNotFound: () =>
    new CodedHttpException(
      HttpStatus.NOT_FOUND,
      'PATIENT_NOT_FOUND',
      'No se encontró el paciente en tu organización.',
    ),
  paymentNotFound: () =>
    new CodedHttpException(
      HttpStatus.NOT_FOUND,
      'PAYMENT_NOT_FOUND',
      'No se encontró el pago para este paciente.',
    ),
  treatmentNotFound: () =>
    new CodedHttpException(
      HttpStatus.NOT_FOUND,
      'TREATMENT_NOT_FOUND',
      'No se encontró el tratamiento para este paciente.',
    ),
  encounterNotFound: () =>
    new CodedHttpException(
      HttpStatus.NOT_FOUND,
      'ENCOUNTER_NOT_FOUND',
      'No se encontró la atención para este paciente.',
    ),
  branchRequired: () =>
    new CodedHttpException(
      HttpStatus.BAD_REQUEST,
      'BRANCH_REQUIRED',
      'Indica la sucursal que recibe el pago.',
    ),
  branchForbidden: () =>
    new CodedHttpException(
      HttpStatus.FORBIDDEN,
      'BRANCH_FORBIDDEN',
      'No tienes permiso para operar en la sucursal indicada.',
    ),
  invalidAmount: () =>
    new CodedHttpException(
      HttpStatus.BAD_REQUEST,
      'INVALID_PAYMENT_AMOUNT',
      'El importe debe ser un entero mayor a cero, en unidades menores.',
    ),
  currencyRequired: () =>
    new CodedHttpException(
      HttpStatus.BAD_REQUEST,
      'PAYMENT_CURRENCY_REQUIRED',
      'Indica la moneda: el pago no está asociado a un tratamiento con presupuesto.',
    ),
  currencyMismatch: (treatmentCurrency: string) =>
    new CodedHttpException(
      HttpStatus.BAD_REQUEST,
      'PAYMENT_CURRENCY_MISMATCH',
      `El pago debe estar en la moneda del tratamiento (${treatmentCurrency}).`,
    ),
  invalidPaidAt: () =>
    new CodedHttpException(
      HttpStatus.BAD_REQUEST,
      'INVALID_PAID_AT',
      'La fecha del pago no puede ser futura.',
    ),
  treatmentWithoutBudget: () =>
    new CodedHttpException(
      HttpStatus.CONFLICT,
      'TREATMENT_WITHOUT_BUDGET',
      'El tratamiento no tiene presupuesto: defínelo antes de registrar pagos.',
    ),
  treatmentNotPayable: () =>
    new CodedHttpException(
      HttpStatus.CONFLICT,
      'TREATMENT_NOT_PAYABLE',
      'El tratamiento fue rechazado o cancelado y no admite pagos.',
    ),
  exceedsBalance: (balanceMinor: number) =>
    new CodedHttpException(
      HttpStatus.CONFLICT,
      'PAYMENT_EXCEEDS_BALANCE',
      `El importe supera el saldo pendiente del tratamiento (${balanceMinor}).`,
    ),
  encounterAlreadyPaid: () =>
    new CodedHttpException(
      HttpStatus.CONFLICT,
      'ENCOUNTER_ALREADY_PAID',
      'La atención ya tiene un pago registrado; anúlalo antes de registrar otro.',
    ),
  encounterVoided: () =>
    new CodedHttpException(
      HttpStatus.CONFLICT,
      'ENCOUNTER_VOIDED',
      'La atención está anulada y no admite pagos.',
    ),
  alreadyVoided: () =>
    new CodedHttpException(
      HttpStatus.CONFLICT,
      'PAYMENT_ALREADY_VOIDED',
      'El pago ya está anulado.',
    ),
  voidReasonRequired: () =>
    new CodedHttpException(
      HttpStatus.BAD_REQUEST,
      'VOID_REASON_REQUIRED',
      'El motivo de anulación es obligatorio.',
    ),
} as const;
