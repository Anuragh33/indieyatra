"use client";
import { useEffect, useRef, useState } from "react";
import { Globe, Check } from "lucide-react";
import { LOCALES, useLanguage, type Locale } from "@/lib/i18n";

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const locale = useLanguage((s) => s.locale);
  const setLocale = useLanguage((s) => s.setLocale);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // close on outside click + esc
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    if (open) {
      document.addEventListener("mousedown", onDoc);
      document.addEventListener("keydown", onKey);
    }
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="btn-icon flex items-center gap-1.5 px-2"
        aria-label="Change language"
        aria-expanded={open}
      >
        <Globe className="w-4 h-4" />
        <span className={`text-xs font-semibold ${compact ? "" : "hidden sm:inline"}`}>
          {current.native}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-44 bg-bg-elevated border border-border rounded-md shadow-card py-1 z-50">
          {LOCALES.map((l) => {
            const active = l.code === locale;
            return (
              <button
                key={l.code}
                onClick={() => {
                  setLocale(l.code as Locale);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-bg-hover ${
                  active ? "text-saffron" : "text-text-primary"
                }`}
              >
                <span className="flex flex-col items-start">
                  <span className="font-medium">{l.native}</span>
                  <span className="text-[10px] text-text-muted">{l.label}</span>
                </span>
                {active && <Check className="w-4 h-4" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
