import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";
import { UUID_PATTERN } from "../../../../common/validation/uuid-pattern.js";

// Regex de UUID genérico: acepta v7 (formato del contrato), a diferencia
// de @IsUUID() que por defecto valida solo v4.

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  // bcrypt soporta hasta 72 bytes; se acota en validación.
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;

  @Matches(UUID_PATTERN)
  organizationId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @ArrayUnique()
  @Matches(UUID_PATTERN, { each: true })
  branchIds!: string[];

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @ArrayUnique()
  @Matches(UUID_PATTERN, { each: true })
  roleIds!: string[];
}
