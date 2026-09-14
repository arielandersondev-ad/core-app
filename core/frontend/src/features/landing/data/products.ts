import type { Product } from "@/features/landing/types/product";

export const products: readonly Product[] = [
  {
    name: "Core",
    eyebrow: "Administración central",
    description:
      "Organizaciones, usuarios, permisos y operaciones reunidos en un solo centro de control.",
    capabilities: ["Multiempresa", "Roles", "Analítica"],
    status: "available",
    accent: "CO",
  },
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
    name: "Pharma",
    eyebrow: "Operación farmacéutica",
    description:
      "Inventario, lotes, vencimientos y ventas coordinados desde la recepción hasta el mostrador.",
    capabilities: ["Stock", "Lotes", "Ventas"],
    status: "development",
    accent: "PH",
  },
  {
    name: "Petshop",
    eyebrow: "Cuidado y retail animal",
    description:
      "Clientes, mascotas, servicios y productos conectados para una atención más cercana.",
    capabilities: ["Mascotas", "Servicios", "Tienda"],
    status: "soon",
    accent: "PE",
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
];
