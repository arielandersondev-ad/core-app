import { IsIn, IsOptional, IsString } from 'class-validator';
import type { PatientStatus } from '../../domain/entities/patient.entity.js';
import { PaginationQueryDto } from '../../../../common/presentation/dto/pagination.query.dto.js';

export class ListPatientsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE'])
  status?: PatientStatus;
}
