"use client";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { MobileNav } from "@/components/MobileNav";
import { apiGet, apiPost, getToken, WS_URL } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Schedule, Seat, Bus, Operator } from "@/lib/types";
import { formatTime, formatDuration } from "@/lib/utils";
import { useCurrency } from "@/lib/currency";
import { Star, Wifi, Usb, Coffee, MapPin, Check, X, Shield, Bus as BusIcon, Crown, Armchair, Bed } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useT } from "@/lib/i18n";
import { useToast } from "@/components/Toast";

type Tab = "details" | "seats" | "fare" | "baggage" | "reviews" | "cancellation";

type Review = {
  id: string;
  rating: number;
  title: string;
  comment: string;
  helpful: number;
  is_verified: boolean;
  created_at: string;
  user?: { full_name: string };
};

export default function BusDetails() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const t = useT();
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const { format: formatPrice } = useCurrency();
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [tab, setTab] = useState<Tab>("seats");
  const [selectedSeats, setSelectedSeats] = useState<Set<string>>(new Set());
  const [lockTimer, setLockTimer] = useState<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!id) return;
    // Show cached search result immediately while full data loads
    try {
      const cached = sessionStorage.getItem(`schedule_${id}`);
      if (cached) setSchedule(JSON.parse(cached));
    } catch {}
    apiGet<Schedule>(`/api/schedules/${id}`).then(setSchedule).catch(() => null);
    apiGet<Seat[]>(`/api/buses/${id}/seats`).then(setSeats).catch(() => {});

    // Subscribe to real-time seat lock/release events for this schedule
    const ws = new WebSocket(`${WS_URL}?room=schedule:${id}`);
    wsRef.current = ws;
    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data) as {
          type: string;
          payload: { seat_id: string };
        };
        if (msg.type === "seat.locked") {
          setSeats((prev) =>
            prev.map((s) =>
              s.id === msg.payload.seat_id ? { ...s, status: "locked" } : s
            )
          );
        } else if (msg.type === "seat.released") {
          setSeats((prev) =>
            prev.map((s) =>
              s.id === msg.payload.seat_id ? { ...s, status: "available" } : s
            )
          );
        }
      } catch {}
    };
    return () => {
      ws.close();
    };
  }, [id]);

  // Group seats by berth type
  const lowerBerths = seats.filter((s) => s.berth_type === "lower");
  const upperBerths = seats.filter((s) => s.berth_type === "upper");

  const handleSeatClick = async (seat: Seat) => {
    if (seat.status === "booked" || seat.status === "ladies") return;
    const n = new Set(selectedSeats);
    if (n.has(seat.id)) {
      n.delete(seat.id);
      // Best-effort release
      if (getToken()) {
        apiPost("/api/seats/release", {
          schedule_id: id,
          seat_id: seat.id,
        }).catch(() => {});
      }
    } else {
      n.add(seat.id);
      // Best-effort lock
      if (getToken()) {
        try {
          await apiPost("/api/seats/lock", {
            schedule_id: id,
            seat_id: seat.id,
          });
          setLockTimer(300);
          success(`Seat ${seat.seat_number} held for 5 minutes`);
        } catch {
          toastError("Could not lock seat — please try again");
        }
      }
    }
    setSelectedSeats(n);
  };

  // Countdown for seat lock
  useEffect(() => {
    if (lockTimer === null || lockTimer <= 0) return;
    const t = setTimeout(() => setLockTimer(lockTimer - 1), 1000);
    return () => clearTimeout(t);
  }, [lockTimer]);

  const total = seats
    .filter((s) => selectedSeats.has(s.id))
    .reduce((sum, s) => sum + s.price, 0);

  const proceedToCheckout = () => {
    if (!user && !getToken()) {
      router.push("/login?redirect=/checkout");
      return;
    }
    sessionStorage.setItem(
      "checkout",
      JSON.stringify({
        schedule_id: id,
        seat_ids: Array.from(selectedSeats),
        total,
      })
    );
    router.push("/checkout");
  };

  if (!schedule) {
    return (
      <>
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 py-6 space-y-3">
          <p className="text-sm text-text-muted animate-pulse px-1">Loading bus details…</p>
          <div className="card p-6 h-40 skeleton" />
          <div className="card p-6 h-24 skeleton" />
          <div className="card p-6 h-64 skeleton" />
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 pb-32 md:pb-12">
        {/* Header */}
        <div className="card p-5 mb-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-md bg-bg-elevated flex items-center justify-center font-display font-bold text-saffron text-xl">
              {schedule.operator?.name?.charAt(0) || "?"}
            </div>
            <div className="flex-1">
              <h1 className="font-display text-2xl font-bold">{schedule.operator?.name}</h1>
              <p className="text-sm text-text-muted">{schedule.bus?.bus_type}</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-saffron text-saffron" />
                  <span className="text-sm font-semibold">{(schedule.bus?.rating || 4.5).toFixed(1)}</span>
                </div>
                <span className="text-xs text-text-muted">
                  · {schedule.bus?.total_reviews || 1500} reviews
                </span>
                {schedule.operator?.is_government && (
                  <span className="chip bg-saffron/10 text-saffron border border-saffron/20">
                    Government
                  </span>
                )}
                {schedule.operator?.is_electric && (
                  <span className="chip bg-teal/10 text-teal border border-teal/20">
                    Electric Bus
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Route bar */}
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center gap-3">
              <div>
                <div className="font-display text-2xl font-bold">
                  {formatTime(schedule.departure_at)}
                </div>
                <div className="text-xs text-text-muted">
                  {schedule.route?.from_city?.name}
                </div>
              </div>
              <div className="flex-1 flex flex-col items-center">
                <div className="text-xs text-text-muted">
                  {formatDuration(schedule.duration_min)}
                </div>
                <div className="w-full h-px bg-border my-1" />
                <div className="text-xs text-text-muted">
                  {schedule.stops === 0 ? t("search.nonStop") : `${schedule.stops} stop`}
                </div>
              </div>
              <div>
                <div className="font-display text-2xl font-bold">
                  {formatTime(schedule.arrival_at)}
                </div>
                <div className="text-xs text-text-muted">
                  {schedule.route?.to_city?.name}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 border-b border-border overflow-x-auto">
          {([
          ["details",     t("bus.details")],
          ["seats",       t("bus.seats")],
          ["fare",        t("bus.fareClasses")],
          ["baggage",     t("bus.baggage")],
          ["reviews",     t("bus.reviews")],
          ["cancellation",t("bus.cancellation")],
        ] as [Tab, string][]).map(
          (k, label) => (
            <button
              key={k[0]}
              onClick={() => setTab(k[0])}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                tab === k[0]
                  ? "border-saffron text-saffron"
                  : "border-transparent text-text-secondary hover:text-text-primary"
              }`}
            >
              {k[1]}
            </button>
          )
        )}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            {tab === "details" && <DetailsTab schedule={schedule} />}
            {tab === "fare" && <FareClassesTab schedule={schedule} />}
            {tab === "seats" && (
              <SeatsTab
                lowerBerths={lowerBerths}
                upperBerths={upperBerths}
                selectedSeats={selectedSeats}
                onSeatClick={handleSeatClick}
              />
            )}
            {tab === "baggage" && <BaggageTab />}
            {tab === "reviews" && <ReviewsTab operatorId={schedule?.operator_id} scheduleId={schedule?.id} />}
            {tab === "cancellation" && <CancellationTab />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Sticky bottom CTA */}
      {selectedSeats.size > 0 && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-0 left-0 right-0 z-40 glass-strong border-t border-border p-4"
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div>
              <div className="text-xs text-text-muted">
                {selectedSeats.size} {t("search.seatsAvailable")}
                {lockTimer !== null && lockTimer > 0 && (
                  <span className="ml-2 text-warning">
                    · {t("bus.seatHeld")} {Math.floor(lockTimer / 60)}:
                    {String(lockTimer % 60).padStart(2, "0")}
                  </span>
                )}
              </div>
              <div className="font-display text-2xl font-bold text-saffron">
                {formatPrice(total)}
              </div>
            </div>
            <button onClick={proceedToCheckout} className="btn-primary">
              {t("bus.continue")}
            </button>
          </div>
        </motion.div>
      )}
      <MobileNav />
    </>
  );
}

function DetailsTab({ schedule }: { schedule: Schedule }) {
  const t = useT();
  return (
    <div className="grid md:grid-cols-3 gap-4">
      <div className="md:col-span-2 space-y-4">
        <div className="card p-5">
          <h3 className="font-semibold mb-3">Boarding & Drop Points</h3>
          <div className="space-y-3">
            <PointItem label="Boarding" city={schedule.route?.from_city?.name || ""} time={formatTime(schedule.departure_at)} />
            <PointItem label="Drop" city={schedule.route?.to_city?.name || ""} time={formatTime(schedule.arrival_at)} />
          </div>
        </div>
        <div className="card p-5">
          <h3 className="font-semibold mb-3">Bus Specifications</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-text-muted text-xs">Layout</div>
              <div className="font-medium">{schedule.bus?.layout}</div>
            </div>
            <div>
              <div className="text-text-muted text-xs">Total Seats</div>
              <div className="font-medium">{schedule.bus?.total_seats}</div>
            </div>
            <div>
              <div className="text-text-muted text-xs">AC</div>
              <div className="font-medium">{schedule.bus?.is_ac ? "Yes" : "No"}</div>
            </div>
            <div>
              <div className="text-text-muted text-xs">Sleeper</div>
              <div className="font-medium">{schedule.bus?.is_sleeper ? "Yes" : "No"}</div>
            </div>
          </div>
        </div>
      </div>
      <div className="card p-5 border-teal/30 bg-teal/5 h-fit">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-teal" /> Why book this bus?
        </h3>
        <ul className="space-y-2 text-sm text-text-secondary">
          <li className="flex gap-2"><Check className="w-4 h-4 text-teal flex-shrink-0 mt-0.5" /> Best price for this route</li>
          <li className="flex gap-2"><Check className="w-4 h-4 text-teal flex-shrink-0 mt-0.5" /> Great departure time</li>
          <li className="flex gap-2"><Check className="w-4 h-4 text-teal flex-shrink-0 mt-0.5" /> High on-time performance</li>
          <li className="flex gap-2"><Check className="w-4 h-4 text-teal flex-shrink-0 mt-0.5" /> Verified operator</li>
        </ul>
      </div>
    </div>
  );
}

function FareClassesTab({ schedule }: { schedule: Schedule }) {
  const t = useT();
  const { format: formatPrice } = useCurrency();
  const base = schedule.base_fare;
  const isAc = schedule.bus?.is_ac;
  const isSleeper = schedule.bus?.is_sleeper;
  const busType = (schedule.bus?.bus_type || "").toLowerCase();
  const isVolvo = busType.includes("volvo") || busType.includes("multi-axle");

  const classes = [
    {
      id: "economy",
      label: "Economy Seater",
      icon: Armchair,
      price: base,
      color: "border-border",
      badge: null as string | null,
      perks: ["Reclining seats", "Window seat option", "USB charging", "Reading light"],
      available: !isSleeper,
    },
    {
      id: "sleeper",
      label: "AC Sleeper",
      icon: Bed,
      price: Math.round(base * 1.45),
      color: "border-teal/40",
      badge: "Popular",
      perks: ["Full flat berth", "Pillow & blanket", "AC vents per berth", "Privacy curtain"],
      available: isSleeper || isAc,
    },
    {
      id: "premium",
      label: "Volvo Premium",
      icon: Crown,
      price: Math.round(base * 1.85),
      color: "border-saffron/40",
      badge: "Best",
      perks: ["Premium leather seats", "Individual entertainment", "Meal included", "Priority boarding"],
      available: isVolvo || base > 1200,
    },
  ].filter((c) => c.available);

  return (
    <div className="space-y-4">
      <p className="text-sm text-text-muted">
        Choose the class that suits your journey. All fares include taxes.
      </p>
      <div className="grid md:grid-cols-3 gap-4">
        {classes.map((cls) => (
          <div
            key={cls.id}
            className={`card p-5 border-2 ${cls.color} relative hover:shadow-card transition`}
          >
            {cls.badge && (
              <span className="absolute -top-2.5 left-4 chip bg-saffron text-white border-saffron text-[10px] font-bold px-2 py-0.5">
                {cls.badge}
              </span>
            )}
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-md bg-bg-elevated flex items-center justify-center">
                <cls.icon className="w-4 h-4 text-saffron" />
              </div>
              <div>
                <div className="font-semibold text-sm">{cls.label}</div>
                <div className="font-display text-lg font-bold text-saffron">{formatPrice(cls.price)}</div>
              </div>
            </div>
            <ul className="space-y-1.5 text-xs text-text-secondary">
              {cls.perks.map((p) => (
                <li key={p} className="flex items-center gap-2">
                  <Check className="w-3 h-3 text-teal flex-shrink-0" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function PointItem({ label, city, time }: { label: string; city: string; time: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-full bg-saffron/10 text-saffron flex items-center justify-center flex-shrink-0">
        <MapPin className="w-4 h-4" />
      </div>
      <div className="flex-1">
        <div className="text-xs text-text-muted">{label} · {time}</div>
        <div className="font-medium">{city}</div>
      </div>
    </div>
  );
}

function SeatsTab({
  lowerBerths,
  upperBerths,
  selectedSeats,
  onSeatClick,
}: {
  lowerBerths: Seat[];
  upperBerths: Seat[];
  selectedSeats: Set<string>;
  onSeatClick: (s: Seat) => void;
}) {
  const t = useT();
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">{t("bus.selectSeats")}</h3>
        <div className="flex items-center gap-3 text-xs">
          <Legend color="bg-bg-elevated border-border" label={t("bus.legendAvailable")} />
          <Legend color="bg-saffron" label={t("bus.legendSelected")} />
          <Legend color="bg-bg-elevated opacity-50" label={t("bus.legendOccupied")} />
          <Legend color="bg-purple/30 border border-purple" label={t("bus.legendLadies")} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SeatGrid
          title={t("bus.lowerBerth")}
          seats={lowerBerths}
          selectedSeats={selectedSeats}
          onSeatClick={onSeatClick}
        />
        <SeatGrid
          title={t("bus.upperBerth")}
          seats={upperBerths}
          selectedSeats={selectedSeats}
          onSeatClick={onSeatClick}
        />
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-3 h-3 rounded-sm ${color}`} />
      <span className="text-text-muted">{label}</span>
    </div>
  );
}

function SeatGrid({
  title,
  seats,
  selectedSeats,
  onSeatClick,
}: {
  title: string;
  seats: Seat[];
  selectedSeats: Set<string>;
  onSeatClick: (s: Seat) => void;
}) {
  return (
    <div>
      <div className="text-xs text-text-muted mb-2 uppercase tracking-wide">{title}</div>
      <div className="grid grid-cols-3 gap-2">
        {seats.map((seat) => {
          const isSelected = selectedSeats.has(seat.id);
          const isOccupied = seat.status === "booked";
          const isLadies = seat.status === "ladies";
          return (
            <button
              key={seat.id}
              onClick={() => onSeatClick(seat)}
              disabled={isOccupied}
              className={`aspect-square rounded-md border text-xs font-medium transition-all ${
                isSelected
                  ? "bg-saffron border-saffron text-white"
                  : isOccupied
                  ? "bg-bg-elevated/50 border-border text-text-muted cursor-not-allowed"
                  : isLadies
                  ? "bg-purple/20 border-purple text-purple"
                  : "bg-bg-elevated border-border hover:border-saffron text-text-primary"
              }`}
            >
              {seat.seat_number}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function BaggageTab() {
  return (
    <div className="card p-5 space-y-4">
      <h3 className="font-semibold">Baggage Policy</h3>
      <div className="grid md:grid-cols-2 gap-3 text-sm">
        <PolicyItem label="Free Check-in" value="15 kg per passenger" />
        <PolicyItem label="Hand Luggage" value="5 kg per passenger" />
        <PolicyItem label="Extra Baggage" value="₹50/kg (pay at counter)" />
        <PolicyItem label="Lost & Found" value="Contact operator within 24h" />
      </div>
    </div>
  );
}

function PolicyItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 bg-bg-elevated rounded-md">
      <div className="text-xs text-text-muted">{label}</div>
      <div className="font-medium mt-0.5">{value}</div>
    </div>
  );
}

function ReviewsTab({ operatorId, scheduleId }: { operatorId?: string; scheduleId?: string }) {
  const t = useT();
  const { success: toastSuccess, error: toastError } = useToast();
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ rating: 5, title: "", comment: "" });
  const [submitting, setSubmitting] = useState(false);

  const loadReviews = () => {
    if (!operatorId) { setReviews([]); return; }
    apiGet<Review[]>(`/api/reviews?operator_id=${operatorId}`)
      .then((r) => setReviews(r))
      .catch(() => setReviews([]));
  };

  useEffect(() => { loadReviews(); }, [operatorId]);

  const submitReview = async () => {
    if (!form.comment.trim()) { toastError("Please write a comment"); return; }
    setSubmitting(true);
    try {
      await apiPost("/api/reviews", {
        operator_id: operatorId,
        schedule_id: scheduleId,
        rating: form.rating,
        title: form.title,
        comment: form.comment,
      });
      toastSuccess("Review submitted");
      setForm({ rating: 5, title: "", comment: "" });
      setShowForm(false);
      loadReviews();
    } catch (e: any) {
      toastError(e.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  // Distribution computed from real data
  const total = reviews?.length ?? 0;
  const avg = total > 0
    ? (reviews!.reduce((s, r) => s + r.rating, 0) / total).toFixed(1)
    : "—";
  const distribution = [5, 4, 3, 2, 1].map((stars) => {
    const count = reviews?.filter((r) => r.rating === stars).length ?? 0;
    return { stars, pct: total > 0 ? Math.round((count / total) * 100) : 0 };
  });

  const relativeTime = (iso: string) => {
    const d = new Date(iso);
    const days = Math.floor((Date.now() - d.getTime()) / 86400000);
    if (days < 1) return t("bus.today");
    if (days < 7) return t("bus.daysAgo", days);
    if (days < 30) return t("bus.weeksAgo", Math.floor(days / 7));
    return t("bus.monthsAgo", Math.floor(days / 30));
  };

  if (reviews === null) {
    return <div className="card p-10 text-center text-text-muted">Loading reviews…</div>;
  }
  const WriteReviewForm = () => (
    <div className="card p-5 space-y-3">
      <h3 className="font-semibold text-sm">Write a Review</h3>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((s) => (
          <button key={s} onClick={() => setForm((f) => ({ ...f, rating: s }))}>
            <Star className={`w-5 h-5 ${s <= form.rating ? "fill-saffron text-saffron" : "text-text-muted"}`} />
          </button>
        ))}
      </div>
      <input
        value={form.title}
        onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
        placeholder="Review title (optional)"
        className="input text-sm"
      />
      <textarea
        value={form.comment}
        onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
        placeholder="Share your experience…"
        rows={3}
        className="input text-sm resize-none"
      />
      <div className="flex gap-2">
        <button onClick={submitReview} disabled={submitting} className="btn-primary text-xs disabled:opacity-60">
          {submitting ? "Submitting…" : "Submit"}
        </button>
        <button onClick={() => setShowForm(false)} className="btn-secondary text-xs">Cancel</button>
      </div>
    </div>
  );

  if (reviews.length === 0) {
    return (
      <div className="space-y-4">
        <div className="card p-10 text-center">
          <div className="text-4xl mb-2">⭐</div>
          <h3 className="font-semibold mb-1">{t("bus.noReviews")}</h3>
          <p className="text-sm text-text-muted mb-4">{t("bus.noReviewsSub")}</p>
          {!showForm && (
            <button onClick={() => setShowForm(true)} className="btn-primary text-sm">Write a Review</button>
          )}
        </div>
        {showForm && <WriteReviewForm />}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-text-secondary">{t("bus.reviewsCount", total)}</span>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="btn-secondary text-xs">Write a Review</button>
        )}
      </div>
      {showForm && <WriteReviewForm />}
    <div className="grid md:grid-cols-3 gap-4">
      <div className="card p-5">
        <div className="text-center mb-3">
          <div className="font-display text-5xl font-bold text-saffron">{avg}</div>
          <div className="text-sm text-text-muted">{t("bus.outOf5")} · {t("bus.reviewsCount", total)}</div>
        </div>
        <div className="space-y-1.5">
          {distribution.map((d) => (
            <div key={d.stars} className="flex items-center gap-2 text-xs">
              <span className="w-3">{d.stars}</span>
              <Star className="w-3 h-3 fill-saffron text-saffron" />
              <div className="flex-1 h-1.5 bg-bg-elevated rounded-full overflow-hidden">
                <div
                  className="h-full bg-saffron"
                  style={{ width: `${d.pct}%` }}
                />
              </div>
              <span className="text-text-muted w-8 text-right">{d.pct}%</span>
            </div>
          ))}
        </div>
      </div>
      <div className="md:col-span-2 space-y-3">
        {reviews.map((r) => (
          <div key={r.id} className="card p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-gradient-purple flex items-center justify-center text-xs font-bold">
                {(r.user?.full_name || "A").charAt(0)}
              </div>
              <div>
                <div className="text-sm font-semibold flex items-center gap-1.5">
                  {r.user?.full_name || "Anonymous"}
                  {r.is_verified && (
                    <span className="chip bg-teal/10 text-teal border-teal/20 text-[9px]">
                      ✓ {t("bus.verified")}
                    </span>
                  )}
                </div>
                <div className="text-xs text-text-muted">{relativeTime(r.created_at)}</div>
              </div>
              <div className="ml-auto flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${
                      i < r.rating ? "fill-saffron text-saffron" : "text-text-muted"
                    }`}
                  />
                ))}
              </div>
            </div>
            {r.title && <div className="font-semibold text-sm mb-1">{r.title}</div>}
            <p className="text-sm text-text-secondary">{r.comment}</p>
            {r.helpful > 0 && (
              <div className="text-[10px] text-text-muted mt-2">
                {t("bus.foundHelpful", r.helpful)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
    </div>
  );
}

function CancellationTab() {
  return (
    <div className="card p-5 space-y-3">
      <h3 className="font-semibold">Cancellation Policy</h3>
      <div className="space-y-2 text-sm">
        <PolicyRow time="> 24h before departure" refund="90% refund" />
        <PolicyRow time="12-24h before" refund="70% refund" />
        <PolicyRow time="6-12h before" refund="50% refund" />
        <PolicyRow time="< 6h before" refund="No refund" />
        <PolicyRow time="No-show" refund="No refund" />
      </div>
    </div>
  );
}

function PolicyRow({ time, refund }: { time: string; refund: string }) {
  return (
    <div className="flex items-center justify-between p-3 bg-bg-elevated rounded-md">
      <span>{time}</span>
      <span className="font-medium text-saffron">{refund}</span>
    </div>
  );
}
