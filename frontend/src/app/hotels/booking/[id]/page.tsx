"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { MobileNav } from "@/components/MobileNav";
import { apiGet } from "@/lib/api";
import { useCurrency } from "@/lib/currency";
import {
  ArrowLeft, Calendar, Building2, User, Star,
  CheckCircle2, XCircle, Clock3, MessageCircle, Wifi, UtensilsCrossed,
} from "lucide-react";

type HotelBookingDetail = {
  id: string;
  booking_ref: string;
  status: string;
  check_in: string;
  check_out: string;
  nights: number;
  guests: number;
  room_count: number;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  special_requests: string;
  room_price: number;
  tax_amount: number;
  platform_fee: number;
  total_amount: number;
  payment_method: string;
  early_checkin: boolean;
  late_checkout: boolean;
  hotel?: {
    name: string;
    city: string;
    state: string;
    address: string;
    star_rating: number;
    check_in_time: string;
    check_out_time: string;
  };
  room?: {
    room_type: string;
    bed_type: string;
    size_sqft: number;
    breakfast_incl: boolean;
    free_cancellation: boolean;
    amenities: string;
  };
};

const STATUS_CONFIG: Record<string, { label: string; cls: string; icon: any }> = {
  confirmed:   { label: "Confirmed",   cls: "bg-teal/10 text-teal border-teal/20",           icon: CheckCircle2 },
  pending:     { label: "Pending",     cls: "bg-warning/10 text-warning border-warning/20",  icon: Clock3       },
  checked_in:  { label: "Checked In",  cls: "bg-teal/10 text-teal border-teal/20",           icon: CheckCircle2 },
  checked_out: { label: "Checked Out", cls: "bg-purple/10 text-purple border-purple/20",     icon: CheckCircle2 },
  cancelled:   { label: "Cancelled",   cls: "bg-danger/10 text-danger border-danger/20",     icon: XCircle      },
};

export default function HotelBookingDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { format: fmt } = useCurrency();
  const [booking, setBooking] = useState<HotelBookingDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    apiGet<HotelBookingDetail>(`/api/hotels/bookings/${id}`)
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
  const amenities = (booking.room?.amenities ?? "").split(",").filter(Boolean);

  const shareWhatsApp = () => {
    const ci = booking.check_in ? new Date(booking.check_in).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "";
    const co = booking.check_out ? new Date(booking.check_out).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "";
    const msg = `My IndieYatra hotel stay is confirmed!\nRef: ${booking.booking_ref}\n${booking.hotel?.name ?? ""}, ${booking.hotel?.city ?? ""}\nCheck-in: ${ci} | Check-out: ${co}\n${booking.nights} night${booking.nights !== 1 ? "s" : ""} · ${booking.room?.room_type ?? ""}\nTotal: ${fmt(booking.total_amount)}`;
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
                <span className="chip bg-hotel/10 text-hotel border border-hotel/20 text-[10px]">Hotel</span>
              </div>
              <h1 className="font-display text-2xl md:text-3xl font-bold">{booking.hotel?.name ?? "—"}</h1>
              <div className="flex items-center gap-1.5 text-sm text-text-muted mt-1">
                {booking.hotel?.star_rating && (
                  <span className="flex items-center gap-0.5">
                    {Array.from({ length: booking.hotel.star_rating }).map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-hotel text-hotel" />
                    ))}
                  </span>
                )}
                <span>{booking.hotel?.city}{booking.hotel?.state ? `, ${booking.hotel.state}` : ""}</span>
              </div>
              {booking.hotel?.address && (
                <div className="text-xs text-text-muted mt-0.5">{booking.hotel.address}</div>
              )}
            </div>
            <div className="text-right">
              <div className="text-xs text-text-muted">Total paid</div>
              <div className="font-display text-2xl font-bold text-hotel">{fmt(booking.total_amount)}</div>
            </div>
          </div>
        </div>

        {/* Stay details */}
        <div className="card p-5">
          <h3 className="font-semibold mb-4">Stay Details</h3>
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div className="p-4 bg-bg-elevated rounded-xl">
              <div className="text-[10px] text-text-muted uppercase mb-1">Check-in</div>
              <div className="font-display text-xl font-bold">
                {booking.check_in ? new Date(booking.check_in).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
              </div>
              <div className="text-xs text-text-muted mt-0.5">After {booking.hotel?.check_in_time ?? "14:00"}</div>
              {booking.early_checkin && <div className="text-[10px] text-hotel mt-1">Early check-in requested</div>}
            </div>
            <div className="p-4 bg-bg-elevated rounded-xl">
              <div className="text-[10px] text-text-muted uppercase mb-1">Check-out</div>
              <div className="font-display text-xl font-bold">
                {booking.check_out ? new Date(booking.check_out).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
              </div>
              <div className="text-xs text-text-muted mt-0.5">Before {booking.hotel?.check_out_time ?? "12:00"}</div>
              {booking.late_checkout && <div className="text-[10px] text-hotel mt-1">Late check-out requested</div>}
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <div className="flex items-center gap-2 p-3 bg-bg-elevated rounded-md">
              <Calendar className="w-4 h-4 text-hotel" />
              <div>
                <div className="text-[10px] text-text-muted uppercase">Duration</div>
                <div className="font-medium">{booking.nights} night{booking.nights !== 1 ? "s" : ""}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-bg-elevated rounded-md">
              <User className="w-4 h-4 text-hotel" />
              <div>
                <div className="text-[10px] text-text-muted uppercase">Guests / Rooms</div>
                <div className="font-medium">{booking.guests} guests · {booking.room_count} room{booking.room_count !== 1 ? "s" : ""}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-bg-elevated rounded-md">
              <Building2 className="w-4 h-4 text-hotel" />
              <div>
                <div className="text-[10px] text-text-muted uppercase">Room type</div>
                <div className="font-medium">{booking.room?.room_type ?? "—"} · {booking.room?.bed_type ?? ""}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Room amenities */}
        {(amenities.length > 0 || booking.room?.breakfast_incl) && (
          <div className="card p-5">
            <h3 className="font-semibold mb-3">Room Features</h3>
            <div className="flex flex-wrap gap-2">
              {booking.room?.breakfast_incl && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-hotel/10 text-hotel rounded-full text-xs font-medium">
                  <UtensilsCrossed className="w-3 h-3" /> Breakfast included
                </span>
              )}
              {booking.room?.free_cancellation && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-teal/10 text-teal rounded-full text-xs font-medium">
                  <CheckCircle2 className="w-3 h-3" /> Free cancellation
                </span>
              )}
              {amenities.map((a) => (
                <span key={a} className="flex items-center gap-1.5 px-3 py-1.5 bg-bg-elevated rounded-full text-xs capitalize">
                  {a === "wifi" && <Wifi className="w-3 h-3" />}
                  {a}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Special requests */}
        {booking.special_requests && (
          <div className="card p-5">
            <h3 className="font-semibold mb-2">Special Requests</h3>
            <p className="text-sm text-text-secondary">{booking.special_requests}</p>
          </div>
        )}

        {/* Fare breakdown */}
        <div className="card p-5">
          <h3 className="font-semibold mb-4">Fare Breakdown</h3>
          <div className="space-y-2 text-sm">
            <Row label={`Room price (${booking.nights} night${booking.nights !== 1 ? "s" : ""} × ${booking.room_count} room${booking.room_count !== 1 ? "s" : ""})`} value={fmt(booking.room_price)} />
            <Row label="Taxes" value={fmt(booking.tax_amount)} />
            <Row label="Platform fee" value={fmt(booking.platform_fee)} />
            <div className="border-t border-border pt-2 flex items-center justify-between">
              <span className="font-semibold">Total</span>
              <span className="font-display text-xl font-bold text-hotel">{fmt(booking.total_amount)}</span>
            </div>
          </div>
          {booking.payment_method && (
            <div className="mt-3 pt-3 border-t border-border text-xs text-text-muted">
              Paid via {booking.payment_method.toUpperCase()}
            </div>
          )}
        </div>

        {/* Contact */}
        <div className="card p-5">
          <h3 className="font-semibold mb-3">Guest Contact</h3>
          <div className="space-y-2 text-sm">
            <Row label="Name" value={booking.guest_name || "—"} />
            <Row label="Email" value={booking.guest_email || "—"} />
            <Row label="Phone" value={booking.guest_phone || "—"} />
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
