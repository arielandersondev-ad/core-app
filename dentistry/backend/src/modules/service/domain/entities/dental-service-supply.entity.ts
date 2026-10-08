export interface DentalServiceSupplyProps {
  id?: string;
  organizationId: string;
  serviceId?: string;
  inventoryItemId?: string | null;
  name: string;
  quantity?: number;
  unit?: string;
  estimatedCostMinor?: number | null;
  notes?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class DentalServiceSupply {
  readonly id: string;
  readonly organizationId: string;
  readonly serviceId: string;
  readonly inventoryItemId: string | null;
  readonly name: string;
  readonly quantity: number;
  readonly unit: string;
  readonly estimatedCostMinor: number | null;
  readonly notes: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: DentalServiceSupplyProps) {
    if (!props.name || props.name.trim().length === 0) {
      throw new Error('El nombre del insumo es obligatorio.');
    }

    this.id = props.id ?? '';
    this.organizationId = props.organizationId;
    this.serviceId = props.serviceId ?? '';
    this.inventoryItemId = props.inventoryItemId ?? null;
    this.name = props.name.trim();
    this.quantity = props.quantity && props.quantity > 0 ? props.quantity : 1;
    this.unit = props.unit?.trim() || 'unidades';
    this.estimatedCostMinor = props.estimatedCostMinor ?? null;
    this.notes = props.notes?.trim() ?? null;
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
  }
}
