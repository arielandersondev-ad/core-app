import { IsString } from "class-validator";

export class CreateUserDto {
  
  @IsString()
  email!: string;

  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

  @IsString()
  phone!: string;
}