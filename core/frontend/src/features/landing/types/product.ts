export type ProductStatus = "available" | "development" | "soon";

export type Product = {
  name: string;
  eyebrow: string;
  description: string;
  capabilities: readonly string[];
  status: ProductStatus;
  accent: string;
};
