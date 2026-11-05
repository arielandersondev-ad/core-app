import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import {
  MobileFloatingActionMenu,
  MobileFabDropdown,
  Icons,
  type MobileFloatingActionItem,
} from "../src/index";

describe("MobileFloatingActionMenu (Speed-Dial FAB) Unit Tests (HAG-31)", () => {
  const sampleActions: MobileFloatingActionItem[] = [
    {
      id: "cita",
      label: "Nueva Cita",
      description: "Agendar turno",
      icon: Icons.calendar,
      variant: "primary",
      onClick: vi.fn(),
    },
    {
      id: "paciente",
      label: "Nuevo Paciente",
      icon: Icons.user,
      variant: "default",
      onClick: vi.fn(),
    },
    {
      id: "cobro",
      label: "Cobro Rápido",
      icon: Icons.dollarSign,
      variant: "danger",
      onClick: vi.fn(),
    },
  ];

  describe("Exports & Contract", () => {
    it("exports MobileFloatingActionMenu and MobileFabDropdown alias from @app/ui", () => {
      expect(typeof MobileFloatingActionMenu).toBe("function");
      expect(typeof MobileFabDropdown).toBe("function");
      expect(MobileFabDropdown).toBe(MobileFloatingActionMenu);
    });

    it("returns null when actions array is empty", () => {
      const html = renderToString(<MobileFloatingActionMenu actions={[]} />);
      expect(html).toBe("");
    });
  });

  describe("Closed State & Mobile Positioning", () => {
    it("renders closed FAB at fixed bottom-20 right-4 z-30 with md:hidden by default", () => {
      const html = renderToString(
        <MobileFloatingActionMenu
          actions={sampleActions}
          ariaLabel="Acciones de agenda"
        />
      );

      expect(html).toContain('data-component="mobile-floating-action-menu"');
      expect(html).toContain('data-state="closed"');
      expect(html).toContain("fixed bottom-20 right-4 z-30");
      expect(html).toContain("md:hidden");

      // Trigger button classes
      expect(html).toContain('data-component="mobile-fab-trigger"');
      expect(html).toContain('aria-label="Acciones de agenda"');
      expect(html).toContain('aria-expanded="false"');
      expect(html).toContain(
        "w-14 h-14 rounded-full bg-primary bg-[var(--primary)] text-primary-foreground text-[var(--primary-foreground)] shadow-lg flex items-center justify-center"
      );

      // Closed state does not rotate icon 45 degrees and does not render backdrop or menu items
      expect(html).toContain("rotate-0 transition-transform duration-200");
      expect(html).not.toContain('data-component="mobile-fab-backdrop"');
      expect(html).not.toContain('data-component="mobile-fab-actions"');
      expect(html).not.toContain("Nueva Cita");
    });

    it("supports custom icon and custom className", () => {
      const html = renderToString(
        <MobileFloatingActionMenu
          actions={sampleActions}
          className="bottom-24 right-6"
          icon={<span data-testid="custom-fab-icon">+</span>}
        />
      );

      expect(html).toContain("bottom-24 right-6");
      expect(html).toContain('data-testid="custom-fab-icon"');
    });

    it("allows disabling md:hidden when mobileOnly={false}", () => {
      const html = renderToString(
        <MobileFloatingActionMenu actions={sampleActions} mobileOnly={false} />
      );

      expect(html).not.toContain("md:hidden");
    });
  });

  describe("Open State (Speed-Dial Expanded)", () => {
    it("rotates icon 45 degrees, renders backdrop and lifts secondary action buttons with labels and icons", () => {
      const html = renderToString(
        <MobileFloatingActionMenu
          actions={sampleActions}
          ariaLabel="Menú rápido"
          defaultOpen={true}
        />
      );

      expect(html).toContain('data-state="open"');
      expect(html).toContain('aria-expanded="true"');

      // Icon rotation to 'x'
      expect(html).toContain("rotate-45 transition-transform duration-200");

      // Backdrop overlay
      expect(html).toContain('data-component="mobile-fab-backdrop"');
      expect(html).toContain("fixed inset-0 bg-black/40 backdrop-blur-xs z-20");

      // Secondary actions stack
      expect(html).toContain('data-component="mobile-fab-actions"');
      expect(html).toContain('role="menu"');
      expect(html).toContain('role="menuitem"');

      // Labels and descriptions
      expect(html).toContain("Nueva Cita");
      expect(html).toContain("Agendar turno");
      expect(html).toContain("Nuevo Paciente");
      expect(html).toContain("Cobro Rápido");

      // Variants
      expect(html).toContain('data-variant="primary"');
      expect(html).toContain('data-variant="default"');
      expect(html).toContain('data-variant="danger"');
    });

    it("respects controlled open={true} prop", () => {
      const html = renderToString(
        <MobileFloatingActionMenu actions={sampleActions} open={true} />
      );

      expect(html).toContain('data-state="open"');
      expect(html).toContain("Nueva Cita");
      expect(html).toContain("Nuevo Paciente");
      expect(html).toContain("Cobro Rápido");
    });
  });
});
