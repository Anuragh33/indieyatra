"use client";
import { motion } from "framer-motion";
import { MapPin, Train, Plane, Share2 } from "lucide-react";

const FEATURES = [
  { icon: MapPin, text: "Live bus GPS on map", color: "#FF6B1A" },
  { icon: Train,  text: "Real-time train running status", color: "#4F46E5" },
  { icon: Plane,  text: "Flight radar with altitude + speed", color: "#06B6D4" },
  { icon: Share2, text: "Share live journey with family", color: "#7C3AED" },
];

export function LiveTrackingTeaser() {
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
            Know exactly<br />
            where you are.<br />
            <span className="text-teal">Always.</span>
          </h2>
          <p className="text-text-secondary text-lg mb-8">
            Live GPS tracking for buses, real-time train location, flight radar — all in one screen.
            Share your live location with family in one tap.
          </p>
          <div className="space-y-3 mb-8">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.text}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 + i * 0.1, duration: 0.4 }}
                className="flex items-center gap-3"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${f.color}15`, border: `1px solid ${f.color}25` }}
                >
                  <f.icon className="w-4 h-4" style={{ color: f.color }} />
                </div>
                <span className="text-sm text-text-secondary">{f.text}</span>
              </motion.div>
            ))}
          </div>
          <div className="text-xs text-text-muted flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-teal inline-block animate-pulse" />
            WhatsApp location updates every 30 mins
          </div>
        </motion.div>

        {/* Right — map mockup */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative"
        >
          <motion.div
            animate={{ y: [-6, 6, -6] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          >
            {/* Map card */}
            <div className="rounded-2xl border border-border bg-[#0d1117] overflow-hidden shadow-card aspect-[4/3] relative">
              {/* Dot grid simulating map */}
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: "radial-gradient(circle, rgba(0,212,170,0.5) 1px, transparent 1px)",
                  backgroundSize: "24px 24px",
                }}
              />
              {/* Route line */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 300">
                <path
                  d="M 80 220 Q 140 160 200 140 Q 260 120 310 80"
                  fill="none"
                  stroke="#FF6B1A"
                  strokeWidth="2"
                  strokeDasharray="6 4"
                  opacity="0.6"
                />
                {/* Animated moving dot */}
                <motion.circle
                  cx="0" cy="0" r="5"
                  fill="#FF6B1A"
                  filter="url(#glow)"
                >
                  <animateMotion
                    dur="4s"
                    repeatCount="indefinite"
                    path="M 80 220 Q 140 160 200 140 Q 260 120 310 80"
                  />
                </motion.circle>
                <defs>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                </defs>
                {/* Origin dot */}
                <circle cx="80" cy="220" r="4" fill="#00D4AA" opacity="0.8" />
                {/* Destination dot */}
                <circle cx="310" cy="80" r="4" fill="#7C3AED" opacity="0.8" />
                {/* City labels */}
                <text x="60" y="235" fill="#00D4AA" fontSize="10" opacity="0.7">Mumbai</text>
                <text x="290" y="72" fill="#7C3AED" fontSize="10" opacity="0.7">Delhi</text>
              </svg>

              {/* Status card overlay */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
                className="absolute bottom-4 left-4 right-4"
              >
                <div className="bg-bg-surface/90 backdrop-blur-sm border border-border rounded-xl p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs text-saffron font-semibold mb-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-saffron inline-block animate-pulse" />
                        Live · Your bus is near Nashik
                      </div>
                      <div className="text-xs text-text-secondary">Arriving Pune in ~2h 15m</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-text-muted">Speed</div>
                      <div className="text-xs font-bold text-teal">82 km/h</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
