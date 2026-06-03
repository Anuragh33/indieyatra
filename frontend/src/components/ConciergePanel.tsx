"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { apiGet, apiPost } from "@/lib/api";
import { Skeleton } from "@/components/Skeleton";

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

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const typeIcons: Record<string, string> = {
  price_drop: "↓",
  delay: "⏱",
  tatkal: "🎫",
  cancelled: "✕",
};

export default function ConciergePanel({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<"feed" | "chat">("feed");
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);
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
      .then((a) => { setAlerts(a || []); setFeedLoading(false); })
      .catch(() => setFeedLoading(false));
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

  return (
    <motion.div
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed bottom-24 right-6 z-40 w-[420px] max-w-[calc(100vw-2rem)] h-[600px] max-h-[calc(100vh-8rem)] bg-[#1E293B] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-gradient-to-r from-purple-900/40 to-purple-800/20">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
          <span className="font-display font-semibold text-white">
            IndieYatra Concierge
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white transition-colors"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Briefing strip */}
      {briefing && (
        <div className="px-4 py-2.5 bg-purple-900/20 border-b border-white/5 text-sm">
          <p className="text-white/90 font-medium">{briefing.greeting}</p>
          <p className="text-slate-400 text-xs mt-0.5">{briefing.date}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-white/10">
        {(["feed", "chat"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              tab === t
                ? "text-purple-400 border-b-2 border-purple-400"
                : "text-slate-400 hover:text-white"
            }`}
          >
            {t === "feed" ? `Alerts (${alerts.length})` : "Chat"}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {tab === "feed" && (
          <div className="p-3 space-y-2">
            {feedLoading ? (
              <>
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white/5 rounded-xl p-3 border border-white/10 space-y-2">
                    <Skeleton className="h-4 w-3/4 bg-white/10" />
                    <Skeleton className="h-3 w-full bg-white/8" />
                    <Skeleton className="h-3 w-1/2 bg-white/8" />
                  </div>
                ))}
              </>
            ) : alerts.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm">
                No active alerts. You're all caught up!
              </div>
            ) : null}
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="bg-white/5 rounded-xl p-3 border border-white/10 group relative"
              >
                <div className="flex items-start gap-3">
                  <span className="text-lg flex-shrink-0 mt-0.5">
                    {typeIcons[alert.type] ?? "•"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium leading-tight">
                      {alert.title}
                    </p>
                    <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                      {alert.body}
                    </p>
                    {alert.action_url && (
                      <a
                        href={alert.action_url}
                        className="inline-block mt-2 text-xs text-purple-400 hover:text-purple-300 font-medium"
                      >
                        {alert.action_label} &rarr;
                      </a>
                    )}
                  </div>
                  <button
                    onClick={() => dismiss(alert.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-white flex-shrink-0"
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
              </div>
            ))}
          </div>
        )}

        {tab === "chat" && (
          <div className="flex flex-col h-full">
            <div className="flex-1 p-3 space-y-3 overflow-y-auto">
              {messages.length === 0 && (
                <div className="text-center py-8 text-slate-500 text-sm">
                  <p className="mb-3">Ask me anything about your trips.</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {[
                      "Check my PNR status",
                      "Is my flight on time?",
                      "Best time to book tatkal",
                    ].map((s) => (
                      <button
                        key={s}
                        onClick={() => setInput(s)}
                        className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-slate-300 hover:bg-white/10 transition-colors"
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
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
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
                  <div className="bg-white/8 border border-white/10 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1">
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
          </div>
        )}
      </div>

      {/* Chat input — only shown on chat tab */}
      {tab === "chat" && (
        <div className="p-3 border-t border-white/10">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="flex gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your trip..."
              className="flex-1 bg-white/8 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
            />
            <button
              type="submit"
              disabled={!input.trim() || sending}
              className="w-10 h-10 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors flex-shrink-0"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className="w-4 h-4 text-white"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                />
              </svg>
            </button>
          </form>
        </div>
      )}
    </motion.div>
  );
}
