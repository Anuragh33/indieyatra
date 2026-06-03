"use client";
import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import { Sparkles, ArrowRight, Train, Plane, Bus, Building2 } from "lucide-react";

const USER_MSG = "7 days in Rajasthan under ₹30,000 for 2 people in October";
const AI_LINES = [
  "Here's your optimized Rajasthan itinerary:",
  "Day 1–2: Jaipur — Flight BOM→JAI ₹4,200 + Hotel ₹2,800/night",
  "Day 3–4: Jodhpur — Train ₹415 + Hotel ₹1,900/night",
  "Day 5–6: Jaisalmer — Bus ₹380 + Hotel ₹2,200/night",
  "Day 7: Return — Train + Flight ₹4,800",
];

function Typewriter({ text, active, speed = 30, onDone }: { text: string; active: boolean; speed?: number; onDone?: () => void }) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!active) return;
    let i = 0;
    setDisplayed("");
    setDone(false);
    const id = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(id);
        setDone(true);
        onDone?.();
      }
    }, speed);
    return () => clearInterval(id);
  }, [active, text, speed]);  // eslint-disable-line

  return (
    <span>
      {displayed}
      {!done && active && <span className="inline-block w-0.5 h-3.5 bg-current align-middle ml-0.5 animate-pulse" />}
    </span>
  );
}

const ITINERARY = [
  { icon: Plane,    label: "BOM → JAI Flight",   detail: "IndiGo · 1h 30m",   price: "₹4,200",  color: "#06B6D4" },
  { icon: Building2,label: "Jaipur Hotel",        detail: "2 nights",          price: "₹5,600",  color: "#F59E0B" },
  { icon: Train,    label: "JAI → Jodhpur Train", detail: "5h 45m",            price: "₹415",    color: "#4F46E5" },
  { icon: Building2,label: "Jodhpur Hotel",       detail: "2 nights",          price: "₹3,800",  color: "#F59E0B" },
  { icon: Bus,      label: "Bus to Jaisalmer",    detail: "5h 30m",            price: "₹380",    color: "#FF6B1A" },
  { icon: Building2,label: "Jaisalmer Hotel",     detail: "2 nights",          price: "₹4,400",  color: "#F59E0B" },
];

const STATS = [
  { value: "2M+",    label: "itineraries generated" },
  { value: "₹4,200", label: "average saved per trip" },
  { value: "4.9★",   label: "AI Planner rating" },
];

export function AIPlannerShowcase() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const t1 = setTimeout(() => setPhase(1), 600);
    return () => clearTimeout(t1);
  }, [inView]);

  return (
    <section className="py-20 px-4 md:px-6 max-w-7xl mx-auto" ref={ref}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-14"
      >
        <h2 className="font-display text-4xl md:text-5xl font-bold mb-4 leading-tight">
          From &ldquo;I want to travel&rdquo;<br />
          to a <span className="text-purple">full itinerary</span><br />
          in 10 seconds.
        </h2>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left — chat */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="card p-5"
        >
          <div className="flex items-center gap-2 pb-3 border-b border-border mb-4">
            <div className="w-7 h-7 rounded-full bg-purple flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-sm">AI Trip Planner</span>
            <span className="ml-auto text-[10px] bg-teal/10 text-teal px-2 py-0.5 rounded-full border border-teal/20">Live</span>
          </div>

          <div className="space-y-4 min-h-[260px]">
            {/* User bubble */}
            {phase >= 1 && (
              <div className="flex justify-end">
                <div className="bg-purple/10 border border-purple/20 rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[85%] text-sm">
                  <Typewriter text={USER_MSG} active={phase === 1} onDone={() => setPhase(2)} speed={25} />
                </div>
              </div>
            )}

            {/* AI response lines */}
            {phase >= 2 && (
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-purple/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-3 h-3 text-purple" />
                </div>
                <div className="space-y-1.5 max-w-[88%]">
                  {AI_LINES.map((line, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.4 }}
                      className={`text-sm ${i === 0 ? "font-semibold text-purple" : "text-text-secondary"}`}
                    >
                      {line}
                    </motion.div>
                  ))}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: AI_LINES.length * 0.4 + 0.2 }}
                    className="flex items-center gap-2 mt-2"
                  >
                    <span className="text-sm font-bold text-teal">Total: ₹28,450</span>
                    <span className="text-xs bg-teal/10 text-teal px-2 py-0.5 rounded-full border border-teal/20">Under budget!</span>
                  </motion.div>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Right — itinerary card */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="card p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Rajasthan · 7 days · 2 people</h3>
            <span className="text-xs text-text-muted">Oct 2025</span>
          </div>
          <div className="space-y-2 mb-5">
            {ITINERARY.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 + i * 0.07 }}
                className="flex items-center gap-3 p-2.5 bg-bg-elevated rounded-lg"
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${item.color}15`, border: `1px solid ${item.color}25` }}
                >
                  <item.icon className="w-3.5 h-3.5" style={{ color: item.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium">{item.label}</div>
                  <div className="text-[10px] text-text-muted">{item.detail}</div>
                </div>
                <div className="text-xs font-semibold" style={{ color: item.color }}>{item.price}</div>
              </motion.div>
            ))}
          </div>
          <div className="flex items-center justify-between p-3 bg-purple/10 rounded-xl border border-purple/20">
            <div>
              <div className="text-xs text-text-muted">Total cost</div>
              <div className="font-display text-xl font-bold text-purple">₹28,450</div>
            </div>
            <Link href="/planner" className="btn-primary text-sm py-2 px-4 flex items-center gap-1.5">
              Book All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="grid grid-cols-3 gap-4 mt-10"
      >
        {STATS.map((s) => (
          <div key={s.label} className="text-center">
            <div className="font-display text-2xl md:text-3xl font-bold text-purple">{s.value}</div>
            <div className="text-xs text-text-muted mt-1">{s.label}</div>
          </div>
        ))}
      </motion.div>

      <div className="text-center mt-8">
        <Link href="/planner" className="btn-primary inline-flex items-center gap-2">
          Plan My Trip <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}
