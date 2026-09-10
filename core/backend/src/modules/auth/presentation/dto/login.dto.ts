import { IsEmail, IsString, IsNotEmpty, Matches } from 'class-validator';

const UUID_PATTERN =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;

  @Matches(UUID_PATTERN, {
    message: 'organizationId debe ser un UUID válido',
  })
  organizationId!: string;
}
