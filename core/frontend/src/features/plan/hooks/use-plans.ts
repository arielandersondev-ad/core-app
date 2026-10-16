'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { planQueryKeys } from '../api/endpoints';
import { planService } from '../services/plan.service';
import type { AssignPlanPayload, CreatePlanPayload, UpdateAssignmentStatusPayload, UpdatePlanPayload } from '../types/plan';

export function usePlans() {
  return useQuery({ queryKey: planQueryKeys.list(), queryFn: planService.list });
}

export function usePlanAssignments() {
  return useQuery({ queryKey: planQueryKeys.assignments(), queryFn: planService.listAssignments });
}

function useInvalidatePlans() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: planQueryKeys.all });
}

export function useCreatePlan() {
  const invalidate = useInvalidatePlans();
  return useMutation({ mutationFn: (payload: CreatePlanPayload) => planService.create(payload), onSuccess: invalidate });
}

export function useUpdatePlan() {
  const invalidate = useInvalidatePlans();
  return useMutation({ mutationFn: ({ id, payload }: {id: string; payload: UpdatePlanPayload}) => planService.update(id, payload), onSuccess: invalidate });
}

export function useDeletePlan() {
  const invalidate = useInvalidatePlans();
  return useMutation({ mutationFn: planService.remove, onSuccess: invalidate });
}

export function useAssignPlan() {
  const invalidate = useInvalidatePlans();
  return useMutation({ mutationFn: ({ organizationId, vertical, payload }: {organizationId: string; vertical: string; payload: AssignPlanPayload}) => planService.assign(organizationId, vertical, payload), onSuccess: invalidate });
}

export function useUpdateAssignmentStatus() {
  const invalidate = useInvalidatePlans();
  return useMutation({ mutationFn: ({ organizationId, vertical, payload }: {organizationId: string; vertical: string; payload: UpdateAssignmentStatusPayload}) => planService.updateAssignmentStatus(organizationId, vertical, payload), onSuccess: invalidate });
}
