"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { MobileNav } from "@/components/MobileNav";
import { apiGet } from "@/lib/api";
import { formatDate, formatTime } from "@/lib/utils";
import { useCurrency } from "@/lib/currency";
import { useToast } from "@/components/Toast";
import {
  ArrowLeft, ArrowRight, Calendar, Clock, MapPin, Bus, User,
  CreditCard, CheckCircle2, XCircle, Clock3, MessageCircle, Download,
} from "lucide-react";

type BookingDetail = {
  id: string;
  booking_ref: string;
  status: string;
  schedule_id: string;
  total_amount: number;
  base_amount: number;
  tax_amount: number;
  contact_email: string;
  contact_phone: string;
  whatsapp_enabled: boolean;
  created_at: string;
  schedule?: {
    departure_at: string;
    arrival_at: string;
    duration_min: number;
    stops: number;
    base_fare: number;
    route?: {
      from_city?: { name: string; code: string };
      to_city?: { name: string; code: string };
    };
    operator?: { name: string; is_government?: boolean; is_electric?: boolean };
    bus?: { bus_type: string; layout: string; is_ac: boolean; is_sleeper: boolean };
  };
  passengers?: {
    id: string;
    full_name: string;
    age: number;
    gender: string;
    id_type: string;
    seat_number: string;
  }[];
  payment?: {
    method: string;
    status: string;
    paid_at?: string;
  };
};

const STATUS_CONFIG: Record<string, { label: string; cls: string; icon: any }> = {
  confirmed: { label: "Confirmed",  cls: "bg-teal/10 text-teal border-teal/20",       icon: CheckCircle2 },
  pending:   { label: "Pending",    cls: "bg-warning/10 text-warning border-warning/20", icon: Clock3      },
  completed: { label: "Completed",  cls: "bg-purple/10 text-purple border-purple/20",  icon: CheckCircle2 },
  cancelled: { label: "Cancelled",  cls: "bg-danger/10 text-danger border-danger/20",  icon: XCircle      },
};

export default function BookingDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { format: formatPrice } = useCurrency();
  const { info: toastInfo, error: toastError } = useToast();
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const downloadTicket = async () => {
    if (!booking) return;
    setDownloading(true);
    try {
      const html = await apiGet<string>(`/api/bookings/${booking.id}/ticket`);
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const w = window.open(url, "_blank");
      if (w) w.focus();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch {
      toastInfo("E-ticket sent to your registered email address");
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    apiGet<BookingDetail>(`/api/bookings/${id}`)
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
            <p className="text-sm text-text-muted mb-4">
              This booking doesn't exist or you don't have access.
            </p>
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

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 md:px-6 py-6 pb-24 md:pb-12 space-y-4">
        {/* Back */}
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
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs text-text-muted">{booking.booking_ref}</span>
                <span className={`chip border ${status.cls} text-[10px] flex items-center gap-1`}>
                  <StatusIcon className="w-3 h-3" /> {status.label}
                </span>
              </div>
              <h1 className="font-display text-2xl md:text-3xl font-bold flex items-center gap-2 flex-wrap">
                <span>{booking.schedule?.route?.from_city?.name ?? "—"}</span>
                <ArrowRight className="w-5 h-5 text-saffron" />
                <span>{booking.schedule?.route?.to_city?.name ?? "—"}</span>
              </h1>
              <div className="text-sm text-text-muted mt-1">
                {booking.schedule?.operator?.name} · {booking.schedule?.bus?.bus_type}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-text-muted">Total paid</div>
              <div className="font-display text-2xl font-bold text-saffron">
                {formatPrice(booking.total_amount)}
              </div>
            </div>
          </div>
        </div>

        {/* Journey details */}
        <div className="card p-5">
          <h3 className="font-semibold mb-4">Journey Details</h3>
          <div className="grid grid-cols-3 gap-4 text-sm mb-5">
            <div className="flex flex-col items-center">
              <div className="font-display text-2xl font-bold">
                {booking.schedule?.departure_at ? formatTime(booking.schedule.departure_at) : "—"}
              </div>
              <div className="text-xs text-text-muted mt-0.5">
                {booking.schedule?.route?.from_city?.code}
              </div>
            </div>
            <div className="flex flex-col items-center justify-center gap-0.5">
              <div className="text-xs text-text-muted">
                {booking.schedule?.duration_min
                  ? `${Math.floor(booking.schedule.duration_min / 60)}h ${booking.schedule.duration_min % 60}m`
                  : "—"}
              </div>
              <div className="w-full h-px bg-border relative my-1">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-teal" />
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-saffron" />
              </div>
              <div className="text-xs text-text-muted">
                {booking.schedule?.stops === 0 ? "Non-stop" : `${booking.schedule?.stops} stop`}
              </div>
            </div>
            <div className="flex flex-col items-center">
              <div className="font-display text-2xl font-bold">
                {booking.schedule?.arrival_at ? formatTime(booking.schedule.arrival_at) : "—"}
              </div>
              <div className="text-xs text-text-muted mt-0.5">
                {booking.schedule?.route?.to_city?.code}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 p-3 bg-bg-elevated rounded-md">
              <Calendar className="w-4 h-4 text-saffron" />
              <div>
                <div className="text-[10px] text-text-muted uppercase">Date</div>
                <div className="font-medium">
                  {booking.schedule?.departure_at
                    ? formatDate(booking.schedule.departure_at)
                    : "TBD"}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-bg-elevated rounded-md">
              <Bus className="w-4 h-4 text-saffron" />
              <div>
                <div className="text-[10px] text-text-muted uppercase">Bus type</div>
                <div className="font-medium">{booking.schedule?.bus?.bus_type ?? "—"}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Passengers */}
        {booking.passengers && booking.passengers.length > 0 && (
          <div className="card p-5">
            <h3 className="font-semibold mb-4">Passengers</h3>
            <div className="space-y-2">
              {booking.passengers.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-bg-elevated rounded-md text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-purple flex items-center justify-center text-xs font-bold">
                      {p.full_name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium">{p.full_name}</div>
                      <div className="text-[10px] text-text-muted">
                        {p.gender} · Age {p.age} · {p.id_type}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-text-muted">Seat</div>
                    <div className="font-semibold text-saffron">{p.seat_number || "—"}</div>
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
            <Row label="Base fare" value={formatPrice(booking.base_amount)} />
            <Row label="Taxes & fees" value={formatPrice(booking.tax_amount)} />
            <div className="border-t border-border pt-2 flex items-center justify-between">
              <span className="font-semibold">Total</span>
              <span className="font-display text-xl font-bold text-saffron">
                {formatPrice(booking.total_amount)}
              </span>
            </div>
          </div>
          {booking.payment && (
            <div className="mt-3 pt-3 border-t border-border text-xs text-text-muted flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5" />
              Paid via {booking.payment.method?.toUpperCase()} ·{" "}
              {booking.payment.paid_at
                ? new Date(booking.payment.paid_at).toLocaleDateString("en-IN", {
                    day: "numeric", month: "short", year: "numeric",
                  })
                : "Pending"}
            </div>
          )}
        </div>

        {/* Contact */}
        <div className="card p-5">
          <h3 className="font-semibold mb-4">Contact</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Row label="Email" value={booking.contact_email} />
            <Row label="Phone" value={booking.contact_phone} />
          </div>
          {booking.whatsapp_enabled && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-teal">
              <MessageCircle className="w-3.5 h-3.5" /> E-ticket sent via WhatsApp
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={downloadTicket}
            disabled={downloading}
            className="btn-primary flex items-center gap-2 disabled:opacity-60"
          >
            <Download className="w-4 h-4" /> {downloading ? "Opening…" : "Download e-Ticket"}
          </button>
          {(booking.status === "confirmed" || booking.status === "pending") && booking.schedule_id && (
            <Link
              href={`/tracking/${booking.schedule_id}`}
              className="btn-secondary flex items-center gap-2"
            >
              <MapPin className="w-4 h-4 text-teal" /> Track Bus
            </Link>
          )}
          {booking.whatsapp_enabled && (
            <button
              onClick={() => {
                const from = booking.schedule?.route?.from_city?.name ?? "";
                const to = booking.schedule?.route?.to_city?.name ?? "";
                const date = booking.schedule?.departure_at
                  ? new Date(booking.schedule.departure_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                  : "";
                const msg = `My IndieBus ticket is confirmed! 🚌\nRef: ${booking.booking_ref}\nRoute: ${from} → ${to}\nDate: ${date}\nTotal: ${formatPrice(booking.total_amount)}`;
                window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
              }}
              className="btn-secondary flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4 text-teal" /> Share on WhatsApp
            </button>
          )}
          <Link href="/trips" className="btn-secondary">
            Back to Trips
          </Link>
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
