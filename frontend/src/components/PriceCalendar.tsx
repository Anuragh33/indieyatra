"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { format, addDays, parseISO } from "date-fns";
import { apiGet } from "@/lib/api";
import { useCurrency } from "@/lib/currency";

interface DayFare {
  date: string;   // YYYY-MM-DD
  fare: number | null;
}

interface Props {
  from: string;
  to: string;
  selectedDate: string;
  onSelect: (date: string) => void;
  vertical?: "bus" | "train" | "flight";
}

export function PriceCalendar({ from, to, selectedDate, onSelect, vertical = "bus" }: Props) {
  const { format: fmt } = useCurrency();
  const [fares, setFares] = useState<DayFare[]>([]);
  const [loading, setLoading] = useState(false);

  const days = Array.from({ length: 14 }, (_, i) => {
    const d = addDays(new Date(), i);
    return format(d, "yyyy-MM-dd");
  });

  useEffect(() => {
    if (!from || !to) return;
    setLoading(true);
    const endpoint =
      vertical === "bus"
        ? `/api/search/buses?from=${from}&to=${to}&date=${days[0]}&days=14`
        : vertical === "train"
        ? `/api/trains/search?from=${from}&to=${to}&date=${days[0]}&days=14`
        : `/api/flights/search?from=${from}&to=${to}&date=${days[0]}&days=14`;

    apiGet<{ date: string; min_fare: number }[]>(endpoint + "&fare_calendar=1")
      .then((data) => {
        const map = new Map(data?.map((d) => [d.date, d.min_fare]) ?? []);
        setFares(days.map((d) => ({ date: d, fare: map.get(d) ?? null })));
      })
      .catch(() => {
        // Fallback: show days without prices
        setFares(days.map((d) => ({ date: d, fare: null })));
      })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, vertical]);

  const knownFares = fares.map((f) => f.fare).filter((f): f is number => f !== null);
  const minFare = knownFares.length ? Math.min(...knownFares) : 0;
  const maxFare = knownFares.length ? Math.max(...knownFares) : 0;

  const colorFor = (fare: number | null) => {
    if (fare === null) return "bg-white/5 text-slate-500";
    if (fare === minFare) return "bg-teal-500/15 text-teal-300 border-teal-500/30";
    const ratio = maxFare === minFare ? 0.5 : (fare - minFare) / (maxFare - minFare);
    if (ratio < 0.4) return "bg-teal-500/10 text-teal-400 border-teal-500/20";
    if (ratio < 0.7) return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    return "bg-red-500/10 text-red-400 border-red-500/20";
  };

  if (!from || !to) return null;

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-slate-400 font-medium">Fare calendar · next 14 days</p>
        <div className="flex items-center gap-3 text-[10px] text-slate-500">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-teal-500/50" />Cheap</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500/50" />Moderate</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500/50" />Expensive</span>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {(loading ? days : fares).map((item, i) => {
          const dateStr = typeof item === "string" ? item : item.date;
          const fare = typeof item === "string" ? null : item.fare;
          const isSelected = dateStr === selectedDate;
          const dayLabel = format(parseISO(dateStr), "d");
          const monthLabel = format(parseISO(dateStr), "MMM");
          const isToday = dateStr === format(new Date(), "yyyy-MM-dd");

          return (
            <motion.button
              key={dateStr}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              onClick={() => onSelect(dateStr)}
              className={`relative flex flex-col items-center py-2 px-1 rounded-lg border text-center transition-all ${
                isSelected
                  ? "border-purple-500 bg-purple-500/20 ring-1 ring-purple-500/50"
                  : `border-transparent ${colorFor(fare)} hover:border-white/20`
              }`}
            >
              {isToday && (
                <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-saffron" />
              )}
              <span className="text-[10px] text-slate-500 leading-none">{monthLabel}</span>
              <span className="text-sm font-bold leading-tight mt-0.5">{dayLabel}</span>
              {loading ? (
                <span className="text-[9px] mt-0.5 text-slate-600">…</span>
              ) : fare !== null ? (
                <span className="text-[9px] mt-0.5 font-medium leading-none">
                  {fmt(fare)}
                </span>
              ) : (
                <span className="text-[9px] mt-0.5 text-slate-600">—</span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
