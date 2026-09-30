import { api } from '@/infrastructure/http/api';
import { PLAN_ENDPOINTS } from '../api/endpoints';
import type {
  AssignPlanPayload, CreatePlanPayload, Plan, PlanAssignment, UpdateAssignmentStatusPayload, UpdatePlanPayload,
} from '../types/plan';

export const planService = {
  async list(): Promise<Plan[]> {
    const { data } = await api.get<Plan[]>(PLAN_ENDPOINTS.collection);
    return data;
  },
  async listAssignments(): Promise<PlanAssignment[]> {
    const { data } = await api.get<PlanAssignment[]>(PLAN_ENDPOINTS.assignments);
    return data;
  },
  async create(payload: CreatePlanPayload): Promise<Plan> {
    const { data } = await api.post<Plan>(PLAN_ENDPOINTS.collection, payload);
    return data;
  },
  async update(id: string, payload: UpdatePlanPayload): Promise<Plan> {
    const { data } = await api.patch<Plan>(PLAN_ENDPOINTS.detail(id), payload);
    return data;
  },
  async remove(id: string): Promise<Plan> {
    const { data } = await api.delete<Plan>(PLAN_ENDPOINTS.detail(id));
    return data;
  },
  async assign(organizationId: string, vertical: string, payload: AssignPlanPayload): Promise<PlanAssignment> {
    const { data } = await api.put<PlanAssignment>(PLAN_ENDPOINTS.organizationVertical(organizationId, vertical), payload);
    return data;
  },
  async updateAssignmentStatus(organizationId: string, vertical: string, payload: UpdateAssignmentStatusPayload): Promise<PlanAssignment> {
    const { data } = await api.patch<PlanAssignment>(PLAN_ENDPOINTS.organizationVerticalStatus(organizationId, vertical), payload);
    return data;
  },
};
