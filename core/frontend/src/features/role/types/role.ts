export type CreateRole = {
	organizationId: string | null
	name: string
	code: string
	description: string | null
}

export type RoleListItem = CreateRole & {
	id: string;
	deleted: boolean
	deletedAt: string | null
	createdAt: string
	updatedAt: string
}

export type CreatePermissionPayload = {
	code: string;
	name: string;
	description: string | null;
}
export type PermissionItem = CreatePermissionPayload &{
	id: string;
}

export type PermissionGroup = {
	key: string;
	permissions: PermissionItem[];
}

export type ReplaceRolePermissionsPayload = {
  permissionIds: string[];
};