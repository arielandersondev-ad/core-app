"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchAppointments,
  fetchAppointmentById,
  createAppointment,
  updateAppointmentStatus,
  cancelAppointment,
  type AppointmentDto,
  type CreateAppointmentRequest,
  type ListAppointmentsParams,
} from "../api/appointments";

export const appointmentQueryKeys = {
  all: ["appointments"] as const,
  list: (params: ListAppointmentsParams = {}) => ["appointments", params] as const,
  detail: (id: string) => ["appointments", "detail", id] as const,
};

export function useAppointments(params: ListAppointmentsParams = {}) {
  return useQuery<AppointmentDto[]>({
    queryKey: appointmentQueryKeys.list(params),
    queryFn: () => fetchAppointments(params),
  });
}

export function useAppointmentDetail(id: string) {
  return useQuery<AppointmentDto>({
    queryKey: appointmentQueryKeys.detail(id),
    queryFn: () => fetchAppointmentById(id),
    enabled: Boolean(id),
  });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateAppointmentRequest) => createAppointment(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: appointmentQueryKeys.all,
      });
    },
  });
}

export function useUpdateAppointmentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: {
        status:
          | "SCHEDULED"
          | "CONFIRMED"
          | "WAITING_ROOM"
          | "IN_PROGRESS"
          | "COMPLETED"
          | "NO_SHOW";
        notes?: string;
      };
    }) => updateAppointmentStatus(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: appointmentQueryKeys.all,
      });
    },
  });
}

export function useCancelAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: {
        canceledByMembershipId?: string;
        reason: string;
      };
    }) => cancelAppointment(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: appointmentQueryKeys.all,
      });
    },
  });
}
