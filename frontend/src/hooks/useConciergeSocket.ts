"use client";

import { useEffect, useRef } from "react";
import { WS_URL } from "@/lib/api";

interface ConciergeAlert {
  alert_type: string;
  title: string;
  body: string;
}

interface Envelope {
  type: string;
  payload: ConciergeAlert;
  ts: number;
}

export function useConciergeSocket(
  userID: string | null | undefined,
  onAlert: (alert: ConciergeAlert) => void
) {
  const wsRef = useRef<WebSocket | null>(null);
  const onAlertRef = useRef(onAlert);
  onAlertRef.current = onAlert;

  useEffect(() => {
    if (!userID || typeof window === "undefined") return;

    const url = `${WS_URL}?room=concierge:${userID}&user_id=${userID}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onmessage = (e) => {
      try {
        const env: Envelope = JSON.parse(e.data);
        if (env.type === "concierge.alert") {
          onAlertRef.current(env.payload);
        }
      } catch {
        // ignore malformed frames
      }
    };

    ws.onerror = () => {};
    ws.onclose = () => {};

    return () => {
      ws.close();
    };
  }, [userID]);
}
