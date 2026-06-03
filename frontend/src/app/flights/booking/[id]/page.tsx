"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { MobileNav } from "@/components/MobileNav";
import { apiGet } from "@/lib/api";
import { useCurrency } from "@/lib/currency";
import {
  ArrowLeft, ArrowRight, Calendar, Plane,
  CheckCircle2, XCircle, Clock3, MessageCircle, Luggage,
} from "lucide-react";

type FlightBookingDetail = {
  id: string;
  booking_ref: string;
  pnr: string;
  status: string;
  cabin_class: string;
  total_amount: number;
  base_fare: number;
  taxes_and_fees: number;
  meal_fee: number;
  insurance_fee: number;
  platform_fee: number;
  gst_amount: number;
  contact_email: string;
  contact_phone: string;
  created_at: string;
  schedule?: {
    journey_date: string;
    departure_time: string;
    arrival_time: string;
    duration_min: number;
    aircraft: string;
    baggage_kg: number;
    has_meal: boolean;
    airline?: { name: string; code: string; color: string };
    from_airport?: { iata: string; name: string; city: string; terminal: string };
    to_airport?: { iata: string; name: string; city: string; terminal: string };
  };
  passengers?: {
    id: string;
    title: string;
    first_name: string;
    last_name: string;
    gender: string;
    dob: string;
    seat_number: string;
    meal_preference: string;
    extra_baggage_kg: number;
    status: string;
  }[];
};

const STATUS_CONFIG: Record<string, { label: string; cls: string; icon: any }> = {
  confirmed: { label: "Confirmed", cls: "bg-teal/10 text-teal border-teal/20",           icon: CheckCircle2 },
  pending:   { label: "Pending",   cls: "bg-warning/10 text-warning border-warning/20",  icon: Clock3       },
  cancelled: { label: "Cancelled", cls: "bg-danger/10 text-danger border-danger/20",     icon: XCircle      },
};

export default function FlightBookingDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { format: fmt } = useCurrency();
  const [booking, setBooking] = useState<FlightBookingDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    apiGet<FlightBookingDetail>(`/api/flights/bookings/${id}`)
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
  const airlineColor = s?.airline?.color ?? "#06B6D4";

  const shareWhatsApp = () => {
    const msg = `My IndieYatra flight is confirmed!\nRef: ${booking.booking_ref} | PNR: ${booking.pnr}\n${s?.airline?.name ?? ""} · ${s?.from_airport?.city ?? ""} → ${s?.to_airport?.city ?? ""}\nDate: ${s?.journey_date ? new Date(s.journey_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : ""}\nCabin: ${booking.cabin_class} | Total: ${fmt(booking.total_amount)}`;
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
                <span className="chip bg-flight/10 text-flight border border-flight/20 text-[10px]">Flight</span>
              </div>
              <h1 className="font-display text-2xl md:text-3xl font-bold flex items-center gap-2 flex-wrap">
                <span>{s?.from_airport?.city ?? "—"}</span>
                <ArrowRight className="w-5 h-5 text-flight" />
                <span>{s?.to_airport?.city ?? "—"}</span>
              </h1>
              <div className="text-sm text-text-muted mt-1">
                {s?.airline?.name} · {booking.cabin_class}
                {s?.aircraft && <span className="ml-1">· {s.aircraft}</span>}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-text-muted">Total paid</div>
              <div className="font-display text-2xl font-bold" style={{ color: airlineColor }}>
                {fmt(booking.total_amount)}
              </div>
            </div>
          </div>
        </div>

        {/* Journey details */}
        <div className="card p-5">
          <h3 className="font-semibold mb-4">Flight Details</h3>
          <div className="grid grid-cols-3 gap-4 mb-5">
            <div className="flex flex-col items-center">
              <div className="font-display text-2xl font-bold">{s?.departure_time ?? "—"}</div>
              <div className="text-xs font-semibold mt-0.5">{s?.from_airport?.iata}</div>
              <div className="text-xs text-text-muted text-center">{s?.from_airport?.name}</div>
              {s?.from_airport?.terminal && (
                <div className="text-[10px] text-text-muted mt-0.5">Terminal {s.from_airport.terminal}</div>
              )}
            </div>
            <div className="flex flex-col items-center justify-center gap-0.5">
              <div className="text-xs text-text-muted">{dh}h {dm}m</div>
              <div className="w-full h-px bg-border relative my-1">
                <Plane className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 text-flight rotate-90" />
              </div>
              <div className="text-[10px] text-text-muted">Non-stop</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="font-display text-2xl font-bold">{s?.arrival_time ?? "—"}</div>
              <div className="text-xs font-semibold mt-0.5">{s?.to_airport?.iata}</div>
              <div className="text-xs text-text-muted text-center">{s?.to_airport?.name}</div>
              {s?.to_airport?.terminal && (
                <div className="text-[10px] text-text-muted mt-0.5">Terminal {s.to_airport.terminal}</div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <div className="flex items-center gap-2 p-3 bg-bg-elevated rounded-md">
              <Calendar className="w-4 h-4 text-flight" />
              <div>
                <div className="text-[10px] text-text-muted uppercase">Date</div>
                <div className="font-medium">
                  {s?.journey_date ? new Date(s.journey_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-bg-elevated rounded-md">
              <Luggage className="w-4 h-4 text-flight" />
              <div>
                <div className="text-[10px] text-text-muted uppercase">Baggage</div>
                <div className="font-medium">{s?.baggage_kg ?? 0}kg included</div>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-bg-elevated rounded-md">
              <Plane className="w-4 h-4 text-flight" />
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
                    <div className="w-8 h-8 rounded-full bg-flight/10 flex items-center justify-center text-xs font-bold text-flight">
                      {p.first_name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium">{p.title} {p.first_name} {p.last_name}</div>
                      <div className="text-[10px] text-text-muted">
                        {p.gender}
                        {p.meal_preference && p.meal_preference !== "none" && ` · ${p.meal_preference}`}
                        {p.extra_baggage_kg > 0 && ` · +${p.extra_baggage_kg}kg baggage`}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-text-muted">Seat</div>
                    <div className="font-semibold text-flight">{p.seat_number || "—"}</div>
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
            <Row label="Taxes & fees" value={fmt(booking.taxes_and_fees)} />
            {booking.meal_fee > 0 && <Row label="Meal add-on" value={fmt(booking.meal_fee)} />}
            {booking.insurance_fee > 0 && <Row label="Travel insurance" value={fmt(booking.insurance_fee)} />}
            <Row label="Platform fee" value={fmt(booking.platform_fee)} />
            <Row label="GST" value={fmt(booking.gst_amount)} />
            <div className="border-t border-border pt-2 flex items-center justify-between">
              <span className="font-semibold">Total</span>
              <span className="font-display text-xl font-bold text-flight">{fmt(booking.total_amount)}</span>
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
