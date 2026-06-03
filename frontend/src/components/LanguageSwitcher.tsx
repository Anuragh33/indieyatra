"use client";
import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { LOCALES, useLanguage, type Locale } from "@/lib/i18n";

const FLAGS: Record<string, string> = {
  en: "🇬🇧",
  hi: "🇮🇳",
  mr: "🇮🇳",
  ta: "🇮🇳",
  kn: "🇮🇳",
  te: "🇮🇳",
  bn: "🇮🇳",
  gu: "🇮🇳",
};

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const locale = useLanguage((s) => s.locale);
  const setLocale = useLanguage((s) => s.setLocale);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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
        aria-label="Change language"
        aria-expanded={open}
        className={`
          flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold
          border transition-all duration-200 select-none
          ${open
            ? "border-purple/60 bg-purple/10 text-purple shadow-[0_0_0_3px_rgba(124,58,237,0.12)]"
            : "border-border bg-bg-elevated hover:border-purple/40 hover:bg-purple/5 hover:text-purple text-text-secondary"
          }
        `}
      >
        <span className="text-sm leading-none">{FLAGS[current.code]}</span>
        {!compact && (
          <span className="hidden sm:inline tracking-wide uppercase text-[11px]">
            {current.code}
          </span>
        )}
        <ChevronDown
          className={`w-3 h-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-bg-elevated border border-border rounded-xl shadow-card overflow-hidden z-50">
          <div className="px-3 py-2 border-b border-border/60">
            <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold">
              Language
            </p>
          </div>
          <div className="py-1">
            {LOCALES.map((l) => {
              const active = l.code === locale;
              return (
                <button
                  key={l.code}
                  onClick={() => {
                    setLocale(l.code as Locale);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors
                    ${active
                      ? "bg-purple/10 text-purple"
                      : "text-text-primary hover:bg-bg-hover"
                    }`}
                >
                  <span className="text-base leading-none w-5 text-center">
                    {FLAGS[l.code]}
                  </span>
                  <span className="flex flex-col items-start min-w-0">
                    <span className="font-medium leading-tight">{l.native}</span>
                    <span className="text-[10px] text-text-muted leading-tight">{l.label}</span>
                  </span>
                  {active && (
                    <Check className="w-3.5 h-3.5 ml-auto shrink-0 text-purple" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
