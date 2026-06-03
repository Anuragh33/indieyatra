"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import {
  Building2, ArrowLeft, Check, Mail, Phone, Shield, Lock, CheckCircle2,
  CreditCard, Smartphone, Wallet, Bed, Users, Calendar, Coffee, X,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { MobileNav } from "@/components/MobileNav";
import { api, apiPost } from "@/lib/api";
import { useAuth } from "@/lib/auth";

interface Hotel {
  id: string;
  name: string;
  city: string;
  state: string;
  image_url: string;
  star_rating: number;
  rating: number;
  check_in_time: string;
  check_out_time: string;
}

interface Room {
  id: string;
  room_type: string;
  bed_type: string;
  max_occupancy: number;
  price_per_night: number;
  tax_percent: number;
  breakfast_incl: boolean;
  free_cancellation: boolean;
  cancellation_hours: number;
  amenities: string;
}

type Step = "details" | "payment" | "confirmed";

function HotelCheckoutInner({ hotelId }: { hotelId: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const { user } = useAuth();

  const roomId = params.get("room_id") || "";
  const checkIn = params.get("check_in") || "";
  const checkOut = params.get("check_out") || "";
  const guests = parseInt(params.get("guests") || "2");

  const nights = Math.max(1, Math.ceil(
    (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000
  ));

  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<Step>("details");

  const [guestName, setGuestName] = useState(user?.full_name || "");
  const [guestEmail, setGuestEmail] = useState(user?.email || "");
  const [guestPhone, setGuestPhone] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [earlyCheckin, setEarlyCheckin] = useState(false);
  const [lateCheckout, setLateCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "card" | "netbanking">("upi");
  const [upiId, setUpiId] = useState("");
  const [bookingRef, setBookingRef] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!hotelId || !roomId) return;
    api<{ hotel: Hotel; rooms: Room[] }>(`/api/hotels/${hotelId}`)
      .then(data => {
        setHotel(data.hotel);
        const r = data.rooms.find(r => r.id === roomId);
        setRoom(r ?? data.rooms[0] ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [hotelId, roomId]);

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="max-w-3xl mx-auto px-6 py-12 pb-24">
          <div className="h-40 bg-bg-elevated animate-pulse rounded-xl mb-4" />
          <div className="h-64 bg-bg-elevated animate-pulse rounded-xl" />
        </main>
        <MobileNav />
      </>
    );
  }

  if (!hotel || !room) {
    return (
      <>
        <Navbar />
        <main className="max-w-3xl mx-auto px-6 py-20 text-center pb-24">
          <Building2 className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <div className="font-semibold mb-2">Room not found</div>
          <button onClick={() => router.back()} className="btn-primary">Go back</button>
        </main>
        <MobileNav />
      </>
    );
  }

  const roomPrice = room.price_per_night * nights;
  const taxAmount = Math.round(roomPrice * room.tax_percent / 100 * 100) / 100;
  const platformFee = 250;
  const totalAmount = Math.round((roomPrice + taxAmount + platformFee) * 100) / 100;

  const handleConfirm = async () => {
    if (!guestName.trim() || !guestEmail.trim() || !guestPhone.trim()) {
      setError("Please fill in all required fields.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const result = await apiPost("/api/hotels/bookings/create", {
        hotel_id: hotelId,
        room_id: room.id,
        check_in: checkIn,
        check_out: checkOut,
        guests,
        room_count: 1,
        guest_name: guestName,
        guest_email: guestEmail,
        guest_phone: guestPhone,
        special_requests: specialRequests,
        payment_method: paymentMethod,
        early_checkin: earlyCheckin,
        late_checkout: lateCheckout,
      }) as { booking_ref: string };
      setBookingRef(result.booking_ref);
      setStep("confirmed");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Booking failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });

  if (step === "confirmed") {
    return (
      <>
        <Navbar />
        <main className="max-w-2xl mx-auto px-6 py-16 pb-24 text-center">
          <div className="w-16 h-16 rounded-full bg-success/15 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-9 h-9 text-success" />
          </div>
          <h1 className="font-display text-3xl font-bold mb-2">Booking Confirmed!</h1>
          <p className="text-text-secondary mb-6">Your room has been reserved. Check your email for confirmation details.</p>

          <div className="card p-6 text-left mb-6">
            <div className="flex items-center gap-3 mb-4">
              <img src={hotel.image_url} alt={hotel.name} className="w-16 h-16 rounded-lg object-cover" />
              <div>
                <div className="font-semibold">{hotel.name}</div>
                <div className="text-sm text-text-secondary">{hotel.city}, {hotel.state}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div>
                <div className="text-text-muted text-xs uppercase tracking-wider mb-1">Booking Ref</div>
                <div className="font-mono font-bold text-hotel text-lg">{bookingRef}</div>
              </div>
              <div>
                <div className="text-text-muted text-xs uppercase tracking-wider mb-1">Room</div>
                <div className="font-semibold">{room.room_type}</div>
              </div>
              <div>
                <div className="text-text-muted text-xs uppercase tracking-wider mb-1">Check-in</div>
                <div className="font-medium">{fmtDate(checkIn)} · {hotel.check_in_time}</div>
              </div>
              <div>
                <div className="text-text-muted text-xs uppercase tracking-wider mb-1">Check-out</div>
                <div className="font-medium">{fmtDate(checkOut)} · {hotel.check_out_time}</div>
              </div>
              <div>
                <div className="text-text-muted text-xs uppercase tracking-wider mb-1">Guest</div>
                <div className="font-medium">{guestName}</div>
              </div>
              <div>
                <div className="text-text-muted text-xs uppercase tracking-wider mb-1">Total Paid</div>
                <div className="font-semibold text-hotel">₹{totalAmount.toLocaleString()}</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => router.push("/bookings")} className="btn-primary">
              View My Bookings
            </button>
            <button onClick={() => router.push("/hotels")} className="btn-secondary">
              Book Another Stay
            </button>
          </div>
        </main>
        <MobileNav />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-6 py-6 pb-28 md:pb-12">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to hotel
        </button>

        {/* Steps */}
        <div className="flex items-center gap-2 mb-8">
          {(["details", "payment"] as const).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                step === s ? "bg-hotel text-white" : "bg-bg-elevated text-text-muted border border-border"
              }`}>
                {i + 1}
              </div>
              <span className={`text-sm capitalize ${step === s ? "text-text-primary font-medium" : "text-text-muted"}`}>{s}</span>
              {i < 1 && <div className="w-12 h-px bg-border" />}
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Main form */}
          <div className="md:col-span-2 space-y-4">
            {step === "details" && (
              <>
                {/* Booking summary */}
                <div className="card p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <img src={hotel.image_url} alt={hotel.name} className="w-14 h-14 rounded-lg object-cover shrink-0" />
                    <div>
                      <div className="font-semibold">{hotel.name}</div>
                      <div className="text-xs text-text-secondary">{hotel.city} · {room.room_type} · {room.bed_type} bed</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div className="flex items-center gap-1.5 text-text-secondary">
                      <Calendar className="w-3.5 h-3.5 text-hotel" />
                      <div>
                        <div className="text-[10px] text-text-muted">Check-in</div>
                        <div className="font-medium text-text-primary">{new Date(checkIn).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-text-secondary">
                      <Calendar className="w-3.5 h-3.5 text-hotel" />
                      <div>
                        <div className="text-[10px] text-text-muted">Check-out</div>
                        <div className="font-medium text-text-primary">{new Date(checkOut).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-text-secondary">
                      <Bed className="w-3.5 h-3.5 text-hotel" />
                      <div>
                        <div className="text-[10px] text-text-muted">Nights</div>
                        <div className="font-medium text-text-primary">{nights}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-text-secondary">
                      <Users className="w-3.5 h-3.5 text-hotel" />
                      <div>
                        <div className="text-[10px] text-text-muted">Guests</div>
                        <div className="font-medium text-text-primary">{guests}</div>
                      </div>
                    </div>
                  </div>
                  {room.breakfast_incl && (
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-success">
                      <Coffee className="w-3 h-3" /> Breakfast included
                    </div>
                  )}
                  {room.free_cancellation && (
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-success">
                      <Check className="w-3 h-3" /> Free cancellation until {room.cancellation_hours}h before check-in
                    </div>
                  )}
                </div>

                {/* Guest details */}
                <div className="card p-5">
                  <h2 className="font-semibold mb-4">Guest Details</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="text-xs text-text-muted block mb-1">Full Name *</label>
                      <input
                        className="input text-sm w-full"
                        placeholder="Name as on ID"
                        value={guestName}
                        onChange={e => setGuestName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-text-muted block mb-1">Email *</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
                        <input
                          className="input text-sm w-full pl-9"
                          type="email" placeholder="you@example.com"
                          value={guestEmail}
                          onChange={e => setGuestEmail(e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-text-muted block mb-1">Phone *</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
                        <input
                          className="input text-sm w-full pl-9"
                          type="tel" placeholder="+91 XXXXX XXXXX"
                          value={guestPhone}
                          onChange={e => setGuestPhone(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs text-text-muted block mb-1">Special Requests</label>
                      <textarea
                        className="input text-sm w-full resize-none"
                        rows={2}
                        placeholder="High floor, late check-in, extra pillows…"
                        value={specialRequests}
                        onChange={e => setSpecialRequests(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-4 text-sm">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox" checked={earlyCheckin}
                        onChange={e => setEarlyCheckin(e.target.checked)}
                        className="accent-hotel"
                      />
                      Early check-in (subject to availability)
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox" checked={lateCheckout}
                        onChange={e => setLateCheckout(e.target.checked)}
                        className="accent-hotel"
                      />
                      Late check-out (subject to availability)
                    </label>
                  </div>
                </div>

                {error && (
                  <div className="card p-3 border-error/30 bg-error/5 text-error text-sm flex items-center gap-2">
                    <X className="w-4 h-4 shrink-0" />{error}
                  </div>
                )}

                <button
                  onClick={() => setStep("payment")}
                  className="w-full text-white font-semibold py-3 rounded-lg hover:opacity-90 active:scale-[0.99] transition-all"
                  style={{ background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" }}
                >
                  Continue to Payment
                </button>
              </>
            )}

            {step === "payment" && (
              <>
                <div className="card p-5">
                  <h2 className="font-semibold mb-4">Payment Method</h2>
                  <div className="space-y-3">
                    {([
                      { id: "upi" as const, label: "UPI", icon: <Smartphone className="w-4 h-4" />, desc: "GPay, PhonePe, Paytm, BHIM" },
                      { id: "card" as const, label: "Credit / Debit Card", icon: <CreditCard className="w-4 h-4" />, desc: "Visa, Mastercard, RuPay" },
                      { id: "netbanking" as const, label: "Net Banking", icon: <Wallet className="w-4 h-4" />, desc: "All major banks supported" },
                    ]).map(m => (
                      <label key={m.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        paymentMethod === m.id ? "border-hotel bg-hotel/5" : "border-border hover:border-hotel/30"
                      }`}>
                        <input type="radio" name="payment" className="accent-hotel" checked={paymentMethod === m.id}
                          onChange={() => setPaymentMethod(m.id)} />
                        <span className="text-hotel">{m.icon}</span>
                        <div className="flex-1">
                          <div className="text-sm font-medium">{m.label}</div>
                          <div className="text-xs text-text-muted">{m.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>

                  {paymentMethod === "upi" && (
                    <div className="mt-4">
                      <label className="text-xs text-text-muted block mb-1">UPI ID</label>
                      <input
                        className="input text-sm w-full"
                        placeholder="yourname@upi"
                        value={upiId}
                        onChange={e => setUpiId(e.target.value)}
                      />
                    </div>
                  )}
                </div>

                <div className="card p-4 bg-bg-elevated border-border/50">
                  <div className="flex items-center gap-2 text-xs text-text-secondary mb-1">
                    <Shield className="w-3.5 h-3.5 text-success" /> Payments are secured with 256-bit SSL encryption
                  </div>
                  <div className="flex items-center gap-2 text-xs text-text-secondary">
                    <Lock className="w-3.5 h-3.5 text-success" /> Your card details are never stored
                  </div>
                </div>

                {error && (
                  <div className="card p-3 border-error/30 bg-error/5 text-error text-sm flex items-center gap-2">
                    <X className="w-4 h-4 shrink-0" />{error}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep("details")}
                    className="btn-secondary flex-1"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={submitting}
                    className="flex-1 text-white font-semibold py-3 rounded-lg hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-60"
                    style={{ background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" }}
                  >
                    {submitting ? "Confirming…" : `Pay ₹${totalAmount.toLocaleString()}`}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Price sidebar */}
          <div>
            <div className="card p-4 sticky top-4">
              <h3 className="font-semibold mb-3 text-sm">Price Breakdown</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">
                    ₹{Math.round(room.price_per_night).toLocaleString()} × {nights} night{nights !== 1 ? "s" : ""}
                  </span>
                  <span>₹{Math.round(roomPrice).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">Taxes ({room.tax_percent}%)</span>
                  <span>₹{Math.round(taxAmount).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">Platform fee</span>
                  <span>₹{platformFee}</span>
                </div>
                <div className="border-t border-border pt-2 flex items-center justify-between font-semibold">
                  <span>Total</span>
                  <span className="text-hotel text-lg">₹{totalAmount.toLocaleString()}</span>
                </div>
              </div>

              {room.free_cancellation && (
                <div className="mt-3 p-2 bg-success/5 border border-success/20 rounded-lg text-xs text-success flex items-start gap-1.5">
                  <Check className="w-3 h-3 mt-0.5 shrink-0" />
                  Free cancellation until {room.cancellation_hours}h before check-in
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <MobileNav />
    </>
  );
}

export default function HotelCheckoutPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-text-muted text-sm">Loading checkout…</div>
      </div>
    }>
      <HotelCheckoutInner hotelId={id} />
    </Suspense>
  );
}
