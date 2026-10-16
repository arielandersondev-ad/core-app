import { Transform } from 'class-transformer';
import { IsDateString, IsIn, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, ValidateIf } from 'class-validator';
import { UUID_PATTERN } from '../../../../common/validation/uuid-pattern.js';

export class ListPlanAssignmentsQueryDto {
  @IsOptional()
  @Matches(UUID_PATTERN)
  organizationId?: string;
}

export class AssignPlanDto {
  @Matches(UUID_PATTERN)
  planId!: string;

  @IsOptional()
  @IsIn(['ACTIVE', 'TRIALING'])
  status?: 'ACTIVE' | 'TRIALING';

  @IsOptional()
  @IsDateString({ strict: true })
  startsAt?: string;
}

export class ChangePlanAssignmentStatusDto {
  @IsIn(['ACTIVE', 'SUSPENDED', 'CANCELED'])
  status!: 'ACTIVE' | 'SUSPENDED' | 'CANCELED';

  @ValidateIf((dto: ChangePlanAssignmentStatusDto) => dto.status === 'SUSPENDED')
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason?: string;
}

export class VerticalParamDto {
  @Transform(({ value }) => typeof value === 'string' ? value.trim().toUpperCase() : value)
  @Matches(/^[A-Z][A-Z0-9_]*$/)
  vertical!: string;
}

export class OrganizationPlanParamsDto extends VerticalParamDto {
  @Matches(UUID_PATTERN)
  organizationId!: string;
}
