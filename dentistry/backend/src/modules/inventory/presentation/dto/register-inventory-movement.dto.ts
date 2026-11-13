import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Min,
} from 'class-validator';

export class RegisterInventoryMovementDto {
  @IsIn(['IN', 'OUT', 'ADJUSTMENT'])
  type: 'IN' | 'OUT' | 'ADJUSTMENT';

  @IsInt()
  quantity: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  unitCostMinor?: number;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;

  @IsOptional()
  @IsString()
  lotNumber?: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  expiryDate?: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsUUID('all')
  relatedTreatmentId?: string;

  @IsOptional()
  @IsUUID('all')
  relatedClinicalEncounterId?: string;
}
