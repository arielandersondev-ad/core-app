import { Matches } from 'class-validator';
import { UUID_PATTERN } from '../../../../common/validation/uuid-pattern.js';

export class PlanParamDto {
  @Matches(UUID_PATTERN)
  planId!: string;
}

export class OrganizationParamDto {
  @Matches(UUID_PATTERN)
  organizationId!: string;
}
