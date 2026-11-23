import { HttpStatus, ServiceUnavailableException } from '@nestjs/common';
import { CodedHttpException } from '../../../common/presentation/http/coded-http-exception.js';
import { MAX_CLINICAL_FILE_BYTES } from '../domain/value-objects/clinical-file-type.js';

/** Catálogo de errores estables de archivos clínicos. */
export const ClinicalFileErrors = {
  patientNotFound: () =>
    new CodedHttpException(
      HttpStatus.NOT_FOUND,
      'PATIENT_NOT_FOUND',
      'No se encontró el paciente en tu organización.',
    ),
  fileNotFound: () =>
    new CodedHttpException(
      HttpStatus.NOT_FOUND,
      'CLINICAL_FILE_NOT_FOUND',
      'No se encontró el archivo de este paciente.',
    ),
  encounterNotFound: () =>
    new CodedHttpException(
      HttpStatus.NOT_FOUND,
      'ENCOUNTER_NOT_FOUND',
      'No se encontró la atención para este paciente.',
    ),
  encounterVoided: () =>
    new CodedHttpException(
      HttpStatus.CONFLICT,
      'ENCOUNTER_VOIDED',
      'No se pueden adjuntar archivos a una atención anulada.',
    ),
  branchForbidden: () =>
    new CodedHttpException(
      HttpStatus.FORBIDDEN,
      'BRANCH_FORBIDDEN',
      'No tienes permiso para operar en la sucursal de la atención.',
    ),
  unsupportedType: () =>
    new CodedHttpException(
      HttpStatus.UNPROCESSABLE_ENTITY,
      'CLINICAL_FILE_TYPE_NOT_ALLOWED',
      'Solo se admiten imágenes JPG o PNG y documentos PDF.',
    ),
  tooLarge: () =>
    new CodedHttpException(
      HttpStatus.UNPROCESSABLE_ENTITY,
      'CLINICAL_FILE_TOO_LARGE',
      `El archivo supera el máximo de ${MAX_CLINICAL_FILE_BYTES / (1024 * 1024)} MB.`,
    ),
  quotaNotConfigured: () =>
    new CodedHttpException(
      HttpStatus.FORBIDDEN,
      'CLINICAL_FILE_QUOTA_UNDEFINED',
      'Tu plan no define el cupo de archivos clínicos. Contacta al administrador.',
    ),
  notPending: () =>
    new CodedHttpException(
      HttpStatus.CONFLICT,
      'CLINICAL_FILE_NOT_PENDING',
      'El archivo ya fue confirmado o descartado.',
    ),
  uploadExpired: () =>
    new CodedHttpException(
      HttpStatus.CONFLICT,
      'CLINICAL_FILE_UPLOAD_EXPIRED',
      'El plazo para subir el archivo venció; vuelve a intentarlo.',
    ),
  uploadMissing: () =>
    new CodedHttpException(
      HttpStatus.CONFLICT,
      'CLINICAL_FILE_UPLOAD_MISSING',
      'El archivo todavía no llegó al almacenamiento; vuelve a intentarlo.',
    ),
  uploadRejected: () =>
    new CodedHttpException(
      HttpStatus.UNPROCESSABLE_ENTITY,
      'CLINICAL_FILE_UPLOAD_REJECTED',
      'El archivo subido no coincide con el tipo o el tamaño declarados.',
    ),
  notReady: () =>
    new CodedHttpException(
      HttpStatus.CONFLICT,
      'CLINICAL_FILE_NOT_READY',
      'El archivo todavía no está disponible.',
    ),
  storageUnavailable: () =>
    new ServiceUnavailableException({
      statusCode: HttpStatus.SERVICE_UNAVAILABLE,
      error: 'Service Unavailable',
      code: 'CLINICAL_FILE_STORAGE_UNAVAILABLE',
      message: 'El almacenamiento de archivos no está disponible.',
    }),
} as const;
