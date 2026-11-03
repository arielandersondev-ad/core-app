export type LoginFormState = {
  errors?: { email?: string; password?: string };
  message?: string;
};

export type { CurrentSession } from "@/infrastructure/auth/session";
