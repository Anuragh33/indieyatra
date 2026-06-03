"use client";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { MobileNav } from "@/components/MobileNav";
import { apiGet, WS_URL } from "@/lib/api";
import { formatTime } from "@/lib/utils";
import { Bus, MapPin, Clock, CheckCircle2, Navigation, Radio } from "lucide-react";
import { motion } from "framer-motion";

type TrackingData = {
  schedule_id: string;
  lat: number;
  lng: number;
  progress: number;
  status: "not_started" | "in_transit" | "arrived";
  departed_at: string;
  arrives_at: string;
  from_city: string;
  to_city: string;
  timestamp: string;
};

export default function TrackingPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    apiGet<TrackingData>(`/api/tracking/${id}`)
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    const ws = new WebSocket(`${WS_URL}?room=track:${id}`);
    wsRef.current = ws;
    ws.onopen = () => setLive(true);
    ws.onclose = () => setLive(false);
    ws.onerror = () => setLive(false);
    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg.type === "bus.gps") {
          setData((prev) =>
            prev
              ? { ...prev, lat: msg.payload.lat, lng: msg.payload.lng, timestamp: new Date().toISOString() }
              : prev
          );
        }
      } catch {}
    };
    return () => { ws.close(); };
  }, [id]);

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="max-w-3xl mx-auto px-4 py-12">
          <div className="card p-6 skeleton h-64" />
        </main>
        <MobileNav />
      </>
    );
  }

  if (!data) {
    return (
      <>
        <Navbar />
        <main className="max-w-3xl mx-auto px-4 py-12 text-center">
          <p className="text-text-muted">Tracking data not available for this schedule.</p>
          <Link href="/trips" className="btn-secondary mt-4 inline-flex">Back to Trips</Link>
        </main>
        <MobileNav />
      </>
    );
  }

  const pct = Math.round(data.progress * 100);
  const eta = data.arrives_at ? new Date(data.arrives_at) : null;
  const minutesLeft = eta ? Math.max(0, Math.round((eta.getTime() - Date.now()) / 60000)) : null;

  const STATUS_CONFIG = {
    not_started: { label: "Not Departed", color: "text-text-muted", bg: "bg-bg-elevated" },
    in_transit:  { label: "In Transit",   color: "text-teal",       bg: "bg-teal/10"    },
    arrived:     { label: "Arrived",      color: "text-purple",     bg: "bg-purple/10"  },
  };
  const statusCfg = STATUS_CONFIG[data.status];

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 md:px-6 py-6 pb-24 md:pb-12 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold">Live Tracking</h1>
          <div className={`flex items-center gap-1.5 chip ${statusCfg.bg} ${statusCfg.color} border-0`}>
            {data.status === "in_transit" && (
              <motion.span
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ repeat: Infinity, duration: 1.4 }}
                className="w-2 h-2 rounded-full bg-teal inline-block"
              />
            )}
            {statusCfg.label}
          </div>
        </div>

        {/* Route card */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="text-center">
              <div className="font-display text-2xl font-bold">{data.from_city}</div>
              <div className="text-xs text-text-muted">{formatTime(data.departed_at)}</div>
            </div>
            <div className="flex-1 px-4">
              <div className="text-xs text-text-muted text-center mb-1">{pct}%</div>
              <div className="relative h-2 bg-bg-elevated rounded-full overflow-hidden">
                <motion.div
                  className="absolute left-0 top-0 h-full bg-gradient-to-r from-saffron to-teal rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
                {data.status === "in_transit" && (
                  <motion.div
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
                    style={{ left: `${pct}%` }}
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1.4 }}
                  >
                    <Bus className="w-4 h-4 text-saffron" />
                  </motion.div>
                )}
              </div>
            </div>
            <div className="text-center">
              <div className="font-display text-2xl font-bold">{data.to_city}</div>
              <div className="text-xs text-text-muted">{formatTime(data.arrives_at)}</div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            icon={Navigation}
            label="Latitude"
            value={data.lat.toFixed(4) + "°"}
          />
          <StatCard
            icon={MapPin}
            label="Longitude"
            value={data.lng.toFixed(4) + "°"}
          />
          <StatCard
            icon={Clock}
            label="ETA"
            value={minutesLeft !== null && data.status === "in_transit"
              ? minutesLeft > 60
                ? `${Math.floor(minutesLeft / 60)}h ${minutesLeft % 60}m`
                : `${minutesLeft} min`
              : data.status === "arrived" ? "Arrived" : "Awaiting departure"
            }
          />
          <StatCard
            icon={data.status === "arrived" ? CheckCircle2 : Radio}
            label="Live Feed"
            value={live ? "Connected" : "Connecting…"}
            valueClass={live ? "text-teal" : "text-text-muted"}
          />
        </div>

        {/* GPS coordinates card */}
        <div className="card p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-saffron" /> GPS Position
          </h3>
          <div className="h-48 bg-bg-elevated rounded-lg flex items-center justify-center relative overflow-hidden">
            {/* Simple dot-on-gradient map placeholder */}
            <div className="absolute inset-0 opacity-10"
              style={{ background: "radial-gradient(circle at 50% 50%, #00D4AA 0%, transparent 70%)" }} />
            <div className="text-center z-10">
              <div className="font-mono text-sm text-text-secondary">
                {data.lat.toFixed(6)}° N, {data.lng.toFixed(6)}° E
              </div>
              <div className="mt-2 text-xs text-text-muted">
                Last updated: {new Date(data.timestamp).toLocaleTimeString("en-IN")}
              </div>
              <motion.div
                animate={{ scale: [1, 1.5, 1], opacity: [1, 0.4, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="mt-3 w-4 h-4 rounded-full bg-teal mx-auto"
              />
            </div>
          </div>
        </div>
      </main>
      <MobileNav />
    </>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  valueClass = "text-text-primary",
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="card p-4">
      <Icon className="w-4 h-4 text-text-muted mb-2" />
      <div className="text-xs text-text-muted">{label}</div>
      <div className={`font-semibold text-sm mt-0.5 ${valueClass}`}>{value}</div>
    </div>
  );
}
