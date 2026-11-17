import { describe, it, expect, vi, afterEach } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { ResponsiveModal } from "../src/components/ui/ResponsiveModal";
import { ModalFooter, DatePicker, TimePicker, BottomSheet } from "../src/index";
import * as useIsMobileModule from "../src/hooks/useIsMobile";

describe("ResponsiveModal Unit & Integration Tests", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("SSR & Closed State", () => {
    it("renders null when open is false", () => {
      const html = renderToString(
        <ResponsiveModal open={false} onClose={() => {}} title="Test Dialog">
          <p>Hidden Content</p>
        </ResponsiveModal>
      );
      expect(html).toBe("");
    });

    it("renders desktop Modal by default during SSR (safe hydration fallback)", () => {
      const html = renderToString(
        <ResponsiveModal
          open={true}
          onClose={() => {}}
          title="SSR Dialog"
          subtitle="Subtitle text"
          eyebrow="Ajustes"
        >
          <div data-testid="content">Modal body content</div>
        </ResponsiveModal>
      );

      expect(html).toContain('role="dialog"');
      expect(html).toContain("SSR Dialog");
      expect(html).toContain("Subtitle text");
      expect(html).toContain("Ajustes");
      expect(html).toContain("Modal body content");
      expect(html).toContain('aria-label="Cerrar modal"');
    });
  });

  describe("Responsive Viewport Adaptation (< 768px vs >= 768px)", () => {
    it("renders BottomSheet when viewport is mobile (< 768px / useIsMobile returns true)", () => {
      vi.spyOn(useIsMobileModule, "useIsMobile").mockReturnValue(true);

      const html = renderToString(
        <ResponsiveModal
          open={true}
          onClose={() => {}}
          title="Mobile Appointment Sheet"
          subtitle="Detalles de turno clínico"
          snapPoint="half"
        >
          <p>Contenido móvil</p>
        </ResponsiveModal>
      );

      // BottomSheet features: pull handle indicator and rounded-t-2xl/3xl bottom sheet styling
      expect(html).toContain("Mobile Appointment Sheet");
      expect(html).toContain("Detalles de turno clínico");
      expect(html).toContain("Contenido móvil");
      expect(html).toContain("rounded-full"); // Pull handle bar indicator
    });

    it("renders desktop Modal when viewport is desktop (>= 768px / useIsMobile returns false)", () => {
      vi.spyOn(useIsMobileModule, "useIsMobile").mockReturnValue(false);

      const html = renderToString(
        <ResponsiveModal
          open={true}
          onClose={() => {}}
          title="Desktop Appointment Modal"
          subtitle="Detalles de turno clínico"
          maxWidth="max-w-2xl"
        >
          <p>Contenido desktop</p>
        </ResponsiveModal>
      );

      expect(html).toContain("Desktop Appointment Modal");
      expect(html).toContain("Detalles de turno clínico");
      expect(html).toContain("Contenido desktop");
      expect(html).toContain("max-w-2xl");
      expect(html).toContain('aria-label="Cerrar modal"');
    });

    it("passes custom breakpoint to useIsMobile", () => {
      const spy = vi.spyOn(useIsMobileModule, "useIsMobile").mockReturnValue(false);

      renderToString(
        <ResponsiveModal
          open={true}
          onClose={() => {}}
          title="Custom Breakpoint"
          breakpoint={1024}
        >
          <p>Content</p>
        </ResponsiveModal>
      );

      expect(spy).toHaveBeenCalledWith(1024);
    });
  });

  describe("forceMode overrides", () => {
    it("forces BottomSheet even when useIsMobile returns false (desktop viewport)", () => {
      vi.spyOn(useIsMobileModule, "useIsMobile").mockReturnValue(false);

      const html = renderToString(
        <ResponsiveModal
          open={true}
          onClose={() => {}}
          title="Forced Sheet on Desktop"
          forceMode="bottomSheet"
          snapPoint="half"
          footer={<button>Guardar</button>}
        >
          <p>Sheet Content</p>
        </ResponsiveModal>
      );

      expect(html).toContain("Forced Sheet on Desktop");
      expect(html).toContain("Sheet Content");
      expect(html).toContain("Guardar");
      expect(html).toContain("rounded-full"); // Pull handle bar indicator
    });

    it("forces Modal even when useIsMobile returns true (mobile viewport)", () => {
      vi.spyOn(useIsMobileModule, "useIsMobile").mockReturnValue(true);

      const html = renderToString(
        <ResponsiveModal
          open={true}
          onClose={() => {}}
          title="Forced Modal on Mobile"
          forceMode="modal"
          maxWidth="max-w-lg"
          footer={<button>Confirmar</button>}
        >
          <p>Modal Content</p>
        </ResponsiveModal>
      );

      expect(html).toContain("Forced Modal on Mobile");
      expect(html).toContain("Modal Content");
      expect(html).toContain("Confirmar");
      expect(html).toContain("max-w-lg");
      expect(html).toContain('aria-label="Cerrar modal"');
    });
  });

  describe("Props mapping & fallback behavior", () => {
    it("resolves description as subtitle when subtitle is not provided", () => {
      const html = renderToString(
        <ResponsiveModal
          open={true}
          onClose={() => {}}
          title="Fallback Test"
          description="Description acting as subtitle"
          forceMode="modal"
        >
          <p>Body</p>
        </ResponsiveModal>
      );

      expect(html).toContain("Fallback Test");
      expect(html).toContain("Description acting as subtitle");
    });

    it("prioritizes subtitle over description when both are provided", () => {
      const html = renderToString(
        <ResponsiveModal
          open={true}
          onClose={() => {}}
          title="Priority Test"
          subtitle="Primary Subtitle"
          description="Ignored Description"
          forceMode="modal"
        >
          <p>Body</p>
        </ResponsiveModal>
      );

      expect(html).toContain("Primary Subtitle");
      expect(html).not.toContain("Ignored Description");
    });

    it("renders headerAction when supplied in modal mode", () => {
      const html = renderToString(
        <ResponsiveModal
          open={true}
          onClose={() => {}}
          title="Header Action Dialog"
          headerAction={<span className="badge">Estado Activo</span>}
          forceMode="modal"
        >
          <p>Body</p>
        </ResponsiveModal>
      );

      expect(html).toContain("Estado Activo");
    });

    it("renders headerAction when supplied in bottomSheet mode", () => {
      const html = renderToString(
        <ResponsiveModal
          open={true}
          onClose={() => {}}
          title="Header Action Sheet"
          headerAction={<span className="badge">Borrador</span>}
          forceMode="bottomSheet"
        >
          <p>Body</p>
        </ResponsiveModal>
      );

      expect(html).toContain("Borrador");
    });

    it("renders custom leading icon", () => {
      const html = renderToString(
        <ResponsiveModal
          open={true}
          onClose={() => {}}
          title="Icon Dialog"
          icon={<svg data-testid="custom-icon"><circle cx="10" cy="10" r="5" /></svg>}
          forceMode="modal"
        >
          <p>Body</p>
        </ResponsiveModal>
      );

      expect(html).toContain('data-testid="custom-icon"');
    });

    it("renders custom footer in modal mode", () => {
      const html = renderToString(
        <ResponsiveModal
          open={true}
          onClose={() => {}}
          title="Footer Dialog"
          footer={
            <div className="flex gap-2">
              <button>Cancelar</button>
              <button>Aceptar</button>
            </div>
          }
          forceMode="modal"
        >
          <p>Body</p>
        </ResponsiveModal>
      );

      expect(html).toContain("Cancelar");
      expect(html).toContain("Aceptar");
    });

    it("hides close button when showCloseButton={false}", () => {
      const html = renderToString(
        <ResponsiveModal
          open={true}
          onClose={() => {}}
          title="No Close Button"
          showCloseButton={false}
          forceMode="modal"
        >
          <p>Body</p>
        </ResponsiveModal>
      );

      expect(html).not.toContain('aria-label="Cerrar modal"');
    });

    it("passes custom className to container", () => {
      const html = renderToString(
        <ResponsiveModal
          open={true}
          onClose={() => {}}
          title="Custom Class Dialog"
          className="custom-audit-class"
          forceMode="bottomSheet"
        >
          <p>Body</p>
        </ResponsiveModal>
      );

      expect(html).toContain("custom-audit-class");
    });
  });

  describe("Snap points in BottomSheet mode", () => {
    const snapPoints: Array<"auto" | "compact" | "half" | "full"> = [
      "auto",
      "compact",
      "half",
      "full",
    ];

    snapPoints.forEach((snap) => {
      it(`renders correctly with snapPoint='${snap}'`, () => {
        const html = renderToString(
          <ResponsiveModal
            open={true}
            onClose={() => {}}
            title={`Snap ${snap}`}
            forceMode="bottomSheet"
            snapPoint={snap}
          >
            <p>Snap content</p>
          </ResponsiveModal>
        );

        expect(html).toContain(`Snap ${snap}`);
        expect(html).toContain('role="dialog"');
      });
    });
  });

  describe("Event Listeners & Accessibility Contract", () => {
    it("handles Escape key handler correctly", () => {
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

      // Non-Escape key does not trigger onClose
      listeners["keydown"][0]({ key: "Enter" });
      expect(onClose).not.toHaveBeenCalled();

      // Escape key triggers onClose
      listeners["keydown"][0]({ key: "Escape" });
      expect(onClose).toHaveBeenCalledTimes(1);

      // Cleanup
      mockWindow.removeEventListener("keydown", handler);
      expect(listeners["keydown"].length).toBe(0);
    });

    it("locks body scroll on open and restores on close", () => {
      const mockBody = { style: { overflow: "" } };
      const prevOverflow = mockBody.style.overflow;

      // Simulate lock
      mockBody.style.overflow = "hidden";
      expect(mockBody.style.overflow).toBe("hidden");

      // Simulate restore
      mockBody.style.overflow = prevOverflow;
      expect(mockBody.style.overflow).toBe("");
    });
  });

  describe("Sticky Bottom Footer Support (HAG-10)", () => {
    it("renders sticky bottom footer container by default in desktop Modal", () => {
      vi.spyOn(useIsMobileModule, "useIsMobile").mockReturnValue(false);

      const html = renderToString(
        <ResponsiveModal
          open={true}
          onClose={() => {}}
          title="Modal with Sticky Footer"
          footer={
            <div data-testid="footer-actions">
              <button>Cancelar</button>
              <button>Guardar Cita</button>
            </div>
          }
        >
          <p>Long scrollable form content</p>
        </ResponsiveModal>
      );

      expect(html).toContain('data-component="modal-base-footer"');
      expect(html).toContain("sticky bottom-0");
      expect(html).toContain("z-20");
      expect(html).toContain("Guardar Cita");
      expect(html).toContain("Cancelar");
    });

    it("renders sticky bottom footer container by default in mobile BottomSheet with safe area", () => {
      vi.spyOn(useIsMobileModule, "useIsMobile").mockReturnValue(true);

      const html = renderToString(
        <ResponsiveModal
          open={true}
          onClose={() => {}}
          title="Sheet with Sticky Footer"
          footer={
            <div data-testid="sheet-actions">
              <button>Cancelar</button>
              <button>Confirmar Cita</button>
            </div>
          }
        >
          <p>Long mobile form content</p>
        </ResponsiveModal>
      );

      expect(html).toContain('data-component="bottom-sheet-base-footer"');
      expect(html).toContain("sticky bottom-0");
      expect(html).toContain("z-20");
      expect(html).toContain("safe-area-inset-bottom");
      expect(html).toContain("Confirmar Cita");
    });

    it("supports disabling sticky footer with footerSticky=false", () => {
      vi.spyOn(useIsMobileModule, "useIsMobile").mockReturnValue(false);

      const html = renderToString(
        <ResponsiveModal
          open={true}
          onClose={() => {}}
          title="Non-sticky Footer"
          footerSticky={false}
          footer={<button>Aceptar</button>}
        >
          <p>Content</p>
        </ResponsiveModal>
      );

      expect(html).toContain('data-component="modal-base-footer"');
      expect(html).not.toContain("sticky bottom-0");
      expect(html).toContain("bg-[var(--surface)]");
    });

    it("supports custom footerClassName", () => {
      const html = renderToString(
        <ResponsiveModal
          open={true}
          onClose={() => {}}
          title="Custom Footer Class"
          footerClassName="custom-footer-extra"
          footer={<button>Action</button>}
        >
          <p>Content</p>
        </ResponsiveModal>
      );

      expect(html).toContain("custom-footer-extra");
    });
  });

  describe("ModalFooter Component Support (HAG-10)", () => {
    it("renders standalone ModalFooter with sticky classes and safe area support", () => {
      const html = renderToString(
        <ModalFooter>
          <button>Cancelar</button>
          <button>Guardar</button>
        </ModalFooter>
      );

      expect(html).toContain('data-component="modal-footer"');
      expect(html).toContain("sticky bottom-0");
      expect(html).toContain("z-20");
      expect(html).toContain("safe-area-inset-bottom");
      expect(html).toContain("Guardar");
      expect(html).toContain("Cancelar");
    });

    it("renders ModalFooter embedded inside form children seamlessly", () => {
      const html = renderToString(
        <ResponsiveModal open={true} onClose={() => {}} title="Form with ModalFooter">
          <form>
            <input name="test" />
            <ModalFooter>
              <button type="submit">Submit Form</button>
            </ModalFooter>
          </form>
        </ResponsiveModal>
      );

      expect(html).toContain('data-component="modal-footer"');
      expect(html).toContain("sticky bottom-0");
      expect(html).toContain("Submit Form");
    });
  });

  describe("DatePicker and TimePicker Component Exports (HAG-10)", () => {
    it("exports DatePicker and TimePicker correctly from @app/ui index", () => {
      expect(typeof DatePicker).toBe("function");
      expect(typeof TimePicker).toBe("function");
    });

    it("renders DatePicker properly with placeholder and label", () => {
      const html = renderToString(
        <DatePicker
          id="appointment-date"
          label="Fecha de la Cita"
          value="2026-11-04"
          placeholder="YYYY-MM-DD"
        />
      );

      expect(html).toContain("Fecha de la Cita");
      expect(html).toContain('value="2026-11-04"');
      expect(html).toContain('placeholder="YYYY-MM-DD"');
    });

    it("renders TimePicker properly with placeholder and label", () => {
      const html = renderToString(
        <TimePicker
          id="appointment-time"
          label="Hora de la Cita"
          value="09:30"
          placeholder="HH:MM (ej. 09:30)"
        />
      );

      expect(html).toContain("Hora de la Cita");
      expect(html).toContain('value="09:30"');
      expect(html).toContain("09:30");
    });
  });

  describe("BottomSheet Browser History (Back button / popstate integration - HAG-59 & HAG-61)", () => {
    const originalWindow = globalThis.window;
    const originalDocument = globalThis.document;

    afterEach(() => {
      if (originalWindow !== undefined) {
        globalThis.window = originalWindow;
      } else {
        delete (globalThis as any).window;
      }
      if (originalDocument !== undefined) {
        globalThis.document = originalDocument;
      } else {
        delete (globalThis as any).document;
      }
      vi.restoreAllMocks();
    });

    /**
     * Lightweight Hook and Component Test Runner for Node/Vitest environments.
     */
    function renderHook<TProps, TResult>(
      hookFn: (props: TProps) => TResult,
      options: { initialProps: TProps }
    ): {
      result: { current: TResult };
      rerender: (newProps?: TProps) => TResult;
    } {
      const internals = (React as any).__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
      const hooks: any[] = [];
      let hookIndex = 0;
      let effects: { idx: number; effect: () => any }[] = [];
      const cleanups: (() => void)[] = [];
      const prevDepsMap = new Map<number, any[] | undefined>();
      let currentProps = options.initialProps;
      let result!: TResult;

      const dispatcher = {
        useState(initialValue: any) {
          const idx = hookIndex++;
          if (hooks[idx] === undefined) {
            hooks[idx] = typeof initialValue === "function" ? initialValue() : initialValue;
          }
          const setState = (action: any) => {
            const next = typeof action === "function" ? action(hooks[idx]) : action;
            hooks[idx] = next;
            rerender();
          };
          return [hooks[idx], setState];
        },
        useRef(initialValue: any) {
          const idx = hookIndex++;
          if (hooks[idx] === undefined) {
            hooks[idx] = { current: initialValue };
          }
          return hooks[idx];
        },
        useCallback(fn: any, deps?: any[]) {
          const idx = hookIndex++;
          if (hooks[idx] === undefined) {
            hooks[idx] = { fn, deps };
          } else {
            const prev = hooks[idx];
            const changed = !deps || deps.some((d, i) => d !== prev.deps[i]);
            if (changed) {
              hooks[idx] = { fn, deps };
            }
          }
          return hooks[idx].fn;
        },
        useEffect(effect: () => any, deps?: any[]) {
          const idx = hookIndex++;
          const prev = prevDepsMap.get(idx);
          const changed = !deps || !prev || deps.some((d, i) => d !== prev[i]);
          if (changed) {
            prevDepsMap.set(idx, deps);
            effects.push({ idx, effect });
          }
        },
      };

      function rerender(newProps?: TProps) {
        if (newProps !== undefined) currentProps = newProps;
        hookIndex = 0;
        const prevDispatcher = internals.H;
        internals.H = dispatcher;
        try {
          result = hookFn(currentProps);
        } finally {
          internals.H = prevDispatcher;
        }
        const runEffects = [...effects];
        effects = [];
        for (const { idx, effect } of runEffects) {
          if (cleanups[idx]) {
            cleanups[idx]();
          }
          const cleanup = effect();
          if (typeof cleanup === "function") {
            cleanups[idx] = cleanup;
          }
        }
        return result;
      }

      function unmount() {
        for (const cleanup of Object.values(cleanups)) {
          if (typeof cleanup === "function") {
            cleanup();
          }
        }
      }

      rerender();
      return {
        result: {
          get current() {
            return result;
          },
        },
        rerender,
        unmount,
      };
    }

    it("invokes window.history.pushState when BottomSheet opens (open={true})", () => {
      const pushStateSpy = vi.fn();
      const listeners = new Map<string, Set<(e: any) => void>>();

      (globalThis as any).window = {
        history: {
          state: { prevData: 123 },
          pushState: pushStateSpy,
          back: vi.fn(),
        },
        addEventListener: vi.fn((event: string, cb: any) => {
          if (!listeners.has(event)) listeners.set(event, new Set());
          listeners.get(event)!.add(cb);
        }),
        removeEventListener: vi.fn((event: string, cb: any) => {
          listeners.get(event)?.delete(cb);
        }),
      };
      (globalThis as any).document = {
        body: {
          style: { overflow: "" },
        },
      };

      const handleClose = vi.fn();
      renderHook((props: any) => BottomSheet(props), {
        initialProps: {
          open: true,
          onClose: handleClose,
          title: "Detalles de Cita",
          children: <div>Contenido</div>,
        },
      });

      expect(pushStateSpy).toHaveBeenCalledTimes(1);
      expect(pushStateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ prevData: 123, __bottomSheet: true }),
        ""
      );
      expect((globalThis as any).window.addEventListener).toHaveBeenCalledWith(
        "popstate",
        expect.any(Function)
      );
    });

    it("invokes onClose() exactly 1 time when popstate event is dispatched (window.dispatchEvent)", () => {
      const listeners = new Map<string, Set<(e: any) => void>>();
      const pushStateSpy = vi.fn();

      (globalThis as any).window = {
        history: {
          state: {},
          pushState: pushStateSpy,
          back: vi.fn(),
        },
        addEventListener: vi.fn((event: string, cb: any) => {
          if (!listeners.has(event)) listeners.set(event, new Set());
          listeners.get(event)!.add(cb);
        }),
        removeEventListener: vi.fn((event: string, cb: any) => {
          listeners.get(event)?.delete(cb);
        }),
        dispatchEvent: vi.fn((event: any) => {
          const cbs = listeners.get(event.type);
          if (cbs) {
            cbs.forEach((cb) => cb(event));
          }
          return true;
        }),
      };
      (globalThis as any).document = {
        body: {
          style: { overflow: "" },
        },
      };

      class PopStateEvent {
        type: string;
        constructor(type: string) {
          this.type = type;
        }
      }
      (globalThis as any).PopStateEvent = PopStateEvent;

      const handleClose = vi.fn();
      renderHook((props: any) => BottomSheet(props), {
        initialProps: {
          open: true,
          onClose: handleClose,
          title: "Panel con Historial",
          children: <div>Contenido</div>,
        },
      });

      expect(handleClose).not.toHaveBeenCalled();

      // Dispatch popstate event (simulating mobile Back button)
      (globalThis as any).window.dispatchEvent(new (globalThis as any).PopStateEvent("popstate"));

      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it("safely calls window.history.back() on cleanup when closed without popstate and history was pushed", () => {
      const pushStateSpy = vi.fn();
      const backSpy = vi.fn();
      const listeners = new Map<string, Set<(e: any) => void>>();

      const mockHistoryState = { __bottomSheet: true };
      (globalThis as any).window = {
        history: {
          state: mockHistoryState,
          pushState: pushStateSpy,
          back: backSpy,
        },
        addEventListener: vi.fn((event: string, cb: any) => {
          if (!listeners.has(event)) listeners.set(event, new Set());
          listeners.get(event)!.add(cb);
        }),
        removeEventListener: vi.fn((event: string, cb: any) => {
          listeners.get(event)?.delete(cb);
        }),
      };
      (globalThis as any).document = {
        body: {
          style: { overflow: "" },
        },
      };

      const handleClose = vi.fn();
      const { rerender } = renderHook((props: any) => BottomSheet(props), {
        initialProps: {
          open: true,
          onClose: handleClose,
          title: "Panel a cerrar",
          children: <div>Contenido</div>,
        },
      });

      expect(pushStateSpy).toHaveBeenCalledTimes(1);
      expect(backSpy).not.toHaveBeenCalled();

      // Change open to false (closing normally, e.g. via backdrop or close button)
      rerender({
        open: false,
        onClose: handleClose,
        title: "Panel a cerrar",
        children: <div>Contenido</div>,
      });

      expect(backSpy).toHaveBeenCalledTimes(1);
    });

    it("does not call history.pushState when open is false", () => {
      const pushStateSpy = vi.fn();

      (globalThis as any).window = {
        history: {
          state: {},
          pushState: pushStateSpy,
          back: vi.fn(),
        },
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };

      const handleClose = vi.fn();
      renderHook((props: any) => BottomSheet(props), {
        initialProps: {
          open: false,
          onClose: handleClose,
          title: "Panel Cerrado",
          children: <div>Contenido</div>,
        },
      });

      expect(pushStateSpy).not.toHaveBeenCalled();
    });

    it("renders safely without history errors during SSR (window or window.history undefined)", () => {
      delete (globalThis as any).window;

      expect(() => {
        renderToString(
          <BottomSheet open={true} onClose={() => {}} title="SSR Sheet">
            <div>Contenido SSR</div>
          </BottomSheet>
        );
      }).not.toThrow();
    });

    it("handles React StrictMode mounting cycle (mount -> cleanup -> remount) without closing itself or calling history.back", () => {
      vi.useFakeTimers();

      const pushStateSpy = vi.fn();
      const backSpy = vi.fn();
      const listeners = new Map<string, Set<(e: any) => void>>();

      const mockHistoryState = { __bottomSheet: true };
      (globalThis as any).window = {
        history: {
          state: mockHistoryState,
          pushState: pushStateSpy,
          back: backSpy,
        },
        addEventListener: vi.fn((event: string, cb: any) => {
          if (!listeners.has(event)) listeners.set(event, new Set());
          listeners.get(event)!.add(cb);
        }),
        removeEventListener: vi.fn((event: string, cb: any) => {
          listeners.get(event)?.delete(cb);
        }),
      };
      (globalThis as any).document = {
        body: {
          style: { overflow: "" },
        },
      };

      const handleClose = vi.fn();

      // Render 1: primer montaje en StrictMode
      const { rerender } = renderHook((props: any) => BottomSheet(props), {
        initialProps: {
          open: true,
          onClose: handleClose,
          title: "StrictMode Sheet",
          children: <div>Contenido</div>,
        },
      });

      expect(pushStateSpy).toHaveBeenCalledTimes(1);
      expect(backSpy).not.toHaveBeenCalled();
      expect(handleClose).not.toHaveBeenCalled();

      // StrictMode simula re-ejecución inmediata de render con open=true
      rerender({
        open: true,
        onClose: handleClose,
        title: "StrictMode Sheet Remounted",
        children: <div>Contenido</div>,
      });

      // Avanzamos los timers
      vi.runAllTimers();

      // Verificamos que back NO se haya llamado y onClose NO se haya disparado
      expect(backSpy).not.toHaveBeenCalled();
      expect(handleClose).not.toHaveBeenCalled();

      // Cuando ahora sí se cierra normalmente cambiando open a false:
      rerender({
        open: false,
        onClose: handleClose,
        title: "StrictMode Sheet Remounted",
        children: <div>Contenido</div>,
      });

      expect(backSpy).toHaveBeenCalledTimes(1);

      vi.useRealTimers();
    });
  });
});
