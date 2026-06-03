"use client";
import { motion } from "framer-motion";
import { Smartphone, Wifi, Zap, Bell } from "lucide-react";

const STEPS = [
  "Open IndieYatra in Chrome or Safari",
  "Tap \"Add to Home Screen\"",
  "Done — it's an app now",
];

const BADGES = [
  { icon: Smartphone, label: "Available as PWA" },
  { icon: Wifi,       label: "Works Offline" },
  { icon: Zap,        label: "2G Ready" },
];

export function DownloadApp() {
  return (
    <section className="py-20 px-4 md:px-6 bg-bg-surface">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4 leading-tight">
            IndieYatra<br />
            <span className="text-purple">in your pocket</span>
          </h2>
          <p className="text-text-secondary text-lg mb-8">
            Works perfectly on any browser. Install as an app — no Play Store needed.
            Works offline. Works on 2G.
          </p>

          <ol className="space-y-3 mb-8">
            {STEPS.map((step, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 + i * 0.1 }}
                className="flex items-center gap-3 text-sm text-text-secondary"
              >
                <span className="w-7 h-7 rounded-full bg-purple flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {i + 1}
                </span>
                {step}
              </motion.li>
            ))}
          </ol>

          <div className="flex flex-wrap gap-2">
            {BADGES.map((b) => (
              <div key={b.label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-bg-elevated text-xs text-text-secondary">
                <b.icon className="w-3.5 h-3.5 text-purple" />
                {b.label}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Right — phone mockup */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex justify-center"
        >
          <motion.div
            animate={{ y: [-8, 8, -8] }}
            transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
            className="relative w-64"
          >
            <div className="bg-bg-surface border-2 border-border rounded-[2.5rem] p-3 shadow-card">
              <div className="bg-bg-elevated rounded-[2rem] overflow-hidden">
                {/* Status bar */}
                <div className="flex justify-between px-5 pt-3 pb-2 text-[10px] text-text-muted">
                  <span>9:41</span><span>●●● ▮</span>
                </div>

                {/* App content */}
                <div className="px-4 pb-4">
                  <div className="font-display font-bold text-sm mb-3">
                    Indie<span className="text-purple">Yatra</span>
                  </div>

                  {/* Notification banner */}
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.6, duration: 0.4 }}
                    className="flex items-center gap-2 bg-saffron/10 border border-saffron/20 rounded-xl p-2.5 mb-3"
                  >
                    <Bell className="w-3.5 h-3.5 text-saffron shrink-0" />
                    <div>
                      <div className="text-[10px] font-semibold text-saffron">Price dropped!</div>
                      <div className="text-[10px] text-text-muted">Delhi→Goa now ₹3,200</div>
                    </div>
                  </motion.div>

                  {/* Mini vertical cards */}
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { label: "Buses", color: "#FF6B1A" },
                      { label: "Trains", color: "#4F46E5" },
                      { label: "Flights", color: "#06B6D4" },
                      { label: "Hotels", color: "#F59E0B" },
                    ].map((v) => (
                      <div
                        key={v.label}
                        className="rounded-lg p-2 text-[10px] font-semibold"
                        style={{ background: `${v.color}15`, color: v.color, border: `1px solid ${v.color}25` }}
                      >
                        {v.label}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom nav */}
                <div className="flex justify-around border-t border-border py-2 px-4">
                  {["Home", "Trips", "AI", "You"].map((label) => (
                    <div key={label} className="flex flex-col items-center gap-0.5">
                      <div className="w-1 h-1 rounded-full bg-text-muted" />
                      <span className="text-[8px] text-text-muted">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Glow */}
            <div className="absolute inset-0 -z-10 bg-purple/10 blur-3xl rounded-full" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
