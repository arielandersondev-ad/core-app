import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import type { PatientHealthProfile } from '../../domain/entities/patient-health-profile.entity.js';

export class SavePatientHealthProfileDto {
  @IsOptional()
  @IsString()
  medicalHistory?: string | null;

  @IsOptional()
  @IsString()
  allergies?: string | null;

  @IsOptional()
  @IsString()
  currentMedications?: string | null;

  @IsOptional()
  @IsString()
  dentalHistory?: string | null;

  @IsOptional()
  @IsString()
  relevantConditions?: string | null;

  @IsOptional()
  @IsString()
  observations?: string | null;

  /** Concurrencia optimista opcional: versión leída (0 si no existía). */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  rowVersion?: number;
}

export class PatientHealthProfileResponseDto {
  patientId: string;
  medicalHistory: string | null;
  allergies: string | null;
  currentMedications: string | null;
  dentalHistory: string | null;
  relevantConditions: string | null;
  observations: string | null;
  updatedAt: string | null;
  rowVersion: number;

  static fromEntity(profile: PatientHealthProfile): PatientHealthProfileResponseDto {
    const dto = new PatientHealthProfileResponseDto();
    dto.patientId = profile.patientId;
    dto.medicalHistory = profile.medicalHistory;
    dto.allergies = profile.allergies;
    dto.currentMedications = profile.currentMedications;
    dto.dentalHistory = profile.dentalHistory;
    dto.relevantConditions = profile.relevantConditions;
    dto.observations = profile.observations;
    dto.updatedAt = profile.updatedAt?.toISOString() ?? null;
    dto.rowVersion = profile.rowVersion;
    return dto;
  }
}
