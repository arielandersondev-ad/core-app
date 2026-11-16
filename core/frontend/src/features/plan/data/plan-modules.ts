import type { PlanVertical } from '../types/plan';

export type PlanModuleOption = Readonly<{ code: string; label: string }>;

/** Módulos que un plan puede habilitar; los códigos los valida cada vertical. */
export const PLAN_MODULES: Readonly<Record<PlanVertical, readonly PlanModuleOption[]>> = {
  DENTISTRY: [
    { code: 'patients', label: 'Pacientes' },
    { code: 'agenda', label: 'Agenda' },
    { code: 'appointments', label: 'Citas' },
    { code: 'procedures', label: 'Procedimientos' },
    { code: 'inventory', label: 'Inventario' },
    { code: 'dashboard', label: 'Dashboard' },
    { code: 'services', label: 'Servicios' },
    { code: 'treatments', label: 'Tratamientos' },
    { code: 'payments', label: 'Pagos' },
  ],
};
