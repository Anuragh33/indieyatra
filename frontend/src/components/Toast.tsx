"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";

type ToastKind = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  message: string;
  kind: ToastKind;
  duration?: number;
}

interface ToastCtx {
  toast: (message: string, kind?: ToastKind, duration?: number) => void;
  success: (message: string) => void;
  error:   (message: string) => void;
  warning: (message: string) => void;
  info:    (message: string) => void;
}

const Ctx = createContext<ToastCtx | null>(null);

const KIND_CONFIG: Record<ToastKind, { icon: any; cls: string }> = {
  success: { icon: CheckCircle2, cls: "border-teal/30 bg-teal/10 text-teal"        },
  error:   { icon: XCircle,      cls: "border-danger/30 bg-danger/10 text-danger"   },
  warning: { icon: AlertTriangle,cls: "border-warning/30 bg-warning/10 text-warning"},
  info:    { icon: Info,         cls: "border-border bg-bg-elevated text-text-primary"},
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: string) =>
    setToasts((t) => t.filter((x) => x.id !== id)), []);

  const toast = useCallback((message: string, kind: ToastKind = "info", duration = 3500) => {
    const id = `t${++counter.current}`;
    setToasts((t) => [...t, { id, message, kind, duration }]);
    setTimeout(() => dismiss(id), duration);
  }, [dismiss]);

  const success = useCallback((m: string) => toast(m, "success"), [toast]);
  const error   = useCallback((m: string) => toast(m, "error", 5000), [toast]);
  const warning = useCallback((m: string) => toast(m, "warning"), [toast]);
  const info    = useCallback((m: string) => toast(m, "info"), [toast]);

  return (
    <Ctx.Provider value={{ toast, success, error, warning, info }}>
      {children}
      <div className="fixed bottom-20 md:bottom-6 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => {
            const { icon: Icon, cls } = KIND_CONFIG[t.kind];
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border shadow-card backdrop-blur-sm ${cls}`}
              >
                <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p className="text-sm flex-1 leading-snug">{t.message}</p>
                <button
                  onClick={() => dismiss(t.id)}
                  className="flex-shrink-0 opacity-60 hover:opacity-100 transition"
                  aria-label="Dismiss"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  );
}

export function useToast(): ToastCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
