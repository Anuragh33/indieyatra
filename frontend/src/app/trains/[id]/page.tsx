"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Train, ArrowLeft, Clock, Zap, Coffee, MapPin,
  ChevronRight, Info, ChevronDown, ChevronUp,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { MobileNav } from "@/components/MobileNav";
import { api } from "@/lib/api";

interface Station {
  code: string;
  name: string;
  city: string;
  state: string;
  zone: string;
}
interface TrainModel {
  number: string;
  name: string;
  train_type: string;
  is_superfast: boolean;
  has_pantry: boolean;
  runs_on: string;
  classes: string;
}
interface TrainSchedule {
  id: string;
  train_id: string;
  train: TrainModel;
  from_station: Station;
  to_station: Station;
  journey_date: string;
  departure_time: string;
  arrival_time: string;
  arrival_day: number;
  duration_min: number;
}
interface RouteStop {
  stop_number: number;
  station: Station;
  arrival_time: string;
  departure_time: string;
  halt_min: number;
  distance_km: number;
  day_number: number;
  platform: string;
}
interface ClassAvail {
  class: string;
  total_berths: number;
  available: number;
  rac: number;
  waitlist_count: number;
  base_fare: number;
  tatkal_fare: number;
  status: "AVAILABLE" | "RAC" | "WL" | "REGRET";
}
interface DetailResponse {
  schedule: TrainSchedule;
  stops: RouteStop[];
  classes: ClassAvail[];
}

const typeColors: Record<string, string> = {
  "Rajdhani":    "bg-purple/10 text-purple border-purple/20",
  "Shatabdi":    "bg-teal/10 text-teal border-teal/20",
  "Vande Bharat":"bg-train/10 text-train border-train/20",
  "Duronto":     "bg-saffron/10 text-saffron border-saffron/20",
  "Garib Rath":  "bg-success/10 text-success border-success/20",
  "Superfast":   "bg-flight/10 text-flight border-flight/20",
};

const statusColor: Record<string, string> = {
  AVAILABLE: "text-success",
  RAC:       "text-warning",
  WL:        "text-saffron",
  REGRET:    "text-text-muted",
};

function durationStr(min: number) {
  return `${Math.floor(min / 60)}h ${String(min % 60).padStart(2, "0")}m`;
}

function classReservationFee(cls: string): number {
  const fees: Record<string, number> = {
    "1A": 60, "2A": 50, "3A": 40, "SL": 20, "CC": 30, "EC": 60, "2S": 15,
  };
  return fees[cls] ?? 40;
}

// ── Coach Layout Visual ───────────────────────────────────────
function CoachLayout({ classes }: { classes: ClassAvail[] }) {
  const [activeClass, setActiveClass] = useState(classes[0]?.class ?? "");
  const cls = classes.find(c => c.class === activeClass);

  if (!cls) return <p className="text-text-muted text-sm">No class data available.</p>;

  const berths = cls.total_berths;
  const booked = berths - cls.available;
  const coachSize = activeClass === "SL" || activeClass === "3A" ? 72 : activeClass === "2A" ? 48 : 24;
  const coaches = Math.ceil(berths / coachSize);
  const coachPrefix = activeClass === "SL" ? "S" : activeClass === "3A" ? "B" : activeClass === "2A" ? "A" : "H";
  const berthTypes = activeClass === "SL" || activeClass === "3A"
    ? ["LB", "MB", "UB", "SL", "SU"]
    : activeClass === "2A"
    ? ["LB", "UB", "SL", "SU"]
    : ["LB", "UB"];
  const berthsPerComp = berthTypes.length;

  return (
    <div>
      {/* Class selector */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {classes.map(c => (
          <button
            key={c.class}
            onClick={() => setActiveClass(c.class)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-all ${
              activeClass === c.class
                ? "bg-train/10 text-train border-train/30"
                : "border-border text-text-secondary hover:border-border-hover"
            }`}
          >
            {c.class}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 text-xs text-text-secondary flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-train/20 border border-train/30" /> Available
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-danger/20 border border-danger/30" /> Booked
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-success/20 border border-success/30" /> Ladies
        </div>
      </div>

      {/* Coach grid */}
      <div className="flex flex-wrap gap-4">
        {Array.from({ length: Math.min(coaches, 6) }, (_, ci) => {
          const comps = Math.ceil(coachSize / berthsPerComp);
          const offset = ci * coachSize;
          return (
            <div key={ci} className="border border-border rounded-lg p-3 bg-bg-elevated">
              <div className="text-xs font-bold text-text-secondary mb-2 font-mono">{coachPrefix}{ci + 1}</div>
              <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${berthsPerComp}, 1fr)` }}>
                {Array.from({ length: Math.min(comps * berthsPerComp, coachSize) }, (_, bi) => {
                  const absIdx = offset + bi;
                  const isBooked = absIdx < booked;
                  const isLadies = absIdx >= Math.floor(coachSize * 0.9) && !isBooked;
                  return (
                    <div
                      key={bi}
                      title={`${coachPrefix}${ci + 1} · ${berthTypes[bi % berthsPerComp]} ${Math.floor(bi / berthsPerComp) + 1}`}
                      className={`w-5 h-5 rounded-sm text-[7px] flex items-center justify-center cursor-default transition-colors ${
                        isBooked
                          ? "bg-danger/25 border border-danger/30 text-danger"
                          : isLadies
                          ? "bg-success/25 border border-success/30 text-success"
                          : "bg-train/20 border border-train/30 text-train hover:bg-train/40"
                      }`}
                    >
                      {berthTypes[bi % berthsPerComp]}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-xs text-text-muted">
        Showing first {Math.min(coaches, 6)} coaches of {coachPrefix} class · LB=Lower, MB=Middle, UB=Upper, SL=Side Lower, SU=Side Upper
      </p>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function TrainDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [data, setData] = useState<DetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"stations" | "coach" | "fare">("stations");
  const [showAllStops, setShowAllStops] = useState(false);
  const [selClass, setSelClass] = useState<string | null>(null);

  useEffect(() => {
    api<DetailResponse>(`/api/trains/schedule/${params.id}`)
      .then(d => {
        setData(d);
        const avail = d.classes.find(c => c.status === "AVAILABLE") ?? d.classes[0];
        if (avail) setSelClass(avail.class);
      })
      .catch(() => setLoading(false))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 py-8 space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="skeleton h-20 rounded-lg" />)}
        </main>
      </>
    );
  }

  if (!data) {
    return (
      <>
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 py-8 text-center">
          <Train className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <h1 className="font-display text-xl font-bold mb-2">Schedule not found</h1>
          <button onClick={() => router.back()} className="btn-secondary mt-4 inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Go Back
          </button>
        </main>
      </>
    );
  }

  const { schedule, stops, classes } = data;
  const t = schedule.train;
  const dayBadge = schedule.arrival_day > 1 ? `+${schedule.arrival_day - 1}` : "";
  const sc = classes.find(c => c.class === selClass);

  // Fare breakdown
  const reservFee = classReservationFee(selClass ?? "3A");
  const superfastFee = t.is_superfast ? 45 : 0;
  const gst = Math.round(((sc?.base_fare ?? 0) + reservFee + superfastFee) * 0.05);
  const total = (sc?.base_fare ?? 0) + reservFee + superfastFee + gst + 15; // +15 IRCTC fee

  const journeyDate = new Date(schedule.journey_date).toLocaleDateString("en-IN", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-6 pb-28 md:pb-8">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary mb-5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to search results
        </button>

        {/* Train header */}
        <div className="card p-5 mb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="font-mono text-sm text-text-muted">{t.number}</span>
                <span className={`chip text-[10px] border ${typeColors[t.train_type] || "bg-bg-elevated border-border text-text-secondary"}`}>
                  {t.train_type}
                </span>
                {t.is_superfast && <span title="Superfast"><Zap className="w-3.5 h-3.5 text-saffron" /></span>}
                {t.has_pantry && <span title="Pantry car"><Coffee className="w-3.5 h-3.5 text-teal" /></span>}
              </div>
              <h1 className="font-display text-xl font-bold mb-0.5">{t.name}</h1>
              <p className="text-xs text-text-muted">Runs: {t.runs_on}</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold font-mono">{schedule.departure_time}</div>
                <div className="text-xs font-semibold text-train">{schedule.from_station.code}</div>
                <div className="text-[10px] text-text-muted">{schedule.from_station.city}</div>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="text-xs text-text-muted">{durationStr(schedule.duration_min)}</div>
                <div className="flex items-center gap-1">
                  <div className="h-px w-8 bg-border" />
                  <Train className="w-4 h-4 text-train" />
                  <div className="h-px w-8 bg-border" />
                </div>
                <div className="text-[10px] text-text-muted">{journeyDate}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold font-mono">
                  {schedule.arrival_time}
                  {dayBadge && <span className="text-sm text-warning ml-0.5">{dayBadge}</span>}
                </div>
                <div className="text-xs font-semibold text-train">{schedule.to_station.code}</div>
                <div className="text-[10px] text-text-muted">{schedule.to_station.city}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-border mb-5">
          {(["stations", "coach", "fare"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px ${
                tab === t
                  ? "border-train text-train"
                  : "border-transparent text-text-secondary hover:text-text-primary"
              }`}
            >
              {t === "stations" ? "Stations" : t === "coach" ? "Coach Layout" : "Fare"}
            </button>
          ))}
        </div>

        {/* Tab: Stations */}
        {tab === "stations" && (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-bg-elevated border-b border-border">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs text-text-muted font-semibold">#</th>
                    <th className="text-left px-4 py-3 text-xs text-text-muted font-semibold">Station</th>
                    <th className="text-center px-3 py-3 text-xs text-text-muted font-semibold">Arrival</th>
                    <th className="text-center px-3 py-3 text-xs text-text-muted font-semibold">Departure</th>
                    <th className="text-center px-3 py-3 text-xs text-text-muted font-semibold">Halt</th>
                    <th className="text-right px-4 py-3 text-xs text-text-muted font-semibold">Distance</th>
                    <th className="text-center px-3 py-3 text-xs text-text-muted font-semibold">Day</th>
                    <th className="text-center px-3 py-3 text-xs text-text-muted font-semibold">Platform</th>
                  </tr>
                </thead>
                <tbody>
                  {(showAllStops ? stops : stops.slice(0, 5)).map((s, i) => {
                    const isOrigin = s.arrival_time === "--";
                    const isTerm = s.departure_time === "--";
                    return (
                      <tr
                        key={i}
                        className={`border-b border-border last:border-0 ${
                          isOrigin || isTerm ? "bg-train/5" : ""
                        }`}
                      >
                        <td className="px-4 py-3 text-text-muted text-xs">{s.stop_number}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {(isOrigin || isTerm) && (
                              <MapPin className="w-3.5 h-3.5 text-train shrink-0" />
                            )}
                            <div>
                              <div className="font-semibold text-sm">{s.station.name}</div>
                              <div className="text-[10px] text-text-muted font-mono">{s.station.code} · {s.station.zone}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-center font-mono text-sm">
                          {isOrigin ? <span className="text-text-muted">–</span> : s.arrival_time}
                        </td>
                        <td className="px-3 py-3 text-center font-mono text-sm">
                          {isTerm ? <span className="text-text-muted">–</span> : s.departure_time}
                        </td>
                        <td className="px-3 py-3 text-center text-xs text-text-muted">
                          {s.halt_min > 0 ? `${s.halt_min}m` : "–"}
                        </td>
                        <td className="px-4 py-3 text-right text-xs text-text-muted font-mono">
                          {s.distance_km > 0 ? `${s.distance_km} km` : "–"}
                        </td>
                        <td className="px-3 py-3 text-center text-xs text-text-muted">
                          {s.day_number > 1 ? `Day ${s.day_number}` : "Day 1"}
                        </td>
                        <td className="px-3 py-3 text-center text-xs font-semibold text-text-primary">
                          {s.platform || "–"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {stops.length > 5 && (
              <button
                onClick={() => setShowAllStops(v => !v)}
                className="w-full py-3 flex items-center justify-center gap-2 text-sm text-train hover:bg-train/5 transition-colors border-t border-border"
              >
                {showAllStops ? (
                  <><ChevronUp className="w-4 h-4" /> Show less</>
                ) : (
                  <><ChevronDown className="w-4 h-4" /> View all {stops.length} stations</>
                )}
              </button>
            )}
          </div>
        )}

        {/* Tab: Coach Layout */}
        {tab === "coach" && (
          <div className="card p-5">
            <CoachLayout classes={classes} />
          </div>
        )}

        {/* Tab: Fare */}
        {tab === "fare" && (
          <div className="space-y-4">
            {/* Class selector */}
            <div className="flex flex-wrap gap-2">
              {classes.map(c => (
                <button
                  key={c.class}
                  onClick={() => setSelClass(c.class)}
                  disabled={c.status === "REGRET"}
                  className={`px-4 py-2 rounded-md text-sm font-medium border transition-all disabled:opacity-40 ${
                    selClass === c.class
                      ? "bg-train/10 text-train border-train/30"
                      : "border-border text-text-secondary hover:border-border-hover"
                  }`}
                >
                  <span className="font-mono font-bold">{c.class}</span>
                  <span className={`ml-2 text-xs ${statusColor[c.status] || ""}`}>
                    {c.status === "AVAILABLE"
                      ? `${c.available} AVL`
                      : c.status === "RAC"
                      ? `RAC ${c.rac}`
                      : c.status === "WL"
                      ? `WL ${c.waitlist_count}`
                      : "Regret"}
                  </span>
                </button>
              ))}
            </div>

            {sc && (
              <div className="card p-5 space-y-3">
                <h3 className="font-semibold text-sm text-text-secondary uppercase tracking-wide">
                  Fare Breakdown — {selClass} Class
                </h3>
                <div className="space-y-2 text-sm">
                  {[
                    { label: "Base Fare", amt: sc.base_fare },
                    { label: "Reservation Fee", amt: reservFee },
                    { label: "Superfast Charge", amt: superfastFee },
                    { label: "IRCTC Service Fee", amt: 15 },
                    { label: `GST (5%)`, amt: gst },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between text-text-secondary">
                      <span>{row.label}</span>
                      <span className="font-mono">₹{row.amt}</span>
                    </div>
                  ))}
                  <div className="border-t border-border pt-2 flex items-center justify-between font-bold text-text-primary">
                    <span>Total per person</span>
                    <span className="text-train text-lg font-mono">₹{total}</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-border">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-text-secondary">Tatkal fare</span>
                    <span className="font-mono font-semibold text-saffron">₹{sc.tatkal_fare}</span>
                  </div>
                  <p className="text-xs text-text-muted flex items-start gap-1">
                    <Info className="w-3 h-3 mt-0.5 shrink-0" />
                    Tatkal quota opens 1 day before departure. Charges are higher and non-refundable.
                  </p>
                </div>
              </div>
            )}

            {/* All classes comparison */}
            <div className="card overflow-hidden">
              <div className="px-5 py-3 border-b border-border bg-bg-elevated">
                <h3 className="font-semibold text-sm">All Classes Comparison</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border">
                    <tr>
                      <th className="text-left px-5 py-3 text-xs text-text-muted font-semibold">Class</th>
                      <th className="text-center px-4 py-3 text-xs text-text-muted font-semibold">Availability</th>
                      <th className="text-right px-4 py-3 text-xs text-text-muted font-semibold">Base Fare</th>
                      <th className="text-right px-4 py-3 text-xs text-text-muted font-semibold">Tatkal</th>
                      <th className="text-right px-5 py-3 text-xs text-text-muted font-semibold">Total (est.)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classes.map(c => {
                      const rf = classReservationFee(c.class);
                      const sf = t.is_superfast ? 45 : 0;
                      const g = Math.round((c.base_fare + rf + sf) * 0.05);
                      const tot = c.base_fare + rf + sf + g + 15;
                      return (
                        <tr key={c.class} className="border-b border-border last:border-0 hover:bg-bg-elevated/50 transition-colors">
                          <td className="px-5 py-3 font-bold font-mono">{c.class}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`text-xs font-medium ${statusColor[c.status] || ""}`}>
                              {c.status === "AVAILABLE"
                                ? `${c.available} Available`
                                : c.status === "RAC"
                                ? `RAC ${c.rac}`
                                : c.status === "WL"
                                ? `WL ${c.waitlist_count}`
                                : "Regret"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-mono">₹{c.base_fare}</td>
                          <td className="px-4 py-3 text-right font-mono text-saffron">₹{c.tatkal_fare}</td>
                          <td className="px-5 py-3 text-right font-bold font-mono text-train">₹{tot}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Book CTA */}
        <div className="fixed bottom-16 md:bottom-0 left-0 right-0 bg-bg-surface border-t border-border p-4 md:relative md:bg-transparent md:border-0 md:mt-6 md:p-0">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
            <div>
              {sc && (
                <>
                  <div className="text-xs text-text-muted">{selClass} Class · per person</div>
                  <div className="text-2xl font-bold text-train font-mono">₹{total}</div>
                </>
              )}
            </div>
            <button
              onClick={() => router.push(`/checkout/train/${params.id}?class=${selClass}`)}
              className="flex items-center gap-2 text-white font-semibold px-6 py-3 rounded-md transition-all active:scale-95 hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)" }}
            >
              Continue to Booking
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </main>
      <MobileNav />
    </>
  );
}
