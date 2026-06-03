"use client";
import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Check, X } from "lucide-react";

// ── Count-up ──────────────────────────────────────────────────────────────────
function CountUp({
  to, prefix = "", suffix = "", duration = 1800,
}: {
  to: number; prefix?: string; suffix?: string; duration?: number;
}) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setVal(Math.round(ease * to));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, to, duration]);

  return <span ref={ref}>{prefix}{val}{suffix}</span>;
}

// ── Stats ─────────────────────────────────────────────────────────────────────
// Counts up to the short Indian-notation number; prefix/suffix carry the unit label
const stats = [
  { label: "Travellers",    value: 20,  prefix: "",  suffix: " Lakh+" },
  { label: "Bus Operators", value: 500, prefix: "",  suffix: "+"      },
  { label: "Trains",        value: 20,  prefix: "",  suffix: "K+"     },
  { label: "Saved by users",value: 500, prefix: "₹", suffix: " Cr+"   },
];

// ── Differentiators ───────────────────────────────────────────────────────────
const diff = [
  {
    feature: "Live GPS bus tracking",
    us: true,
    mmt: false,
    irctc: false,
  },
  {
    feature: "Tatkal opening alerts",
    us: true,
    mmt: false,
    irctc: false,
  },
  {
    feature: "AI multimodal route optimizer",
    us: true,
    mmt: false,
    irctc: false,
  },
  {
    feature: "AI trip planner + concierge",
    us: true,
    mmt: false,
    irctc: false,
  },
  {
    feature: "Bus + Train + Flight in one app",
    us: true,
    mmt: true,
    irctc: false,
  },
  {
    feature: "8 Indian language support",
    us: true,
    mmt: false,
    irctc: false,
  },
];

export function VerticalsShowcase() {
  return (
    <section className="py-24 px-4 max-w-5xl mx-auto">
      {/* Heading */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="text-center mb-16"
      >
        <p className="text-xs uppercase tracking-widest text-saffron font-semibold mb-3">
          Why IndieYatra
        </p>
        <h2 className="font-display text-4xl md:text-5xl font-bold text-white">
          Built different.<br />
          <span className="text-purple-400">For Indian travellers.</span>
        </h2>
      </motion.div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            className="text-center"
          >
            <p className="font-display text-4xl md:text-5xl font-bold text-white">
              <CountUp to={s.value} prefix={s.prefix} suffix={s.suffix} />
            </p>
            <p className="text-slate-400 text-sm mt-1">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Comparison table */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="rounded-2xl border border-white/10 overflow-hidden"
      >
        {/* Table header */}
        <div className="grid grid-cols-[1fr_auto_auto_auto] bg-white/5 border-b border-white/10">
          <div className="px-5 py-3 text-xs text-slate-400 font-medium uppercase tracking-wider">
            Feature
          </div>
          {[
            { name: "IndieYatra", accent: "text-saffron" },
            { name: "MakeMyTrip", accent: "text-slate-400" },
            { name: "IRCTC", accent: "text-slate-400" },
          ].map((c) => (
            <div
              key={c.name}
              className={`w-28 md:w-36 px-3 py-3 text-xs font-semibold text-center ${c.accent}`}
            >
              {c.name}
            </div>
          ))}
        </div>

        {/* Rows */}
        {diff.map((row, i) => (
          <motion.div
            key={row.feature}
            initial={{ opacity: 0, x: -12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.07, duration: 0.4 }}
            className={`grid grid-cols-[1fr_auto_auto_auto] items-center border-b border-white/5 last:border-b-0 ${
              i % 2 === 0 ? "bg-transparent" : "bg-white/[0.02]"
            }`}
          >
            <div className="px-5 py-3.5 text-sm text-white/85">{row.feature}</div>
            {[row.us, row.mmt, row.irctc].map((has, ci) => (
              <div key={ci} className="w-28 md:w-36 flex justify-center py-3.5">
                {has ? (
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-teal-500/15">
                    <Check className="w-3.5 h-3.5 text-teal-400" strokeWidth={2.5} />
                  </span>
                ) : (
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/5">
                    <X className="w-3 h-3 text-slate-600" strokeWidth={2} />
                  </span>
                )}
              </div>
            ))}
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
