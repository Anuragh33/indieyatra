"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Train, ArrowLeft, Check, ChevronLeft, ChevronRight,
  Plus, Trash2, Mail, Phone, Shield, Lock,
  CheckCircle2, Zap, Coffee, User, CreditCard,
  Smartphone, Building2, Wallet,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { MobileNav } from "@/components/MobileNav";
import { api, apiPost, getToken } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/Toast";
import { motion, AnimatePresence } from "framer-motion";

// ── Types ──────────────────────────────────────────────────────
interface ScheduleDetail {
  schedule: {
    id: string;
    journey_date: string;
    departure_time: string;
    arrival_time: string;
    arrival_day: number;
    duration_min: number;
    train: {
      number: string;
      name: string;
      train_type: string;
      is_superfast: boolean;
      has_pantry: boolean;
    };
    from_station: { code: string; name: string; city: string };
    to_station: { code: string; name: string; city: string };
  };
  classes: {
    class: string;
    available: number;
    rac: number;
    waitlist_count: number;
    base_fare: number;
    tatkal_fare: number;
    status: "AVAILABLE" | "RAC" | "WL" | "REGRET";
  }[];
}

interface ConfirmedBooking {
  pnr: string;
  booking_ref: string;
  status: string;
  class: string;
  quota: string;
  total_amount: number;
  passengers: {
    full_name: string;
    coach: string;
    berth_number: string;
    status: string;
  }[];
}

const RESERVATION_FEE: Record<string, number> = {
  "1A": 60, "2A": 50, "3A": 40, "SL": 20, "CC": 30, "EC": 60, "2S": 15,
};
const BERTH_PREFS = ["Lower", "Middle", "Upper", "Side Lower", "Side Upper"];
const MEAL_PREFS = ["Veg", "Non-Veg", "Jain", "None"];
const STEP_KEYS = ["review", "passengers", "payment", "confirm"] as const;
type StepKey = typeof STEP_KEYS[number];
const PAYMENT_METHODS = [
  { k: "upi",        label: "UPI",         icon: Smartphone, sub: "GPay · PhonePe · Paytm" },
  { k: "card",       label: "Card",        icon: CreditCard, sub: "Credit / Debit · Visa · Rupay" },
  { k: "netbanking", label: "Net Banking", icon: Building2,  sub: "All major banks" },
  { k: "wallet",     label: "Wallet",      icon: Wallet,     sub: "Paytm · Amazon Pay" },
] as const;

function emptyPassenger() {
  return {
    full_name: "",
    age: "",
    gender: "M",
    berth_preference: "Lower",
    id_type: "aadhaar",
    id_number: "",
    is_senior: false,
    meal_preference: "Veg",
  };
}

// ── Main checkout component ─────────────────────────────────────
function TrainCheckoutContent({ scheduleId }: { scheduleId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initClass = searchParams.get("class") ?? "";
  const { user } = useAuth();
  const { error: toastError, success: toastSuccess } = useToast();

  const [data, setData] = useState<ScheduleDetail | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [step, setStep] = useState<StepKey>("review");
  const [selClass, setSelClass] = useState(initClass);
  const [quota, setQuota] = useState<"GN" | "TQ">("GN");
  const [insurance, setInsurance] = useState(false);
  const [passengers, setPassengers] = useState([emptyPassenger()]);
  const [contact, setContact] = useState({ email: "", phone: "" });
  const [payMethod, setPayMethod] = useState<"upi" | "card" | "netbanking" | "wallet">("upi");
  const [upiId, setUpiId] = useState("");
  const [card, setCard] = useState({ num: "", exp: "", cvv: "" });
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState<ConfirmedBooking | null>(null);

  useEffect(() => {
    api<ScheduleDetail>(`/api/trains/schedule/${scheduleId}`)
      .then(d => {
        setData(d);
        if (!selClass) {
          const avail = d.classes.find(c => c.status !== "REGRET") ?? d.classes[0];
          if (avail) setSelClass(avail.class);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingData(false));
  }, [scheduleId]);

  useEffect(() => {
    if (user) {
      setContact(c => ({ ...c, email: c.email || user.email }));
      setPassengers(ps => ps.map((p, i) =>
        i === 0 && !p.full_name ? { ...p, full_name: user.full_name } : p
      ));
    }
  }, [user]);

  if (loadingData) {
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
          <Link href="/trains" className="btn-secondary mt-4 inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to search
          </Link>
        </main>
      </>
    );
  }

  const { schedule, classes } = data;
  const sc = classes.find(c => c.class === selClass);
  const reservFee = RESERVATION_FEE[selClass] ?? 40;
  const superfastFee = schedule.train.is_superfast ? 45 : 0;
  const farePerPax = quota === "TQ" ? (sc?.tatkal_fare ?? 0) : (sc?.base_fare ?? 0);
  const baseTotalFare = farePerPax * passengers.length;
  const gst = Math.round((baseTotalFare + reservFee + superfastFee) * 0.05);
  const irctcFee = 15 * passengers.length;
  const insuranceFee = insurance ? 35 * passengers.length : 0;
  const total = baseTotalFare + reservFee + superfastFee + gst + irctcFee + insuranceFee;

  const journeyDate = new Date(schedule.journey_date).toLocaleDateString("en-IN", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });

  const addPassenger = () => {
    if (passengers.length >= 6) return;
    setPassengers([...passengers, emptyPassenger()]);
  };

  const removePassenger = (i: number) => {
    if (passengers.length === 1) return;
    setPassengers(passengers.filter((_, idx) => idx !== i));
  };

  const updatePassenger = (i: number, field: string, value: string | boolean) => {
    setPassengers(ps => ps.map((p, idx) => idx === i ? { ...p, [field]: value } : p));
  };

  const validate = (): boolean => {
    if (step === "review") {
      if (!selClass) { toastError("Select a class to continue"); return false; }
      if (!getToken()) { router.push("/login?redirect=" + encodeURIComponent(`/checkout/train/${scheduleId}?class=${selClass}`)); return false; }
    }
    if (step === "passengers") {
      for (const p of passengers) {
        if (!p.full_name.trim() || !p.age) { toastError("Fill name and age for all passengers"); return false; }
        const age = parseInt(p.age as string);
        if (isNaN(age) || age < 1 || age > 120) { toastError("Enter a valid age"); return false; }
      }
      if (!contact.email.trim() || !contact.phone.trim()) { toastError("Contact email and phone are required"); return false; }
    }
    return true;
  };

  const next = () => {
    if (!validate()) return;
    if (step === "review") setStep("passengers");
    else if (step === "passengers") setStep("payment");
    else if (step === "payment") submit();
  };

  const back = () => {
    if (step === "passengers") setStep("review");
    else if (step === "payment") setStep("passengers");
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      const booking = await apiPost<ConfirmedBooking>("/api/trains/bookings/create", {
        schedule_id: scheduleId,
        class: selClass,
        quota,
        passengers: passengers.map(p => ({
          ...p,
          age: parseInt(p.age as string),
        })),
        contact_email: contact.email,
        contact_phone: contact.phone,
        insurance,
      });
      setConfirmed(booking);
      setStep("confirm");
      toastSuccess("Train booked!");
    } catch (e: unknown) {
      toastError((e as Error).message || "Booking failed");
    } finally {
      setSubmitting(false);
    }
  };

  const STEP_LABELS: Record<StepKey, string> = {
    review: "Review",
    passengers: "Passengers",
    payment: "Payment",
    confirm: "Confirm",
  };

  return (
    <>
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 md:px-6 py-6 pb-24 md:pb-12">
        {/* Stepper */}
        <div className="mb-6">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {STEP_KEYS.map((k, i) => {
              const idx = STEP_KEYS.findIndex(x => x === step);
              const isDone = i < idx;
              const isActive = k === step;
              return (
                <div key={k} className="flex-1 flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm border-2 transition ${
                      isDone ? "bg-teal border-teal text-white"
                        : isActive ? "border-train text-white"
                        : "border-border text-text-muted"
                    }`}
                      style={isActive ? { background: "linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)" } : {}}>
                      {isDone ? <Check className="w-4 h-4" /> : i + 1}
                    </div>
                    <div className={`text-[10px] mt-1 uppercase tracking-wider ${isActive ? "text-train" : "text-text-muted"}`}>
                      {STEP_LABELS[k]}
                    </div>
                  </div>
                  {i < STEP_KEYS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 mb-4 ${isDone ? "bg-teal" : "bg-border"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid md:grid-cols-[1fr_340px] gap-6">
          <div>
            <AnimatePresence mode="wait">
              {/* ── Step 1: Review ── */}
              {step === "review" && (
                <StepCard key="review" title="Review Journey">
                  {/* Train info summary */}
                  <div className="bg-train/5 border border-train/15 rounded-lg p-4 mb-5">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="font-mono text-xs text-text-muted">{schedule.train.number}</span>
                      {schedule.train.is_superfast && <Zap className="w-3.5 h-3.5 text-saffron" />}
                      {schedule.train.has_pantry && <Coffee className="w-3.5 h-3.5 text-teal" />}
                    </div>
                    <div className="font-semibold mb-1">{schedule.train.name}</div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-bold font-mono text-lg">{schedule.departure_time}</div>
                        <div className="text-xs font-semibold text-train">{schedule.from_station.code}</div>
                      </div>
                      <div className="flex-1 flex flex-col items-center">
                        <div className="text-xs text-text-muted">{Math.floor(schedule.duration_min / 60)}h {String(schedule.duration_min % 60).padStart(2, "0")}m</div>
                        <div className="flex items-center gap-1 w-full">
                          <div className="h-px flex-1 bg-border" />
                          <Train className="w-3.5 h-3.5 text-train" />
                          <div className="h-px flex-1 bg-border" />
                        </div>
                        <div className="text-[10px] text-text-muted">{journeyDate}</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold font-mono text-lg">
                          {schedule.arrival_time}
                          {schedule.arrival_day > 1 && <span className="text-xs text-warning ml-0.5">+{schedule.arrival_day - 1}</span>}
                        </div>
                        <div className="text-xs font-semibold text-train">{schedule.to_station.code}</div>
                      </div>
                    </div>
                  </div>

                  {/* Class selector */}
                  <div className="mb-5">
                    <label className="text-xs text-text-muted font-medium block mb-2">Select Class</label>
                    <div className="flex flex-wrap gap-2">
                      {classes.map(c => (
                        <button
                          key={c.class}
                          disabled={c.status === "REGRET"}
                          onClick={() => setSelClass(c.class)}
                          className={`px-4 py-2.5 rounded-md text-sm font-medium border transition-all disabled:opacity-40 ${
                            selClass === c.class
                              ? "border-train text-white"
                              : "border-border text-text-secondary hover:border-border-hover"
                          }`}
                          style={selClass === c.class ? { background: "linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)" } : {}}
                        >
                          <span className="font-mono font-bold">{c.class}</span>
                          <span className={`ml-2 text-[10px] ${
                            c.status === "AVAILABLE" ? "text-success" : c.status === "RAC" ? "text-warning" : c.status === "WL" ? "text-saffron" : "text-text-muted"
                          } ${selClass === c.class ? "!text-white/80" : ""}`}>
                            {c.status === "AVAILABLE" ? `${c.available} AVL` : c.status === "RAC" ? `RAC` : c.status === "WL" ? `WL ${c.waitlist_count}` : "Regret"}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quota */}
                  <div className="mb-5">
                    <label className="text-xs text-text-muted font-medium block mb-2">Quota</label>
                    <div className="flex gap-2">
                      {(["GN", "TQ"] as const).map(q => (
                        <button
                          key={q}
                          onClick={() => setQuota(q)}
                          className={`flex-1 py-2.5 rounded-md text-sm border transition ${
                            quota === q ? "border-train text-white" : "border-border hover:border-border-hover"
                          }`}
                          style={quota === q ? { background: "linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)" } : {}}
                        >
                          <span className="font-semibold">{q}</span>
                          <span className="ml-2 text-xs opacity-70">{q === "GN" ? "General" : "Tatkal"}</span>
                        </button>
                      ))}
                    </div>
                    {quota === "TQ" && (
                      <p className="mt-2 text-xs text-warning">Tatkal charges apply. Non-refundable. Opens 1 day before departure.</p>
                    )}
                  </div>

                  {/* Insurance */}
                  <label className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-border-hover cursor-pointer transition">
                    <input
                      type="checkbox"
                      checked={insurance}
                      onChange={e => setInsurance(e.target.checked)}
                      className="accent-train w-4 h-4"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium flex items-center gap-2">
                        <Shield className="w-4 h-4 text-train" /> Travel Insurance
                        <span className="text-xs font-normal text-text-muted">₹35/person</span>
                      </div>
                      <p className="text-xs text-text-muted mt-0.5">Covers trip cancellation, baggage loss, medical emergencies</p>
                    </div>
                  </label>
                </StepCard>
              )}

              {/* ── Step 2: Passengers ── */}
              {step === "passengers" && (
                <StepCard key="passengers" title="Passenger Details">
                  <div className="space-y-5">
                    {passengers.map((p, i) => (
                      <div key={i} className="border border-border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm font-semibold">
                            <User className="w-4 h-4 text-train" />
                            Passenger {i + 1}
                          </div>
                          {passengers.length > 1 && (
                            <button onClick={() => removePassenger(i)} className="text-text-muted hover:text-danger transition">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-text-muted mb-1.5 block">Full Name *</label>
                            <input
                              value={p.full_name}
                              onChange={e => updatePassenger(i, "full_name", e.target.value)}
                              placeholder="As on ID proof"
                              className="input"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-text-muted mb-1.5 block">Age *</label>
                            <input
                              type="number"
                              value={p.age}
                              onChange={e => updatePassenger(i, "age", e.target.value)}
                              placeholder="28"
                              min="1"
                              max="120"
                              className="input"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-xs text-text-muted mb-1.5 block">Gender</label>
                          <div className="flex gap-2">
                            {["M", "F", "Other"].map(g => (
                              <button
                                key={g}
                                onClick={() => updatePassenger(i, "gender", g)}
                                className={`flex-1 py-2 rounded-md text-sm border transition ${
                                  p.gender === g ? "border-train text-white" : "border-border hover:border-border-hover"
                                }`}
                                style={p.gender === g ? { background: "linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)" } : {}}
                              >
                                {g === "M" ? "Male" : g === "F" ? "Female" : "Other"}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-text-muted mb-1.5 block">Berth Preference</label>
                            <select
                              value={p.berth_preference}
                              onChange={e => updatePassenger(i, "berth_preference", e.target.value)}
                              className="input"
                            >
                              {BERTH_PREFS.map(b => <option key={b}>{b}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="text-xs text-text-muted mb-1.5 block">Meal Preference</label>
                            <select
                              value={p.meal_preference}
                              onChange={e => updatePassenger(i, "meal_preference", e.target.value)}
                              className="input"
                            >
                              {MEAL_PREFS.map(m => <option key={m}>{m}</option>)}
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-text-muted mb-1.5 block">ID Type</label>
                            <select
                              value={p.id_type}
                              onChange={e => updatePassenger(i, "id_type", e.target.value)}
                              className="input"
                            >
                              <option value="aadhaar">Aadhaar</option>
                              <option value="pan">PAN</option>
                              <option value="passport">Passport</option>
                              <option value="driving">Driving Licence</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-xs text-text-muted mb-1.5 block">ID Number</label>
                            <input
                              value={p.id_number}
                              onChange={e => updatePassenger(i, "id_number", e.target.value)}
                              placeholder="Optional"
                              className="input"
                            />
                          </div>
                        </div>

                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="checkbox"
                            checked={p.is_senior}
                            onChange={e => updatePassenger(i, "is_senior", e.target.checked)}
                            className="accent-train"
                          />
                          <span className="text-text-secondary">Senior citizen (60+ years)</span>
                        </label>
                      </div>
                    ))}

                    {passengers.length < 6 && (
                      <button
                        onClick={addPassenger}
                        className="w-full py-2.5 border border-dashed border-border rounded-lg text-sm text-text-secondary hover:border-train hover:text-train flex items-center justify-center gap-2 transition"
                      >
                        <Plus className="w-4 h-4" /> Add Passenger ({passengers.length}/6)
                      </button>
                    )}

                    {/* Contact */}
                    <div className="border-t border-border pt-4 space-y-3">
                      <h4 className="font-semibold text-sm">Contact Information</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-text-muted mb-1.5 block">Email *</label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                            <input
                              type="email"
                              value={contact.email}
                              onChange={e => setContact({ ...contact, email: e.target.value })}
                              className="input pl-10"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-text-muted mb-1.5 block">Phone *</label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                            <input
                              type="tel"
                              value={contact.phone}
                              onChange={e => setContact({ ...contact, phone: e.target.value })}
                              placeholder="+91 98765 43210"
                              className="input pl-10"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </StepCard>
              )}

              {/* ── Step 3: Payment ── */}
              {step === "payment" && (
                <StepCard key="payment" title="Payment">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-5">
                    {PAYMENT_METHODS.map(m => (
                      <button
                        key={m.k}
                        onClick={() => setPayMethod(m.k)}
                        className={`p-3 rounded-md border text-left transition ${
                          payMethod === m.k ? "border-train bg-train/5" : "border-border hover:border-border-hover"
                        }`}
                      >
                        <m.icon className={`w-4 h-4 mb-1.5 ${payMethod === m.k ? "text-train" : "text-text-muted"}`} />
                        <div className="font-medium text-sm">{m.label}</div>
                        <div className="text-[10px] text-text-muted">{m.sub}</div>
                      </button>
                    ))}
                  </div>

                  {payMethod === "upi" && (
                    <div className="space-y-3">
                      <label className="text-xs text-text-muted block">UPI ID</label>
                      <input
                        value={upiId}
                        onChange={e => setUpiId(e.target.value)}
                        placeholder="yourname@oksbi"
                        className="input"
                      />
                      <div className="flex flex-wrap gap-2">
                        {["GPay", "PhonePe", "Paytm", "BHIM"].map(a => (
                          <button key={a} className="chip bg-bg-elevated border border-border text-text-secondary hover:border-train">{a}</button>
                        ))}
                      </div>
                    </div>
                  )}

                  {payMethod === "card" && (
                    <div className="space-y-3">
                      <input value={card.num} onChange={e => setCard({ ...card, num: e.target.value })} placeholder="Card number" className="input" />
                      <div className="grid grid-cols-2 gap-3">
                        <input value={card.exp} onChange={e => setCard({ ...card, exp: e.target.value })} placeholder="MM / YY" className="input" />
                        <input value={card.cvv} onChange={e => setCard({ ...card, cvv: e.target.value })} placeholder="CVV" type="password" className="input" />
                      </div>
                    </div>
                  )}

                  {(payMethod === "netbanking" || payMethod === "wallet") && (
                    <select className="input">
                      <option>Select bank / wallet</option>
                      <option>HDFC Bank</option>
                      <option>ICICI Bank</option>
                      <option>SBI</option>
                      <option>Axis Bank</option>
                    </select>
                  )}

                  <div className="flex flex-wrap items-center gap-2 mt-5 text-[10px] text-text-muted">
                    <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> PCI DSS</span>
                    <span>·</span>
                    <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> SSL Encrypted</span>
                    <span>·</span>
                    <span>Razorpay Secured</span>
                  </div>
                </StepCard>
              )}

              {/* ── Step 4: Confirm ── */}
              {step === "confirm" && confirmed && (
                <StepCard key="confirm" title="Booking Confirmed">
                  <div className="text-center py-6">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                      className="w-20 h-20 rounded-full bg-teal/10 border-2 border-teal flex items-center justify-center mx-auto mb-4"
                    >
                      <CheckCircle2 className="w-10 h-10 text-teal" />
                    </motion.div>
                    <h2 className="font-display text-2xl font-bold mb-1">Booking Confirmed!</h2>
                    <p className="text-text-secondary text-sm mb-5">Ticket details sent to {contact.email}</p>

                    {/* PNR + Ref */}
                    <div className="flex flex-wrap items-center justify-center gap-4 mb-6">
                      <div className="card p-4 text-center min-w-[140px]">
                        <div className="text-xs text-text-muted mb-1">PNR Number</div>
                        <div className="font-mono text-xl font-bold text-train tracking-widest">{confirmed.pnr}</div>
                      </div>
                      <div className="card p-4 text-center min-w-[140px]">
                        <div className="text-xs text-text-muted mb-1">Booking Ref</div>
                        <div className="font-mono text-lg font-bold text-saffron">{confirmed.booking_ref}</div>
                      </div>
                    </div>

                    {/* Seat assignments */}
                    {confirmed.passengers?.length > 0 && (
                      <div className="card overflow-hidden mb-5 text-left">
                        <div className="px-4 py-2.5 bg-bg-elevated border-b border-border text-xs font-semibold text-text-secondary">
                          Seat Assignments
                        </div>
                        {confirmed.passengers.map((p, i) => (
                          <div key={i} className="flex items-center justify-between px-4 py-3 border-b border-border last:border-0">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-train" />
                              <span className="text-sm font-medium">{p.full_name}</span>
                            </div>
                            <div className="text-right text-sm">
                              <div className={`font-semibold ${
                                p.status === "CNF" ? "text-success"
                                  : p.status.startsWith("RAC") ? "text-warning"
                                  : "text-saffron"
                              }`}>{p.status}</div>
                              {p.coach && p.berth_number && (
                                <div className="text-xs text-text-muted font-mono">Coach {p.coach} · Berth {p.berth_number}</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <Link href="/trips" className="btn-primary text-sm">View My Trips</Link>
                      <Link href="/pnr" className="btn-secondary text-sm">Check PNR Status</Link>
                      <Link href="/trains" className="btn-secondary text-sm">Book Another</Link>
                    </div>
                  </div>
                </StepCard>
              )}
            </AnimatePresence>

            {step !== "confirm" && (
              <div className="flex items-center justify-between mt-6">
                {step !== "review" ? (
                  <button onClick={back} className="btn-secondary text-sm flex items-center gap-1">
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                ) : (
                  <button onClick={() => router.back()} className="btn-secondary text-sm flex items-center gap-1">
                    <ArrowLeft className="w-4 h-4" /> Go Back
                  </button>
                )}
                <button
                  onClick={next}
                  disabled={submitting}
                  className="flex items-center gap-2 text-white font-semibold px-6 py-2.5 rounded-md transition-all active:scale-95 hover:opacity-90 disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)" }}
                >
                  {submitting ? "Processing..." : step === "payment" ? `Pay ₹${total.toLocaleString("en-IN")}` : "Continue"}
                  {!submitting && <ChevronRight className="w-4 h-4" />}
                </button>
              </div>
            )}
          </div>

          {/* Fare sidebar */}
          {step !== "confirm" && (
            <aside className="card p-5 h-fit sticky top-20">
              <h3 className="font-semibold mb-3">Fare Summary</h3>
              <div className="text-xs text-text-muted mb-3">
                {schedule.from_station.code} → {schedule.to_station.code} · {selClass} · {quota} · {passengers.length} pax
              </div>
              <div className="space-y-2 text-sm">
                <FareRow label={`Base fare × ${passengers.length}`} value={baseTotalFare} />
                <FareRow label="Reservation fee" value={reservFee} />
                {superfastFee > 0 && <FareRow label="Superfast charge" value={superfastFee} />}
                <FareRow label={`IRCTC fee × ${passengers.length}`} value={irctcFee} />
                <FareRow label="GST (5%)" value={gst} />
                {insurance && <FareRow label={`Insurance × ${passengers.length}`} value={insuranceFee} />}
                <div className="border-t border-border pt-2 flex items-center justify-between font-bold">
                  <span>Total</span>
                  <span className="text-train text-xl font-mono">₹{total.toLocaleString("en-IN")}</span>
                </div>
              </div>
              {quota === "TQ" && sc && (
                <div className="mt-3 text-xs text-text-muted border-t border-border pt-3">
                  Tatkal fare applied: ₹{sc.tatkal_fare}/pax
                </div>
              )}
              <ul className="mt-4 space-y-1.5 text-xs text-text-secondary">
                {["Best price guarantee", "Instant PNR confirmation", "Free cancellation (24h)", "24×7 support"].map(t => (
                  <li key={t} className="flex items-center gap-2">
                    <Check className="w-3 h-3 text-teal shrink-0" />
                    {t}
                  </li>
                ))}
              </ul>
            </aside>
          )}
        </div>
      </main>
      <MobileNav />
    </>
  );
}

// ── Page shell with Suspense ────────────────────────────────────
export default function TrainCheckoutPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={
      <>
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 py-8 space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="skeleton h-20 rounded-lg" />)}
        </main>
      </>
    }>
      <TrainCheckoutContent scheduleId={params.id} />
    </Suspense>
  );
}

function StepCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8 }}
      transition={{ duration: 0.2 }}
      className="card p-5 md:p-6"
    >
      <h2 className="font-display text-xl font-bold mb-4">{title}</h2>
      {children}
    </motion.div>
  );
}

function FareRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between text-text-secondary">
      <span>{label}</span>
      <span className="font-mono font-medium text-text-primary">₹{value.toLocaleString("en-IN")}</span>
    </div>
  );
}
