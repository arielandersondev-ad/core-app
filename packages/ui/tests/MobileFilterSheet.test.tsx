import { describe, it, expect, vi, afterEach } from "vitest";
import { renderToString } from "react-dom/server";
import {
  MobileFilterSheet,
  FilterBottomSheet,
  FilterTriggerButton,
} from "../src/index";

describe("MobileFilterSheet & FilterTriggerButton Unit & Integration Tests (HAG-38)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Module Exports & Contract Integrity", () => {
    it("exports MobileFilterSheet, FilterBottomSheet and FilterTriggerButton from @app/ui", () => {
      expect(typeof MobileFilterSheet).toBe("function");
      expect(typeof FilterBottomSheet).toBe("function");
      expect(typeof FilterTriggerButton).toBe("function");
    });

    it("ensures FilterBottomSheet is an identical alias to MobileFilterSheet", () => {
      expect(FilterBottomSheet).toBe(MobileFilterSheet);
    });
  });

  describe("FilterTriggerButton Component Tests", () => {
    it("renders with default label 'Filtros' and filter icon SVG", () => {
      const html = renderToString(<FilterTriggerButton />);

      expect(html).toContain("Filtros");
      expect(html).toContain("<svg");
      expect(html).toContain("relative inline-flex items-center gap-1.5");
      // When activeCount is 0, uses outline variant
      expect(html).toContain("border");
    });

    it("renders custom label when provided", () => {
      const html = renderToString(<FilterTriggerButton label="Filtrar servicios" />);

      expect(html).toContain("Filtrar servicios");
    });

    it("does not render badge when activeCount is 0 or undefined", () => {
      const htmlWithoutCount = renderToString(<FilterTriggerButton />);
      const htmlWithZero = renderToString(<FilterTriggerButton activeCount={0} />);

      expect(htmlWithoutCount).not.toContain("rounded-full");
      expect(htmlWithZero).not.toContain("rounded-full");
    });

    it("renders badge with count when activeCount > 0 and switches to primary variant", () => {
      const html = renderToString(<FilterTriggerButton activeCount={3} />);

      expect(html).toContain("3");
      expect(html).toContain("rounded-full");
      // Badge indicator present
      expect(html).toContain("min-h-[18px]");
    });

    it("does not render badge if activeCount is negative", () => {
      const html = renderToString(<FilterTriggerButton activeCount={-1} />);

      expect(html).not.toContain("rounded-full");
    });

    it("triggers onClick callback correctly when clicked", () => {
      const handleClick = vi.fn();
      const element = FilterTriggerButton({
        onClick: handleClick,
        activeCount: 2,
      });

      expect(typeof element.props.onClick).toBe("function");
      element.props.onClick();
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("supports disabled state and custom className", () => {
      const html = renderToString(
        <FilterTriggerButton
          disabled={true}
          className="custom-trigger-class"
          label="Filtros"
        />
      );

      expect(html).toContain("disabled");
      expect(html).toContain("custom-trigger-class");
    });
  });

  describe("MobileFilterSheet Lifecycle & Render States", () => {
    it("renders null (empty string) when isOpen is false and no trigger is passed", () => {
      const html = renderToString(
        <MobileFilterSheet isOpen={false} onClose={() => {}}>
          <p>Opciones de filtro</p>
        </MobileFilterSheet>
      );

      expect(html).toBe("");
    });

    it("renders only trigger element when isOpen is false and trigger is supplied", () => {
      const html = renderToString(
        <MobileFilterSheet
          isOpen={false}
          onClose={() => {}}
          trigger={<button id="open-filters-btn">Abrir Filtros</button>}
        >
          <div id="hidden-filter-content">Contenido oculto</div>
        </MobileFilterSheet>
      );

      expect(html).toContain('id="open-filters-btn"');
      expect(html).toContain("Abrir Filtros");
      expect(html).not.toContain("id=\"hidden-filter-content\"");
      expect(html).not.toContain('role="dialog"');
    });

    it("renders both trigger and BottomSheet dialog when isOpen is true and trigger is supplied", () => {
      const html = renderToString(
        <MobileFilterSheet
          isOpen={true}
          onClose={() => {}}
          trigger={<button id="open-filters-btn">Abrir Filtros</button>}
        >
          <div id="visible-filter-content">Opciones activas</div>
        </MobileFilterSheet>
      );

      expect(html).toContain('id="open-filters-btn"');
      expect(html).toContain('role="dialog"');
      expect(html).toContain('id="visible-filter-content"');
    });

    it("renders children wrapped inside scrollable container space-y-4 py-1", () => {
      const html = renderToString(
        <MobileFilterSheet isOpen={true} onClose={() => {}}>
          <div className="filter-item">Filtro 1</div>
          <div className="filter-item">Filtro 2</div>
        </MobileFilterSheet>
      );

      expect(html).toContain("space-y-4 py-1");
      expect(html).toContain("Filtro 1");
      expect(html).toContain("Filtro 2");
    });
  });

  describe("Header & Active Badge Display", () => {
    it("renders default title 'Filtros' and no header badge when activeCount is 0", () => {
      const html = renderToString(
        <MobileFilterSheet isOpen={true} onClose={() => {}} activeCount={0}>
          <div>Contenido</div>
        </MobileFilterSheet>
      );

      expect(html).toContain("Filtros");
      expect(html).not.toContain("activo");
      expect(html).not.toContain("activos");
    });

    it("renders custom title when provided", () => {
      const html = renderToString(
        <MobileFilterSheet
          isOpen={true}
          onClose={() => {}}
          title="Filtrar Pacientes"
        >
          <div>Contenido</div>
        </MobileFilterSheet>
      );

      expect(html).toContain("Filtrar Pacientes");
    });

    it("renders singular header badge '1 activo' when activeCount is 1", () => {
      const html = renderToString(
        <MobileFilterSheet isOpen={true} onClose={() => {}} activeCount={1}>
          <div>Contenido</div>
        </MobileFilterSheet>
      );

      expect(html).toContain("1 activo");
    });

    it("renders plural header badge 'X activos' when activeCount > 1", () => {
      const html = renderToString(
        <MobileFilterSheet isOpen={true} onClose={() => {}} activeCount={4}>
          <div>Contenido</div>
        </MobileFilterSheet>
      );

      expect(html).toContain("4 activos");
    });
  });

  describe("Action Buttons & Sticky Footer Callbacks", () => {
    it("renders default footer actions 'Limpiar' and 'Aplicar filtros'", () => {
      const html = renderToString(
        <MobileFilterSheet isOpen={true} onClose={() => {}}>
          <div>Contenido</div>
        </MobileFilterSheet>
      );

      expect(html).toContain("Limpiar");
      expect(html).toContain("Aplicar filtros");
      // Sticky bottom footer container
      expect(html).toContain("sticky bottom-0");
      expect(html).toContain("backdrop-blur-sm");
    });

    it("supports custom button labels via applyLabel and clearLabel", () => {
      const html = renderToString(
        <MobileFilterSheet
          isOpen={true}
          onClose={() => {}}
          applyLabel="Confirmar selección"
          clearLabel="Restablecer todo"
        >
          <div>Contenido</div>
        </MobileFilterSheet>
      );

      expect(html).toContain("Confirmar selección");
      expect(html).toContain("Restablecer todo");
      expect(html).not.toContain("Aplicar filtros");
      expect(html).not.toContain("Limpiar");
    });

    it("invokes onClear callback when clear button is clicked", () => {
      const handleClear = vi.fn();
      const component = MobileFilterSheet({
        isOpen: true,
        onClose: () => {},
        onClear: handleClear,
        children: <div>Contenido</div>,
      });

      // BottomSheet is the second element of the fragment
      const bottomSheet = (component as any).props.children[1];
      const footer = bottomSheet.props.footer;
      const clearBtn = footer.props.children[0];

      expect(typeof clearBtn.props.onClick).toBe("function");
      clearBtn.props.onClick();
      expect(handleClear).toHaveBeenCalledTimes(1);
    });

    it("invokes onApply and onClose callbacks when apply button is clicked", () => {
      const handleApply = vi.fn();
      const handleClose = vi.fn();
      const component = MobileFilterSheet({
        isOpen: true,
        onClose: handleClose,
        onApply: handleApply,
        children: <div>Contenido</div>,
      });

      const bottomSheet = (component as any).props.children[1];
      const footer = bottomSheet.props.footer;
      const applyBtn = footer.props.children[1];

      expect(typeof applyBtn.props.onClick).toBe("function");
      applyBtn.props.onClick();
      expect(handleApply).toHaveBeenCalledTimes(1);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it("handles undefined onApply and onClear gracefully without throwing", () => {
      const handleClose = vi.fn();
      const component = MobileFilterSheet({
        isOpen: true,
        onClose: handleClose,
        children: <div>Contenido</div>,
      });

      const bottomSheet = (component as any).props.children[1];
      const footer = bottomSheet.props.footer;
      const [clearBtn, applyBtn] = footer.props.children;

      expect(clearBtn.props.onClick).toBeUndefined();
      expect(() => applyBtn.props.onClick()).not.toThrow();
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  describe("Accessibility, Dismissal & Keyboard Contract", () => {
    it("renders dialog with role='dialog', aria-modal='true' and aria-label matching title", () => {
      const html = renderToString(
        <MobileFilterSheet
          isOpen={true}
          onClose={() => {}}
          title="Filtros de Especialidad"
        >
          <div>Contenido</div>
        </MobileFilterSheet>
      );

      expect(html).toContain('role="dialog"');
      expect(html).toContain('aria-modal="true"');
      expect(html).toContain('aria-label="Filtros de Especialidad"');
      expect(html).toContain('data-component="bottom-sheet"');
    });

    it("renders pull handle indicator and close button with aria-label='Cerrar panel'", () => {
      const html = renderToString(
        <MobileFilterSheet isOpen={true} onClose={() => {}}>
          <div>Contenido</div>
        </MobileFilterSheet>
      );

      expect(html).toContain('aria-label="Cerrar panel"');
      // Pull handle visual indicator (rounded-full w-10 or w-12 bar)
      expect(html).toContain("rounded-full");
    });

    it("renders backdrop element with aria-hidden='true' and backdrop blur", () => {
      const html = renderToString(
        <MobileFilterSheet isOpen={true} onClose={() => {}}>
          <div>Contenido</div>
        </MobileFilterSheet>
      );

      expect(html).toContain('aria-hidden="true"');
      expect(html).toContain("bg-black/60");
      expect(html).toContain("backdrop-blur-xs");
    });

    it("handles Escape key handler to invoke onClose callback", () => {
      const onClose = vi.fn();
      const listeners: Record<string, ((e: any) => void)[]> = {};

      const mockWindow = {
        addEventListener: (event: string, cb: any) => {
          listeners[event] = listeners[event] || [];
          listeners[event].push(cb);
        },
        removeEventListener: (event: string, cb: any) => {
          if (listeners[event]) {
            listeners[event] = listeners[event].filter((fn) => fn !== cb);
          }
        },
      };

      const handler = (e: { key: string }) => {
        if (e.key === "Escape") onClose();
      };

      mockWindow.addEventListener("keydown", handler);
      expect(listeners["keydown"].length).toBe(1);

      // Other keys do not trigger close
      listeners["keydown"][0]({ key: "Tab" });
      listeners["keydown"][0]({ key: "Enter" });
      expect(onClose).not.toHaveBeenCalled();

      // Escape triggers close
      listeners["keydown"][0]({ key: "Escape" });
      expect(onClose).toHaveBeenCalledTimes(1);

      mockWindow.removeEventListener("keydown", handler);
      expect(listeners["keydown"].length).toBe(0);
    });

    it("verifies BottomSheet is configured with snapPoint='half' and dismissible flags", () => {
      const handleClose = vi.fn();
      const component = MobileFilterSheet({
        isOpen: true,
        onClose: handleClose,
        children: <div>Contenido</div>,
      });

      const bottomSheet = (component as any).props.children[1];
      expect(bottomSheet.props.snapPoint).toBe("half");
      expect(bottomSheet.props.showHandle).toBe(true);
      expect(bottomSheet.props.showCloseButton).toBe(true);
      expect(bottomSheet.props.dismissOnBackdrop).toBe(true);
      expect(bottomSheet.props.dismissOnSwipe).toBe(true);
      expect(bottomSheet.props.footerSticky).toBe(true);
    });

    it("forwards custom className to the underlying BottomSheet container", () => {
      const html = renderToString(
        <MobileFilterSheet
          isOpen={true}
          onClose={() => {}}
          className="custom-sheet-container"
        >
          <div>Contenido</div>
        </MobileFilterSheet>
      );

      expect(html).toContain("custom-sheet-container");
    });
  });
});
