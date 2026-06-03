"use client";
import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Star } from "lucide-react";

function CountUp({ to, prefix = "", suffix = "", duration = 2 }: { to: number; prefix?: string; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const animate = (now: number) => {
      const p = Math.min((now - start) / (duration * 1000), 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setCount(Math.floor(ease * to));
      if (p < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [inView, to, duration]);

  return <span ref={ref}>{prefix}{count.toLocaleString("en-IN")}{suffix}</span>;
}

const STATS = [
  { label: "Tickets booked",          to: 10,   suffix: "M+",   prefix: "" },
  { label: "Bus operators",           to: 500,  suffix: "+",    prefix: "" },
  { label: "Languages supported",     to: 8,    suffix: "",     prefix: "" },
  { label: "App rating",              to: 48,   suffix: "★",    prefix: "4." },
  { label: "Saved by price alerts",   to: 12,   suffix: "Cr+",  prefix: "₹" },
  { label: "Booking success rate",    to: 99,   suffix: ".2%",  prefix: "" },
];

const TESTIMONIALS = [
  {
    name: "Rahul Sharma",
    city: "Delhi",
    stars: 5,
    quote: "Booked flight + train + hotel for my Ladakh trip in under 5 minutes. The optimizer found a route I never would have thought of — saved me ₹4,500.",
    tag: "Delhi → Leh · Flight + Bus combo",
  },
  {
    name: "Priya Nair",
    city: "Kochi",
    stars: 5,
    quote: "Finally a travel app in Malayalam... wait, almost! But the Hindi version is perfect for my parents. They booked their own tickets for the first time ever.",
    tag: "Kochi → Varanasi · Train",
  },
  {
    name: "Arjun Mehta",
    city: "Mumbai",
    stars: 5,
    quote: "The Concierge woke me up with a WhatsApp saying my Rajdhani was delayed and had already notified my hotel. That's magic.",
    tag: "Mumbai → Delhi · Rajdhani Express",
  },
  {
    name: "Sneha Reddy",
    city: "Hyderabad",
    stars: 5,
    quote: "Premium member for 8 months. Already saved ₹6,200 in convenience fees alone. The ₹799 pays itself in the first booking.",
    tag: "Premium Member · 12 trips booked",
  },
];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

export function SocialProof() {
  return (
    <section className="py-20 px-4 md:px-6 max-w-7xl mx-auto">
      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
          Trusted by <span className="text-saffron">millions</span> of Indians
        </h2>
      </motion.div>

      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-16"
      >
        {STATS.map((s) => (
          <motion.div key={s.label} variants={item} className="card p-4 text-center">
            <div className="font-display text-2xl md:text-3xl font-bold text-saffron mb-1">
              <CountUp to={s.to} prefix={s.prefix} suffix={s.suffix} />
            </div>
            <div className="text-[10px] text-text-muted uppercase tracking-wide">{s.label}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* Testimonials */}
      <div className="overflow-x-auto pb-4 -mx-4 px-4">
        <div className="flex gap-4" style={{ minWidth: "max-content" }}>
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="card p-5 w-72 md:w-80 shrink-0 flex flex-col"
            >
              <div className="flex items-center gap-0.5 mb-3">
                {Array.from({ length: t.stars }).map((_, j) => (
                  <Star key={j} className="w-3.5 h-3.5 fill-hotel text-hotel" />
                ))}
              </div>
              <p className="text-sm text-text-secondary leading-relaxed flex-1 mb-4">&ldquo;{t.quote}&rdquo;</p>
              <div>
                <div className="font-semibold text-sm">{t.name}</div>
                <div className="text-xs text-text-muted">{t.city}</div>
                <div className="mt-2 text-[10px] bg-saffron/10 text-saffron px-2.5 py-1 rounded-full inline-block border border-saffron/20">
                  {t.tag}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
