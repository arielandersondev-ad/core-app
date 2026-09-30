import { ArrayMaxSize, IsArray, Matches } from 'class-validator';
import { UUID_PATTERN } from '../../../../common/validation/uuid-pattern.js';

export class ReplaceRolePermissionsDto {
  @IsArray()
  @ArrayMaxSize(100)
  @Matches(UUID_PATTERN, { each: true, message: 'Cada permissionId debe ser un UUID válido' })
  permissionIds!: string[];
}
