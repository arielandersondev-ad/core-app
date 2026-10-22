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

export class CreateDentalServiceSupplyInput {
  @IsOptional()
  @IsUUID()
  inventoryItemId?: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  estimatedCostMinor?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateDentalServiceDto {
  @IsUUID()
  organizationId: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsString()
  name: string;

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
  isActive?: boolean;

  @IsUUID()
  createdByMembershipId: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateDentalServiceSupplyInput)
  supplies?: CreateDentalServiceSupplyInput[];
}
