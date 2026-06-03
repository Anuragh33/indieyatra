"use client";
import { motion } from "framer-motion";
import { Mic, MessageCircle, Globe, ArrowRight } from "lucide-react";

const LANGUAGES = [
  "हिंदी", "தமிழ்", "తెలుగు", "ಕನ್ನಡ", "मराठी", "বাংলা", "ગુજરાતી", "English",
];

const FEATURES = [
  { icon: Mic,           text: "Voice search in 8 Indian languages" },
  { icon: MessageCircle, text: "WhatsApp tickets in your language" },
  { icon: Globe,         text: "Full UI translated — every word, every screen" },
];

export function VernacularSection() {
  return (
    <section className="py-20 px-4 md:px-6 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-12 items-center">
        {/* Left — phone mockup */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex justify-center"
        >
          <motion.div
            animate={{ y: [-8, 8, -8] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            className="relative w-64"
          >
            {/* Phone shell */}
            <div className="bg-bg-surface border-2 border-border rounded-[2.5rem] p-3 shadow-card">
              {/* Screen */}
              <div className="bg-bg-elevated rounded-[2rem] overflow-hidden">
                {/* Status bar */}
                <div className="flex justify-between px-5 pt-3 pb-2 text-[10px] text-text-muted">
                  <span>9:41</span>
                  <div className="flex gap-1">
                    <span>●●●</span>
                  </div>
                </div>
                {/* App header */}
                <div className="px-4 pb-3 border-b border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-display font-bold text-sm">Indie<span className="text-purple">Yatra</span></span>
                    <div className="flex items-center gap-1.5 text-[10px] bg-purple/10 text-purple px-2 py-1 rounded-full border border-purple/20">
                      <Globe className="w-2.5 h-2.5" /> हिंदी
                    </div>
                  </div>
                </div>
                {/* Search bar in Hindi */}
                <div className="px-4 py-3">
                  <div className="text-[10px] text-text-muted mb-1">कहाँ जाना है?</div>
                  <div className="bg-bg-surface rounded-xl p-2.5 flex items-center gap-2 border border-border mb-2">
                    <div className="flex-1 text-xs text-text-muted">मुंबई से...</div>
                    <motion.div
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="w-6 h-6 rounded-full bg-purple/20 flex items-center justify-center"
                    >
                      <Mic className="w-3 h-3 text-purple" />
                    </motion.div>
                  </div>
                  <div className="bg-bg-surface rounded-xl p-2.5 border border-border">
                    <div className="text-xs text-text-muted">दिल्ली तक...</div>
                  </div>
                  {/* City name in Devanagari */}
                  <div className="mt-3 text-xs text-text-secondary">
                    लोकप्रिय: <span className="text-saffron">मुंबई · दिल्ली · गोवा</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Right */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4 leading-tight">
            India speaks<br />
            many languages.<br />
            <span className="text-purple">So does IndieYatra.</span>
          </h2>
          <p className="text-text-secondary text-lg mb-8">
            Book in your language, get tickets on WhatsApp in your language, search with your voice in your language.
          </p>

          {/* Language pills */}
          <div className="flex flex-wrap gap-2 mb-8">
            {LANGUAGES.map((lang, i) => (
              <motion.span
                key={lang}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06, duration: 0.3 }}
                className="px-3.5 py-1.5 rounded-full border border-purple/30 bg-purple/10 text-sm font-medium text-purple"
              >
                {lang}
              </motion.span>
            ))}
          </div>

          {/* Feature points */}
          <div className="space-y-3 mb-8">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.text}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + i * 0.1, duration: 0.4 }}
                className="flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-purple/10 border border-purple/20 flex items-center justify-center shrink-0">
                  <f.icon className="w-4 h-4 text-purple" />
                </div>
                <span className="text-sm text-text-secondary">{f.text}</span>
              </motion.div>
            ))}
          </div>

          <button className="btn-primary inline-flex items-center gap-2">
            Try in your language <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    </section>
  );
}
