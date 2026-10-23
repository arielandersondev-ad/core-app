export type JsonValue =
  | string
  | number
  | boolean
  | null
  | readonly JsonValue[]
  | { readonly [key: string]: JsonValue };

export type PlanType = 'PUBLIC' | 'CUSTOM';

export type Plan = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  type: PlanType;
  vertical: string;
  durationDays: number;
  entitlements: JsonValue;
  priceMinor: number | null;
  currency: string | null;
  isActive: boolean;
  deleted: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CreatePlan = Omit<
  Plan,
  'id' | 'deleted' | 'deletedAt' | 'createdAt' | 'updatedAt'
>;

export type UpdatePlan = Partial<
  Pick<
    Plan,
    | 'name'
    | 'description'
    | 'type'
    | 'durationDays'
    | 'entitlements'
    | 'priceMinor'
    | 'currency'
    | 'isActive'
  >
>;
