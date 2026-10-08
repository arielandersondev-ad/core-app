import { Injectable } from "@nestjs/common";
import { PermissionRepository } from "../../domain/repositories/permission.repository.js";
import { PermissionListItem } from "../contracts/permission-group.js";

@Injectable()
export class ListAllPermissionsUseCase {
	constructor(
		private readonly permissionRepo: PermissionRepository
	){}

	async execute(): Promise<PermissionListItem[]>{
		const permissions = await this.permissionRepo.listAllPermissions()
		return permissions
	}
}