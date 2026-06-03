"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plane, ArrowLeft, Check, Plus, Trash2,
  Mail, Phone, Shield, Lock, CheckCircle2,
  Luggage, Utensils, CreditCard, Smartphone, Wallet,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { MobileNav } from "@/components/MobileNav";
import { api, apiPost } from "@/lib/api";
import { useAuth } from "@/lib/auth";

interface FlightDetail {
  schedule: {
    id: string;
    departure_time: string;
    arrival_time: string;
    duration_min: number;
    aircraft: string;
    cabin_class: string;
    base_fare: number;
    taxes_and_fees: number;
    baggage_kg: number;
    has_meal: boolean;
    fare_type: string;
    refund_policy: string;
    airline: { code: string; name: string; color: string };
    from_airport: { iata: string; city: string; terminal: string };
    to_airport: { iata: string; city: string; terminal: string };
    journey_date: string;
  };
  flight_number: string;
}

interface Pax {
  title: string;
  first_name: string;
  last_name: string;
  dob: string;
  gender: string;
  id_type: string;
  id_number: string;
  frequent_flyer: string;
  meal_preference: string;
  extra_baggage_kg: number;
}

const emptyPax = (): Pax => ({
  title: "Mr", first_name: "", last_name: "", dob: "",
  gender: "M", id_type: "aadhaar", id_number: "",
  frequent_flyer: "", meal_preference: "none", extra_baggage_kg: 0,
});

function durStr(min: number) {
  return `${Math.floor(min / 60)}h ${String(min % 60).padStart(2, "0")}m`;
}

function FlightCheckoutInner({ scheduleId }: { scheduleId: string }) {
  const router = useRouter();
  const { user } = useAuth();

  const [data, setData] = useState<FlightDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<"passengers" | "payment" | "confirmed">("passengers");
  const [passengers, setPassengers] = useState<Pax[]>([emptyPax()]);
  const [contactEmail, setContactEmail] = useState(user?.email ?? "");
  const [contactPhone, setContactPhone] = useState(user?.phone ?? "");
  const [insurance, setInsurance] = useState(false);
  const [payMethod, setPayMethod] = useState("upi");
  const [booking, setBooking] = useState<{ pnr: string; booking_ref: string; passengers: { first_name: string; last_name: string; seat_number: string }[] } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api<FlightDetail>(`/api/flights/${scheduleId}`)
      .then(d => setData(d))
      .catch(() => setLoading(false))
      .finally(() => setLoading(false));
  }, [scheduleId]);

  if (loading || !data) {
    return (
      <>
        <Navbar />
        <main className="max-w-5xl mx-auto px-4 py-8 space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="skeleton h-20 rounded-lg" />)}
        </main>
      </>
    );
  }

  const s = data.schedule;
  const paxCount = passengers.length;
  const baseFare = s.base_fare * paxCount;
  const taxes = s.taxes_and_fees * paxCount;
  const mealFee = passengers.filter(p => p.meal_preference !== "none").length * 250;
  const baggageFee = passengers.reduce((sum, p) => sum + p.extra_baggage_kg * 600, 0);
  const insuranceFee = insurance ? 149 * paxCount : 0;
  const platformFee = 250;
  const gst = (baseFare + mealFee) * 0.05;
  const total = baseFare + taxes + mealFee + baggageFee + insuranceFee + platformFee + gst;

  const journeyDate = new Date(s.journey_date).toLocaleDateString("en-IN", {
    weekday: "short", day: "numeric", month: "short",
  });

  const updatePax = (i: number, field: keyof Pax, val: string | number) =>
    setPassengers(p => p.map((x, j) => j === i ? { ...x, [field]: val } : x));

  const handleConfirm = async () => {
    setSubmitting(true); setError("");
    try {
      const res = await apiPost("/api/flights/bookings/create", {
        schedule_id: scheduleId,
        cabin_class: s.cabin_class,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        insurance,
        passengers,
      }) as { pnr: string; booking_ref: string; passengers: { first_name: string; last_name: string; seat_number: string }[] };
      setBooking(res);
      setStep("confirmed");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Booking failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [
    { key: "passengers", label: "Passengers" },
    { key: "payment", label: "Payment" },
    { key: "confirmed", label: "Confirmed" },
  ];

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-6 pb-28 md:pb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary mb-5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {/* Step indicator */}
        {step !== "confirmed" && (
          <div className="flex items-center gap-2 mb-6">
            {steps.slice(0, 2).map((st, i) => (
              <div key={st.key} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step === st.key ? "bg-flight text-white" : "bg-bg-elevated border border-border text-text-muted"
                }`}>
                  {step === "payment" && i === 0 ? <Check className="w-3.5 h-3.5" /> : i + 1}
                </div>
                <span className={`text-sm ${step === st.key ? "text-flight font-medium" : "text-text-muted"}`}>{st.label}</span>
                {i < 1 && <div className="w-8 h-px bg-border" />}
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-6">
          {/* Main form */}
          <div className="flex-1 min-w-0">
            {/* Flight summary card */}
            <div className="card p-4 mb-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-bold mb-0.5" style={{ color: s.airline.color || "#06B6D4" }}>
                    {s.airline.name} · {data.flight_number}
                  </div>
                  <div className="text-xs text-text-muted">{s.aircraft} · {journeyDate}</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-lg font-bold font-mono">{s.departure_time}</div>
                    <div className="text-xs text-flight font-semibold">{s.from_airport.iata}</div>
                  </div>
                  <div className="flex flex-col items-center gap-0.5">
                    <div className="text-[10px] text-text-muted">{durStr(s.duration_min)}</div>
                    <Plane className="w-4 h-4 text-flight" />
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold font-mono">{s.arrival_time}</div>
                    <div className="text-xs text-flight font-semibold">{s.to_airport.iata}</div>
                  </div>
                </div>
              </div>
            </div>

            {step === "passengers" && (
              <div className="space-y-5">
                {passengers.map((p, i) => (
                  <div key={i} className="card p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-sm">Passenger {i + 1}</h3>
                      {passengers.length > 1 && (
                        <button onClick={() => setPassengers(arr => arr.filter((_, j) => j !== i))} className="text-danger hover:opacity-80">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                      <div>
                        <label className="text-xs text-text-muted font-medium block mb-1">Title</label>
                        <select className="input text-sm w-full" value={p.title} onChange={e => updatePax(i, "title", e.target.value)}>
                          {["Mr", "Mrs", "Ms", "Dr"].map(t => <option key={t}>{t}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-text-muted font-medium block mb-1">First Name</label>
                        <input className="input text-sm w-full" value={p.first_name} onChange={e => updatePax(i, "first_name", e.target.value)} placeholder="As on ID" />
                      </div>
                      <div>
                        <label className="text-xs text-text-muted font-medium block mb-1">Last Name</label>
                        <input className="input text-sm w-full" value={p.last_name} onChange={e => updatePax(i, "last_name", e.target.value)} placeholder="As on ID" />
                      </div>
                      <div>
                        <label className="text-xs text-text-muted font-medium block mb-1">Date of Birth</label>
                        <input type="date" className="input text-sm w-full" value={p.dob} onChange={e => updatePax(i, "dob", e.target.value)} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                      <div>
                        <label className="text-xs text-text-muted font-medium block mb-1">Gender</label>
                        <select className="input text-sm w-full" value={p.gender} onChange={e => updatePax(i, "gender", e.target.value)}>
                          <option value="M">Male</option>
                          <option value="F">Female</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-text-muted font-medium block mb-1">ID Type</label>
                        <select className="input text-sm w-full" value={p.id_type} onChange={e => updatePax(i, "id_type", e.target.value)}>
                          <option value="aadhaar">Aadhaar</option>
                          <option value="passport">Passport</option>
                          <option value="pan">PAN</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-text-muted font-medium block mb-1">ID Number</label>
                        <input className="input text-sm w-full font-mono" value={p.id_number} onChange={e => updatePax(i, "id_number", e.target.value)} placeholder="XXXX XXXX XXXX" />
                      </div>
                      <div>
                        <label className="text-xs text-text-muted font-medium block mb-1">Frequent Flyer</label>
                        <input className="input text-sm w-full" value={p.frequent_flyer} onChange={e => updatePax(i, "frequent_flyer", e.target.value)} placeholder="Optional" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-text-muted font-medium block mb-1">Meal Preference</label>
                        <select className="input text-sm w-full" value={p.meal_preference} onChange={e => updatePax(i, "meal_preference", e.target.value)}>
                          <option value="none">No meal (+₹0)</option>
                          <option value="veg">Vegetarian (+₹250)</option>
                          <option value="nonveg">Non-vegetarian (+₹250)</option>
                          <option value="jain">Jain (+₹250)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-text-muted font-medium block mb-1">Extra Baggage</label>
                        <select className="input text-sm w-full" value={p.extra_baggage_kg} onChange={e => updatePax(i, "extra_baggage_kg", parseInt(e.target.value))}>
                          <option value={0}>None</option>
                          <option value={5}>+5kg (₹3,000)</option>
                          <option value={10}>+10kg (₹6,000)</option>
                          <option value={15}>+15kg (₹9,000)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}

                {passengers.length < 6 && (
                  <button
                    onClick={() => setPassengers(p => [...p, emptyPax()])}
                    className="btn-secondary flex items-center gap-2 text-sm"
                  >
                    <Plus className="w-4 h-4" /> Add Passenger
                  </button>
                )}

                {/* Contact */}
                <div className="card p-5">
                  <h3 className="font-semibold text-sm mb-4">Contact Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-text-muted font-medium block mb-1 flex items-center gap-1">
                        <Mail className="w-3 h-3" /> Email
                      </label>
                      <input className="input text-sm w-full" value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="for e-ticket" />
                    </div>
                    <div>
                      <label className="text-xs text-text-muted font-medium block mb-1 flex items-center gap-1">
                        <Phone className="w-3 h-3" /> Phone
                      </label>
                      <input className="input text-sm w-full" value={contactPhone} onChange={e => setContactPhone(e.target.value)} placeholder="for SMS alerts" />
                    </div>
                  </div>
                </div>

                {/* Insurance */}
                <label className="card p-4 flex items-start gap-3 cursor-pointer hover:border-flight/40 transition-all">
                  <input type="checkbox" checked={insurance} onChange={e => setInsurance(e.target.checked)} className="accent-flight mt-0.5" />
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Shield className="w-4 h-4 text-flight" /> Travel Insurance
                      <span className="text-flight font-bold">₹149/person</span>
                    </div>
                    <p className="text-xs text-text-muted mt-0.5">
                      Covers trip cancellation, medical emergencies, and baggage loss up to ₹2 lakhs.
                    </p>
                  </div>
                </label>

                <button
                  onClick={() => setStep("payment")}
                  disabled={passengers.some(p => !p.first_name || !p.last_name)}
                  className="w-full flex items-center justify-center gap-2 text-white font-semibold py-3 rounded-md transition-all active:scale-95 disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)" }}
                >
                  Proceed to Payment
                </button>
              </div>
            )}

            {step === "payment" && (
              <div className="space-y-4">
                <div className="card p-5">
                  <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-success" /> Secure Payment
                  </h3>
                  <div className="space-y-2">
                    {[
                      { key: "upi", label: "UPI", sub: "GPay, PhonePe, Paytm", icon: <Smartphone className="w-4 h-4" /> },
                      { key: "card", label: "Credit / Debit Card", sub: "Visa, Mastercard, RuPay", icon: <CreditCard className="w-4 h-4" /> },
                      { key: "netbanking", label: "Net Banking", sub: "All major banks", icon: <Wallet className="w-4 h-4" /> },
                    ].map(m => (
                      <label key={m.key} className={`flex items-center gap-3 p-3 rounded-md border cursor-pointer transition-all ${
                        payMethod === m.key ? "border-flight bg-flight/5" : "border-border hover:border-border-hover"
                      }`}>
                        <input type="radio" checked={payMethod === m.key} onChange={() => setPayMethod(m.key)} className="accent-flight" />
                        <span className="text-flight">{m.icon}</span>
                        <div>
                          <div className="text-sm font-medium">{m.label}</div>
                          <div className="text-xs text-text-muted">{m.sub}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {error && <p className="text-danger text-sm">{error}</p>}

                <button
                  onClick={handleConfirm}
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 text-white font-semibold py-3 rounded-md transition-all active:scale-95 disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)" }}
                >
                  {submitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <><Lock className="w-4 h-4" /> Pay ₹{Math.round(total).toLocaleString()}</>
                  )}
                </button>
              </div>
            )}

            {step === "confirmed" && booking && (
              <div className="card p-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-success/10 border border-success/20 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8 text-success" />
                </div>
                <h2 className="font-display text-2xl font-bold">Booking Confirmed!</h2>
                <div className="flex flex-col items-center gap-1">
                  <div className="text-xs text-text-muted">PNR</div>
                  <div className="font-mono text-2xl font-bold text-flight tracking-widest">{booking.pnr}</div>
                  <div className="text-xs text-text-muted">{booking.booking_ref}</div>
                </div>
                <div className="card p-4 text-left space-y-2 mt-2">
                  {booking.passengers.map((p, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="font-medium">{p.first_name} {p.last_name}</span>
                      <span className="font-mono text-flight font-semibold">Seat {p.seat_number}</span>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-text-secondary">
                  E-ticket sent to <span className="font-medium">{contactEmail}</span>. Check-in opens 48h before departure.
                </p>
                <div className="flex gap-3 justify-center pt-2">
                  <button onClick={() => router.push("/trips")} className="btn-primary text-sm">View My Trips</button>
                  <button onClick={() => router.push("/flights")} className="btn-secondary text-sm">Book Another</button>
                </div>
              </div>
            )}
          </div>

          {/* Fare sidebar */}
          {step !== "confirmed" && (
            <aside className="w-full md:w-72 shrink-0">
              <div className="card p-5 sticky top-20 space-y-3">
                <h3 className="font-semibold text-sm">Fare Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-text-secondary">
                    <span>Base fare × {paxCount}</span>
                    <span className="font-mono">₹{Math.round(baseFare).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-text-secondary">
                    <span>Taxes &amp; fees</span>
                    <span className="font-mono">₹{Math.round(taxes).toLocaleString()}</span>
                  </div>
                  {mealFee > 0 && (
                    <div className="flex justify-between text-text-secondary">
                      <span>Meal</span>
                      <span className="font-mono">₹{Math.round(mealFee).toLocaleString()}</span>
                    </div>
                  )}
                  {baggageFee > 0 && (
                    <div className="flex justify-between text-text-secondary">
                      <span>Extra baggage</span>
                      <span className="font-mono">₹{Math.round(baggageFee).toLocaleString()}</span>
                    </div>
                  )}
                  {insuranceFee > 0 && (
                    <div className="flex justify-between text-text-secondary">
                      <span>Insurance</span>
                      <span className="font-mono">₹{Math.round(insuranceFee).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-text-secondary">
                    <span>Platform fee</span>
                    <span className="font-mono">₹{platformFee}</span>
                  </div>
                  <div className="flex justify-between text-text-secondary">
                    <span>GST (5%)</span>
                    <span className="font-mono">₹{Math.round(gst).toLocaleString()}</span>
                  </div>
                  <div className="border-t border-border pt-2 flex justify-between font-bold text-text-primary">
                    <span>Total</span>
                    <span className="text-flight font-mono text-lg">₹{Math.round(total).toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-text-muted pt-1">
                  <Lock className="w-3 h-3 text-success shrink-0" />
                  256-bit SSL secured
                </div>
                <div className="pt-1 border-t border-border text-xs text-text-muted space-y-1">
                  <div className="flex items-center gap-1.5"><Luggage className="w-3 h-3" /> {s.baggage_kg}kg check-in included</div>
                  {s.has_meal && <div className="flex items-center gap-1.5"><Utensils className="w-3 h-3" /> Meal included</div>}
                  <div className="text-text-muted">{s.refund_policy}</div>
                </div>
              </div>
            </aside>
          )}
        </div>
      </main>
      <MobileNav />
    </>
  );
}

export default function FlightCheckoutPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<div className="p-8 text-text-muted">Loading…</div>}>
      <FlightCheckoutInner scheduleId={params.id} />
    </Suspense>
  );
}
