export type PermissionListItem = {
  id: string;
  code: string;
  name: string;
  description: string | null;
};

export type PermissionGroup = {
  key: string;
  permissions: PermissionListItem[];
};
