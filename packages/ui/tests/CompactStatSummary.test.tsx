import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import {
  CompactStatSummary,
  MinimalStatStrip,
  EmptyState,
} from "../src/index";

describe("EmptyState & CompactStatSummary Unit Tests (HAG-18)", () => {
  describe("EmptyState Expansive Behavior", () => {
    it("renders with expansive flexbox layout and STRICTLY does not use position: absolute", () => {
      const html = renderToString(
        <EmptyState
          message="No hay registros disponibles"
          description="Añade tu primer elemento para comenzar."
          action={<button>Añadir</button>}
        />
      );

      expect(html).toContain('data-component="empty-state"');
      // Expansive flexbox classes
      expect(html).toContain("w-full");
      expect(html).toContain("h-full");
      expect(html).toContain("flex-1");
      expect(html).toContain("min-h-0");
      expect(html).toContain("justify-center");

      // STRICT RULE: No position: absolute
      expect(html).not.toContain("absolute");
      expect(html).not.toContain("position: absolute");

      // Content verification
      expect(html).toContain("No hay registros disponibles");
      expect(html).toContain("Añade tu primer elemento para comenzar.");
      expect(html).toContain("Añadir");
    });
  });

  describe("CompactStatSummary & MinimalStatStrip", () => {
    const items = [
      { id: "1", label: "Total Citas", value: 24, variant: "default" as const },
      { id: "2", label: "Confirmadas", value: 16, variant: "success" as const, active: true },
      { id: "3", label: "Pendientes", value: 8, variant: "warning" as const },
    ];

    it("renders horizontal compact metric strip with pills, values and labels", () => {
      const html = renderToString(<CompactStatSummary items={items} />);

      expect(html).toContain('data-component="compact-stat-summary"');
      expect(html).toContain("Total Citas");
      expect(html).toContain("24");
      expect(html).toContain("Confirmadas");
      expect(html).toContain("16");
      expect(html).toContain("Pendientes");
      expect(html).toContain("8");
      // Pill shape classes (38px height)
      expect(html).toContain("rounded-full");
      expect(html).toContain("min-h-[38px]");
    });

    it("supports mobileOnly prop by adding md:hidden class", () => {
      const html = renderToString(
        <CompactStatSummary items={items} mobileOnly={true} />
      );

      expect(html).toContain("md:hidden");
    });

    it("supports card variant with rounded-xl and 42px height", () => {
      const html = renderToString(
        <CompactStatSummary items={items} variant="card" />
      );

      expect(html).toContain("rounded-xl");
      expect(html).toContain("min-h-[42px]");
    });

    it("MinimalStatStrip is identical alias of CompactStatSummary", () => {
      expect(MinimalStatStrip).toBe(CompactStatSummary);
    });

    it("presents the 4 key treatment metrics cleanly with monetary prefix (HAG-23)", () => {
      const treatmentMetrics = [
        { id: "total", label: "Total Servicios", value: 18, variant: "default" as const },
        { id: "active", label: "Servicios Activos", value: 15, variant: "success" as const },
        { id: "categories", label: "Categorías", value: 5, variant: "warning" as const },
        {
          id: "avgPrice",
          label: "Precio Promedio",
          value: "185.00",
          prefix: "Bs.",
          variant: "accent" as const,
        },
      ];

      const html = renderToString(<CompactStatSummary items={treatmentMetrics} />);

      expect(html).toContain("Total Servicios");
      expect(html).toContain("18");
      expect(html).toContain("Servicios Activos");
      expect(html).toContain("15");
      expect(html).toContain("Categorías");
      expect(html).toContain("5");
      expect(html).toContain("Precio Promedio");
      expect(html).toContain("185.00");
      expect(html).toContain("Bs.");
      expect(html).toContain("whitespace-nowrap");
    });
  });
});
