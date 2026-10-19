import type { Product } from "@/features/landing/types/product";

export const products: readonly Product[] = [
  {
    name: "Dentistry",
    eyebrow: "Gestión odontológica",
    description:
      "Agenda, odontograma e historia clínica diseñados para equipos odontológicos modernos.",
    capabilities: ["Pacientes", "Agenda", "Odontograma"],
    status: "available",
    accent: "DE",
  },
  {
    name: "Oftalmología",
    eyebrow: "Salud visual",
    description:
      "Consultas, estudios, recetas y seguimiento clínico en una experiencia precisa y ordenada.",
    capabilities: ["Consultas", "Estudios", "Recetas"],
    status: "soon",
    accent: "OF",
  },
  {
    name: "Pharma",
    eyebrow: "Operación farmacéutica",
    description:
      "Inventario, lotes, vencimientos y ventas coordinados desde la recepción hasta el mostrador.",
    capabilities: ["Stock", "Lotes", "Ventas"],
    status: "development",
    accent: "PH",
  },
];
