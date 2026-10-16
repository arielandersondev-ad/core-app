import type { AuthenticatedRequest } from '../../../../auth/presentation/http/types/authenticated-request.js';
import type { OrganizationUserListScope } from '../../../domain/entities/user-list-item.js';

export type OrganizationUserRequest = AuthenticatedRequest & {
  userListScope?: OrganizationUserListScope;
};
