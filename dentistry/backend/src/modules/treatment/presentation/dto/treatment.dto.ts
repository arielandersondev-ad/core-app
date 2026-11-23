import { Transform } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { PaginationQueryDto } from '../../../../common/presentation/dto/pagination.query.dto.js';
import {
  TREATMENT_STATUSES,
  type TreatmentStatus,
} from '../../domain/entities/treatment.entity.js';
import { MAX_AGREED_PRICE_MINOR } from '../../application/treatment-rules.js';

const upperCase = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim().toUpperCase() : value;

export class ListTreatmentsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(TREATMENT_STATUSES)
  status?: TreatmentStatus;
}

export class CreateTreatmentDto {
  @IsOptional()
  @IsUUID('all')
  serviceId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  estimatedSessions?: number;

  /** Presupuesto en unidades menores: 10 000 Bs se envían como 1000000. */
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(MAX_AGREED_PRICE_MINOR)
  agreedPriceMinor?: number;

  @IsOptional()
  @Transform(upperCase)
  @Matches(/^[A-Z]{3}$/, { message: 'currency debe tener 3 letras (ej. BOB)' })
  currency?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  diagnosisSummary?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  notes?: string | null;
}

export class UpdateTreatmentDto {
  @IsOptional()
  @IsIn(TREATMENT_STATUSES)
  status?: TreatmentStatus;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  estimatedSessions?: number | null;

  /** `null` retira el presupuesto (solo si aún no hay pagos). */
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(MAX_AGREED_PRICE_MINOR)
  agreedPriceMinor?: number | null;

  @IsOptional()
  @Transform(upperCase)
  @Matches(/^[A-Z]{3}$/, { message: 'currency debe tener 3 letras (ej. BOB)' })
  currency?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  diagnosisSummary?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  notes?: string | null;
}
