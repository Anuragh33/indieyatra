"use client";

import { useCallback, useRef, useState } from "react";
import { apiPost } from "@/lib/api";

export interface VoiceResult {
  from: string;
  to: string;
  date: string;
  travelers: number;
  vertical: "bus" | "train" | "flight" | "hotel";
}

type Status = "idle" | "listening" | "processing" | "done" | "error" | "unsupported";

// Web Speech API types not included in standard TS lib
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionInstance extends EventTarget {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionInstance;

export function useVoiceSearch(onResult: (r: VoiceResult) => void) {
  const [status, setStatus] = useState<Status>("idle");
  const [transcript, setTranscript] = useState("");
  const recRef = useRef<SpeechRecognitionInstance | null>(null);
  const statusRef = useRef<Status>("idle");

  const start = useCallback(() => {
    const w = window as unknown as {
      SpeechRecognition?: SpeechRecognitionCtor;
      webkitSpeechRecognition?: SpeechRecognitionCtor;
    };
    const SR: SpeechRecognitionCtor | undefined =
      typeof window !== "undefined" ? (w.SpeechRecognition ?? w.webkitSpeechRecognition) : undefined;

    if (!SR) {
      setStatus("unsupported");
      statusRef.current = "unsupported";
      return;
    }

    const rec = new SR();
    recRef.current = rec;
    rec.lang = "en-IN";
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    setStatus("listening");
    statusRef.current = "listening";
    setTranscript("");

    rec.onresult = async (e: SpeechRecognitionEvent) => {
      const text = e.results[0][0].transcript;
      setTranscript(text);
      setStatus("processing");
      statusRef.current = "processing";
      try {
        const result = await apiPost<VoiceResult>("/api/voice/parse", {
          transcript: text,
        });
        onResult(result);
        setStatus("done");
        statusRef.current = "done";
      } catch {
        setStatus("error");
        statusRef.current = "error";
      }
    };

    rec.onerror = () => {
      setStatus("error");
      statusRef.current = "error";
    };
    rec.onend = () => {
      if (statusRef.current === "listening") {
        setStatus("idle");
        statusRef.current = "idle";
      }
    };

    rec.start();
  }, [onResult]);

  const stop = useCallback(() => {
    recRef.current?.stop();
    setStatus("idle");
    statusRef.current = "idle";
  }, []);

  return { status, transcript, start, stop };
}
