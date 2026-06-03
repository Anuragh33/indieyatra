"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowRight, Plane, Bus, Train, Sparkles, Zap } from "lucide-react";

const POPULAR = [
  { from: "Bangalore", to: "Leh" },
  { from: "Mumbai", to: "Manali" },
  { from: "Delhi", to: "Goa" },
  { from: "Chennai", to: "Varanasi" },
];

const MOCK_RESULTS = [
  { label: "Flight + Bus", icons: ["flight", "bus"] as const, price: 5670, hours: 38, stars: 3 },
  { label: "All Flight",   icons: ["flight"] as const,        price: 8200, hours: 14, stars: 5 },
  { label: "Train + Bus",  icons: ["train", "bus"] as const,  price: 4100, hours: 52, stars: 2 },
];

const iconEl = {
  flight: <Plane  className="w-3.5 h-3.5" />,
  bus:    <Bus    className="w-3.5 h-3.5" />,
  train:  <Train  className="w-3.5 h-3.5" />,
};

const iconColor = {
  flight: "text-cyan-400",
  bus:    "text-saffron",
  train:  "text-indigo-400",
};

function Stars({ n }: { n: number }) {
  return (
    <span className="text-amber-400 text-xs">
      {"★".repeat(n)}<span className="text-white/20">{"★".repeat(5 - n)}</span>
    </span>
  );
}

export function OptimizerTeaser() {
  const router = useRouter();
  const [from, setFrom] = useState("");
  const [to, setTo]     = useState("");
  const [searched, setSearched] = useState(false);

  const canSearch = from.trim().length >= 2 && to.trim().length >= 2;

  const fill = (p: { from: string; to: string }) => {
    setFrom(p.from); setTo(p.to); setSearched(false);
  };

  const goFull = () =>
    router.push(`/optimize?from=${encodeURIComponent(from || "Mumbai")}&to=${encodeURIComponent(to || "Leh")}`);

  return (
    <section className="py-24 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-purple-400 font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" /> Multimodal Optimizer
          </div>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-3">
            Stop searching.<br />
            <span className="text-purple-400">Start optimizing.</span>
          </h2>
          <p className="text-slate-400 text-base">
            Tell us where you want to go. IndieYatra finds the smartest combination of buses, trains and flights.
          </p>
        </motion.div>

        {/* Input strip */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="bg-white/5 border border-white/10 rounded-2xl p-1.5 flex items-center gap-1.5 mb-4"
        >
          <input
            value={from}
            onChange={(e) => { setFrom(e.target.value); setSearched(false); }}
            placeholder="From — Mumbai, Delhi…"
            className="flex-1 bg-transparent text-white placeholder-slate-500 text-sm px-3 py-2.5 focus:outline-none min-w-0"
          />
          <div className="w-px h-5 bg-white/10 flex-shrink-0" />
          <input
            value={to}
            onChange={(e) => { setTo(e.target.value); setSearched(false); }}
            placeholder="To — Leh, Goa…"
            className="flex-1 bg-transparent text-white placeholder-slate-500 text-sm px-3 py-2.5 focus:outline-none min-w-0"
            onKeyDown={(e) => { if (e.key === "Enter" && canSearch) setSearched(true); }}
          />
          <button
            onClick={() => setSearched(true)}
            disabled={!canSearch}
            className="flex-shrink-0 flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-30 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
          >
            <Zap className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Find routes</span>
          </button>
        </motion.div>

        {/* Popular chips */}
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {POPULAR.map((p) => (
            <button
              key={`${p.from}-${p.to}`}
              onClick={() => fill(p)}
              className="text-xs px-3 py-1.5 rounded-full border border-white/10 text-slate-400 hover:border-purple-500/50 hover:text-purple-300 transition-colors"
            >
              {p.from} → {p.to}
            </button>
          ))}
        </div>

        {/* Results */}
        <AnimatePresence>
          {searched && (
            <motion.div
              key="results"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <div className="space-y-2 mb-4">
                {MOCK_RESULTS.map((opt, i) => (
                  <motion.div
                    key={opt.label}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08, duration: 0.3 }}
                    onClick={goFull}
                    className="flex items-center justify-between bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3.5 hover:border-purple-500/40 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        {opt.icons.map((ic, j) => (
                          <span key={j} className={iconColor[ic]}>{iconEl[ic]}</span>
                        ))}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{opt.label}</p>
                        <p className="text-xs text-slate-500">{opt.hours}h journey</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-bold text-purple-300">
                        ₹{opt.price.toLocaleString("en-IN")}
                      </p>
                      <Stars n={opt.stars} />
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="flex items-center justify-between bg-white/[0.03] border border-white/8 rounded-xl px-4 py-3 mb-5">
                <span className="text-sm text-slate-400">
                  Cheapest · <span className="text-white font-semibold">
                    ₹{Math.min(...MOCK_RESULTS.map((r) => r.price)).toLocaleString("en-IN")}
                  </span>
                </span>
                <span className="text-xs text-teal-400 font-medium">
                  Save ₹{(Math.max(...MOCK_RESULTS.map((r) => r.price)) - Math.min(...MOCK_RESULTS.map((r) => r.price))).toLocaleString("en-IN")} vs most expensive
                </span>
              </div>

              <button
                onClick={goFull}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-semibold py-3 rounded-xl transition-all active:scale-[0.98]"
              >
                See full optimizer
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {!searched && (
          <div className="text-center">
            <button
              onClick={goFull}
              className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
            >
              Or explore the full optimizer <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
