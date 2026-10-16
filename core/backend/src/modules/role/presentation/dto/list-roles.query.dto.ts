import { Matches } from 'class-validator';
import { UUID_PATTERN } from '../../../../common/validation/uuid-pattern.js';
export class ListRolesQueryDto {
  @Matches(UUID_PATTERN)
  organizationId!: string;
}
