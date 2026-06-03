"use client";
import { useEffect } from "react";
import { useLanguage } from "@/lib/i18n";

/**
 * Hydration-safe bootstrap that mirrors the persisted language into
 * <html lang> and forces one-time class application after first paint.
 * Returns null — just a side-effect component.
 */
export function LangBootstrap() {
  const locale = useLanguage((s) => s.locale);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  return null;
}
