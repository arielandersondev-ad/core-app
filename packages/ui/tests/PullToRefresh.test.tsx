import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { act } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import {
  PullToRefresh,
  type PullToRefreshProps,
} from "../src/components/ui/PullToRefresh";
import {
  usePullToRefresh,
  type UsePullToRefreshOptions,
  type UsePullToRefreshReturn,
} from "../src/hooks/usePullToRefresh";
import {
  PullToRefresh as ExportedPullToRefresh,
  usePullToRefresh as exportedUsePullToRefresh,
} from "../src/index";

/**
 * Lightweight Hook and Component Test Runner for Node/Vitest environments.
 * Connects into React's internal hook dispatcher to execute hooks and components
 * with reactive state transitions, refs, callbacks, and effects.
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

function createTouchEvent(clientY: number, clientX = 0, currentTarget: any = null): React.TouchEvent {
  return {
    touches: [{ clientY, clientX } as React.Touch],
    currentTarget,
  } as unknown as React.TouchEvent;
}

describe("PullToRefresh & usePullToRefresh Unit Tests (HAG-57)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Contract & Module Exports", () => {
    it("exports PullToRefresh and usePullToRefresh from @app/ui root index", () => {
      expect(typeof ExportedPullToRefresh).toBe("function");
      expect(typeof exportedUsePullToRefresh).toBe("function");
      expect(ExportedPullToRefresh).toBe(PullToRefresh);
      expect(exportedUsePullToRefresh).toBe(usePullToRefresh);
    });
  });

  describe("DOM Structure & Initial Render (PullToRefresh Component)", () => {
    it("renders children and sets data-testid='pull-to-refresh'", () => {
      const html = renderToString(
        <PullToRefresh onRefresh={() => {}}>
          <div data-testid="child-element">Contenido clínico de agenda</div>
        </PullToRefresh>
      );

      expect(html).toContain('data-testid="pull-to-refresh"');
      expect(html).toContain('data-testid="child-element"');
      expect(html).toContain("Contenido clínico de agenda");
    });

    it("renders indicator container with role='status' and aria-live='polite'", () => {
      const html = renderToString(
        <PullToRefresh onRefresh={() => {}}>
          <div>Lista de pacientes</div>
        </PullToRefresh>
      );

      expect(html).toContain('role="status"');
      expect(html).toContain('aria-live="polite"');
    });

    it("displays default pullingLabel 'Desliza para actualizar' when idle", () => {
      const html = renderToString(
        <PullToRefresh onRefresh={() => {}}>
          <div>Items</div>
        </PullToRefresh>
      );

      expect(html).toContain("Desliza para actualizar");
    });

    it("supports custom pullingLabel, readyLabel, and refreshingLabel", () => {
      const html = renderToString(
        <PullToRefresh
          onRefresh={() => {}}
          pullingLabel="Tira para recargar"
          readyLabel="Suelta ya"
          refreshingLabel="Obteniendo turnos..."
        >
          <div>Items</div>
        </PullToRefresh>
      );

      expect(html).toContain("Tira para recargar");
    });

    it("applies custom className alongside default relative layout classes", () => {
      const html = renderToString(
        <PullToRefresh onRefresh={() => {}} className="bg-slate-50 touch-pan-y">
          <div>Vista de citas</div>
        </PullToRefresh>
      );

      expect(html).toContain("relative w-full h-full overflow-hidden bg-slate-50 touch-pan-y");
    });
  });

  describe("Controlled Refreshing State (isRefreshing / async in progress)", () => {
    it("shows refreshingLabel ('Actualizando...') and spinning SVG when isRefreshing is true", () => {
      const { result } = renderHook(
        (props: PullToRefreshProps) => PullToRefresh(props),
        {
          initialProps: {
            onRefresh: () => {},
            isRefreshing: true,
            children: <div>Citas</div>,
          },
        }
      );

      const html = renderToString(result.current);

      expect(html).toContain("Actualizando...");
      expect(html).toContain("animate-spin");
      expect(html).toContain('role="status"');
      expect(html).toContain('aria-live="polite"');
      // Contains svg circle and path for spinner
      expect(html).toContain("<circle");
      expect(html).toContain("<path");
    });

    it("uses custom refreshingLabel when provided in controlled isRefreshing mode", () => {
      const { result } = renderHook(
        (props: PullToRefreshProps) => PullToRefresh(props),
        {
          initialProps: {
            onRefresh: () => {},
            isRefreshing: true,
            refreshingLabel: "Recargando disponibilidad clínica...",
            children: <div>Citas</div>,
          },
        }
      );

      const html = renderToString(result.current);

      expect(html).toContain("Recargando disponibilidad clínica...");
      expect(html).not.toContain("Desliza para actualizar");
    });

    it("sets indicator height to threshold when isRefreshing is true", () => {
      const { result } = renderHook(
        (props: PullToRefreshProps) => PullToRefresh(props),
        {
          initialProps: {
            onRefresh: () => {},
            isRefreshing: true,
            threshold: 80,
            children: <div>Citas</div>,
          },
        }
      );

      const html = renderToString(result.current);

      expect(html).toContain("height:80px");
      expect(html).toContain("translateY(0)");
    });
  });

  describe("Gesture Handling & usePullToRefresh Hook Logic", () => {
    it("starts in idle state with pullDistance 0 and progress 0", () => {
      const onRefresh = vi.fn();
      const { result } = renderHook(
        (props: UsePullToRefreshOptions) => usePullToRefresh(props),
        { initialProps: { onRefresh } }
      );

      expect(result.current.state).toBe("idle");
      expect(result.current.pullDistance).toBe(0);
      expect(result.current.progress).toBe(0);
      expect(result.current.isRefreshing).toBe(false);
    });

    it("incomplete gesture (pull below threshold): does NOT invoke onRefresh and returns to idle", async () => {
      const onRefresh = vi.fn();
      const { result } = renderHook(
        (props: UsePullToRefreshOptions) => usePullToRefresh(props),
        { initialProps: { onRefresh, threshold: 64 } }
      );

      // Start touch at Y=100
      act(() => {
        result.current.handlers.onTouchStart(createTouchEvent(100, 50));
      });

      // Move down 50px (damped by 0.5 = 25px, which is < threshold 64)
      act(() => {
        result.current.handlers.onTouchMove(createTouchEvent(150, 50));
      });

      expect(result.current.state).toBe("pulling");
      expect(result.current.pullDistance).toBe(25);
      expect(result.current.progress).toBeCloseTo(25 / 64, 4);

      // Release touch before reaching threshold
      await act(async () => {
        await result.current.handlers.onTouchEnd();
      });

      // State resets to idle and onRefresh is NOT called
      expect(result.current.state).toBe("idle");
      expect(result.current.pullDistance).toBe(0);
      expect(result.current.progress).toBe(0);
      expect(onRefresh).not.toHaveBeenCalled();
    });

    it("complete gesture (pull exceeding threshold): enters ready state, then executes onRefresh exactly once on release", async () => {
      const onRefresh = vi.fn().mockImplementation(async () => {
        // Simulates async refresh
      });

      const { result } = renderHook(
        (props: UsePullToRefreshOptions) => usePullToRefresh(props),
        { initialProps: { onRefresh, threshold: 64, maxPullDistance: 120 } }
      );

      // Start touch at Y=100
      act(() => {
        result.current.handlers.onTouchStart(createTouchEvent(100, 50));
      });

      // Move down 160px (damped by 0.5 = 80px, exceeding threshold 64)
      act(() => {
        result.current.handlers.onTouchMove(createTouchEvent(260, 50));
      });

      // Verified ready state before releasing
      expect(result.current.state).toBe("ready");
      expect(result.current.pullDistance).toBe(80);
      expect(result.current.progress).toBe(1);

      // Release touch to trigger refresh
      await act(async () => {
        await result.current.handlers.onTouchEnd();
      });

      // onRefresh was executed exactly once
      expect(onRefresh).toHaveBeenCalledTimes(1);
      // After resolution, state and pullDistance return to idle
      expect(result.current.state).toBe("idle");
      expect(result.current.pullDistance).toBe(0);
      expect(result.current.progress).toBe(0);
    });

    it("displays readyLabel ('Suelta para actualizar') in UI when pull exceeds threshold", () => {
      const { result } = renderHook(
        (props: PullToRefreshProps) => PullToRefresh(props),
        {
          initialProps: {
            onRefresh: () => {},
            readyLabel: "Suelta para actualizar",
            children: <div>Contenido</div>,
          },
        }
      );

      // Start touch and pull past threshold
      act(() => {
        result.current.props.onTouchStart(createTouchEvent(100, 50));
      });

      act(() => {
        result.current.props.onTouchMove(createTouchEvent(260, 50));
      });

      const html = renderToString(result.current);
      expect(html).toContain("Suelta para actualizar");
      expect(html).toContain("rotate-180");
    });

    it("respects maxPullDistance damping limit", () => {
      const onRefresh = vi.fn();
      const { result } = renderHook(
        (props: UsePullToRefreshOptions) => usePullToRefresh(props),
        { initialProps: { onRefresh, threshold: 64, maxPullDistance: 100 } }
      );

      act(() => {
        result.current.handlers.onTouchStart(createTouchEvent(100, 50));
      });

      // Large drag: 400px * 0.5 = 200px, but maxPullDistance is 100px
      act(() => {
        result.current.handlers.onTouchMove(createTouchEvent(500, 50));
      });

      expect(result.current.pullDistance).toBe(100);
      expect(result.current.state).toBe("ready");
    });
  });

  describe("Disabled Prop (disabled={true})", () => {
    it("ignores touch gestures and does not trigger onRefresh when disabled=true", async () => {
      const onRefresh = vi.fn();
      const { result } = renderHook(
        (props: UsePullToRefreshOptions) => usePullToRefresh(props),
        { initialProps: { onRefresh, disabled: true, threshold: 64 } }
      );

      act(() => {
        result.current.handlers.onTouchStart(createTouchEvent(100, 50));
      });

      act(() => {
        result.current.handlers.onTouchMove(createTouchEvent(300, 50));
      });

      expect(result.current.state).toBe("idle");
      expect(result.current.pullDistance).toBe(0);

      await act(async () => {
        await result.current.handlers.onTouchEnd();
      });

      expect(onRefresh).not.toHaveBeenCalled();
    });

    it("triggerRefresh() exits early when disabled=true", async () => {
      const onRefresh = vi.fn();
      const { result } = renderHook(
        (props: UsePullToRefreshOptions) => usePullToRefresh(props),
        { initialProps: { onRefresh, disabled: true } }
      );

      await act(async () => {
        await result.current.triggerRefresh();
      });

      expect(onRefresh).not.toHaveBeenCalled();
    });

    it("component with disabled={true} ignores touch interaction and maintains pullingLabel", async () => {
      const onRefresh = vi.fn();
      const { result } = renderHook(
        (props: PullToRefreshProps) => PullToRefresh(props),
        {
          initialProps: {
            onRefresh,
            disabled: true,
            children: <div>Turnos</div>,
          },
        }
      );

      act(() => {
        result.current.props.onTouchStart(createTouchEvent(100, 50));
      });

      act(() => {
        result.current.props.onTouchMove(createTouchEvent(300, 50));
      });

      const html = renderToString(result.current);
      expect(html).toContain("Desliza para actualizar");
      expect(html).not.toContain("Suelta para actualizar");
      expect(html).not.toContain("Actualizando...");

      await act(async () => {
        await result.current.props.onTouchEnd();
      });

      expect(onRefresh).not.toHaveBeenCalled();
    });
  });

  describe("Scroll & Directional Constraints", () => {
    it("aborts pull if target element has scrollTop > 0", () => {
      const onRefresh = vi.fn();
      const { result } = renderHook(
        (props: UsePullToRefreshOptions) => usePullToRefresh(props),
        { initialProps: { onRefresh } }
      );

      const mockScrollableElement = { scrollTop: 15 } as HTMLElement;

      act(() => {
        result.current.handlers.onTouchStart(
          createTouchEvent(100, 50, mockScrollableElement)
        );
      });

      act(() => {
        result.current.handlers.onTouchMove(createTouchEvent(200, 50));
      });

      expect(result.current.state).toBe("idle");
      expect(result.current.pullDistance).toBe(0);
    });

    it("ignores gesture when horizontal swipe predominates over vertical drag (deltaX > deltaY)", () => {
      const onRefresh = vi.fn();
      const { result } = renderHook(
        (props: UsePullToRefreshOptions) => usePullToRefresh(props),
        { initialProps: { onRefresh } }
      );

      act(() => {
        result.current.handlers.onTouchStart(createTouchEvent(100, 50));
      });

      // deltaY = 20, deltaX = 80 (horizontal swipe)
      act(() => {
        result.current.handlers.onTouchMove(createTouchEvent(120, 130));
      });

      expect(result.current.state).toBe("idle");
      expect(result.current.pullDistance).toBe(0);
    });

    it("resets distance to 0 when user drags back up (deltaY <= 0)", () => {
      const onRefresh = vi.fn();
      const { result } = renderHook(
        (props: UsePullToRefreshOptions) => usePullToRefresh(props),
        { initialProps: { onRefresh } }
      );

      act(() => {
        result.current.handlers.onTouchStart(createTouchEvent(100, 50));
      });

      // Drag down first
      act(() => {
        result.current.handlers.onTouchMove(createTouchEvent(150, 50));
      });
      expect(result.current.pullDistance).toBe(25);

      // Drag back up above start
      act(() => {
        result.current.handlers.onTouchMove(createTouchEvent(80, 50));
      });
      expect(result.current.pullDistance).toBe(0);
      expect(result.current.state).toBe("idle");
    });

    it("onTouchCancel resets state to idle and pullDistance to 0", () => {
      const onRefresh = vi.fn();
      const { result } = renderHook(
        (props: UsePullToRefreshOptions) => usePullToRefresh(props),
        { initialProps: { onRefresh } }
      );

      act(() => {
        result.current.handlers.onTouchStart(createTouchEvent(100, 50));
      });

      act(() => {
        result.current.handlers.onTouchMove(createTouchEvent(160, 50));
      });

      expect(result.current.pullDistance).toBe(30);

      act(() => {
        result.current.handlers.onTouchCancel();
      });

      expect(result.current.state).toBe("idle");
      expect(result.current.pullDistance).toBe(0);
    });
  });

  describe("Async Lifecycle & Error Resilience", () => {
    it("resets state to idle and pullDistance to 0 even if onRefresh throws an error", async () => {
      const faultyRefresh = vi.fn().mockRejectedValue(new Error("Network Error"));

      const { result } = renderHook(
        (props: UsePullToRefreshOptions) => usePullToRefresh(props),
        { initialProps: { onRefresh: faultyRefresh, threshold: 64 } }
      );

      act(() => {
        result.current.handlers.onTouchStart(createTouchEvent(100, 50));
      });

      act(() => {
        result.current.handlers.onTouchMove(createTouchEvent(250, 50));
      });

      expect(result.current.state).toBe("ready");

      await expect(
        act(async () => {
          await result.current.handlers.onTouchEnd();
        })
      ).rejects.toThrow("Network Error");

      expect(faultyRefresh).toHaveBeenCalledTimes(1);
      expect(result.current.state).toBe("idle");
      expect(result.current.pullDistance).toBe(0);
    });

    it("allows manual triggerRefresh() invocation programmatically", async () => {
      let executed = false;
      const onRefresh = vi.fn().mockImplementation(async () => {
        executed = true;
      });

      const { result } = renderHook(
        (props: UsePullToRefreshOptions) => usePullToRefresh(props),
        { initialProps: { onRefresh, threshold: 64 } }
      );

      await act(async () => {
        await result.current.triggerRefresh();
      });

      expect(executed).toBe(true);
      expect(onRefresh).toHaveBeenCalledTimes(1);
      expect(result.current.state).toBe("idle");
    });
  });
});
