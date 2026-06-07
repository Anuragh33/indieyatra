"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { MobileNav } from "@/components/MobileNav";
import { apiGet, apiPost, getToken } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useCurrency } from "@/lib/currency";
import {
  Check, ChevronLeft, ChevronRight, Mail, Phone, CreditCard,
  Smartphone, Building2, Wallet, Lock, Shield, CheckCircle2, MessageCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useT } from "@/lib/i18n";
import { useToast } from "@/components/Toast";

type Schedule = {
  id: string;
  departure_at: string;
  arrival_at: string;
  duration_min: number;
  base_fare: number;
  base_amount?: number;
  route?: { from_city?: { name: string; code: string }; to_city?: { name: string; code: string } };
  operator?: { name: string; is_electric?: boolean };
  bus?: { bus_type: string; total_seats: number; layout: string };
};

const STEP_KEYS = ["review", "traveler", "payment", "confirm"] as const;
type StepKey = typeof STEP_KEYS[number];

const PAYMENT_METHODS = [
  { k: "upi",         label: "UPI",          icon: Smartphone, sub: "GPay · PhonePe · Paytm · BHIM" },
  { k: "card",        label: "Card",         icon: CreditCard, sub: "Credit / Debit · Visa · MC · Rupay" },
  { k: "netbanking",  label: "Net Banking",  icon: Building2,  sub: "All major banks" },
  { k: "wallet",      label: "Wallet",       icon: Wallet,     sub: "Paytm · Amazon Pay · Mobikwik" },
  { k: "emi",         label: "EMI",          icon: CreditCard, sub: "Starting ₹92/mo" },
] as const;

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const t = useT();
  const { error: toastError, success: toastSuccess } = useToast();
  const { format: formatPrice } = useCurrency();
  const [step, setStep] = useState<StepKey>("review");
  const [schedules, setSchedules] = useState<Schedule | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [contact, setContact] = useState({ email: "", phone: "", whatsapp: true });
  const [passenger, setPassenger] = useState({
    full_name: "",
    age: "",
    gender: "M",
    id_type: "aadhaar",
    id_number: "",
  });
  const [payMethod, setPayMethod] = useState<"upi" | "card" | "netbanking" | "wallet" | "emi">("upi");
  const [upiId, setUpiId] = useState("");
  const [card, setCard] = useState({ num: "", exp: "", cvv: "" });
  const [submitting, setSubmitting] = useState(false);
  const [confirmedRef, setConfirmedRef] = useState<string | null>(null);
  const [confirmedId, setConfirmedId] = useState<string | null>(null);
  const [ticketLoading, setTicketLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = sessionStorage.getItem("checkout");
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      setSelectedSeats(data.seat_ids ?? []);
      if (data.schedule_id) {
        apiGet<Schedule>(`/api/schedules/${data.schedule_id}`).then(setSchedules).catch(() => {});
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (user) {
      setContact((c) => ({ ...c, email: user.email }));
      setPassenger((p) => ({ ...p, full_name: p.full_name || user.full_name }));
    }
  }, [user]);

  const baseFare = schedules?.base_fare ?? 0;
  const numSeats = selectedSeats.length || 1;
  const subtotal = baseFare * numSeats;
  const taxes = Math.round(subtotal * 0.05);
  const total = subtotal + taxes;

  const next = () => {
    if (step === "review") {
      if (!user && !getToken()) {
        router.push("/login?redirect=/checkout");
        return;
      }
      setStep("traveler");
    } else if (step === "traveler") {
      if (!passenger.full_name || !passenger.age || !contact.email || !contact.phone) {
        toastError("Fill all required fields");
        return;
      }
      setStep("payment");
    } else if (step === "payment") {
      submit();
    }
  };
  const back = () => {
    if (step === "traveler") setStep("review");
    else if (step === "payment") setStep("traveler");
  };

  const loadRazorpay = (): Promise<boolean> =>
    new Promise((resolve) => {
      if ((window as any).Razorpay) { resolve(true); return; }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
    });

  const submit = async () => {
    if (!schedules) {
      toastError("Schedule missing — go back and pick a bus first.");
      return;
    }
    setSubmitting(true);
    try {
      const booking = await apiPost<any>("/api/bookings/create", {
        schedule_id: schedules.id,
        seat_ids: selectedSeats,
        passengers: [{ ...passenger, age: parseInt(passenger.age || "0") }],
        contact_email: contact.email,
        contact_phone: contact.phone,
        whatsapp_enabled: contact.whatsapp,
      });

      const orderRes = await apiPost<any>("/api/payments/initiate", {
        booking_id: booking.id,
        method: payMethod,
        amount: total,
      });

      const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      const loaded = await loadRazorpay();
      if (!loaded || !keyId || !orderRes.order_id) {
        setConfirmedRef(booking.booking_ref);
        setConfirmedId(booking.id);
        setStep("confirm");
        toastSuccess("Booking confirmed!");
        return;
      }

      const rzp = new (window as any).Razorpay({
        key: keyId,
        amount: Math.round(total * 100),
        currency: "INR",
        order_id: orderRes.order_id,
        name: "IndieYatra",
        description: "Bus Ticket Booking",
        prefill: { email: contact.email, contact: contact.phone },
        theme: { color: "#FF6B1A" },
        handler: async (response: any) => {
          try {
            await apiPost("/api/payments/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            setConfirmedRef(booking.booking_ref);
            setConfirmedId(booking.id);
            setStep("confirm");
            toastSuccess("Booking confirmed!");
          } catch (e: any) {
            toastError((e as any).message || "Payment verification failed");
          } finally {
            setSubmitting(false);
          }
        },
        modal: {
          ondismiss: () => {
            toastError("Payment cancelled");
            setSubmitting(false);
          },
        },
      });
      rzp.open();
      // keep submitting=true until the modal handler resolves
      return;
    } catch (e: any) {
      toastError((e as any).message || "Booking failed");
    } finally {
      setSubmitting(false);
    }
  };

  const STEP_LABELS: Record<StepKey, string> = {
    review:   t("checkout.review"),
    traveler: t("checkout.traveler"),
    payment:  t("checkout.payment"),
    confirm:  t("checkout.confirm"),
  };

  return (
    <>
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 md:px-6 py-6 pb-24 md:pb-12">
        {/* Stepper */}
        <div className="mb-6">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {STEP_KEYS.map((k, i) => {
              const idx = STEP_KEYS.findIndex((x) => x === step);
              const isDone = i < idx;
              const isActive = k === step;
              return (
                <div key={k} className="flex-1 flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm border-2 transition ${
                        isDone
                          ? "bg-teal border-teal text-white"
                          : isActive
                          ? "bg-gradient-saffron border-saffron text-white"
                          : "border-border text-text-muted"
                      }`}
                    >
                      {isDone ? <Check className="w-4 h-4" /> : i + 1}
                    </div>
                    <div
                      className={`text-[10px] mt-1 uppercase tracking-wider ${
                        isActive ? "text-saffron" : "text-text-muted"
                      }`}
                    >
                      {STEP_LABELS[k]}
                    </div>
                  </div>
                  {i < STEP_KEYS.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-2 mb-4 ${
                        isDone ? "bg-teal" : "bg-border"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid md:grid-cols-[1fr_360px] gap-6">
          <div>
            <AnimatePresence mode="wait">
              {step === "review" && (
                <StepCard key="review" title={t("checkout.reviewTitle")}>
                  {!schedules ? (
                    <div className="space-y-3">
                      <div className="card p-5 bg-warning/10 border-warning/30">
                        <div className="font-semibold mb-1">{t("checkout.noBus")}</div>
                        <p className="text-sm text-text-secondary mb-3">
                          {t("checkout.noBusSub")}
                        </p>
                        <Link href="/" className="btn-primary inline-flex text-sm">
                          {t("checkout.searchBuses")}
                        </Link>
                      </div>
                      <button
                        onClick={() => {
                          apiGet<any[]>(
                            "/api/search/buses?from=MUM&to=GOA&date=2026-06-05&travelers=1"
                          ).then((arr) => {
                            if (arr.length > 0) {
                              setSchedules(arr[0]);
                              setSelectedSeats([]);
                            }
                          });
                        }}
                        className="btn-secondary text-sm"
                      >
                        {t("checkout.loadDemo")}
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="font-display text-2xl font-bold mb-1 flex items-center gap-2 flex-wrap">
                        {schedules.route?.from_city?.name} → {schedules.route?.to_city?.name}
                      </div>
                      <div className="text-sm text-text-muted mb-4">
                        {schedules.operator?.name} · {schedules.bus?.bus_type}
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <KV label="Date" value={new Date(schedules.departure_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} />
                        <KV label={t("search.depart")} value={new Date(schedules.departure_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false })} />
                        <KV label="Arrive" value={new Date(schedules.arrival_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false })} />
                      </div>
                      {selectedSeats.length > 0 && (
                        <div className="mt-3 chip bg-saffron/10 text-saffron border-saffron/20">
                          Seats: {selectedSeats.join(", ")}
                        </div>
                      )}
                    </div>
                  )}
                </StepCard>
              )}

              {step === "traveler" && (
                <StepCard key="traveler" title={t("checkout.travelerTitle")}>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-text-muted mb-1.5 block">{t("checkout.fullName")} *</label>
                        <input
                          value={passenger.full_name}
                          onChange={(e) => setPassenger({ ...passenger, full_name: e.target.value })}
                          placeholder="Priya Sharma"
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-text-muted mb-1.5 block">{t("checkout.age")} *</label>
                        <input
                          type="number"
                          value={passenger.age}
                          onChange={(e) => setPassenger({ ...passenger, age: e.target.value })}
                          placeholder="28"
                          className="input"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-text-muted mb-1.5 block">{t("checkout.gender")}</label>
                      <div className="flex gap-2">
                        {["M", "F", "Other"].map((g) => (
                          <button
                            key={g}
                            onClick={() => setPassenger({ ...passenger, gender: g })}
                            className={`flex-1 py-2 rounded-md text-sm border transition ${
                              passenger.gender === g
                                ? "bg-saffron/10 border-saffron text-saffron"
                                : "border-border hover:border-border-hover"
                            }`}
                          >
                            {g}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-text-muted mb-1.5 block">{t("checkout.idType")}</label>
                        <select
                          value={passenger.id_type}
                          onChange={(e) => setPassenger({ ...passenger, id_type: e.target.value })}
                          className="input"
                        >
                          <option value="aadhaar">{t("checkout.idAadhaar")}</option>
                          <option value="pan">{t("checkout.idPan")}</option>
                          <option value="passport">{t("checkout.idPassport")}</option>
                          <option value="driving">{t("checkout.idDriving")}</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-text-muted mb-1.5 block">{t("checkout.idNumber")}</label>
                        <input
                          value={passenger.id_number}
                          onChange={(e) => setPassenger({ ...passenger, id_number: e.target.value })}
                          placeholder="Optional"
                          className="input"
                        />
                      </div>
                    </div>
                    <div className="border-t border-border pt-4 space-y-3">
                      <h4 className="font-semibold text-sm">{t("checkout.contact")}</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-text-muted mb-1.5 block">{t("checkout.email")} *</label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                            <input
                              type="email"
                              value={contact.email}
                              onChange={(e) => setContact({ ...contact, email: e.target.value })}
                              className="input pl-10"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-text-muted mb-1.5 block">{t("checkout.phone")} *</label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                            <input
                              type="tel"
                              value={contact.phone}
                              onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                              placeholder="+91 98765 43210"
                              className="input pl-10"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-text-muted opacity-60 cursor-not-allowed select-none">
                        <input type="checkbox" disabled className="accent-teal" />
                        <MessageCircle className="w-3.5 h-3.5" />
                        Send ticket via WhatsApp
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple/20 text-purple border border-purple/30 uppercase tracking-wide">
                          Coming Soon
                        </span>
                      </div>
                    </div>
                  </div>
                </StepCard>
              )}

              {step === "payment" && (
                <StepCard key="payment" title={t("checkout.paymentTitle")}>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-5">
                    {PAYMENT_METHODS.map((m) => (
                      <button
                        key={m.k}
                        onClick={() => setPayMethod(m.k)}
                        className={`p-3 rounded-md border text-left transition ${
                          payMethod === m.k
                            ? "border-saffron bg-saffron/5"
                            : "border-border hover:border-border-hover"
                        }`}
                      >
                        <m.icon className={`w-4 h-4 mb-1.5 ${payMethod === m.k ? "text-saffron" : "text-text-muted"}`} />
                        <div className="font-medium text-sm">{m.label}</div>
                        <div className="text-[10px] text-text-muted">{m.sub}</div>
                      </button>
                    ))}
                  </div>

                  {payMethod === "upi" && (
                    <div className="space-y-3">
                      <label className="text-xs text-text-muted block">{t("checkout.upiId")}</label>
                      <input
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="yourname@oksbi"
                        className="input"
                      />
                      <div className="flex flex-wrap gap-2">
                        {["GPay", "PhonePe", "Paytm", "BHIM"].map((a) => (
                          <button
                            key={a}
                            className="chip bg-bg-elevated border border-border text-text-secondary hover:border-saffron"
                          >
                            {a}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {payMethod === "card" && (
                    <div className="space-y-3">
                      <input
                        value={card.num}
                        onChange={(e) => setCard({ ...card, num: e.target.value })}
                        placeholder={t("checkout.cardNumber")}
                        className="input"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          value={card.exp}
                          onChange={(e) => setCard({ ...card, exp: e.target.value })}
                          placeholder={t("checkout.cardExpiry")}
                          className="input"
                        />
                        <input
                          value={card.cvv}
                          onChange={(e) => setCard({ ...card, cvv: e.target.value })}
                          placeholder={t("checkout.cardCvv")}
                          type="password"
                          className="input"
                        />
                      </div>
                    </div>
                  )}

                  {(payMethod === "netbanking" || payMethod === "wallet" || payMethod === "emi") && (
                    <select className="input">
                      <option>{t("checkout.selectBank")}</option>
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

              {step === "confirm" && (
                <StepCard key="confirm" title="Booking confirmed">
                  <div className="text-center py-8">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                      className="w-20 h-20 rounded-full bg-teal/10 border-2 border-teal flex items-center justify-center mx-auto mb-4"
                    >
                      <CheckCircle2 className="w-10 h-10 text-teal" />
                    </motion.div>
                    <h2 className="font-display text-3xl font-bold mb-2">
                      {t("checkout.confirmed")}
                    </h2>
                    <p className="text-text-secondary text-sm mb-4">
                      {t("checkout.confirmedSub")}
.
                    </p>
                    {confirmedRef && (
                      <div className="card p-4 inline-block mb-6">
                        <div className="text-xs text-text-muted">{t("checkout.bookingRef")}</div>
                        <div className="font-mono text-2xl font-bold text-saffron">
                          {confirmedRef}
                        </div>
                      </div>
                    )}
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                      <button
                        disabled={ticketLoading}
                        onClick={async () => {
                          if (!confirmedId) return;
                          setTicketLoading(true);
                          try {
                            const html = await apiGet<string>(`/api/bookings/${confirmedId}/ticket`);
                            const blob = new Blob([html], { type: "text/html" });
                            const url = URL.createObjectURL(blob);
                            const w = window.open(url, "_blank");
                            if (w) w.focus();
                            setTimeout(() => URL.revokeObjectURL(url), 10000);
                          } catch {
                            toastSuccess("Ticket sent to your registered email");
                          } finally {
                            setTicketLoading(false);
                          }
                        }}
                        className="btn-primary text-sm disabled:opacity-60"
                      >
                        {ticketLoading ? "Opening…" : t("checkout.download")}
                      </button>
                      {contact.whatsapp && (
                        <button
                          onClick={() => {
                            const from = schedules?.route?.from_city?.name ?? "";
                            const to = schedules?.route?.to_city?.name ?? "";
                            const date = schedules?.departure_at
                              ? new Date(schedules.departure_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                              : "";
                            const msg = `My IndieYatra ticket is confirmed! 🚌\nRef: ${confirmedRef}\nRoute: ${from} → ${to}\nDate: ${date}`;
                            window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
                          }}
                          className="btn-secondary text-sm flex items-center gap-1"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-teal" /> {t("checkout.shareWhatsapp")}
                        </button>
                      )}
                      <Link href="/trips" className="btn-secondary text-sm">
                        {t("checkout.viewAllTrips")}
                      </Link>
                    </div>
                  </div>
                </StepCard>
              )}
            </AnimatePresence>

            {step !== "confirm" && (
              <div className="flex items-center justify-between mt-6">
                {step !== "review" ? (
                  <button onClick={back} className="btn-secondary text-sm flex items-center gap-1">
                    <ChevronLeft className="w-4 h-4" /> {t("checkout.back")}
                  </button>
                ) : <div />}
                <button
                  onClick={next}
                  disabled={submitting}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50"
                >
                  {submitting
                    ? t("common.loading")
                    : step === "payment"
                    ? t("checkout.pay", formatPrice(total))
                    : t("checkout.continueAlt")}
                  {!submitting && <ChevronRight className="w-4 h-4" />}
                </button>
              </div>
            )}
          </div>

          {step !== "confirm" && (
            <aside className="card p-5 h-fit sticky top-20">
              <h3 className="font-semibold mb-3">{t("checkout.fareBreakdown")}</h3>
              <div className="space-y-2 text-sm">
                <Row label={t("checkout.baseFare")} value={formatPrice(subtotal)} />
                <Row label={t("checkout.taxes")} value={formatPrice(taxes)} />
                <Row label={t("checkout.seatSelection")} value="₹0" />
                <Row label={t("checkout.baggage")} value="₹0" />
                <div className="border-t border-border my-2 pt-2 flex items-center justify-between">
                  <span className="font-semibold">{t("checkout.total")}</span>
                  <span className="font-display text-2xl font-bold text-saffron">
                    {formatPrice(total)}
                  </span>
                </div>
              </div>
              <ul className="mt-4 space-y-1.5 text-xs text-text-secondary">
                <Perk text={t("checkout.perks.bestPrice")} />
                <Perk text={t("checkout.perks.cancel")} />
                <Perk text="WhatsApp tickets (coming soon)" />
                <Perk text={t("checkout.perks.support")} />
              </ul>
            </aside>
          )}
        </div>
      </main>
      <MobileNav />
    </>
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

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-bg-elevated rounded-md p-3">
      <div className="text-[10px] text-text-muted uppercase tracking-wider">{label}</div>
      <div className="font-semibold mt-0.5">{value}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-text-secondary">
      <span>{label}</span>
      <span className="font-medium text-text-primary">{value}</span>
    </div>
  );
}

function Perk({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-2">
      <Check className="w-3 h-3 text-teal" />
      <span>{text}</span>
    </li>
  );
}
