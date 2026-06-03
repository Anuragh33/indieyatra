"use client";
import { motion } from "framer-motion";
import { Eye, Bell, Zap, ArrowRight, Sparkles } from "lucide-react";

const FEATURES = [
  {
    icon: Eye,
    title: "Always Watching",
    desc: "Live train delays, flight gate changes, price drops on saved routes — we catch everything so you don't miss it.",
    color: "#06B6D4",
  },
  {
    icon: Bell,
    title: "Alerts That Matter",
    desc: "Tatkal window opening in 47 mins. Your Goa bus is 20 mins away. Only alerts that need your attention.",
    color: "#F59E0B",
  },
  {
    icon: Zap,
    title: "Acts For You",
    desc: "Auto check-in. Auto rebook on cancellation. Auto notify your hotel about late arrival. Travel on autopilot.",
    color: "#7C3AED",
  },
];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.15 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

export function ConciergeShowcase() {
  return (
    <section className="py-20 px-4 md:px-6 relative overflow-hidden">
      {/* Dot grid background */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(124,58,237,0.4) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-bg-primary via-transparent to-bg-primary" />

      <div className="relative max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <span className="inline-flex items-center gap-1.5 text-xs font-bold tracking-widest uppercase text-purple border border-purple/30 bg-purple/10 px-3 py-1.5 rounded-full mb-5">
            <Sparkles className="w-3 h-3" /> AI Powered
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Meet your personal<br />
            <span className="text-purple">travel intelligence</span>
          </h2>
          <p className="text-text-secondary text-lg max-w-xl mx-auto">
            IndieYatra Concierge monitors your trips 24/7, alerts you before anything goes wrong,
            and acts on your behalf — automatically.
          </p>
        </motion.div>

        {/* Feature cards */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-14"
        >
          {FEATURES.map((f) => (
            <motion.div key={f.title} variants={item}>
              <div className="card p-6 h-full">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: `${f.color}15`, border: `1px solid ${f.color}25` }}
                >
                  <f.icon className="w-5 h-5" style={{ color: f.color }} />
                </div>
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Animated chat mockup */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-lg mx-auto"
        >
          <div className="card p-5 border-purple/20 bg-bg-surface relative">
            {/* Header */}
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border">
              <div className="w-8 h-8 rounded-full bg-purple flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-sm font-semibold">IndieYatra Concierge</div>
                <div className="flex items-center gap-1.5 text-xs text-teal">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal inline-block" /> Online
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="space-y-3 mb-4">
              {/* User */}
              <div className="flex justify-end">
                <div className="bg-bg-elevated rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[80%]">
                  <p className="text-sm">Is my train on time?</p>
                </div>
              </div>

              {/* AI */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4, duration: 0.4 }}
                className="flex gap-2"
              >
                <div className="w-6 h-6 rounded-full bg-purple/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-3 h-3 text-purple" />
                </div>
                <div
                  className="rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[85%]"
                  style={{ background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.2)" }}
                >
                  <p className="text-sm leading-relaxed">
                    Your <span className="font-semibold text-purple">12951 Mumbai Rajdhani</span> is running{" "}
                    <span className="text-warning font-semibold">25 mins late</span>. You&apos;ll still make your
                    connection at Vadodara with <span className="text-teal font-semibold">40 mins to spare</span>.
                  </p>
                </div>
              </motion.div>

              {/* Typing indicator */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 1, duration: 0.3 }}
                className="flex gap-2 items-center"
              >
                <div className="w-6 h-6 rounded-full bg-purple/20 flex items-center justify-center shrink-0">
                  <Sparkles className="w-3 h-3 text-purple" />
                </div>
                <div className="flex gap-1.5 px-4 py-3 rounded-2xl bg-bg-elevated">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-text-muted"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
                    />
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Input */}
            <div className="flex items-center gap-2 p-3 bg-bg-elevated rounded-xl border border-border">
              <span className="text-sm text-text-muted flex-1">Ask your concierge anything...</span>
              <ArrowRight className="w-4 h-4 text-purple" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="text-center mt-8"
        >
          <a href="/concierge" className="btn-primary inline-flex items-center gap-2">
            Try Concierge Free <ArrowRight className="w-4 h-4" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
