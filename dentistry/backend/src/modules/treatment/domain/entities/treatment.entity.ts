export const TREATMENT_STATUSES = [
  'PROPOSED',
  'ACCEPTED',
  'IN_PROGRESS',
  'ON_HOLD',
  'COMPLETED',
  'DECLINED',
  'CANCELED',
] as const;
export type TreatmentStatus = (typeof TREATMENT_STATUSES)[number];

/** Estados finales: el tratamiento queda de solo lectura. */
export const CLOSED_TREATMENT_STATUSES: readonly TreatmentStatus[] = [
  'COMPLETED',
  'DECLINED',
  'CANCELED',
];

export interface Treatment {
  id: string;
  organizationId: string;
  patientId: string;
  serviceId: string | null;
  serviceName: string | null;
  /** Nombre para mostrar. Nulo solo en tratamientos anteriores a este campo. */
  title: string | null;
  practitionerMembershipId: string | null;
  status: TreatmentStatus;
  startedAt: Date | null;
  endedAt: Date | null;
  estimatedSessions: number | null;
  /** Presupuesto acordado en unidades menores; no es deuda ni pago. */
  agreedPriceMinor: number | null;
  currency: string | null;
  diagnosisSummary: string | null;
  notes: string | null;
  createdByMembershipId: string;
  updatedByMembershipId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Estado de cuenta derivado: el saldo no se guarda, es el presupuesto menos el
 * dinero recibido (`Payment` COMPLETED) de este tratamiento.
 */
export interface TreatmentBalance {
  paidMinor: number;
  /** `null` mientras el tratamiento no tenga presupuesto. */
  balanceMinor: number | null;
}

export type TreatmentWithBalance = Treatment & TreatmentBalance;
