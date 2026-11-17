import { HttpStatus } from '@nestjs/common';
import { CodedHttpException } from '../../../common/presentation/http/coded-http-exception.js';

/** Catálogo de errores estables del módulo clínico (doc API, P11). */
export const ClinicalErrors = {
  patientNotFound: () =>
    new CodedHttpException(
      HttpStatus.NOT_FOUND,
      'PATIENT_NOT_FOUND',
      'No se encontró el paciente en tu organización.',
    ),
  patientMismatch: () =>
    new CodedHttpException(
      HttpStatus.BAD_REQUEST,
      'PATIENT_MISMATCH',
      'El paciente del cuerpo no coincide con el de la ruta.',
    ),
  branchForbidden: () =>
    new CodedHttpException(
      HttpStatus.FORBIDDEN,
      'BRANCH_FORBIDDEN',
      'No tienes permiso para operar en la sucursal indicada.',
    ),
  encounterNotFound: () =>
    new CodedHttpException(
      HttpStatus.NOT_FOUND,
      'ENCOUNTER_NOT_FOUND',
      'No se encontró la atención en tu organización.',
    ),
  appointmentNotFound: () =>
    new CodedHttpException(
      HttpStatus.NOT_FOUND,
      'APPOINTMENT_NOT_FOUND',
      'No se encontró la cita para este paciente.',
    ),
  appointmentNotEligible: () =>
    new CodedHttpException(
      HttpStatus.UNPROCESSABLE_ENTITY,
      'APPOINTMENT_NOT_ELIGIBLE',
      'La cita está cancelada, no asistida o pertenece a otra sucursal.',
    ),
  appointmentTaken: () =>
    new CodedHttpException(
      HttpStatus.CONFLICT,
      'ENCOUNTER_APPOINTMENT_TAKEN',
      'Ya existe una atención para esta cita.',
    ),
  treatmentNotFound: () =>
    new CodedHttpException(
      HttpStatus.NOT_FOUND,
      'TREATMENT_NOT_FOUND',
      'No se encontró el tratamiento para este paciente.',
    ),
  treatmentProcedureNotFound: () =>
    new CodedHttpException(
      HttpStatus.NOT_FOUND,
      'TREATMENT_PROCEDURE_NOT_FOUND',
      'No se encontró el procedimiento planificado para este paciente.',
    ),
  treatmentProcedureMismatch: () =>
    new CodedHttpException(
      HttpStatus.UNPROCESSABLE_ENTITY,
      'TREATMENT_PROCEDURE_MISMATCH',
      'El procedimiento planificado está cancelado o no pertenece al tratamiento de la atención.',
    ),
  invalidProcedureTarget: (message: string) =>
    new CodedHttpException(
      HttpStatus.BAD_REQUEST,
      'INVALID_PROCEDURE_TARGET',
      message,
    ),
  notInProgress: (action: 'completar' | 'registrar procedimientos') =>
    new CodedHttpException(
      HttpStatus.CONFLICT,
      'ENCOUNTER_NOT_IN_PROGRESS',
      action === 'completar'
        ? 'Solo se puede completar una atención en curso.'
        : 'Solo se pueden registrar procedimientos en una atención en curso.',
    ),
  alreadyVoided: () =>
    new CodedHttpException(
      HttpStatus.CONFLICT,
      'ENCOUNTER_ALREADY_VOIDED',
      'La atención ya está anulada.',
    ),
  encounterChanged: () =>
    new CodedHttpException(
      HttpStatus.CONFLICT,
      'ENCOUNTER_CHANGED',
      'La atención cambió; vuelve a cargarla antes de continuar.',
    ),
  invalidEndedAt: () =>
    new CodedHttpException(
      HttpStatus.BAD_REQUEST,
      'INVALID_ENDED_AT',
      'La hora de fin no puede ser anterior al inicio de la atención.',
    ),
  voidReasonRequired: () =>
    new CodedHttpException(
      HttpStatus.BAD_REQUEST,
      'VOID_REASON_REQUIRED',
      'El motivo de anulación es obligatorio.',
    ),
  healthProfileStale: () =>
    new CodedHttpException(
      HttpStatus.CONFLICT,
      'HEALTH_PROFILE_STALE',
      'El perfil de salud cambió; vuelve a cargarlo antes de guardar.',
    ),
} as const;
