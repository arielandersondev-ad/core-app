import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../common/infrastructure/prisma.service.js";
import { Permission } from "../domain/entities/permission.entity.js";
import { PermissionRepository } from "../domain/repositories/permission.repository.js";
import { PermissionListItem } from "../application/contracts/permission-group.js";

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

	async findByCode(code: string): Promise<Permission | null> {
		const row = await this.prisma.orm.core.Permission.first({ code });
		return row ? this.toDomain(row) : null;
	}

	async create(data: { code: string; name: string; description: string | null }): Promise<Permission> {
		const row = await this.prisma.orm.core.Permission.create(data);
		return this.toDomain(row);
	}

	async listAllPermissions(): Promise<PermissionListItem[]> {
		const rows = await this.prisma.orm.core.Permission.all()
		return rows.map((row)=> this.toDomain(row))
	}
}
