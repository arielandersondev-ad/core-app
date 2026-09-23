export type RolePermission = {
    id: string;
    createdAt: Date;
    PermissionId: string;
    RoleId: string;
}
export type Permission = {
    id: string
    name: string
    code: string
    description: string | null
    createdAt: Date | null
    updatedAt: Date
}