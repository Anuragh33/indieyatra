"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { MobileNav } from "@/components/MobileNav";
import { apiGet } from "@/lib/api";
import { useCurrency } from "@/lib/currency";
import {
  ArrowLeft, ArrowRight, Calendar, Train, User,
  CheckCircle2, XCircle, Clock3, MessageCircle, AlertCircle,
} from "lucide-react";

type TrainBookingDetail = {
  id: string;
  booking_ref: string;
  pnr: string;
  status: string;
  class: string;
  quota: string;
  total_amount: number;
  base_fare: number;
  reservation_fee: number;
  superfast_fee: number;
  gst_amount: number;
  irctc_fee: number;
  insurance_fee: number;
  contact_email: string;
  contact_phone: string;
  created_at: string;
  schedule?: {
    journey_date: string;
    departure_time: string;
    arrival_time: string;
    arrival_day: number;
    duration_min: number;
    train?: { name: string; number: string; train_type: string; is_superfast: boolean; has_pantry: boolean };
    from_station?: { name: string; code: string; city: string };
    to_station?: { name: string; code: string; city: string };
  };
  passengers?: {
    id: string;
    full_name: string;
    age: number;
    gender: string;
    coach: string;
    berth_number: string;
    status: string;
    meal_preference: string;
    is_senior: boolean;
  }[];
};

const STATUS_CONFIG: Record<string, { label: string; cls: string; icon: any }> = {
  confirmed: { label: "Confirmed", cls: "bg-teal/10 text-teal border-teal/20",           icon: CheckCircle2 },
  pending:   { label: "Pending",   cls: "bg-warning/10 text-warning border-warning/20",  icon: Clock3       },
  cancelled: { label: "Cancelled", cls: "bg-danger/10 text-danger border-danger/20",     icon: XCircle      },
};

const PASSENGER_STATUS_CLS: Record<string, string> = {
  CNF: "text-teal",
  RAC: "text-warning",
};

export default function TrainBookingDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { format: fmt } = useCurrency();
  const [booking, setBooking] = useState<TrainBookingDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    apiGet<TrainBookingDetail>(`/api/trains/bookings/${id}`)
      .then(setBooking)
      .catch(() => setBooking(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="max-w-3xl mx-auto px-4 py-6">
          <div className="card p-6 h-64 skeleton" />
        </main>
      </>
    );
  }

  if (!booking) {
    return (
      <>
        <Navbar />
        <main className="max-w-3xl mx-auto px-4 py-6 text-center">
          <div className="card p-12">
            <XCircle className="w-12 h-12 text-danger/40 mx-auto mb-3" />
            <h2 className="font-display text-2xl font-bold mb-2">Booking not found</h2>
            <p className="text-sm text-text-muted mb-4">This booking doesn&apos;t exist or you don&apos;t have access.</p>
            <Link href="/trips" className="btn-primary inline-flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Back to Trips
            </Link>
          </div>
        </main>
      </>
    );
  }

  const status = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.pending;
  const StatusIcon = status.icon;
  const s = booking.schedule;
  const dh = s ? Math.floor(s.duration_min / 60) : 0;
  const dm = s ? s.duration_min % 60 : 0;

  const shareWhatsApp = () => {
    const msg = `My IndieYatra train ticket is confirmed!\nRef: ${booking.booking_ref} | PNR: ${booking.pnr}\nRoute: ${s?.from_station?.city ?? ""} → ${s?.to_station?.city ?? ""}\nDate: ${s?.journey_date ? new Date(s.journey_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : ""}\nClass: ${booking.class} | Total: ${fmt(booking.total_amount)}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 md:px-6 py-6 pb-24 md:pb-12 space-y-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Trips
        </button>

        {/* Header */}
        <div className="card p-5">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="font-mono text-xs text-text-muted">{booking.booking_ref}</span>
                <span className={`chip border ${status.cls} text-[10px] flex items-center gap-1`}>
                  <StatusIcon className="w-3 h-3" /> {status.label}
                </span>
                <span className="chip bg-train/10 text-train border border-train/20 text-[10px]">Train</span>
              </div>
              <h1 className="font-display text-2xl md:text-3xl font-bold flex items-center gap-2 flex-wrap">
                <span>{s?.from_station?.city ?? "—"}</span>
                <ArrowRight className="w-5 h-5 text-train" />
                <span>{s?.to_station?.city ?? "—"}</span>
              </h1>
              <div className="text-sm text-text-muted mt-1">
                {s?.train?.name} · {s?.train?.number} · {booking.class}
                {s?.train?.is_superfast && <span className="ml-1 text-warning">SF</span>}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-text-muted">Total paid</div>
              <div className="font-display text-2xl font-bold text-train">{fmt(booking.total_amount)}</div>
            </div>
          </div>
        </div>

        {/* Journey details */}
        <div className="card p-5">
          <h3 className="font-semibold mb-4">Journey Details</h3>
          <div className="grid grid-cols-3 gap-4 mb-5">
            <div className="flex flex-col items-center">
              <div className="font-display text-2xl font-bold">{s?.departure_time ?? "—"}</div>
              <div className="text-xs font-medium mt-0.5">{s?.from_station?.code}</div>
              <div className="text-xs text-text-muted">{s?.from_station?.name}</div>
            </div>
            <div className="flex flex-col items-center justify-center gap-0.5">
              <div className="text-xs text-text-muted">{dh}h {dm}m</div>
              <div className="w-full h-px bg-border relative my-1">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-train" />
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-train" />
              </div>
              {s?.arrival_day && s.arrival_day > 1 && (
                <div className="text-[10px] text-warning">+{s.arrival_day - 1} day</div>
              )}
            </div>
            <div className="flex flex-col items-center">
              <div className="font-display text-2xl font-bold">{s?.arrival_time ?? "—"}</div>
              <div className="text-xs font-medium mt-0.5">{s?.to_station?.code}</div>
              <div className="text-xs text-text-muted">{s?.to_station?.name}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <div className="flex items-center gap-2 p-3 bg-bg-elevated rounded-md">
              <Calendar className="w-4 h-4 text-train" />
              <div>
                <div className="text-[10px] text-text-muted uppercase">Date</div>
                <div className="font-medium">
                  {s?.journey_date ? new Date(s.journey_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-bg-elevated rounded-md">
              <Train className="w-4 h-4 text-train" />
              <div>
                <div className="text-[10px] text-text-muted uppercase">Class / Quota</div>
                <div className="font-medium">{booking.class} · {booking.quota}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-bg-elevated rounded-md">
              <AlertCircle className="w-4 h-4 text-train" />
              <div>
                <div className="text-[10px] text-text-muted uppercase">PNR</div>
                <div className="font-mono font-semibold">{booking.pnr}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Passengers */}
        {booking.passengers && booking.passengers.length > 0 && (
          <div className="card p-5">
            <h3 className="font-semibold mb-4">Passengers ({booking.passengers.length})</h3>
            <div className="space-y-2">
              {booking.passengers.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-bg-elevated rounded-md text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-train/20 flex items-center justify-center text-xs font-bold text-train">
                      {p.full_name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium flex items-center gap-1.5">
                        {p.full_name}
                        {p.is_senior && <span className="text-[9px] bg-warning/10 text-warning px-1.5 py-0.5 rounded">SR</span>}
                      </div>
                      <div className="text-[10px] text-text-muted">
                        {p.gender} · Age {p.age}
                        {p.meal_preference && p.meal_preference !== "none" && ` · ${p.meal_preference}`}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-semibold text-sm ${PASSENGER_STATUS_CLS[p.status.slice(0, 3)] ?? "text-danger"}`}>
                      {p.status}
                    </div>
                    {p.coach && (
                      <div className="text-[10px] text-text-muted">{p.coach} · {p.berth_number}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fare breakdown */}
        <div className="card p-5">
          <h3 className="font-semibold mb-4">Fare Breakdown</h3>
          <div className="space-y-2 text-sm">
            <Row label="Base fare" value={fmt(booking.base_fare)} />
            <Row label="Reservation fee" value={fmt(booking.reservation_fee)} />
            {booking.superfast_fee > 0 && <Row label="Superfast surcharge" value={fmt(booking.superfast_fee)} />}
            <Row label="GST" value={fmt(booking.gst_amount)} />
            <Row label="IRCTC convenience fee" value={fmt(booking.irctc_fee)} />
            {booking.insurance_fee > 0 && <Row label="Travel insurance" value={fmt(booking.insurance_fee)} />}
            <div className="border-t border-border pt-2 flex items-center justify-between">
              <span className="font-semibold">Total</span>
              <span className="font-display text-xl font-bold text-train">{fmt(booking.total_amount)}</span>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="card p-5">
          <h3 className="font-semibold mb-3">Contact</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Row label="Email" value={booking.contact_email || "—"} />
            <Row label="Phone" value={booking.contact_phone || "—"} />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <button onClick={shareWhatsApp} className="btn-secondary flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-teal" /> Share on WhatsApp
          </button>
          <Link href="/trips" className="btn-secondary">Back to Trips</Link>
        </div>
      </main>
      <MobileNav />
    </>
  );
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between text-text-secondary">
      <span>{label}</span>
      <span className="font-medium text-text-primary">{String(value)}</span>
    </div>
  );
}
