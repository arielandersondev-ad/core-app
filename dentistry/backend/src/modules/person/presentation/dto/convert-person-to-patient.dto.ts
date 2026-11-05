import {
  IsDateString,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

export class ConvertPersonToPatientDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  email?: string;

  @IsOptional()
  @IsDateString({ strict: true }, { message: 'birthDate debe ser una fecha válida (YYYY-MM-DD)' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'birthDate debe tener formato YYYY-MM-DD' })
  birthDate?: string | null;

  @IsOptional()
  @IsString()
  @IsIn(['MALE', 'FEMALE', 'OTHER'], {
    message: 'sex debe ser MALE, FEMALE o OTHER',
  })
  sex?: string;

  @IsOptional()
  @IsString()
  documentType?: string;

  @IsOptional()
  @IsString()
  documentNumber?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
