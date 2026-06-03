"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { apiGet, apiPost } from "@/lib/api";
import { Navbar } from "@/components/Navbar";
import { MobileNav } from "@/components/MobileNav";

interface Briefing {
  greeting: string;
  train_trips: number;
  flight_trips: number;
  date: string;
}

interface Alert {
  id: string;
  type: string;
  title: string;
  body: string;
  action_url: string;
  action_label: string;
  priority: number;
  is_read: boolean;
  is_dismissed: boolean;
  created_at: string;
}

interface Settings {
  whatsapp_alerts: boolean;
  delay_alerts: boolean;
  price_drop_alerts: boolean;
  tatkal_alerts: boolean;
  briefing_time: string;
  auto_rebook: boolean;
  auto_checkin: boolean;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const typeColors: Record<string, string> = {
  price_drop: "bg-teal-500/10 border-teal-500/30 text-teal-300",
  delay: "bg-amber-500/10 border-amber-500/30 text-amber-300",
  tatkal: "bg-purple-500/10 border-purple-500/30 text-purple-300",
  cancelled: "bg-red-500/10 border-red-500/30 text-red-300",
};

const typeIcon: Record<string, string> = {
  price_drop: "↓",
  delay: "⏱",
  tatkal: "🎫",
  cancelled: "✕",
};

export default function ConciergePage() {
  const [tab, setTab] = useState<"feed" | "chat" | "settings">("feed");
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    apiGet<Briefing>("/api/concierge/briefing")
      .then(setBriefing)
      .catch(() => {});
    apiGet<Alert[]>("/api/concierge/feed")
      .then((a) => setAlerts(a || []))
      .catch(() => {});
    apiGet<Settings>("/api/concierge/settings")
      .then(setSettings)
      .catch(() => {});
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setSending(true);
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    try {
      const res = await apiPost<{ reply: string; session_id: string }>(
        "/api/concierge/chat",
        { message: text, session_id: sessionId }
      );
      setSessionId(res.session_id);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: res.reply },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I'm having trouble connecting right now. Please try again in a moment.",
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  async function dismiss(id: string) {
    await apiPost(`/api/concierge/dismiss/${id}`, {});
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }

  async function saveSettings() {
    if (!settings) return;
    setSavingSettings(true);
    try {
      await apiPost("/api/concierge/settings", settings);
    } finally {
      setSavingSettings(false);
    }
  }

  const tabs = [
    { key: "feed", label: `Alerts${alerts.length > 0 ? ` (${alerts.length})` : ""}` },
    { key: "chat", label: "AI Chat" },
    { key: "settings", label: "Settings" },
  ] as const;

  return (
    <div className="min-h-screen bg-bg-primary">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 pt-24 pb-28">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                className="w-5 h-5 text-white"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-white">
                Your Concierge
              </h1>
              <p className="text-slate-400 text-sm">
                AI-powered travel intelligence, 24/7
              </p>
            </div>
          </div>

          {briefing && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-purple-900/30 to-purple-800/10 border border-purple-500/20"
            >
              <p className="text-white font-semibold">{briefing.greeting}</p>
              <p className="text-slate-400 text-sm mt-1">{briefing.date}</p>
              <div className="flex gap-4 mt-3">
                {briefing.train_trips > 0 && (
                  <span className="text-sm text-indigo-300">
                    {briefing.train_trips} train trip
                    {briefing.train_trips !== 1 ? "s" : ""}
                  </span>
                )}
                {briefing.flight_trips > 0 && (
                  <span className="text-sm text-cyan-300">
                    {briefing.flight_trips} flight
                    {briefing.flight_trips !== 1 ? "s" : ""}
                  </span>
                )}
                {briefing.train_trips === 0 && briefing.flight_trips === 0 && (
                  <span className="text-sm text-slate-400">
                    No upcoming trips in 48 hours
                  </span>
                )}
              </div>
            </motion.div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10 mb-6">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                tab === t.key
                  ? "border-purple-400 text-purple-400"
                  : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Feed tab */}
          {tab === "feed" && (
            <motion.div
              key="feed"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-3"
            >
              {alerts.length === 0 && (
                <div className="text-center py-20 text-slate-500">
                  <div className="text-4xl mb-3">✓</div>
                  <p className="text-lg font-medium text-slate-400">
                    All clear!
                  </p>
                  <p className="text-sm mt-1">
                    No active alerts. We'll notify you when something needs
                    attention.
                  </p>
                </div>
              )}
              {alerts.map((alert, i) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className={`p-4 rounded-2xl border ${typeColors[alert.type] ?? "bg-white/5 border-white/10 text-white"} relative group`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xl flex-shrink-0 mt-0.5">
                      {typeIcon[alert.type] ?? "•"}
                    </span>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{alert.title}</p>
                      <p className="text-xs opacity-75 mt-1 leading-relaxed">
                        {alert.body}
                      </p>
                      {alert.action_url && (
                        <a
                          href={alert.action_url}
                          className="inline-block mt-2 text-xs font-medium underline underline-offset-2 opacity-90 hover:opacity-100"
                        >
                          {alert.action_label} &rarr;
                        </a>
                      )}
                    </div>
                    <button
                      onClick={() => dismiss(alert.id)}
                      className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity text-current flex-shrink-0 mt-0.5"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        className="w-4 h-4"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Chat tab */}
          {tab === "chat" && (
            <motion.div
              key="chat"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex flex-col"
              style={{ height: "520px" }}
            >
              <div className="flex-1 overflow-y-auto space-y-3 pb-4">
                {messages.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-slate-400 mb-4 text-sm">
                      Ask me anything about your travel.
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {[
                        "What's my next trip?",
                        "Is my train running on time?",
                        "Best train from Mumbai to Goa?",
                        "When should I book tatkal?",
                        "Packing tips for Rajasthan",
                      ].map((s) => (
                        <button
                          key={s}
                          onClick={() => setInput(s)}
                          className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-slate-300 hover:bg-white/10 transition-colors"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {m.role === "assistant" && (
                      <div className="w-7 h-7 rounded-full bg-purple-700 flex items-center justify-center flex-shrink-0 mr-2 mt-1">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={1.8}
                          className="w-3.5 h-3.5 text-white"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
                          />
                        </svg>
                      </div>
                    )}
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        m.role === "user"
                          ? "bg-purple-600 text-white rounded-br-sm"
                          : "bg-white/8 border border-white/10 text-slate-200 rounded-bl-sm"
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                ))}

                {sending && (
                  <div className="flex justify-start">
                    <div className="w-7 h-7 rounded-full bg-purple-700 flex items-center justify-center flex-shrink-0 mr-2 mt-1">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.8}
                        className="w-3.5 h-3.5 text-white"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
                        />
                      </svg>
                    </div>
                    <div className="bg-white/8 border border-white/10 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5 items-center">
                      {[0, 1, 2].map((i) => (
                        <motion.span
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-slate-400"
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{
                            duration: 1.2,
                            repeat: Infinity,
                            delay: i * 0.2,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage();
                }}
                className="flex gap-3 pt-4 border-t border-white/10"
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about your trips, delays, or travel tips..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || sending}
                  className="w-12 h-12 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors flex-shrink-0"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    className="w-5 h-5 text-white"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                    />
                  </svg>
                </button>
              </form>
            </motion.div>
          )}

          {/* Settings tab */}
          {tab === "settings" && settings && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-6"
            >
              <section className="bg-white/5 rounded-2xl border border-white/10 p-5 space-y-4">
                <h3 className="font-semibold text-white">Notifications</h3>

                {(
                  [
                    {
                      key: "whatsapp_alerts" as const,
                      label: "WhatsApp Alerts",
                      desc: "Receive all alerts via WhatsApp",
                    },
                    {
                      key: "delay_alerts" as const,
                      label: "Delay Alerts",
                      desc: "Get notified when your train or flight is delayed",
                    },
                    {
                      key: "price_drop_alerts" as const,
                      label: "Price Drop Alerts",
                      desc: "Alert when bus prices fall below your threshold",
                    },
                    {
                      key: "tatkal_alerts" as const,
                      label: "Tatkal Window Alerts",
                      desc: "Reminder 1 hour before tatkal booking opens",
                    },
                  ] as const
                ).map((item) => (
                  <label
                    key={item.key}
                    className="flex items-center justify-between gap-4 cursor-pointer"
                  >
                    <div>
                      <p className="text-sm text-white font-medium">
                        {item.label}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {item.desc}
                      </p>
                    </div>
                    <div className="relative flex-shrink-0">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={settings[item.key]}
                        onChange={(e) =>
                          setSettings((s) =>
                            s ? { ...s, [item.key]: e.target.checked } : s
                          )
                        }
                      />
                      <div className="w-11 h-6 rounded-full bg-white/10 peer-checked:bg-purple-600 transition-colors" />
                      <div className="absolute left-1 top-1 w-4 h-4 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
                    </div>
                  </label>
                ))}
              </section>

              <section className="bg-white/5 rounded-2xl border border-white/10 p-5 space-y-4">
                <h3 className="font-semibold text-white">Daily Briefing</h3>
                <div>
                  <label className="block text-sm text-white font-medium mb-2">
                    Briefing time
                  </label>
                  <select
                    value={settings.briefing_time}
                    onChange={(e) =>
                      setSettings((s) =>
                        s ? { ...s, briefing_time: e.target.value } : s
                      )
                    }
                    className="bg-white/8 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                  >
                    {Array.from({ length: 16 }, (_, i) => i + 5).map((h) => (
                      <option
                        key={h}
                        value={`${String(h).padStart(2, "0")}:00`}
                        className="bg-slate-800"
                      >
                        {String(h).padStart(2, "0")}:00
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-400 mt-1.5">
                    Receive a WhatsApp summary of upcoming trips each morning.
                  </p>
                </div>
              </section>

              <section className="bg-white/5 rounded-2xl border border-white/10 p-5 space-y-4">
                <h3 className="font-semibold text-white">Automation</h3>
                {(
                  [
                    {
                      key: "auto_rebook" as const,
                      label: "Auto-Rebook",
                      desc: "Automatically find alternatives when your booking is cancelled",
                    },
                    {
                      key: "auto_checkin" as const,
                      label: "Auto Check-In",
                      desc: "Check in automatically when the window opens (flights)",
                    },
                  ] as const
                ).map((item) => (
                  <label
                    key={item.key}
                    className="flex items-center justify-between gap-4 cursor-pointer"
                  >
                    <div>
                      <p className="text-sm text-white font-medium">
                        {item.label}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {item.desc}
                      </p>
                    </div>
                    <div className="relative flex-shrink-0">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={settings[item.key]}
                        onChange={(e) =>
                          setSettings((s) =>
                            s ? { ...s, [item.key]: e.target.checked } : s
                          )
                        }
                      />
                      <div className="w-11 h-6 rounded-full bg-white/10 peer-checked:bg-purple-600 transition-colors" />
                      <div className="absolute left-1 top-1 w-4 h-4 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
                    </div>
                  </label>
                ))}
              </section>

              <button
                onClick={saveSettings}
                disabled={savingSettings}
                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold transition-colors"
              >
                {savingSettings ? "Saving..." : "Save Settings"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <MobileNav />
    </div>
  );
}
