import type { ListPatientsParams, PatientStatus } from "@/features/patient/types/patient";

export const PATIENT_PAGE_SIZES = [10, 20, 50, 100] as const;

type ListChange = {
  search?: string;
  status?: PatientStatus | "";
  page?: number;
  pageSize?: number;
};

export function readPatientListParams(params: Pick<URLSearchParams, "get">): ListPatientsParams & { page: number; pageSize: number } {
  const page = Number(params.get("page") ?? 1);
  const pageSize = Number(params.get("pageSize") ?? 20);
  const status = params.get("status");
  return {
    search: params.get("search")?.trim() || undefined,
    status: status === "ACTIVE" || status === "INACTIVE" ? status : undefined,
    page: Number.isSafeInteger(page) && page > 0 ? page : 1,
    pageSize: Number.isSafeInteger(pageSize) && pageSize > 0 && pageSize <= 100 ? pageSize : 20,
  };
}

export function updatePatientListParams(current: string, change: ListChange): URLSearchParams {
  const next = new URLSearchParams(current);
  for (const key of ["search", "status", "page", "pageSize"] as const) {
    const value = change[key];
    if (value === undefined) continue;
    if (value === "") next.delete(key);
    else next.set(key, String(value));
  }
  if (change.search !== undefined || change.status !== undefined || change.pageSize !== undefined) {
    next.set("page", "1");
  }
  return next;
}

export function visiblePatientPages(page: number, totalPages: number): number[] {
  if (totalPages < 1) return [];
  const center = Math.min(page, totalPages);
  const pages = new Set([1, totalPages]);
  for (let candidate = Math.max(1, center - 2); candidate <= Math.min(totalPages, center + 2); candidate++) {
    pages.add(candidate);
  }
  return [...pages].sort((a, b) => a - b);
}
