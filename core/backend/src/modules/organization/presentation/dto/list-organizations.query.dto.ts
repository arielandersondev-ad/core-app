import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../../common/presentation/dto/pagination.query.dto.js';

export class ListOrganizationsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
