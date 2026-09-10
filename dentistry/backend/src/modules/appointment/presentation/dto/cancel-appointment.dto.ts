import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CancelAppointmentDto {
  @IsUUID()
  cancelledByMembershipId: string;

  @IsString()
  @IsNotEmpty()
  reason: string;
}
