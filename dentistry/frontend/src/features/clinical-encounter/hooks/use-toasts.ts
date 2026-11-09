"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type ToastTone = "success" | "info" | "warning" | "danger";

export interface ClinicalEncounterToast {
  id: string;
  message: string;
  tone: ToastTone;
}

const AUTO_DISMISS_MS = 3200;

export function useToasts() {
  const [toasts, setToasts] = useState<ClinicalEncounterToast[]>([]);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const sequence = useRef(0);

  const dismissToast = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback((message: string, tone: ToastTone = "success") => {
    sequence.current += 1;
    const id = `toast-${sequence.current}`;

    setToasts((current) => [...current, { id, message, tone }]);

    const timer = setTimeout(() => {
      timers.current.delete(id);
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, AUTO_DISMISS_MS);

    timers.current.set(id, timer);
  }, []);

  useEffect(() => {
    const activeTimers = timers.current;
    return () => {
      for (const timer of activeTimers.values()) {
        clearTimeout(timer);
      }
      activeTimers.clear();
    };
  }, []);

  return { toasts, pushToast, dismissToast };
}
