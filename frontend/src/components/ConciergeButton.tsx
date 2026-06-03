"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { apiGet } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useConciergeSocket } from "@/hooks/useConciergeSocket";
import ConciergePanel from "./ConciergePanel";

interface Alert {
  id: string;
  is_read: boolean;
  is_dismissed: boolean;
}

export default function ConciergeButton() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  // Initial load
  useEffect(() => {
    apiGet<Alert[]>("/api/concierge/feed")
      .then((alerts) => setUnread(alerts.filter((a) => !a.is_read).length))
      .catch(() => {});
  }, [open]);

  // Live WebSocket — increment badge instantly when a new alert arrives
  useConciergeSocket(user?.id, () => {
    setUnread((n) => n + 1);
  });

  return (
    <>
      <AnimatePresence>
        {open && <ConciergePanel onClose={() => setOpen(false)} />}
      </AnimatePresence>

      <motion.button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 to-purple-800 shadow-xl flex items-center justify-center focus:outline-none"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.93 }}
        aria-label="Open concierge"
      >
        <motion.span
          className="absolute inset-0 rounded-full bg-purple-500 opacity-40"
          animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0, 0.4] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut" }}
        />
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          className="w-6 h-6 text-white relative z-10"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z"
          />
        </svg>
        <AnimatePresence>
          {unread > 0 && (
            <motion.span
              key="badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center"
            >
              {unread > 9 ? "9+" : unread}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </>
  );
}
