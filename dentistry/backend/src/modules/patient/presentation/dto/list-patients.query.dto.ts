import { IsIn, IsOptional, IsString, Matches } from 'class-validator';
import type { PatientStatus } from '../../domain/entities/patient.entity.js';
import { PaginationQueryDto } from '../../../../common/presentation/dto/pagination.query.dto.js';

export class ListPatientsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE'])
  status?: PatientStatus;

  /** Fecha civil de alta (inclusive) en la zona horaria de la organización. */
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'createdFrom debe tener el formato YYYY-MM-DD' })
  createdFrom?: string;

  /** Fecha civil de alta (inclusive) en la zona horaria de la organización. */
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'createdTo debe tener el formato YYYY-MM-DD' })
  createdTo?: string;
}
