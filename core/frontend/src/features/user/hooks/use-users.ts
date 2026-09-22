'use client';

import { useQuery } from '@tanstack/react-query';
import { userQueryKeys } from '@/features/user/api/endpoints';
import { userService } from '@/features/user/services/user.service';

export function useUsers() {
  return useQuery({
    queryKey: userQueryKeys.list(),
    queryFn: userService.list,
  });
}
