import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator';

export class ListInventoryItemsQueryDto {
  @IsOptional()
  @IsUUID('all')
  branchId?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['all', 'out', 'low'])
  status?: 'all' | 'out' | 'low';
}
