import { create } from "zustand";
import { persist } from "zustand/middleware";

// 1 USD = ~83.5 INR (hardcoded; replace with live rate if desired)
const USD_RATE = 83.5;

type Currency = "INR" | "USD";

interface CurrencyState {
  currency: Currency;
  toggle: () => void;
  format: (inrAmount: number) => string;
}

export const useCurrency = create<CurrencyState>()(
  persist(
    (set, get) => ({
      currency: "INR",
      toggle: () =>
        set((s) => ({ currency: s.currency === "INR" ? "USD" : "INR" })),
      format: (inrAmount: number) => {
        const { currency } = get();
        if (currency === "USD") {
          const usd = inrAmount / USD_RATE;
          return `$${usd.toFixed(usd < 10 ? 2 : 0)}`;
        }
        return `₹${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Math.round(inrAmount))}`;
      },
    }),
    { name: "indieyatra-currency" }
  )
);
