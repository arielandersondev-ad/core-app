export type InventoryStockStatus = 'OUT_OF_STOCK' | 'LOW' | 'OK';

export interface InventoryItemProps {
  id?: string;
  organizationId: string;
  branchId: string;
  sku: string;
  name: string;
  description?: string | null;
  category?: string | null;
  unit: string;
  minStock?: number;
  currentStock?: number;
  unitCostMinor?: number | null;
  currency?: string;
  isActive?: boolean;
  createdByMembershipId: string;
  updatedByMembershipId?: string | null;
  deletedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
  rowVersion?: number;
}

export class InventoryItem {
  readonly id: string;
  readonly organizationId: string;
  readonly branchId: string;
  readonly sku: string;
  readonly name: string;
  readonly description: string | null;
  readonly category: string | null;
  readonly unit: string;
  readonly minStock: number;
  readonly currentStock: number;
  readonly unitCostMinor: number | null;
  readonly currency: string;
  readonly isActive: boolean;
  readonly createdByMembershipId: string;
  readonly updatedByMembershipId: string | null;
  readonly deletedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly rowVersion: number;

  constructor(props: InventoryItemProps) {
    if (!props.sku?.trim()) throw new Error('El SKU es obligatorio.');
    if (!props.name?.trim()) throw new Error('El nombre es obligatorio.');
    if (!props.unit?.trim()) throw new Error('La unidad es obligatoria.');

    const minStock = props.minStock ?? 0;
    const currentStock = props.currentStock ?? 0;
    if (!Number.isInteger(minStock) || minStock < 0) {
      throw new Error('El stock mínimo debe ser un entero no negativo.');
    }
    if (!Number.isInteger(currentStock) || currentStock < 0) {
      throw new Error('El stock actual debe ser un entero no negativo.');
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
    this.sku = props.sku.trim();
    this.name = props.name.trim();
    this.description = props.description?.trim() || null;
    this.category = props.category?.trim() || null;
    this.unit = props.unit.trim();
    this.minStock = minStock;
    this.currentStock = currentStock;
    this.unitCostMinor = props.unitCostMinor ?? null;
    this.currency = currency;
    this.isActive = props.isActive ?? true;
    this.createdByMembershipId = props.createdByMembershipId;
    this.updatedByMembershipId = props.updatedByMembershipId ?? null;
    this.deletedAt = props.deletedAt ?? null;
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
    this.rowVersion = props.rowVersion ?? 1;
  }

  get status(): InventoryStockStatus {
    if (this.currentStock <= 0) return 'OUT_OF_STOCK';
    if (this.currentStock < this.minStock) return 'LOW';
    return 'OK';
  }

  toJSON() {
    return {
      id: this.id,
      organizationId: this.organizationId,
      branchId: this.branchId,
      sku: this.sku,
      name: this.name,
      description: this.description,
      category: this.category,
      unit: this.unit,
      minStock: this.minStock,
      currentStock: this.currentStock,
      unitCostMinor: this.unitCostMinor,
      currency: this.currency,
      isActive: this.isActive,
      status: this.status,
      createdByMembershipId: this.createdByMembershipId,
      updatedByMembershipId: this.updatedByMembershipId,
      deletedAt: this.deletedAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      rowVersion: this.rowVersion,
    };
  }
}
