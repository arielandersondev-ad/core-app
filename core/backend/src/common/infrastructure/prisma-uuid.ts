import type { Char } from "@prisma/orm-postgres/target/codec-types";

export type Uuid36 = Char<36>;

// El valor ya es un string UUID validado upstream; solo etiquetamos su tipo.
export function toUuid36(value: string | undefined | null): Uuid36 {
  return value as Uuid36;
}
