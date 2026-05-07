"use client";

import { AnimatePresence, motion } from "framer-motion";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

type ToastTone = "neutral" | "good" | "warn" | "bad";

export type ToastInput = {
  id?: string;
  title: string;
  description?: string;
  tone?: ToastTone;
  durationMs?: number;
  onUndo?: () => void | Promise<void>;
  undoLabel?: string;
};

type ToastInternal = Required<Pick<ToastInput, "id" | "title">> &
  Omit<ToastInput, "id" | "title">;

type Ctx = {
  push: (t: ToastInput) => string;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<Ctx | null>(null);

const accentByTone: Record<ToastTone, string> = {
  neutral: "#64748B",
  good: "#16A34A",
  warn: "#D97706",
  bad: "#DC2626",
};

export function Toaster({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastInternal[]>([]);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const dismiss = useCallback((id: string) => {
    setToasts((cur) => cur.filter((t) => t.id !== id));
    const handle = timers.current[id];
    if (handle) {
      clearTimeout(handle);
      delete timers.current[id];
    }
  }, []);

  const push = useCallback((t: ToastInput) => {
    const id = t.id ?? `t-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const next: ToastInternal = {
      id,
      title: t.title,
      description: t.description,
      tone: t.tone ?? "neutral",
      durationMs: t.durationMs ?? 5000,
      onUndo: t.onUndo,
      undoLabel: t.undoLabel ?? "Undo",
    };
    setToasts((cur) => [...cur, next]);
    if (next.durationMs && next.durationMs > 0) {
      timers.current[id] = setTimeout(() => dismiss(id), next.durationMs);
    }
    return id;
  }, [dismiss]);

  useEffect(() => {
    return () => {
      Object.values(timers.current).forEach(clearTimeout);
    };
  }, []);

  return (
    <ToastContext.Provider value={{ push, dismiss }}>
      {children}
      <div className="pointer-events-none fixed bottom-6 right-6 z-50 flex w-[360px] max-w-[calc(100vw-32px)] flex-col gap-2">
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="pointer-events-auto relative overflow-hidden rounded-md border border-rule bg-surface shadow-panel"
            >
              <span className="absolute left-0 top-0 h-full w-[3px]" style={{ background: accentByTone[t.tone ?? "neutral"] }} />
              <div className="flex items-start gap-3 px-4 py-3">
                <div className="flex-1">
                  <div className="text-[12.5px] font-semibold text-ink">{t.title}</div>
                  {t.description ? (
                    <div className="mt-0.5 text-[11.5px] text-ink-muted">{t.description}</div>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {t.onUndo ? (
                    <button
                      type="button"
                      onClick={async () => {
                        await t.onUndo?.();
                        dismiss(t.id);
                      }}
                      className="rounded px-2 py-1 text-[12px] font-semibold text-accent-azure hover:bg-canvas"
                    >
                      {t.undoLabel}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    aria-label="Dismiss"
                    onClick={() => dismiss(t.id)}
                    className="rounded p-1 text-ink-faint hover:bg-canvas hover:text-ink"
                  >
                    <svg width="11" height="11" viewBox="0 0 12 12">
                      <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <Toaster>");
  return ctx;
}
