// Language store + i18n bootstrap.
// Source of truth: en.ts. Other locales fall back to en for missing keys
// until the hi/mr/ta/kn/te translation files are authored.

import { create } from "zustand";
import { persist } from "zustand/middleware";
import en from "./en";

export type Locale = "en" | "hi" | "mr" | "ta" | "kn" | "te" | "bn" | "gu";

export const LOCALES: { code: Locale; label: string; native: string }[] = [
  { code: "en", label: "English",  native: "English"  },
  { code: "hi", label: "Hindi",    native: "हिन्दी"   },
  { code: "mr", label: "Marathi",  native: "मराठी"    },
  { code: "ta", label: "Tamil",    native: "தமிழ்"     },
  { code: "kn", label: "Kannada",  native: "ಕನ್ನಡ"    },
  { code: "te", label: "Telugu",   native: "తెలుగు"    },
  { code: "bn", label: "Bengali",  native: "বাংলা"     },
  { code: "gu", label: "Gujarati", native: "ગુજરાતી"   },
];

import hi from "./hi";
import mr from "./mr";
import ta from "./ta";
import kn from "./kn";
import te from "./te";
import bn from "./bn";
import gu from "./gu";

const dictionaries: Record<Locale, any> = { en, hi, mr, ta, kn, te, bn, gu };

interface LangState {
  locale: Locale;
  setLocale: (l: Locale) => void;
}

export const useLanguage = create<LangState>()(
  persist(
    (set) => ({
      locale: "en",
      setLocale: (locale) => {
        set({ locale });
        if (typeof document !== "undefined") {
          document.documentElement.lang = locale;
          // sync with next-intl cookie for server-component locale resolution
          document.cookie = `ib-locale=${locale};path=/;max-age=31536000;SameSite=Lax`;
        }
      },
    }),
    { name: "indiebus-lang" }
  )
);

/**
 * Deep-merge fallback: if a key exists in the requested locale, use it;
 * otherwise walk into the en dictionary. Function values in en are
 * executed with the args passed in.
 */
function get(dict: any, path: (string | number)[]): any {
  let cur: any = dict;
  for (const k of path) {
    if (cur == null) return undefined;
    cur = cur[k];
  }
  return cur;
}

/**
 * t() hook: returns a translator bound to the current locale.
 *   const t = useT();
 *   t("nav.signIn")                      -> string
 *   t("search.stops", 2)                 -> string (calls the function with args)
 *   t("auth.register.welcome", "Priya")  -> string
 *
 * Missing keys are surfaced in the console the first time per session so
 * they're easy to find while translating.
 */
export function useT() {
  const locale = useLanguage((s) => s.locale);
  const dict = dictionaries[locale] ?? en;

  const t = (key: string, ...args: any[]): string => {
    const path = key.split(".");
    let val: any = get(dict, path);
    if (val === undefined) {
      val = get(en, path);
      if (typeof window !== "undefined" && !(window as any).__ib_missing_keys) {
        (window as any).__ib_missing_keys = new Set<string>();
      }
      if (typeof window !== "undefined") {
        const set = (window as any).__ib_missing_keys as Set<string>;
        if (!set.has(key)) {
          set.add(key);
          // eslint-disable-next-line no-console
          console.warn(`[i18n] missing key "${key}" in locale "${locale}" — falling back to en`);
        }
      }
    }
    if (typeof val === "function") return val(...args);
    if (val == null) return key;
    return String(val);
  };

  return t;
}
