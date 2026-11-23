import type { PlanVertical } from '../types/plan';

export type PlanFeatureOption = Readonly<{ code: string; label: string }>;

/**
 * Funciones (`entitlements.features`) que un plan puede habilitar y que la vertical
 * ya implementa. Las demás claves del plan se conservan sin cambios.
 */
export const PLAN_FEATURES: Readonly<Record<PlanVertical, readonly PlanFeatureOption[]>> = {
  DENTISTRY: [
    { code: 'clinicalHistory', label: 'Pacientes e historial clínico' },
    { code: 'appointments', label: 'Agenda y citas' },
    { code: 'procedureNotes', label: 'Procedimientos' },
    { code: 'inventory', label: 'Inventario' },
    { code: 'dashboard', label: 'Dashboard' },
    { code: 'services', label: 'Servicios' },
    { code: 'treatments', label: 'Tratamientos' },
    { code: 'payments', label: 'Pagos' },
    { code: 'files', label: 'Archivos clínicos' },
  ],
};
