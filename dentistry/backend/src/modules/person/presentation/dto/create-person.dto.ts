import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePersonDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre completo es obligatorio' })
  nombreCompleto: string;

  @IsOptional()
  @IsString()
  phone?: string | null;

  @IsOptional()
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  email?: string | null;

  @IsOptional()
  @IsString()
  notes?: string | null;

  // Compatibilidad alternativa/fallback
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;
}
