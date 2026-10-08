'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { userQueryKeys } from '@/features/user/api/endpoints';
import { userService } from '@/features/user/services/user.service';

export function useUsers() {
  return useQuery({
    queryKey: userQueryKeys.list(),
    queryFn: userService.list,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: userService.create,
    onSuccess: async()=>{
      await queryClient.invalidateQueries({
        queryKey: userQueryKeys.all
      })
    }
  })
}