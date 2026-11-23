import { Transform } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { PaginationQueryDto } from '../../../../common/presentation/dto/pagination.query.dto.js';
import { MAX_PAYMENT_MINOR } from '../../application/payment-rules.js';
import {
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  type PaymentMethod,
  type PaymentStatus,
} from '../../domain/entities/payment.entity.js';

const upperCase = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim().toUpperCase() : value;

export class ListPaymentsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID('all')
  treatmentId?: string;

  @IsOptional()
  @IsIn(PAYMENT_STATUSES)
  status?: PaymentStatus;
}

/** Campos comunes a cualquier pago recibido. */
abstract class PaymentInputDto {
  /** Unidades menores: 200 Bs se envían como 20000. */
  @IsInt()
  @Min(1)
  @Max(MAX_PAYMENT_MINOR)
  amountMinor: number;

  @IsIn(PAYMENT_METHODS)
  paymentMethod: PaymentMethod;

  /** Solo hace falta en un cobro sin tratamiento; con tratamiento se usa el suyo. */
  @IsOptional()
  @Transform(upperCase)
  @Matches(/^[A-Z]{3}$/, { message: 'currency debe tener 3 letras (ej. BOB)' })
  currency?: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  paidAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  reference?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string | null;
}

export class RegisterTreatmentPaymentDto extends PaymentInputDto {
  /** Opcional si el usuario solo opera en una sucursal. */
  @IsOptional()
  @IsUUID('all')
  branchId?: string;
}

export class RegisterEncounterPaymentDto extends PaymentInputDto {
  /** Tratamiento que reduce el pago; por defecto, el de la atención. */
  @IsOptional()
  @IsUUID('all')
  treatmentId?: string;
}

export class VoidPaymentDto {
  @IsString()
  @MaxLength(500)
  reason: string;
}
