import {SetMetadata} from '@nestjs/common'
export const CORE_ACCESS_KEY = 'core-access-key'
export type CoreAccess =
  | 'users:read' | 'users:create' | 'users:update'
  | 'organizations:read' | 'organizations:create' | 'organizations:update'
  | 'branches:read' | 'branches:create' | 'branches:update'
  | 'roles:read' | 'roles:create' | 'roles:update'
  | 'plans:read' | 'plans:create' | 'plans:update' | 'plans:delete' | 'plans:assign';

export function RequireCoreAccess(access: CoreAccess) {
    return SetMetadata(CORE_ACCESS_KEY, access)
}
