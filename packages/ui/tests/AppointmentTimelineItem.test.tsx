import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import {
  AppointmentTimelineItem,
  getTimelineStatusDotClass,
  sortAppointmentsByTimelinePriority,
  AppointmentTimelineItemData,
  AppointmentTimelineItemProps,
} from "../src/components/ui/AppointmentTimelineItem";

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
  let effects: (() => void)[] = [];
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
    useEffect(effect: () => void, deps?: any[]) {
      const idx = hookIndex++;
      const prev = prevDepsMap.get(idx);
      const changed = !deps || !prev || deps.some((d, i) => d !== prev[i]);
      if (changed) {
        prevDepsMap.set(idx, deps);
        effects.push(effect);
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
    for (const eff of runEffects) {
      eff();
    }
    return result;
  }

  rerender();
  return {
    result: {
      get current() {
        return result;
      },
    },
    rerender,
  };
}

describe("AppointmentTimelineItem Primitives and Helpers (HAG-51)", () => {
  it("determina los colores del punto de estado según el contrato HAG-51", () => {
    expect(getTimelineStatusDotClass("SCHEDULED")).toContain("bg-amber-400");
    expect(getTimelineStatusDotClass("CONFIRMED")).toContain("bg-emerald-500");
    expect(getTimelineStatusDotClass("COMPLETED")).toContain("bg-emerald-500");
    expect(getTimelineStatusDotClass("NO_SHOW")).toContain("bg-rose-500");
    expect(getTimelineStatusDotClass("CANCELED")).toContain("bg-rose-500");
  });

  const mockItem: AppointmentTimelineItemData = {
    id: "apt-101",
    startTime: "05:00",
    durationMin: 45,
    status: "SCHEDULED",
    contactName: "María Fernández Cruz",
    serviceName: "Evaluación general",
    notes: "Prueba de cita real en BD",
  };

  it("renderiza el riel de timeline con hora en mono bold, punto de estado y línea vertical cuando no es la última", () => {
    const html = renderToString(
      <AppointmentTimelineItem appointment={mockItem} isLast={false} />
    );

    expect(html).toContain("05:00");
    expect(html).toContain("bg-amber-400");
    expect(html).toContain("data-testid=\"timeline-vertical-line\"");
  });

  it("no renderiza la línea vertical conectora en la última cita", () => {
    const html = renderToString(
      <AppointmentTimelineItem appointment={mockItem} isLast={true} />
    );

    expect(html).toContain("05:00");
    expect(html).not.toContain("data-testid=\"timeline-vertical-line\"");
  });

  it("renderiza en estado colapsado por defecto mostrando servicio con duración y nota con icono", () => {
    const html = renderToString(
      <AppointmentTimelineItem appointment={mockItem} isExpanded={false} />
    );

    expect(html).toContain("María Fernández Cruz");
    expect(html).toContain("Evaluación general · 45 min");
    expect(html).toContain("Prueba de cita real en BD");
    expect(html).toContain("📄");

    // No debe contener botones de la vista expandida
    expect(html).not.toContain("Confirmar");
    expect(html).not.toContain("No asistió");
  });

  it("renderiza en estado expandido mostrando botones de WhatsApp, llamada, Confirmar y No asistió", () => {
    const html = renderToString(
      <AppointmentTimelineItem appointment={mockItem} isExpanded={true} />
    );

    expect(html).toContain("María Fernández Cruz");
    expect(html).toContain("Evaluación general");
    expect(html).toContain("Contactar por WhatsApp");
    expect(html).toContain("Llamar al paciente");
    expect(html).toContain("Confirmar");
    expect(html).toContain("No asistió");
    expect(html).toContain("45 min");
  });

  describe("Ajustes visuales y comportamiento interactivo HAG-61 (Estilo Bybit, teléfono y Ver ficha)", () => {
    const itemWithPhone: AppointmentTimelineItemData = {
      ...mockItem,
      phone: "+591 71234567",
    };

    it("renderiza el nombre del paciente con subrayado punteado estilo Bybit (decoration-dotted)", () => {
      const html = renderToString(
        <AppointmentTimelineItem appointment={itemWithPhone} />
      );

      expect(html).toContain("María Fernández Cruz");
      expect(html).toContain("decoration-dotted");
      expect(html).toContain("underline");
      expect(html).toContain("underline-offset-4");
    });

    it("NO muestra el teléfono cuando la tarjeta está colapsada (isExpanded={false})", () => {
      const html = renderToString(
        <AppointmentTimelineItem appointment={itemWithPhone} isExpanded={false} />
      );

      expect(html).not.toContain("+591 71234567");
      expect(html).not.toContain('data-testid="appointment-expanded-phone"');
    });

    it("SÍ muestra el teléfono de forma sutil debajo del nombre cuando la tarjeta está expandida (isExpanded={true})", () => {
      const html = renderToString(
        <AppointmentTimelineItem appointment={itemWithPhone} isExpanded={true} />
      );

      expect(html).toContain("+591 71234567");
      expect(html).toContain('data-testid="appointment-expanded-phone"');
      expect(html).toContain("font-mono");
      expect(html).toContain("text-[11px]");
    });

    it("no muestra el contenedor del teléfono si appointment.phone no está definido", () => {
      const html = renderToString(
        <AppointmentTimelineItem appointment={mockItem} isExpanded={true} />
      );

      expect(html).not.toContain('data-testid="appointment-expanded-phone"');
    });

    it("garantiza que NO exista ningún texto o botón 'Ver ficha'", () => {
      const collapsedHtml = renderToString(
        <AppointmentTimelineItem appointment={itemWithPhone} isExpanded={false} />
      );
      const expandedHtml = renderToString(
        <AppointmentTimelineItem appointment={itemWithPhone} isExpanded={true} />
      );

      expect(collapsedHtml).not.toContain("Ver ficha");
      expect(expandedHtml).not.toContain("Ver ficha");
    });

    it("invoca onNameClick al hacer click en el nombre punteado deteniendo la propagación", () => {
      const handleNameClick = vi.fn();
      const handleToggleExpand = vi.fn();

      const { result } = renderHook(
        (props: AppointmentTimelineItemProps) => AppointmentTimelineItem(props),
        {
          initialProps: {
            appointment: itemWithPhone,
            onNameClick: handleNameClick,
            onToggleExpand: handleToggleExpand,
          },
        }
      );

      function findElementWithClass(node: any, classNameSub: string): any {
        if (!node || typeof node !== "object") return null;
        if (
          typeof node.props?.className === "string" &&
          node.props.className.includes(classNameSub)
        ) {
          return node;
        }
        if (node.props?.children) {
          const children = Array.isArray(node.props.children)
            ? node.props.children
            : [node.props.children];
          for (const child of children) {
            const found = findElementWithClass(child, classNameSub);
            if (found) return found;
          }
        }
        return null;
      }

      const nameSpan = findElementWithClass(result.current, "decoration-dotted");
      expect(nameSpan).not.toBeNull();
      expect(nameSpan.props.className).toContain("decoration-dotted");
      const stopPropagationSpy = vi.fn();
      nameSpan.props.onClick({ stopPropagation: stopPropagationSpy } as any);

      expect(stopPropagationSpy).toHaveBeenCalledTimes(1);
      expect(handleNameClick).toHaveBeenCalledTimes(1);
    });
  });

  describe("Estado visual 'Vencida' (isOverdue) y Ordenamiento Inteligente HAG-67", () => {
    const defaultItem: AppointmentTimelineItemData = {
      id: "apt-201",
      startTime: "05:00",
      durationMin: 30,
      status: "SCHEDULED",
      contactName: "Carlos Choque Apaza",
      serviceName: "Limpieza",
    };

    it("renderiza estilo de cita vencida cuando isOverdue={true} se pasa por prop", () => {
      const html = renderToString(
        <AppointmentTimelineItem appointment={defaultItem} isOverdue={true} />
      );

      // Badge data-testid="appointment-overdue-badge" con texto 'Vencida'
      expect(html).toContain('data-testid="appointment-overdue-badge"');
      expect(html).toContain("Vencida");

      // Hora con estilo line-through y texto rose
      expect(html).toContain("line-through");
      expect(html).toContain("text-rose-500/80");

      // Tarjeta acordeón con border-dashed y opacidad atenuada opacity-75
      expect(html).toContain("border-dashed");
      expect(html).toContain("opacity-75");

      // Dot y línea con estilos de overdue
      expect(html).toContain("bg-rose-500 ring-3 ring-rose-500/20");
      expect(html).toContain("border-dashed border-rose-500/30");
    });

    it("renderiza estilo de cita vencida cuando appointment.isOverdue = true en los datos", () => {
      const overdueItem: AppointmentTimelineItemData = {
        ...defaultItem,
        isOverdue: true,
      };

      const html = renderToString(
        <AppointmentTimelineItem appointment={overdueItem} />
      );

      expect(html).toContain('data-testid="appointment-overdue-badge"');
      expect(html).toContain("Vencida");
      expect(html).toContain("line-through");
      expect(html).toContain("border-dashed");
      expect(html).toContain("opacity-75");
    });

    it("NO renderiza badge de vencida ni line-through en la hora cuando isOverdue={false} (por defecto)", () => {
      const html = renderToString(
        <AppointmentTimelineItem appointment={defaultItem} isOverdue={false} />
      );

      expect(html).not.toContain('data-testid="appointment-overdue-badge"');
      expect(html).not.toContain("Vencida");
      expect(html).not.toContain("line-through");
      expect(html).not.toContain("opacity-75");
      expect(html).not.toContain("border-dashed");
    });

    it("sortAppointmentsByTimelinePriority coloca citas actuales y futuras primero, y citas vencidas al final abajo", () => {
      // Simular hora actual: 06:00 AM (360 minutos)
      const currentMinutes = 6 * 60; // 360

      const appointments = [
        {
          id: "apt-past-1",
          startTime: "05:00",
          endTime: "05:30",
          status: "SCHEDULED", // Terminó a las 05:30 (< 06:00), paciente no vino -> Vencida
        },
        {
          id: "apt-active",
          startTime: "05:45",
          endTime: "06:15",
          status: "CONFIRMED", // Termina a las 06:15 (>= 06:00) -> Actual/En curso
        },
        {
          id: "apt-future-2",
          startTime: "07:30",
          status: "SCHEDULED", // Futura
        },
        {
          id: "apt-explicit-overdue",
          startTime: "04:30",
          isOverdue: true, // Explícitamente vencida
        },
        {
          id: "apt-future-1",
          startTime: "06:30",
          status: "SCHEDULED", // Futura
        },
      ];

      const sorted = sortAppointmentsByTimelinePriority(appointments, currentMinutes);

      // IDs esperados en orden:
      // 1) Actuales / futuras por startTime ascendente:
      //    - apt-active (05:45)
      //    - apt-future-1 (06:30)
      //    - apt-future-2 (07:30)
      // 2) Vencidas al final por startTime ascendente:
      //    - apt-explicit-overdue (04:30)
      //    - apt-past-1 (05:00)
      expect(sorted.map((a) => a.id)).toEqual([
        "apt-active",
        "apt-future-1",
        "apt-future-2",
        "apt-explicit-overdue",
        "apt-past-1",
      ]);

      // Las citas vencidas deben tener isOverdue: true
      const overdueResults = sorted.filter((a) => a.isOverdue);
      expect(overdueResults.map((a) => a.id)).toEqual([
        "apt-explicit-overdue",
        "apt-past-1",
      ]);
    });

    it("sortAppointmentsByTimelinePriority ordena correctamente cuando solo se usan flags isOverdue sin currentMinutes", () => {
      const appointments = [
        { id: "1", startTime: "08:00", isOverdue: true },
        { id: "2", startTime: "09:00", isOverdue: false },
        { id: "3", startTime: "07:00", isOverdue: false },
        { id: "4", startTime: "06:00", isOverdue: true },
      ];

      const sorted = sortAppointmentsByTimelinePriority(appointments);

      // Primero las no vencidas: 07:00 (id 3), 09:00 (id 2)
      // Al final las vencidas: 06:00 (id 4), 08:00 (id 1)
      expect(sorted.map((a) => a.id)).toEqual(["3", "2", "4", "1"]);
    });
  });
});
