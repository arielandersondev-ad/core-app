/** Módulos que un plan de Dentistry puede habilitar (mismos códigos que el backend). */
export type DentistryModule =
  | "patients"
  | "agenda"
  | "appointments"
  | "procedures"
  | "inventory"
  | "dashboard"
  | "services"
  | "treatments"
  | "payments";

export type SessionPlan = {
  /** null: plan anterior a las funciones por plan; no restringe módulos. */
  modules: DentistryModule[] | null;
  /** null: el plan no define ese cupo. */
  limits: { patients: number | null; members: number | null; branches: number | null };
};

/** Sin plan vigente no hay módulos; con `modules: null` están todos. */
export function isModuleEnabled(plan: SessionPlan | null, module: DentistryModule): boolean {
  if (!plan) return false;
  return plan.modules === null || plan.modules.includes(module);
}

/** Rutas de plataforma que pertenecen a un módulo del plan. */
const ROUTE_MODULES: readonly { prefix: string; module: DentistryModule }[] = [
  { prefix: "/dashboard", module: "dashboard" },
  { prefix: "/patients", module: "patients" },
  { prefix: "/agenda", module: "agenda" },
  { prefix: "/services", module: "services" },
  { prefix: "/treatments", module: "treatments" },
  { prefix: "/payments", module: "payments" },
  { prefix: "/register-payment", module: "payments" },
  { prefix: "/inventory", module: "inventory" },
];

export function moduleForPath(pathname: string): DentistryModule | null {
  const match = ROUTE_MODULES.find(
    ({ prefix }) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  return match?.module ?? null;
}

function isLimit(value: unknown): value is number | null {
  return value === null || (typeof value === "number" && Number.isInteger(value) && value > 0);
}

/** Valida el bloque `plan` de /auth/me; undefined se trata como sin plan. */
export function isSessionPlan(value: unknown): value is SessionPlan | null {
  if (value === null) return true;
  if (!value || typeof value !== "object") return false;
  const plan = value as Partial<SessionPlan>;
  const modulesOk =
    plan.modules === null ||
    (Array.isArray(plan.modules) && plan.modules.every((code) => typeof code === "string"));
  const limits = plan.limits;
  return (
    modulesOk &&
    !!limits &&
    typeof limits === "object" &&
    isLimit(limits.patients) &&
    isLimit(limits.members) &&
    isLimit(limits.branches)
  );
}
