"use client";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { MobileNav } from "@/components/MobileNav";
import { SkeletonTripCard } from "@/components/Skeleton";
import { apiGet } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useCurrency } from "@/lib/currency";
import {
  Bus, Train, Plane, Building2, ArrowRight, Calendar, Sparkles,
  CheckCircle2, Clock, XCircle, AlertCircle, Timer,
} from "lucide-react";

type UnifiedTrip = {
  id: string;
  vertical: "bus" | "train" | "flight" | "hotel";
  booking_ref: string;
  status: string;
  total_amount: number;
  from_name: string;
  to_name: string;
  travel_date: string;
  description: string;
  created_at: string;
};

const VERTICAL_META = {
  bus:    { icon: Bus,       color: "text-saffron", bg: "bg-saffron/10", border: "border-saffron/20", label: "Bus" },
  train:  { icon: Train,     color: "text-train",   bg: "bg-train/10",   border: "border-train/20",   label: "Train" },
  flight: { icon: Plane,     color: "text-flight",  bg: "bg-flight/10",  border: "border-flight/20",  label: "Flight" },
  hotel:  { icon: Building2, color: "text-hotel",   bg: "bg-hotel/10",   border: "border-hotel/20",   label: "Hotel" },
};

const STATUS_META: Record<string, { icon: typeof CheckCircle2; cls: string; label: string }> = {
  confirmed:   { icon: CheckCircle2, cls: "text-teal",    label: "Confirmed" },
  pending:     { icon: Clock,        cls: "text-warning", label: "Pending" },
  completed:   { icon: CheckCircle2, cls: "text-purple",  label: "Completed" },
  cancelled:   { icon: XCircle,      cls: "text-danger",  label: "Cancelled" },
  checked_in:  { icon: CheckCircle2, cls: "text-teal",    label: "Checked In" },
  checked_out: { icon: CheckCircle2, cls: "text-purple",  label: "Checked Out" },
};

type TabKey = "all" | "upcoming" | "completed" | "bus" | "train" | "flight" | "hotel" | "timeline";

function isUpcoming(trip: UnifiedTrip) {
  if (!trip.travel_date) return trip.status === "confirmed" || trip.status === "pending";
  return new Date(trip.travel_date) >= new Date(new Date().toDateString());
}

function countdownLabel(dateStr: string): { label: string; urgent: boolean } {
  const today = new Date(new Date().toDateString());
  const d = new Date(dateStr);
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (diff < 0) return { label: "Past", urgent: false };
  if (diff === 0) return { label: "Today!", urgent: true };
  if (diff === 1) return { label: "Tomorrow", urgent: true };
  if (diff <= 3) return { label: `In ${diff} days`, urgent: true };
  return { label: `In ${diff} days`, urgent: false };
}

function TimelineDot({ color, urgent }: { color: string; urgent: boolean }) {
  return (
    <div className="relative flex-shrink-0 flex flex-col items-center">
      <div className={`w-3 h-3 rounded-full border-2 z-10 ${urgent ? "bg-saffron border-saffron" : `${color.replace("text-", "bg-")} border-current`}`} />
      <div className="flex-1 w-px bg-border mt-1" />
    </div>
  );
}

function TripTimelineCard({ trip, fmt, isLast }: { trip: UnifiedTrip; fmt: (n: number) => string; isLast: boolean }) {
  const m = VERTICAL_META[trip.vertical] ?? VERTICAL_META.bus;
  const s = STATUS_META[trip.status] ?? { icon: Clock, cls: "text-text-muted", label: trip.status };
  const StatusIcon = s.icon;
  const cd = trip.travel_date ? countdownLabel(trip.travel_date) : null;

  const detailHref =
    trip.vertical === "bus"    ? `/bookings/${trip.id}` :
    trip.vertical === "train"  ? `/trains/booking/${trip.id}` :
    trip.vertical === "flight" ? `/flights/booking/${trip.id}` :
    `/hotels/booking/${trip.id}`;

  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center pt-1">
        <div className={`w-4 h-4 rounded-full z-10 border-2 ${cd?.urgent ? "border-saffron bg-saffron/20" : `${m.border} ${m.bg}`}`}>
          <m.icon className={`w-2 h-2 ${m.color} m-auto mt-0.5`} />
        </div>
        {!isLast && <div className="flex-1 w-px bg-border mt-1 min-h-[40px]" />}
      </div>

      <motion.div
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        className={`flex-1 card p-4 mb-4 hover:border-opacity-50 transition-all ${cd?.urgent ? "border-saffron/30" : ""}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`chip text-[10px] ${m.bg} ${m.color} border ${m.border}`}>{m.label}</span>
              <span className={`chip text-[10px] border flex items-center gap-1 ${
                trip.status === "confirmed" || trip.status === "checked_in" ? "bg-teal/10 text-teal border-teal/20" :
                trip.status === "pending" ? "bg-warning/10 text-warning border-warning/20" :
                "bg-purple/10 text-purple border-purple/20"
              }`}>
                <StatusIcon className="w-2.5 h-2.5" /> {s.label}
              </span>
              {cd && (
                <span className={`chip text-[10px] flex items-center gap-1 border ${
                  cd.urgent
                    ? "bg-saffron/10 text-saffron border-saffron/20"
                    : "bg-white/5 text-text-muted border-border"
                }`}>
                  <Timer className="w-2.5 h-2.5" /> {cd.label}
                </span>
              )}
            </div>

            {trip.vertical === "hotel" ? (
              <div className="font-semibold">{trip.from_name}</div>
            ) : (
              <div className="font-display text-base font-bold flex items-center gap-1.5 flex-wrap">
                <span>{trip.from_name || "—"}</span>
                <ArrowRight className={`w-3.5 h-3.5 ${m.color} shrink-0`} />
                <span>{trip.to_name || "—"}</span>
              </div>
            )}

            <div className="text-xs text-text-muted mt-0.5 flex items-center gap-1.5 flex-wrap">
              <span>{trip.description}</span>
              {trip.travel_date && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-2.5 h-2.5" />
                  {new Date(trip.travel_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              )}
            </div>
          </div>

          <div className="text-right shrink-0">
            <div className={`font-display text-lg font-bold ${m.color}`}>{fmt(trip.total_amount)}</div>
            <Link href={detailHref} className={`text-xs ${m.color} hover:underline mt-1 block`}>
              View Details
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function TripsInner() {
  const { user } = useAuth();
  const { format: fmt } = useCurrency();
  const [trips, setTrips] = useState<UnifiedTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>("all");

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    apiGet<UnifiedTrip[]>("/api/trips/all")
      .then(t => { setTrips(t ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user]);

  const counts = {
    all:       trips.length,
    upcoming:  trips.filter(isUpcoming).length,
    completed: trips.filter(t => t.status === "completed" || t.status === "checked_out").length,
    bus:       trips.filter(t => t.vertical === "bus").length,
    train:     trips.filter(t => t.vertical === "train").length,
    flight:    trips.filter(t => t.vertical === "flight").length,
    hotel:     trips.filter(t => t.vertical === "hotel").length,
    timeline:  trips.filter(isUpcoming).length,
  };

  const upcomingSorted = trips
    .filter(t => isUpcoming(t) && t.travel_date)
    .sort((a, b) => new Date(a.travel_date).getTime() - new Date(b.travel_date).getTime());

  const visible = trips.filter(t => {
    if (tab === "upcoming")  return isUpcoming(t);
    if (tab === "completed") return t.status === "completed" || t.status === "checked_out";
    if (tab === "bus" || tab === "train" || tab === "flight" || tab === "hotel") return t.vertical === tab;
    if (tab === "timeline") return false; // rendered separately
    return true;
  });

  const totalSpent = trips
    .filter(t => t.status === "confirmed" || t.status === "completed" || t.status === "checked_out")
    .reduce((s, t) => s + t.total_amount, 0);

  const TABS: { key: TabKey; label: string }[] = [
    { key: "all",       label: `All (${counts.all})` },
    { key: "upcoming",  label: `Upcoming (${counts.upcoming})` },
    { key: "timeline",  label: `Timeline` },
    { key: "completed", label: `Completed (${counts.completed})` },
    { key: "bus",       label: `Buses (${counts.bus})` },
    { key: "train",     label: `Trains (${counts.train})` },
    { key: "flight",    label: `Flights (${counts.flight})` },
    { key: "hotel",     label: `Hotels (${counts.hotel})` },
  ];

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 pb-24 md:pb-12">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold">My Trips</h1>
            <p className="text-text-secondary text-sm mt-1">
              {user ? `All your bookings across buses, trains, flights and hotels` : "Sign in to see your bookings"}
            </p>
          </div>
          <Link href="/planner" className="hidden md:flex btn-secondary items-center gap-2 text-sm">
            <Sparkles className="w-4 h-4 text-purple" /> Plan a Trip
          </Link>
        </div>

        {user && !loading && trips.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              { label: "Total Trips", value: counts.all, color: "text-saffron" },
              { label: "Upcoming", value: counts.upcoming, color: "text-teal" },
              { label: "Completed", value: counts.completed, color: "text-purple" },
              { label: "Total Spent", value: fmt(totalSpent), color: "text-flight" },
            ].map(s => (
              <div key={s.label} className="card p-4">
                <div className="text-[10px] uppercase tracking-wider text-text-muted mb-1">{s.label}</div>
                <div className={`font-display text-2xl font-bold ${s.color}`}>{s.value}</div>
              </div>
            ))}
          </div>
        )}

        {user && !loading && trips.length > 0 && (
          <div className="grid grid-cols-4 gap-3 mb-6">
            {(["bus","train","flight","hotel"] as const).map(v => {
              const m = VERTICAL_META[v];
              return (
                <button
                  key={v}
                  onClick={() => setTab(v)}
                  className={`card p-3 flex items-center gap-3 hover:border-opacity-60 transition-all ${tab === v ? `border-2 ${m.border}` : ""}`}
                >
                  <div className={`w-9 h-9 rounded-lg ${m.bg} flex items-center justify-center shrink-0`}>
                    <m.icon className={`w-4 h-4 ${m.color}`} />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-semibold">{m.label}</div>
                    <div className={`text-xl font-bold font-display ${m.color}`}>{counts[v]}</div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <div className="flex gap-1 mb-5 border-b border-border overflow-x-auto">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                tab === key
                  ? "border-saffron text-saffron"
                  : "border-transparent text-text-secondary hover:text-text-primary"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              {[1, 2, 3].map(i => <SkeletonTripCard key={i} />)}
            </motion.div>
          ) : !user ? (
            <motion.div key="auth" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-10 text-center">
              <h3 className="font-semibold text-lg mb-2">Sign in to view your trips</h3>
              <p className="text-sm text-text-muted mb-4">All your bus, train, flight and hotel bookings in one place.</p>
              <Link href="/login" className="btn-primary inline-flex">Sign In</Link>
            </motion.div>
          ) : tab === "timeline" ? (
            <motion.div key="timeline" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {upcomingSorted.length === 0 ? (
                <div className="card p-10 text-center">
                  <Timer className="w-10 h-10 text-text-muted mx-auto mb-3" />
                  <h3 className="font-semibold text-lg mb-1">No upcoming trips</h3>
                  <p className="text-sm text-text-muted mb-4">Book a trip to see your travel timeline here.</p>
                  <div className="flex justify-center gap-3 flex-wrap">
                    {(["buses","trains","flights","hotels"] as const).map(v => (
                      <Link key={v} href={`/${v}`} className="btn-secondary text-sm capitalize">{v}</Link>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="pl-2">
                  {upcomingSorted.map((trip, i) => (
                    <TripTimelineCard
                      key={trip.id}
                      trip={trip}
                      fmt={fmt}
                      isLast={i === upcomingSorted.length - 1}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          ) : visible.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-10 text-center">
              <AlertCircle className="w-10 h-10 text-text-muted mx-auto mb-3" />
              <h3 className="font-semibold text-lg mb-1">No trips here yet</h3>
              <p className="text-sm text-text-muted mb-4">
                {tab === "upcoming" ? "No upcoming trips." : tab === "completed" ? "No completed trips." : `No ${tab} bookings yet.`}
              </p>
              <div className="flex justify-center gap-3 flex-wrap">
                {(["buses","trains","flights","hotels"] as const).map(v => (
                  <Link key={v} href={`/${v}`} className="btn-secondary text-sm capitalize">{v}</Link>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              {visible.map(trip => <TripCard key={trip.id} trip={trip} fmt={fmt} />)}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <MobileNav />
    </>
  );
}

function TripCard({ trip, fmt }: { trip: UnifiedTrip; fmt: (n: number) => string }) {
  const m = VERTICAL_META[trip.vertical] ?? VERTICAL_META.bus;
  const s = STATUS_META[trip.status] ?? { icon: Clock, cls: "text-text-muted", label: trip.status };
  const StatusIcon = s.icon;

  const detailHref =
    trip.vertical === "bus"    ? `/bookings/${trip.id}` :
    trip.vertical === "train"  ? `/trains/booking/${trip.id}` :
    trip.vertical === "flight" ? `/flights/booking/${trip.id}` :
    trip.vertical === "hotel"  ? `/hotels/booking/${trip.id}` : "#";

  return (
    <div className="card p-4 md:p-5 hover:border-opacity-50 transition-all">
      <div className="flex items-start gap-4">
        <div className={`w-11 h-11 rounded-xl ${m.bg} border ${m.border} flex items-center justify-center shrink-0`}>
          <m.icon className={`w-5 h-5 ${m.color}`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className="text-xs font-mono text-text-muted">{trip.booking_ref}</span>
            <span className={`chip text-[10px] border flex items-center gap-1 ${
              trip.status === "confirmed" || trip.status === "checked_in" ? "bg-teal/10 text-teal border-teal/20" :
              trip.status === "pending" ? "bg-warning/10 text-warning border-warning/20" :
              trip.status === "completed" || trip.status === "checked_out" ? "bg-purple/10 text-purple border-purple/20" :
              "bg-danger/10 text-danger border-danger/20"
            }`}>
              <StatusIcon className="w-2.5 h-2.5" /> {s.label}
            </span>
            <span className={`chip text-[10px] ${m.bg} ${m.color} border ${m.border}`}>{m.label}</span>
          </div>

          {trip.vertical === "hotel" ? (
            <div className="font-semibold text-base mt-0.5">{trip.from_name}</div>
          ) : (
            <div className="font-display text-lg font-bold flex items-center gap-2 flex-wrap">
              <span>{trip.from_name || "—"}</span>
              <ArrowRight className={`w-4 h-4 ${m.color} shrink-0`} />
              <span>{trip.to_name || "—"}</span>
            </div>
          )}

          <div className="text-xs text-text-muted mt-0.5">
            {trip.description}
            {trip.travel_date && (
              <span className="ml-2 flex-inline items-center gap-1">
                <Calendar className="w-2.5 h-2.5 inline" /> {new Date(trip.travel_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            )}
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className={`font-display text-xl font-bold ${m.color}`}>{fmt(trip.total_amount)}</div>
          <Link href={detailHref} className={`text-xs ${m.color} hover:underline mt-1 block`}>
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function TripsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-text-muted">Loading…</div>}>
      <TripsInner />
    </Suspense>
  );
}
