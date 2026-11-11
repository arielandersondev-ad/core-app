import { HttpException, HttpStatus } from '@nestjs/common';

const ERROR_NAMES: Partial<Record<HttpStatus, string>> = {
  [HttpStatus.BAD_REQUEST]: 'Bad Request',
  [HttpStatus.FORBIDDEN]: 'Forbidden',
  [HttpStatus.NOT_FOUND]: 'Not Found',
  [HttpStatus.CONFLICT]: 'Conflict',
  [HttpStatus.UNPROCESSABLE_ENTITY]: 'Unprocessable Entity',
};

/**
 * Error HTTP con el cuerpo estándar de Nest (`statusCode`, `message`, `error`)
 * más un `code` estable para que los clientes no comparen textos.
 */
export class CodedHttpException extends HttpException {
  constructor(
    status: HttpStatus,
    readonly code: string,
    message: string,
  ) {
    super(
      {
        statusCode: status,
        message,
        error: ERROR_NAMES[status] ?? 'Error',
        code,
      },
      status,
    );
  }
}
