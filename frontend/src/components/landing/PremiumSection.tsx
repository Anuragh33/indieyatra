"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Crown, Check, X, ArrowRight } from "lucide-react";

const FREE = [
  "Standard booking",
  "Email tickets only",
  "Basic price alerts (3 max)",
  "Standard support",
];

const PREMIUM = [
  "Free cancellation on all buses + hotels",
  "No convenience fees (save ₹150–₹300/booking)",
  "AI Concierge — full access",
  "Early Tatkal access (30 min before public)",
  "Unlimited price alerts",
  "WhatsApp tickets + updates",
  "Free seat selection on flights",
  "Priority 24/7 support",
  "Exclusive member-only deals",
  "Family wallet sharing",
];

export function PremiumSection() {
  const [trips, setTrips] = useState(6);
  const savings = trips * 350;
  const net = savings - 799;
  const breakEven = Math.ceil(799 / 350);

  return (
    <section className="py-20 px-4 md:px-6">
      <div
        className="max-w-7xl mx-auto rounded-3xl border border-purple/20 p-8 md:p-12"
        style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.08) 0%, transparent 60%)" }}
      >
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <Crown className="w-10 h-10 text-hotel mx-auto mb-4" />
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-3">
            Travel more. Spend less.<br />
            <span className="text-purple">Stress never.</span>
          </h2>
          <p className="text-text-secondary text-lg">IndieYatra Premium — ₹799/year</p>
        </motion.div>

        {/* Columns */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10"
        >
          {/* Free */}
          <div className="card p-6">
            <div className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">Free</div>
            <div className="space-y-2.5">
              {FREE.map((item) => (
                <div key={item} className="flex items-center gap-2.5 text-sm text-text-secondary">
                  <Check className="w-4 h-4 text-text-muted shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Premium */}
          <div className="relative rounded-2xl border-2 border-purple/40 bg-purple/5 p-6 overflow-hidden">
            <div className="absolute top-4 right-4">
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-hotel/20 text-hotel border border-hotel/30 uppercase tracking-wider">
                Best Value
              </span>
            </div>
            <div className="flex items-center gap-2 mb-4">
              <Crown className="w-4 h-4 text-hotel" />
              <span className="text-sm font-semibold uppercase tracking-wider text-purple">Premium</span>
            </div>
            <div className="space-y-2.5">
              {PREMIUM.map((item) => (
                <div key={item} className="flex items-center gap-2.5 text-sm text-text-secondary">
                  <Check className="w-4 h-4 text-teal shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Savings calculator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="card p-6 mb-8 max-w-xl mx-auto"
        >
          <h4 className="font-semibold text-center mb-1">How much will you save?</h4>
          <p className="text-xs text-text-muted text-center mb-5">Drag to set your trips per year</p>

          <div className="mb-4">
            <div className="flex justify-between text-xs text-text-muted mb-2">
              <span>1 trip</span>
              <span className="font-semibold text-text-primary">{trips} trips / year</span>
              <span>20 trips</span>
            </div>
            <input
              type="range" min={1} max={20} value={trips}
              onChange={(e) => setTrips(Number(e.target.value))}
              className="w-full accent-purple"
            />
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-bg-elevated rounded-xl p-3">
              <div className="text-[10px] text-text-muted uppercase mb-1">Platform fees saved</div>
              <div className="font-display font-bold text-lg text-teal">₹{savings.toLocaleString("en-IN")}</div>
            </div>
            <div className="bg-bg-elevated rounded-xl p-3">
              <div className="text-[10px] text-text-muted uppercase mb-1">Premium cost</div>
              <div className="font-display font-bold text-lg text-text-secondary">₹799</div>
            </div>
            <div className={`rounded-xl p-3 ${net > 0 ? "bg-teal/10 border border-teal/20" : "bg-bg-elevated"}`}>
              <div className="text-[10px] text-text-muted uppercase mb-1">Net savings</div>
              <div className={`font-display font-bold text-lg ${net > 0 ? "text-teal" : "text-text-secondary"}`}>
                {net > 0 ? `₹${net.toLocaleString("en-IN")}` : `−₹${Math.abs(net).toLocaleString("en-IN")}`}
              </div>
            </div>
          </div>

          <p className="text-xs text-text-muted text-center mt-4">
            {net > 0
              ? `At ${trips} trips/year, Premium pays for itself after just ${breakEven} bookings`
              : `Add ${breakEven - trips} more trips/year to break even`}
          </p>
        </motion.div>

        <div className="text-center">
          <Link href="/premium" className="btn-primary inline-flex items-center gap-2 text-base px-8 py-3">
            Get Premium — ₹799/year <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="text-xs text-text-muted mt-3">Cancel anytime · 7-day free trial</p>
        </div>
      </div>
    </section>
  );
}
