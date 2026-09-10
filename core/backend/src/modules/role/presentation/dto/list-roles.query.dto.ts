import { Matches } from 'class-validator';

// Regex de UUID genérico: acepta v7 (formato del contrato).
const UUID_PATTERN = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export class ListRolesQueryDto {
  //@Matches(UUID_PATTERN)
  organizationId!: string;
}
