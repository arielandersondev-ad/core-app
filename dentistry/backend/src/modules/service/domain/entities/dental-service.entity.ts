import { DentalServiceSupply } from './dental-service-supply.entity.js';

export interface DentalServiceProps {
  id?: string;
  organizationId: string;
  code?: string | null;
  name: string;
  category?: string | null;
  description?: string | null;
  durationMinutes?: number | null;
  basePriceMinor?: number | null;
  labCostMinor?: number | null;
  currency?: string | null;
  active?: boolean;
  createdByMembershipId: string;
  updatedByMembershipId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  supplies?: DentalServiceSupply[];
}

export class DentalService {
  readonly id: string;
  readonly organizationId: string;
  private _code: string | null;
  private _name: string;
  private _category: string | null;
  private _description: string | null;
  private _durationMinutes: number;
  private _basePriceMinor: number;
  private _labCostMinor: number;
  private _currency: string;
  private _active: boolean;
  readonly createdByMembershipId: string;
  private _updatedByMembershipId: string | null;
  readonly createdAt: Date;
  private _updatedAt: Date;
  private _supplies: DentalServiceSupply[];

  constructor(props: DentalServiceProps) {
    if (!props.name || props.name.trim().length === 0) {
      throw new Error('El nombre del servicio es obligatorio.');
    }

    this.id = props.id ?? '';
    this.organizationId = props.organizationId;
    this._code = props.code?.trim() || null;
    this._name = props.name.trim();
    this._category = props.category?.trim() || 'General';
    this._description = props.description?.trim() || null;
    this._durationMinutes =
      props.durationMinutes && props.durationMinutes > 0
        ? props.durationMinutes
        : 30;
    this._basePriceMinor =
      props.basePriceMinor !== undefined && props.basePriceMinor !== null
        ? props.basePriceMinor
        : 0;
    this._labCostMinor =
      props.labCostMinor !== undefined && props.labCostMinor !== null
        ? props.labCostMinor
        : 0;
    this._currency = props.currency?.trim() || 'BOB';
    this._active = props.active ?? true;
    this.createdByMembershipId = props.createdByMembershipId;
    this._updatedByMembershipId = props.updatedByMembershipId ?? null;
    this.createdAt = props.createdAt ?? new Date();
    this._updatedAt = props.updatedAt ?? new Date();
    this._supplies = props.supplies ?? [];
  }

  get code(): string | null {
    return this._code;
  }

  get name(): string {
    return this._name;
  }

  get category(): string | null {
    return this._category;
  }

  get description(): string | null {
    return this._description;
  }

  get durationMinutes(): number {
    return this._durationMinutes;
  }

  get basePriceMinor(): number {
    return this._basePriceMinor;
  }

  get labCostMinor(): number {
    return this._labCostMinor;
  }

  get currency(): string {
    return this._currency;
  }

  get active(): boolean {
    return this._active;
  }

  get updatedByMembershipId(): string | null {
    return this._updatedByMembershipId;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get supplies(): DentalServiceSupply[] {
    return this._supplies;
  }

  // Costo total de insumos calculados
  get totalSuppliesCostMinor(): number {
    return this._supplies.reduce(
      (sum, s) => sum + (s.estimatedCostMinor ?? 0) * s.quantity,
      0,
    );
  }

  // Margen de ganancia bruto estimado
  get estimatedMarginMinor(): number {
    return (
      this._basePriceMinor - (this._labCostMinor + this.totalSuppliesCostMinor)
    );
  }

  updateDetails(props: {
    code?: string | null;
    name?: string;
    category?: string | null;
    description?: string | null;
    durationMinutes?: number | null;
    basePriceMinor?: number | null;
    labCostMinor?: number | null;
    currency?: string | null;
    active?: boolean;
    updatedByMembershipId: string;
    supplies?: DentalServiceSupply[];
  }) {
    if (props.name !== undefined) {
      if (!props.name || props.name.trim().length === 0) {
        throw new Error('El nombre del servicio no puede estar vacío.');
      }
      this._name = props.name.trim();
    }

    if (props.code !== undefined) {
      this._code = props.code?.trim() || null;
    }

    if (props.category !== undefined) {
      this._category = props.category?.trim() || null;
    }

    if (props.description !== undefined) {
      this._description = props.description?.trim() || null;
    }

    if (props.durationMinutes !== undefined && props.durationMinutes !== null) {
      this._durationMinutes = Math.max(5, props.durationMinutes);
    }

    if (props.basePriceMinor !== undefined && props.basePriceMinor !== null) {
      this._basePriceMinor = Math.max(0, props.basePriceMinor);
    }

    if (props.labCostMinor !== undefined && props.labCostMinor !== null) {
      this._labCostMinor = Math.max(0, props.labCostMinor);
    }

    if (props.currency !== undefined && props.currency) {
      this._currency = props.currency.trim();
    }

    if (props.active !== undefined) {
      this._active = props.active;
    }

    if (props.supplies !== undefined) {
      this._supplies = props.supplies;
    }

    this._updatedByMembershipId = props.updatedByMembershipId;
    this._updatedAt = new Date();
  }

  toggleActive(updatedByMembershipId: string): boolean {
    this._active = !this._active;
    this._updatedByMembershipId = updatedByMembershipId;
    this._updatedAt = new Date();
    return this._active;
  }
}
