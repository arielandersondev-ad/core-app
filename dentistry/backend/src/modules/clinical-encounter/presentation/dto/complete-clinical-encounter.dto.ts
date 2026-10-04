import { IsISO8601, IsOptional, IsUUID } from 'class-validator';

export class CompleteClinicalEncounterDto {
  @IsOptional()
  @IsISO8601()
  endedAt?: string;

  @IsUUID()
  updatedByMembershipId: string;
}