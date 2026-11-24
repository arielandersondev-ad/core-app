import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { PaginationQueryDto } from '../../../../common/presentation/dto/pagination.query.dto.js';
import {
  CLINICAL_FILE_CATEGORIES,
  MAX_CLINICAL_FILE_BYTES,
  type ClinicalFileCategory,
} from '../../domain/value-objects/clinical-file-type.js';

/** Instante ISO 8601 con zona explícita (Z u offset): sin ambigüedad de zona. */
const ZONED_INSTANT =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/;

export class ListClinicalFilesQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID('all')
  clinicalEncounterId?: string;

  @IsOptional()
  @IsIn(CLINICAL_FILE_CATEGORIES)
  category?: ClinicalFileCategory;
}

export class RequestClinicalFileUploadDto {
  @IsIn(CLINICAL_FILE_CATEGORIES)
  category: ClinicalFileCategory;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  originalFilename: string;

  /** Se compara con la lista permitida en el caso de uso y con los bytes al confirmar. */
  @IsString()
  @MaxLength(100)
  mimeType: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_CLINICAL_FILE_BYTES)
  sizeBytes: number;

  @IsOptional()
  @IsUUID('all')
  clinicalEncounterId?: string;

  @IsOptional()
  @Matches(ZONED_INSTANT, { message: 'capturedAt debe ser un instante ISO 8601 con zona' })
  capturedAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}

/**
 * Solo datos descriptivos: el archivo, su paciente y su atención no cambian.
 * `null` borra la descripción o la fecha de captura; omitir un campo lo conserva.
 */
export class UpdateClinicalFileDto {
  /** `updatedAt` que el cliente leyó; evita pisar una edición concurrente. */
  @Matches(ZONED_INSTANT, { message: 'expectedUpdatedAt debe ser un instante ISO 8601 con zona' })
  expectedUpdatedAt: string;

  @ValidateIf((_, value) => value !== undefined)
  @IsIn(CLINICAL_FILE_CATEGORIES)
  category?: ClinicalFileCategory;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string | null;

  @IsOptional()
  @Matches(ZONED_INSTANT, { message: 'capturedAt debe ser un instante ISO 8601 con zona' })
  capturedAt?: string | null;
}

export class ClinicalFileAccessUrlQueryDto {
  @IsOptional()
  @IsIn(['inline', 'attachment'])
  disposition: 'inline' | 'attachment' = 'inline';
}
