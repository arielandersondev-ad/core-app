import { IsBooleanString, IsOptional, IsString, IsUUID } from 'class-validator';

export class ListDentalServicesQueryDto {
  @IsUUID()
  organizationId: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  active?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
