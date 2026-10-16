import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsDefined,
  IsISO31661Alpha2,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { ROLE_CODE_PATTERN } from '../../../role/domain/value-objects/role-code.js';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

const optionalTrim = ({ value }: { value: unknown }) => {
  if (typeof value !== 'string') {
    return value;
  }

  const normalized = value.trim();
  return normalized.length === 0 ? undefined : normalized;
};

const upperTrim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toUpperCase() : value;

const optionalNumber = ({ value }: { value: unknown }) => {
  if (value === '' || value === null || value === undefined) {
    return undefined;
  }

  return typeof value === 'number' ? value : Number(value);
};

export class OrganizationSetupDataDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name!: string;

  @Transform(optionalTrim)
  @IsOptional()
  @IsString()
  @MaxLength(200)
  legalName?: string;

  @Transform(optionalTrim)
  @IsOptional()
  @IsString()
  @MaxLength(50)
  taxId?: string;

  @Transform(optionalTrim)
  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  email?: string;

  @Transform(optionalTrim)
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @Transform(optionalTrim)
  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(2048)
  website?: string;

  @Transform(upperTrim)
  @IsISO31661Alpha2()
  country!: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  timezone!: string;
}

export class OrganizationSetupRoleDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @Matches(ROLE_CODE_PATTERN, {
    message:
      'code debe comenzar con una letra y contener solo letras mayúsculas, números o guiones bajos',
  })
  code!: string;

  @Transform(optionalTrim)
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

export class OrganizationSetupBranchDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name!: string;

  @Transform(optionalTrim)
  @IsOptional()
  @IsString()
  @MaxLength(50)
  code?: string;

  @Transform(optionalTrim)
  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  email?: string;

  @Transform(optionalTrim)
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @Transform(optionalTrim)
  @IsOptional()
  @IsString()
  @MaxLength(200)
  addressLine1?: string;

  @Transform(optionalTrim)
  @IsOptional()
  @IsString()
  @MaxLength(200)
  addressLine2?: string;

  @Transform(optionalTrim)
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @Transform(optionalTrim)
  @IsOptional()
  @IsString()
  @MaxLength(100)
  state?: string;

  @Transform(upperTrim)
  @IsISO31661Alpha2()
  country!: string;

  @Transform(optionalTrim)
  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string;

  @Transform(optionalNumber)
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @Transform(optionalNumber)
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  timezone!: string;
}

export class ReqCreateOrganizationSetupDto {
  @IsDefined()
  @ValidateNested()
  @Type(() => OrganizationSetupDataDto)
  organization!: OrganizationSetupDataDto;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => OrganizationSetupRoleDto)
  roles!: OrganizationSetupRoleDto[];

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => OrganizationSetupBranchDto)
  branches!: OrganizationSetupBranchDto[];
}
