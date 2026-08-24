import { ConflictException, Injectable, Logger } from "@nestjs/common";
import { UserRepository } from "../../domain/repositories/user.repository.js";
import {
  CreateUserWithAccess,
  UserWithMembership,
} from "../../domain/entities/user.entity.js";
import { CreateUserDto } from "../../presentation/dto/create-user.dto.js";

@Injectable()
export class CreateUserUseCase {
  private readonly logger = new Logger(CreateUserUseCase.name);

  constructor(
    private readonly userRepository: UserRepository,
  ) {}

  async execute(data: CreateUserDto): Promise<UserWithMembership> {
    this.logger.log(`Paso 1/4 - Iniciando registro del usuario "${data.email}"`);

    this.logger.log("Paso 2/4 - Verificando disponibilidad del correo");
    const emailTaken = await this.userRepository.emailExists(data.email);
    if (emailTaken) {
      this.logger.warn(`El correo ${data.email} ya está registrado`);
      throw new ConflictException(`El correo ${data.email} ya está registrado`);
    }

    const payload: CreateUserWithAccess = {
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      password: data.password,
      organizationId: data.organizationId,
      branchIds: data.branchIds,
      roleIds: data.roleIds,
    };

    this.logger.log(
      `Paso 3/4 - Delegando persistencia transaccional: hasheo de contraseña, ` +
        `validación de organización ${data.organizationId} y vinculación de ` +
        `${data.branchIds.length} sucursal(es) y ${data.roleIds.length} rol(es)`,
    );

    const result = await this.userRepository.createUserWithMembership(payload);

    this.logger.log(
      `Paso 4/4 - Registro completado: userId=${result.user.id}, ` +
        `membershipId=${result.membership.id}, estado=${result.membership.status}`,
    );

    return result;
  }
}
