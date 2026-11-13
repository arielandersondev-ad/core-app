export type InventoryMovementType = 'IN' | 'OUT' | 'ADJUSTMENT';

export interface InventoryMovementProps {
  id?: string;
  organizationId: string;
  branchId: string;
  itemId: string;
  type: InventoryMovementType;
  quantity: number;
  unitCostMinor?: number | null;
  currency?: string;
  lotNumber?: string | null;
  expiryDate?: string | null;
  reason?: string | null;
  relatedTreatmentId?: string | null;
  relatedClinicalEncounterId?: string | null;
  createdByMembershipId: string;
  createdAt?: Date;
}

export class InventoryMovement {
  readonly id: string;
  readonly organizationId: string;
  readonly branchId: string;
  readonly itemId: string;
  readonly type: InventoryMovementType;
  readonly quantity: number;
  readonly unitCostMinor: number | null;
  readonly currency: string;
  readonly lotNumber: string | null;
  readonly expiryDate: string | null;
  readonly reason: string | null;
  readonly relatedTreatmentId: string | null;
  readonly relatedClinicalEncounterId: string | null;
  readonly createdByMembershipId: string;
  readonly createdAt: Date;

  constructor(props: InventoryMovementProps) {
    if (!['IN', 'OUT', 'ADJUSTMENT'].includes(props.type)) {
      throw new Error('El tipo de movimiento no es válido.');
    }
    if (!Number.isInteger(props.quantity) || props.quantity === 0) {
      throw new Error('La cantidad debe ser un entero distinto de cero.');
    }
    if (props.type !== 'ADJUSTMENT' && props.quantity < 0) {
      throw new Error('Las entradas y salidas requieren cantidad positiva.');
    }
    if (
      props.unitCostMinor !== undefined &&
      props.unitCostMinor !== null &&
      (!Number.isInteger(props.unitCostMinor) || props.unitCostMinor < 0)
    ) {
      throw new Error('El costo unitario debe ser un entero no negativo.');
    }

    const currency = (props.currency ?? 'BOB').toUpperCase();
    if (!/^[A-Z]{3}$/.test(currency)) {
      throw new Error('La moneda debe ser un código ISO de tres letras.');
    }

    this.id = props.id ?? '';
    this.organizationId = props.organizationId;
    this.branchId = props.branchId;
    this.itemId = props.itemId;
    this.type = props.type;
    this.quantity = props.quantity;
    this.unitCostMinor = props.unitCostMinor ?? null;
    this.currency = currency;
    this.lotNumber = props.lotNumber?.trim() || null;
    this.expiryDate = props.expiryDate ?? null;
    this.reason = props.reason?.trim() || null;
    this.relatedTreatmentId = props.relatedTreatmentId ?? null;
    this.relatedClinicalEncounterId =
      props.relatedClinicalEncounterId ?? null;
    this.createdByMembershipId = props.createdByMembershipId;
    this.createdAt = props.createdAt ?? new Date();
  }

  get signedQuantity(): number {
    if (this.type === 'IN') return Math.abs(this.quantity);
    if (this.type === 'OUT') return -Math.abs(this.quantity);
    return this.quantity;
  }

  toJSON() {
    return {
      id: this.id,
      organizationId: this.organizationId,
      branchId: this.branchId,
      itemId: this.itemId,
      type: this.type,
      quantity: this.quantity,
      signedQuantity: this.signedQuantity,
      unitCostMinor: this.unitCostMinor,
      currency: this.currency,
      lotNumber: this.lotNumber,
      expiryDate: this.expiryDate,
      reason: this.reason,
      relatedTreatmentId: this.relatedTreatmentId,
      relatedClinicalEncounterId: this.relatedClinicalEncounterId,
      createdByMembershipId: this.createdByMembershipId,
      createdAt: this.createdAt,
    };
  }
}
