"use client";
import { useState } from "react";
import { Search, Train, CheckCircle, Clock, XCircle, User } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { MobileNav } from "@/components/MobileNav";
import { api } from "@/lib/api";

interface PassengerStatus {
  full_name: string;
  age: number;
  gender: string;
  berth_preference: string;
  coach: string;
  berth_number: string;
  status: string; // CNF / RAC1 / WL3
}
interface PNRResult {
  pnr: string;
  booking_ref: string;
  class: string;
  quota: string;
  status: string;
  chart_prepared: boolean;
  schedule: {
    train: { number: string; name: string; train_type: string };
    from_station: { code: string; name: string };
    to_station: { code: string; name: string };
    departure_time: string;
    arrival_time: string;
    arrival_day: number;
    journey_date: string;
    duration_min: number;
  };
  passengers: PassengerStatus[];
}

function statusBadge(s: string) {
  if (s === "CNF") return (
    <span className="flex items-center gap-1 text-success text-xs font-bold">
      <CheckCircle className="w-3.5 h-3.5" /> Confirmed
    </span>
  );
  if (s.startsWith("RAC")) return (
    <span className="flex items-center gap-1 text-warning text-xs font-bold">
      <Clock className="w-3.5 h-3.5" /> {s}
    </span>
  );
  if (s.startsWith("WL")) return (
    <span className="flex items-center gap-1 text-saffron text-xs font-bold">
      <Clock className="w-3.5 h-3.5" /> {s}
    </span>
  );
  return <span className="text-text-muted text-xs">{s}</span>;
}

export default function PNRPage() {
  const [pnr, setPNR] = useState("");
  const [result, setResult] = useState<PNRResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const check = async () => {
    const cleaned = pnr.trim().replace(/\s/g, "");
    if (cleaned.length !== 10 || !/^\d+$/.test(cleaned)) {
      setError("Enter a valid 10-digit PNR number.");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await api<PNRResult>(`/api/trains/pnr/${cleaned}`);
      setResult(res);
    } catch {
      setError("PNR not found. Verify the number and try again.");
    } finally {
      setLoading(false);
    }
  };

  const s = result?.schedule;

  return (
    <>
      <Navbar />
      <main className="min-h-screen pb-24 md:pb-8 max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-train/10 border border-train/20 flex items-center justify-center mx-auto mb-4">
            <Train className="w-7 h-7 text-train" />
          </div>
          <h1 className="font-display text-2xl font-bold mb-1">PNR Status</h1>
          <p className="text-text-secondary text-sm">Check real-time status of your train booking</p>
        </div>

        {/* Input */}
        <div className="card p-5 mb-6">
          <label className="text-xs text-text-muted font-medium block mb-1.5">PNR Number</label>
          <div className="flex gap-3">
            <input
              className="input flex-1 font-mono text-lg tracking-widest text-center"
              placeholder="10-digit PNR"
              value={pnr}
              maxLength={10}
              onChange={e => {
                setPNR(e.target.value.replace(/\D/g, ""));
                setError("");
              }}
              onKeyDown={e => e.key === "Enter" && check()}
            />
            <button
              onClick={check}
              disabled={loading}
              className="flex items-center gap-2 text-white font-semibold px-5 py-2.5 rounded-md transition-all active:scale-95 disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)" }}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              Check
            </button>
          </div>
          {error && (
            <p className="mt-2 text-xs text-danger flex items-center gap-1">
              <XCircle className="w-3.5 h-3.5" /> {error}
            </p>
          )}
        </div>

        {/* Result */}
        {result && s && (
          <div className="space-y-4 animate-fade-in">
            {/* Train info */}
            <div className="card p-5">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="text-xs text-text-muted font-mono mb-0.5">{s.train.number}</div>
                  <h2 className="font-semibold text-base">{s.train.name}</h2>
                  <div className="text-xs text-text-muted mt-0.5">
                    {new Date(s.journey_date).toLocaleDateString("en-IN", {
                      weekday: "short", day: "numeric", month: "short", year: "numeric",
                    })}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-text-muted">PNR</div>
                  <div className="font-mono font-bold text-text-primary tracking-wider">{result.pnr}</div>
                  <div className={`text-xs mt-1 font-medium ${
                    result.status === "confirmed" ? "text-success" : "text-warning"
                  }`}>
                    {result.status.toUpperCase()}
                  </div>
                </div>
              </div>

              {/* Journey */}
              <div className="flex items-center gap-4 p-3 bg-bg-elevated rounded-lg">
                <div className="text-center">
                  <div className="text-lg font-bold font-mono">{s.departure_time}</div>
                  <div className="text-xs font-bold text-train">{s.from_station.code}</div>
                  <div className="text-[10px] text-text-muted">{s.from_station.name.split(" ")[0]}</div>
                </div>
                <div className="flex-1 flex flex-col items-center gap-1">
                  <div className="text-[10px] text-text-muted">
                    {Math.floor(s.duration_min / 60)}h {String(s.duration_min % 60).padStart(2, "0")}m
                  </div>
                  <div className="w-full flex items-center gap-1">
                    <div className="h-px flex-1 bg-border" />
                    <Train className="w-3.5 h-3.5 text-train" />
                    <div className="h-px flex-1 bg-border" />
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold font-mono">
                    {s.arrival_time}
                    {s.arrival_day > 1 && (
                      <span className="text-xs text-warning ml-0.5">+{s.arrival_day - 1}</span>
                    )}
                  </div>
                  <div className="text-xs font-bold text-train">{s.to_station.code}</div>
                  <div className="text-[10px] text-text-muted">{s.to_station.name.split(" ")[0]}</div>
                </div>
              </div>

              <div className="flex gap-4 mt-3 text-xs text-text-muted">
                <span>Class: <span className="font-semibold text-text-primary font-mono">{result.class}</span></span>
                <span>Quota: <span className="font-semibold text-text-primary">{result.quota}</span></span>
                {result.chart_prepared && (
                  <span className="text-success font-semibold flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Chart Prepared
                  </span>
                )}
              </div>
            </div>

            {/* Passengers */}
            <div className="card overflow-hidden">
              <div className="px-5 py-3 bg-bg-elevated border-b border-border">
                <h3 className="font-semibold text-sm">
                  Passenger Status ({result.passengers?.length ?? 0})
                </h3>
              </div>
              <div className="divide-y divide-border">
                {(result.passengers ?? []).map((p, i) => (
                  <div key={i} className="flex items-center justify-between px-5 py-4 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-train/10 border border-train/20 flex items-center justify-center">
                        <User className="w-4 h-4 text-train" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">{p.full_name}</div>
                        <div className="text-xs text-text-muted">
                          {p.age}yrs · {p.gender === "M" ? "Male" : p.gender === "F" ? "Female" : "Other"}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {statusBadge(p.status)}
                      {p.coach && p.berth_number && (
                        <div className="text-xs text-text-muted mt-0.5 font-mono">
                          Coach {p.coach} · Berth {p.berth_number}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
      <MobileNav />
    </>
  );
}
