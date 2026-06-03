"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { MobileNav } from "@/components/MobileNav";
import { apiGet } from "@/lib/api";
import type { Schedule, City } from "@/lib/types";
import { formatTime, formatDuration } from "@/lib/utils";
import { useCurrency } from "@/lib/currency";
import {
  Wifi, Usb, Coffee, MapPin, Star, Clock, Users, Zap, TrendingUp, AlertTriangle, Sparkles, Filter,
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { useT } from "@/lib/i18n";
import { motion } from "framer-motion";

function SearchResultsInner() {
  const params = useSearchParams();
  const router = useRouter();
  const t = useT();
  const { format: formatPrice } = useCurrency();
  const from = params.get("from") || "MUM";
  const to = params.get("to") || "GOA";
  const date = params.get("date") || new Date().toISOString().slice(0, 10);
  const travelers = parseInt(params.get("travelers") || "1");
  const acOnly   = params.get("ac_only")   === "1";
  const govtOnly = params.get("govt_only") === "1";
  const tripType = params.get("trip_type") || "one-way";
  const returnDate = params.get("return_date") || "";

  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"best" | "cheapest" | "fastest">("best");
  const [priceTrend, setPriceTrend] = useState<{ month: string; price: number }[]>([]);
  const [fromCity, setFromCity] = useState<City | null>(null);
  const [toCity, setToCity]   = useState<City | null>(null);
  const [loadingMsg, setLoadingMsg] = useState("Searching routes…");

  // Filters
  const [busTypeFilters, setBusTypeFilters] = useState<Set<string>>(new Set());
  const [amenityFilters, setAmenityFilters] = useState<Set<string>>(new Set());
  const [operatorFilters, setOperatorFilters] = useState<Set<string>>(new Set());
  const [priceRange, setPriceRange] = useState<[number, number]>([200, 1500]);
  const [stopsFilter, setStopsFilter] = useState<Set<string>>(new Set());
  const [departureRange, setDepartureRange] = useState<[number, number]>([0, 1440]); // minutes since midnight

  useEffect(() => {
    setLoading(true);
    setLoadingMsg("Searching routes…");
    const timer = setTimeout(() => setLoadingMsg("Connecting to server, please wait…"), 2500);
    apiGet<Schedule[]>(
      `/api/search/buses?from=${from}&to=${to}&date=${date}&travelers=${travelers}`
    )
      .then((d) => {
        clearTimeout(timer);
        setSchedules(d);
        setLoading(false);
        // Derive city names from the first result — no extra API call needed
        if (d.length > 0) {
          if (d[0].route?.from_city) setFromCity(d[0].route.from_city);
          if (d[0].route?.to_city)   setToCity(d[0].route.to_city);
          apiGet<{ date: string; avg_price: number }[]>(
            `/api/price-history?route_id=${d[0].route_id}`
          )
            .then((hist) => {
              if (hist.length > 0) {
                setPriceTrend(
                  hist.slice(-12).map((h) => ({
                    month: new Date(h.date).toLocaleDateString("en-IN", { month: "short" }),
                    price: Math.round(h.avg_price),
                  }))
                );
              }
            })
            .catch(() => {});
        }
      })
      .catch(() => { clearTimeout(timer); setLoading(false); });
  }, [from, to, date, travelers]);

  const filtered = schedules
    .filter((s) => s.base_fare >= priceRange[0] && s.base_fare <= priceRange[1])
    .filter((s) => {
      if (busTypeFilters.size === 0) return true;
      const type = (s.bus?.bus_type || "").toLowerCase();
      for (const f of busTypeFilters) if (type.includes(f.toLowerCase())) return true;
      return false;
    })
    .filter((s) => {
      if (amenityFilters.size === 0) return true;
      const amenities = (s.bus?.amenities || "").toLowerCase();
      for (const a of amenityFilters) if (amenities.includes(a.toLowerCase())) return true;
      return false;
    })
    .filter((s) => {
      if (operatorFilters.size === 0) return true;
      return operatorFilters.has(s.operator?.id || s.operator_id);
    })
    .filter((s) => !acOnly   || s.bus?.is_ac)
    .filter((s) => !govtOnly || s.operator?.is_government)
    .filter((s) => {
      if (stopsFilter.size === 0) return true;
      if (stopsFilter.has("0") && s.stops === 0) return true;
      if (stopsFilter.has("1") && s.stops === 1) return true;
      if (stopsFilter.has("2+") && s.stops >= 2) return true;
      return false;
    })
    .filter((s) => {
      const dep = new Date(s.departure_at);
      const mins = dep.getHours() * 60 + dep.getMinutes();
      return mins >= departureRange[0] && mins <= departureRange[1];
    });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "cheapest") return a.base_fare - b.base_fare;
    if (sortBy === "fastest") return a.duration_min - b.duration_min;
    return 0;
  });

  // Unique operators in current result set, for the filter sidebar
  const operatorsInResults = Array.from(
    new Map(
      schedules
        .map((s) => s.operator)
        .filter((o): o is NonNullable<typeof o> => !!o && !!o.id)
        .map((o) => [o.id, o])
    ).values()
  );

  const minPrice = schedules.length ? Math.min(...schedules.map((s) => s.base_fare)) : 0;
  const maxPrice = schedules.length ? Math.max(...schedules.map((s) => s.base_fare)) : 0;
  const minDuration = schedules.length ? Math.min(...schedules.map((s) => s.duration_min)) : 0;

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 pb-24 md:pb-12">
        {/* Header */}
        <div className="card p-5 mb-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold">
              {fromCity?.name || from} → {toCity?.name || to}
            </h1>
            <p className="text-sm text-text-muted mt-1 flex items-center gap-2 flex-wrap">
              <span>{date}{returnDate ? ` → ${returnDate}` : ""}</span>
              <span>·</span>
              <span>{t("search.traveler", travelers)}</span>
              {tripType === "round" && (
                <span className="chip bg-saffron/10 text-saffron border border-saffron/20 text-[10px]">Round Trip</span>
              )}
              {tripType === "multi" && (
                <span className="chip bg-purple/10 text-purple border border-purple/20 text-[10px]">Multi City</span>
              )}
              <span>·</span>
              <span>{schedules.length} {t("search.seatsAvailable")}</span>
            </p>
          </div>
          <button
            onClick={() => router.push("/")}
            className="btn-secondary text-sm self-start md:self-center"
          >
            {t("search.modify")}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_300px] gap-4">
          {/* FILTERS SIDEBAR */}
          <aside className="card p-5 h-fit sticky top-20">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-4 h-4 text-saffron" />
              <h3 className="font-semibold">{t("search.filters")}</h3>
            </div>

            <FilterGroup title="Stops">
              {[
                { k: "0",  l: "Non-stop" },
                { k: "1",  l: "1 Stop"   },
                { k: "2+", l: "2+ Stops" },
              ].map((row) => (
                <Checkbox
                  key={row.k}
                  label={row.l}
                  checked={stopsFilter.has(row.k)}
                  onChange={(v) => {
                    const n = new Set(stopsFilter);
                    if (v) n.add(row.k); else n.delete(row.k);
                    setStopsFilter(n);
                  }}
                />
              ))}
            </FilterGroup>

            <FilterGroup title={`Departure: ${minsToTime(departureRange[0])} – ${minsToTime(departureRange[1])}`}>
              <input
                type="range"
                min={0}
                max={1440}
                step={30}
                value={departureRange[1]}
                onChange={(e) =>
                  setDepartureRange([departureRange[0], parseInt(e.target.value)])
                }
                className="w-full accent-saffron"
              />
            </FilterGroup>

            <FilterGroup title={`${t("search.price")}: ${formatPrice(priceRange[0])} – ${formatPrice(priceRange[1])}`}>
              <input
                type="range"
                min={200}
                max={1500}
                value={priceRange[1]}
                onChange={(e) =>
                  setPriceRange([priceRange[0], parseInt(e.target.value)])
                }
                className="w-full accent-saffron"
              />
            </FilterGroup>

            <FilterGroup title={t("search.busType")}>
              {[
                { k: "Volvo",        l: t("search.busTypeVolvo")   },
                { k: "AC Sleeper",   l: t("search.busTypeAcSleeper")},
                { k: "AC Seater",    l: t("search.busTypeAcSeater") },
                { k: "Non-AC",       l: t("search.busTypeNonAc")    },
                { k: "Electric",     l: "Electric"                  },
              ].map((row) => (
                <Checkbox
                  key={row.k}
                  label={row.l}
                  checked={busTypeFilters.has(row.k)}
                  onChange={(v) => {
                    const n = new Set(busTypeFilters);
                    if (v) n.add(row.k);
                    else n.delete(row.k);
                    setBusTypeFilters(n);
                  }}
                />
              ))}
            </FilterGroup>

            <FilterGroup title="Amenities">
              {[
                { k: "wifi", label: "WiFi" },
                { k: "usb", label: "USB Charging" },
                { k: "blanket", label: "Blanket" },
                { k: "meals", label: "Meals" },
                { k: "tracking", label: "Live Tracking" },
              ].map((a) => (
                <Checkbox
                  key={a.k}
                  label={a.label}
                  checked={amenityFilters.has(a.k)}
                  onChange={(v) => {
                    const n = new Set(amenityFilters);
                    if (v) n.add(a.k);
                    else n.delete(a.k);
                    setAmenityFilters(n);
                  }}
                />
              ))}
            </FilterGroup>

            {operatorsInResults.length > 0 && (
              <FilterGroup title={t("search.operators")}>
                {operatorsInResults.map((o) => (
                  <Checkbox
                    key={o.id}
                    label={o.name}
                    checked={operatorFilters.has(o.id)}
                    onChange={(v) => {
                      const n = new Set(operatorFilters);
                      if (v) n.add(o.id);
                      else n.delete(o.id);
                      setOperatorFilters(n);
                    }}
                  />
                ))}
              </FilterGroup>
            )}
          </aside>

          {/* RESULTS */}
          <section>
            {/* Sort tabs */}
            <div className="flex items-center gap-1 mb-3 overflow-x-auto pb-1">
              {[
                { k: "best",      l: t("search.best")      },
                { k: "cheapest",  l: t("search.cheapest")  },
                { k: "fastest",   l: t("search.fastest")   },
              ].map((row) => (
                <button
                  key={row.k}
                  onClick={() => setSortBy(row.k as any)}
                  className={`px-4 py-2 rounded-md text-sm whitespace-nowrap transition-all ${
                    sortBy === row.k
                      ? "bg-saffron/10 text-saffron border border-saffron/30"
                      : "bg-bg-surface text-text-secondary border border-border hover:border-border-hover"
                  }`}
                >
                  <span className="font-medium">{row.l}</span>{" "}
                  <span className="text-xs">{formatPrice(minPrice || 0)}</span>
                </button>
              ))}
            </div>

            {loading ? (
              <div className="space-y-3">
                <p className="text-sm text-text-muted px-1 animate-pulse">{loadingMsg}</p>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="card p-5">
                    <div className="h-5 w-32 skeleton rounded mb-3" />
                    <div className="h-8 w-full skeleton rounded" />
                  </div>
                ))}
              </div>
            ) : sorted.length === 0 ? (
              <div className="card p-10 text-center">
                <div className="text-4xl mb-2">🚌</div>
                <h3 className="font-semibold text-lg mb-1">{t("search.noBuses")}</h3>
                <p className="text-sm text-text-muted">
                  {t("search.noBusesSub")}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {sorted.map((s, i) => (
                  <ScheduleCard key={s.id} schedule={s} index={i} />
                ))}
              </div>
            )}
          </section>

          {/* PRICE TREND SIDEBAR */}
          <aside className="space-y-4 lg:sticky lg:top-20 h-fit">
            <div className="card p-5">
              <h3 className="font-semibold mb-1">{t("search.priceTrend")}</h3>
              <p className="text-xs text-text-muted mb-3">{t("search.next6Months")}</p>
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={priceTrend}>
                    <XAxis dataKey="month" stroke="#6B7280" style={{ fontSize: 10 }} />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{
                        background: "#1A2235",
                        border: "1px solid #1F2937",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke="#00D4AA"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card p-5 border-teal/30 bg-teal/5">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-teal" />
                <span className="chip bg-teal/10 text-teal border border-teal/20">
                  AI Insight
                </span>
              </div>
              <h3 className="font-semibold mb-1">{t("search.aiInsightTitle")}</h3>
              <p className="text-sm text-text-secondary">
                {t("search.aiInsightBody")}
              </p>
            </div>

            <div className="card p-5 border-warning/30 bg-warning/5">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-warning" />
                <span className="chip bg-warning/10 text-warning border border-warning/20">
                  Price Alert
                </span>
              </div>
              <h3 className="font-semibold mb-1">{t("search.priceAlertTitle")}</h3>
              <p className="text-sm text-text-secondary">
                {t("search.priceAlertBody")}
              </p>
            </div>
          </aside>
        </div>
      </main>
      <MobileNav />
    </>
  );
}

function minsToTime(mins: number): string {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <div className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
        {title}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-saffron"
      />
      <span className="text-text-secondary">{label}</span>
    </label>
  );
}

function ScheduleCard({ schedule: s, index }: { schedule: Schedule; index: number }) {
  const t = useT();
  const router = useRouter();
  const { format: formatPrice } = useCurrency();
  const amenities = (s.bus?.amenities || "").split(",");
  const stopsLabel = s.stops === 0 ? t("search.nonStop") : t("search.stops", s.stops);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.06, 0.5) }}
      className="card card-hover p-4 md:p-5"
    >
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex items-center gap-3 md:w-48">
          <div className="w-10 h-10 rounded-md bg-bg-elevated flex items-center justify-center font-display font-bold text-saffron">
            {s.operator?.name?.charAt(0) || "?"}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-sm truncate">{s.operator?.name}</div>
            <div className="flex items-center gap-1 text-xs text-text-muted">
              <Star className="w-3 h-3 fill-saffron text-saffron" />
              {(s.bus?.rating || 4.3).toFixed(1)} ·{" "}
              {s.bus?.total_reviews || 1200} reviews
            </div>
          </div>
        </div>

        <div className="flex-1">
          <div className="text-xs text-text-muted mb-1 truncate">{s.bus?.bus_type}</div>
          <div className="flex items-center gap-3">
            <div className="text-center">
              <div className="font-display text-xl font-bold">
                {formatTime(s.departure_at)}
              </div>
              <div className="text-xs text-text-muted">{s.route?.from_city?.code}</div>
            </div>
            <div className="flex-1 flex flex-col items-center">
              <div className="text-xs text-text-muted">
                {formatDuration(s.duration_min)}
              </div>
              <div className="w-full h-px bg-border relative my-1">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-teal" />
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-saffron" />
              </div>
              <div className="text-[10px] text-text-muted">{stopsLabel}</div>
            </div>
            <div className="text-center">
              <div className="font-display text-xl font-bold">
                {formatTime(s.arrival_at)}
              </div>
              <div className="text-xs text-text-muted">{s.route?.to_city?.code}</div>
            </div>
          </div>
        </div>

        <div className="flex flex-row md:flex-col items-end justify-between gap-2 md:w-32">
          <div className="text-right">
            <div className="text-xs text-text-muted flex items-center gap-1 justify-end">
              <Users className="w-3 h-3" />
              {s.seats_available} {t("search.seatsAvailable")}
            </div>
            <div className="font-display text-2xl font-bold text-saffron">
              {formatPrice(s.base_fare)}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-border flex flex-wrap items-center gap-2">
        {amenities.slice(0, 5).map((a) => (
          <span key={a} className="chip bg-bg-elevated text-text-secondary border border-border">
            {a === "wifi" && <Wifi className="w-3 h-3" />}
            {a === "usb" && <Usb className="w-3 h-3" />}
            {a === "meals" && <Coffee className="w-3 h-3" />}
            {a === "tracking" && <MapPin className="w-3 h-3" />}
            {a}
          </span>
        ))}
        {s.operator?.is_electric && (
          <span className="chip bg-teal/10 text-teal border border-teal/20">
            <Zap className="w-3 h-3" />
            Electric
          </span>
        )}
        {s.operator?.is_government && (
          <span className="chip bg-saffron/10 text-saffron border border-saffron/20">
            Government
          </span>
        )}
        <button
          onClick={() => {
            sessionStorage.setItem(`schedule_${s.id}`, JSON.stringify(s));
            router.push(`/bus/${s.id}`);
          }}
          className="ml-auto btn-primary text-sm"
        >
          {t("search.viewSeats")}
        </button>
      </div>
    </motion.div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-8 text-text-muted">Loading…</div>}>
      <SearchResultsInner />
    </Suspense>
  );
}
