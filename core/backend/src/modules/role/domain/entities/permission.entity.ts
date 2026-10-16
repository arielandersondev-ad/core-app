export type RolePermission = {
    id: string;
    createdAt: Date;
    permissionId: string;
    roleId: string;
}
export type Permission = {
    id: string
    name: string
    code: string
    description: string | null
    createdAt: Date | null
    updatedAt: Date
}
