import {
  ArrayMaxSize,
  IsArray,
  IsEmail,
  IsOptional,
  IsString,
  IsUrl,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateBranchDto } from './create-branch.dto.js';

export class CreateOrganizationDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  legalName?: string;

  @IsOptional()
  @IsString()
  taxId?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsUrl()
  website?: string;

  @IsString()
  country!: string;

  @IsString()
  timezone!: string;

  // Opcional: si se omite o llega vacío el backend crea una sucursal por defecto.
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => CreateBranchDto)
  branches?: CreateBranchDto[];
}
