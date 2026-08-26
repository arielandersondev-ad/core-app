import { Injectable } from "@nestjs/common";
import { RoleRepository } from "../../domain/repositories/role.repository.js";
import { Role } from "../../domain/entities/role.entity.js";

@Injectable()
export class CreateRoleUseCase {
    constructor(
        private readonly roleRepo: RoleRepository
    ) {}
    async execute (data : any): Promise<Role>{
        return await this.roleRepo.create(data)
    } 
}