import { Injectable, Logger } from '@nestjs/common';
import { PermissionRepository } from '../../domain/repositories/permission.repository.js';
import type { PermissionGroup } from '../contracts/permission-group.js';
import { groupPermissionsByResource } from '../mappers/group-permissions-by-resource.js';

@Injectable()
export class ListPermissionByRoleIdUseCase {
	private readonly logger = new Logger(ListPermissionByRoleIdUseCase.name);

	constructor (
		private readonly permissionRepository: PermissionRepository
	) {}

	async execute(roleId: string): Promise<PermissionGroup[]> {
		this.logger.log(`Paso 1/2 - Consultando permisos disponibles para el rol ${roleId}`);
		const permissions = await this.permissionRepository.listPermissionByRoleId(roleId);
		this.logger.log(`Paso 2/2 - Permisos encontrados para el rol ${roleId}: ${permissions.length}`);
		return groupPermissionsByResource(permissions);
	}
}
