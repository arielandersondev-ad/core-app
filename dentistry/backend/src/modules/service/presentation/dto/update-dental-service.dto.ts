import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateDentalServiceSupplyInput } from './create-dental-service.dto.js';

export class UpdateDentalServiceDto {
  @IsUUID()
  organizationId: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(5)
  durationMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  basePriceMinor?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  labCostMinor?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsUUID()
  updatedByMembershipId: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateDentalServiceSupplyInput)
  supplies?: CreateDentalServiceSupplyInput[];
}

export class ToggleDentalServiceStatusDto {
  @IsUUID()
  organizationId: string;

  @IsUUID()
  updatedByMembershipId: string;
}
