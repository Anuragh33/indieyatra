import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

export const locales = ["en", "hi", "ta", "te", "kn", "mr", "bn", "gu"] as const;
export type Locale = (typeof locales)[number];

export const localeNames: Record<Locale, string> = {
  en: "English",
  hi: "हिंदी",
  ta: "தமிழ்",
  te: "తెలుగు",
  kn: "ಕನ್ನಡ",
  mr: "मराठी",
  bn: "বাংলা",
  gu: "ગુજરાતી",
};

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const locale = (cookieStore.get("ib-locale")?.value ?? "en") as Locale;
  const safe = locales.includes(locale) ? locale : "en";

  return {
    locale: safe,
    messages: (await import(`../../messages/${safe}.json`)).default,
  };
});
