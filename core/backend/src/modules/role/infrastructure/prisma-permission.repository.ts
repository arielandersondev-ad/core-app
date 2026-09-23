import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../common/infrastructure/prisma.service.js";
import { Permission } from "../domain/entities/permission.entity.js";
import { PermissionRepository } from "../domain/repositories/permission.repository.js";

@Injectable()
export class PrismaPermissionRepository extends PermissionRepository {
	constructor(private prisma: PrismaService) { 
		super()
	}
	private toDomain (row: any): Permission {
		return{
			id: row.id,
			code: row.code,
			createdAt: row.createdAt,
			description: row.description,
			name: row.name,
			updatedAt: row.updatedAt
		}
	}

	async listPermissionByRoleId(roleId: string): Promise<Permission[]> {
		const rows = await this.prisma.orm.core.Permission
		.where((permission) => permission.rolePermissions.some({roleId})).all()
		return rows.map((row) => this.toDomain(row));
	}
}
