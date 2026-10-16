import { Matches } from 'class-validator';
import { UUID_PATTERN } from '../../../../common/validation/uuid-pattern.js';

export class OrganizationUsersParamsDto {
  @Matches(UUID_PATTERN, { message: 'organizationId debe ser un UUID válido' })
  organizationId!: string;
}
