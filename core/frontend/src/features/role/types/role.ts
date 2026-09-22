export type RoleListItem = {
    id: string;
    organizationId: string | null
    name: string
    code: string
    description: string | null
    deleted: boolean
    deletedAt: string | null
    createdAt: string
    updatedAt: string
}
