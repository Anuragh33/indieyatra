"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { MobileNav } from "@/components/MobileNav";
import { apiPost, apiGet } from "@/lib/api";
import { useCurrency } from "@/lib/currency";
import {
  Plane, Train, Bus, ArrowRight, Zap, Clock, Star,
  Leaf, AlertTriangle, CheckCircle2, Moon, Users,
  ChevronDown, ChevronUp,
} from "lucide-react";

type RouteLeg = {
  vertical: string;
  operator: string;
  flight_number?: string;
  from: string; from_code: string;
  to: string; to_code: string;
  departure_time: string; arrival_time: string;
  duration_min: number;
  fare: number;
  layover_min: number;
  layover_note?: string;
  is_overnight: boolean;
};

type RouteOption = {
  label: string; tag: string;
  legs: RouteLeg[];
  total_duration_min: number;
  total_fare: number;
  comfort_score: number;
  co2_kg: number;
  warnings: string[];
};

type OptimizeResult = {
  options: RouteOption[];
  from: string; to: string; date: string;
  travelers: number; optimize_for: string;
  message?: string;
};

const VERTICAL_ICON: Record<string, React.ElementType> = {
  flight: Plane,
  train: Train,
  bus: Bus,
};

const VERTICAL_COLOR: Record<string, string> = {
  flight: "#06B6D4",
  train:  "#4F46E5",
  bus:    "#FF6B1A",
};

function dur(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h ${m > 0 ? `${m}m` : ""}`.trim() : `${m}m`;
}

function RouteCard({ opt, fmt, index }: { opt: RouteOption; fmt: (n: number) => string; index: number }) {
  const [expanded, setExpanded] = useState(index === 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`card overflow-hidden ${index === 0 ? "border-purple/40 ring-1 ring-purple/20" : ""}`}
    >
      {index === 0 && (
        <div className="px-5 py-2 bg-purple/10 border-b border-purple/20 text-xs font-semibold text-purple flex items-center gap-1.5">
          <Star className="w-3 h-3" /> Best Match
        </div>
      )}

      {/* Summary row */}
      <button
        className="w-full px-5 py-4 flex items-center gap-4 hover:bg-bg-elevated/50 transition-colors text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1 min-w-0">
          <div className="text-xs text-text-muted mb-0.5">{opt.label}</div>
          <div className="font-semibold flex items-center gap-2 flex-wrap">
            {opt.legs.map((l, i) => {
              const Icon = VERTICAL_ICON[l.vertical] ?? Bus;
              return (
                <span key={i} className="flex items-center gap-1 text-sm" style={{ color: VERTICAL_COLOR[l.vertical] }}>
                  <Icon className="w-3.5 h-3.5" /> {l.from} → {l.to}
                  {i < opt.legs.length - 1 && <ArrowRight className="w-3 h-3 text-text-muted ml-1" />}
                </span>
              );
            })}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="font-display text-xl font-bold text-purple">{fmt(opt.total_fare)}</div>
          <div className="text-xs text-text-muted">{dur(opt.total_duration_min)}</div>
        </div>
        <div className="flex flex-col items-center gap-0.5 ml-2 shrink-0">
          <div className="flex">
            {Array.from({ length: 5 }).map((_, j) => (
              <Star key={j} className={`w-2.5 h-2.5 ${j < opt.comfort_score ? "text-hotel fill-hotel" : "text-border"}`} />
            ))}
          </div>
          <div className="text-[9px] text-text-muted flex items-center gap-0.5">
            <Leaf className="w-2.5 h-2.5 text-teal" /> {opt.co2_kg}kg CO₂
          </div>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-text-muted shrink-0" /> : <ChevronDown className="w-4 h-4 text-text-muted shrink-0" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-3">
              {/* Legs */}
              {opt.legs.map((leg, i) => {
                const Icon = VERTICAL_ICON[leg.vertical] ?? Bus;
                const color = VERTICAL_COLOR[leg.vertical];
                return (
                  <div key={i}>
                    <div className="flex items-center gap-3 p-3 bg-bg-elevated rounded-xl">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
                        <Icon className="w-4 h-4" style={{ color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">
                          {leg.operator}{leg.flight_number ? ` ${leg.flight_number}` : ""}
                        </div>
                        <div className="text-xs text-text-muted">
                          {leg.from} ({leg.from_code}) → {leg.to} ({leg.to_code})
                          {leg.departure_time && leg.departure_time !== "—" && ` · ${leg.departure_time}`}
                          {leg.arrival_time && leg.arrival_time !== "—" && ` → ${leg.arrival_time}`}
                          {" · "}{dur(leg.duration_min)}
                        </div>
                        {leg.is_overnight && (
                          <div className="flex items-center gap-1 text-[10px] text-purple mt-0.5">
                            <Moon className="w-2.5 h-2.5" /> Overnight
                          </div>
                        )}
                      </div>
                      <div className="text-sm font-bold shrink-0" style={{ color }}>{fmt(leg.fare)}</div>
                    </div>

                    {/* Layover */}
                    {leg.layover_min > 0 && i < opt.legs.length - 1 && (
                      <div className={`flex items-center gap-2 px-4 py-2 text-xs rounded-lg my-1 ${
                        leg.layover_min < 90 ? "bg-warning/10 text-warning" : "bg-teal/10 text-teal"
                      }`}>
                        <Clock className="w-3 h-3" />
                        {dur(leg.layover_min)} wait at {leg.to}
                        {leg.layover_note && ` — ${leg.layover_note}`}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Warnings */}
              {opt.warnings && opt.warnings.length > 0 && (
                <div className="space-y-1.5">
                  {opt.warnings.map((w, i) => (
                    <div key={i} className={`flex items-start gap-2 text-xs p-2.5 rounded-lg ${
                      w.startsWith("Overnight") ? "bg-purple/10 text-purple" :
                      w.includes("tight") ? "bg-warning/10 text-warning" :
                      "bg-teal/10 text-teal"
                    }`}>
                      {w.includes("tight") ? <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> :
                       w.startsWith("Overnight") ? <Moon className="w-3.5 h-3.5 shrink-0 mt-0.5" /> :
                       <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />}
                      {w}
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <Link href="/planner" className="btn-primary text-sm flex items-center gap-2">
                  Book All Legs <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <button className="btn-secondary text-sm">Book Individually</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function OptimizePage() {
  const { format: fmt } = useCurrency();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState(() => new Date(Date.now() + 86400000).toISOString().slice(0, 10));
  const [travelers, setTravelers] = useState(1);
  const [optimizeFor, setOptimizeFor] = useState<"cheapest" | "fastest" | "comfortable">("cheapest");
  const [result, setResult] = useState<OptimizeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    if (!from || !to) { setError("Enter both origin and destination"); return; }
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const data = await apiPost<OptimizeResult>("/api/optimize/routes", { from, to, date, travelers, optimize_for: optimizeFor });
      setResult(data);
    } catch {
      setError("Could not find routes. Try different cities.");
    } finally {
      setLoading(false);
    }
  };

  const CRITERIA = [
    { key: "cheapest"   as const, icon: "₹", label: "Cheapest" },
    { key: "fastest"    as const, icon: "⚡", label: "Fastest" },
    { key: "comfortable" as const, icon: "⭐", label: "Comfortable" },
  ];

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 md:px-6 py-8 pb-24 md:pb-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-purple" />
            <span className="text-xs font-bold tracking-widest uppercase text-purple">Trip Optimizer</span>
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
            Find the <span className="text-purple">smartest route</span>
          </h1>
          <p className="text-text-secondary">
            Combines buses, trains and flights to get you there optimally.
          </p>
        </motion.div>

        {/* Search form */}
        <div className="card p-5 mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-text-muted uppercase tracking-wider mb-1.5 block">From</label>
              <input
                className="input w-full"
                placeholder="e.g. Bangalore, Mumbai, Delhi"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-text-muted uppercase tracking-wider mb-1.5 block">To</label>
              <input
                className="input w-full"
                placeholder="e.g. Leh, Goa, Jaipur"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-text-muted uppercase tracking-wider mb-1.5 block">Date</label>
              <input
                type="date"
                className="input w-full"
                value={date}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-text-muted uppercase tracking-wider mb-1.5 block">Travelers</label>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-text-muted" />
                <input
                  type="number" min={1} max={6} className="input flex-1"
                  value={travelers}
                  onChange={(e) => setTravelers(Math.max(1, Math.min(6, Number(e.target.value))))}
                />
              </div>
            </div>
          </div>

          {/* Optimize for selector */}
          <div>
            <label className="text-xs text-text-muted uppercase tracking-wider mb-2 block">Optimize for</label>
            <div className="flex gap-2 flex-wrap">
              {CRITERIA.map((c) => (
                <button
                  key={c.key}
                  onClick={() => setOptimizeFor(c.key)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                    optimizeFor === c.key
                      ? "bg-purple/10 border-purple/40 text-purple"
                      : "border-border text-text-secondary hover:border-purple/30"
                  }`}
                >
                  <span>{c.icon}</span> {c.label}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <button
            onClick={handleSearch}
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Finding best routes...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" /> Find Best Routes
              </>
            )}
          </button>
        </div>

        {/* Results */}
        {result && (
          <div>
            {result.message ? (
              <div className="card p-8 text-center">
                <p className="text-text-muted">{result.message}</p>
              </div>
            ) : (
              <>
                {/* Comparison bar */}
                <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
                  {result.options.map((opt, i) => (
                    <div
                      key={i}
                      className={`shrink-0 px-3 py-2 rounded-xl border text-xs ${
                        i === 0 ? "bg-purple/10 border-purple/30 text-purple" : "bg-bg-elevated border-border text-text-secondary"
                      }`}
                    >
                      <span className="font-semibold">{fmt(opt.total_fare)}</span>
                      {" · "}{dur(opt.total_duration_min)}
                      {" · "}{"⭐".repeat(opt.comfort_score)}
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  {result.options.map((opt, i) => (
                    <RouteCard key={i} opt={opt} fmt={fmt} index={i} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Popular combinations */}
        {!result && !loading && (
          <PopularCombinations onSelect={(f, t) => { setFrom(f); setTo(t); }} />
        )}
      </main>
      <MobileNav />
    </>
  );
}

function PopularCombinations({ onSelect }: { onSelect: (from: string, to: string) => void }) {
  const [combos, setCombos] = useState<any[]>([]);

  useState(() => {
    apiGet<any[]>("/api/optimize/popular-combinations").then(setCombos).catch(() => {});
  });

  if (combos.length === 0) return null;

  return (
    <div>
      <h3 className="font-semibold text-sm text-text-muted uppercase tracking-wider mb-3">Popular Routes</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {combos.map((c, i) => (
          <button
            key={i}
            onClick={() => onSelect(c.from, c.to)}
            className="card p-3 text-left hover:border-purple/30 transition-colors flex items-center gap-3"
          >
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">{c.from} → {c.to}</div>
              <div className="text-xs text-text-muted">{c.tag}</div>
            </div>
            <div className="text-xs text-teal font-semibold shrink-0">Save {c.savings}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
