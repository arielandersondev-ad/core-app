import { SetMetadata } from '@nestjs/common';

export const REQUIRED_PERMISSION = 'dentistry:required-permission';
export const RequirePermission = (permission: string) => SetMetadata(REQUIRED_PERMISSION, permission);
