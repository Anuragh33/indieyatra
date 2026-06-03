"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export function FinalCTA() {
  return (
    <section className="py-20 px-4 md:px-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-3xl mx-auto text-center rounded-3xl border border-purple/20 p-12 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.12) 0%, rgba(79,70,229,0.08) 50%, transparent 100%)" }}
      >
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-purple/10 blur-3xl rounded-full -z-10" />

        <div className="flex items-center justify-center gap-2 mb-5">
          <Sparkles className="w-5 h-5 text-purple" />
          <span className="text-xs font-bold tracking-widest uppercase text-purple">IndieYatra</span>
        </div>

        <h2 className="font-display text-4xl md:text-5xl font-bold mb-4 leading-tight">
          Your next adventure<br />
          <span className="text-purple">starts here.</span>
        </h2>
        <p className="text-text-secondary text-lg mb-8">
          Buses · Trains · Flights · Hotels · AI Planning · Concierge · All in one place.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-5">
          <Link href="/planner" className="btn-primary inline-flex items-center gap-2 text-base px-7 py-3 w-full sm:w-auto justify-center">
            Start Planning Free <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/premium" className="btn-secondary inline-flex items-center gap-2 text-base px-7 py-3 w-full sm:w-auto justify-center">
            Try Premium Free <Sparkles className="w-4 h-4 text-purple" />
          </Link>
        </div>

        <p className="text-xs text-text-muted">
          No credit card required · Cancel anytime · 7-day Premium trial included
        </p>
      </motion.div>
    </section>
  );
}
