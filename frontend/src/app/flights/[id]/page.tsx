"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plane, ArrowLeft, Clock, Luggage, Utensils, Wifi, Zap, ChevronRight, Info,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { MobileNav } from "@/components/MobileNav";
import { api } from "@/lib/api";

interface FlightSchedule {
  id: string;
  flight_number: string;
  departure_time: string;
  arrival_time: string;
  duration_min: number;
  aircraft: string;
  cabin_class: string;
  available_seats: number;
  base_fare: number;
  taxes_and_fees: number;
  baggage_kg: number;
  has_meal: boolean;
  has_wifi: boolean;
  has_usb: boolean;
  on_time_percent: number;
  fare_type: string;
  refund_policy: string;
  airline: { code: string; name: string; color: string };
  from_airport: { iata: string; name: string; city: string; terminal: string };
  to_airport: { iata: string; name: string; city: string; terminal: string };
  journey_date: string;
}
interface TaxRow { label: string; amount: number }
interface DetailResponse {
  schedule: FlightSchedule;
  flight_number: string;
  taxes_breakdown: TaxRow[];
}

function durStr(min: number) {
  return `${Math.floor(min / 60)}h ${String(min % 60).padStart(2, "0")}m`;
}

const SEAT_ROWS = 30;
const COLS = ["A", "B", "C", "D", "E", "F"];
const BOOKED_RATE = 0.45;

function SeatMap({ bookedSeats }: { bookedSeats: Set<string> }) {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <div>
      <div className="flex items-center gap-4 mb-4 text-xs text-text-secondary flex-wrap">
        <div className="flex items-center gap-1.5"><div className="w-5 h-5 rounded bg-flight/20 border border-flight/30" /> Available</div>
        <div className="flex items-center gap-1.5"><div className="w-5 h-5 rounded bg-flight border-flight" /> Selected</div>
        <div className="flex items-center gap-1.5"><div className="w-5 h-5 rounded bg-bg-elevated border border-border opacity-40" /> Occupied</div>
      </div>
      <div className="overflow-x-auto">
        <div className="inline-block min-w-[260px]">
          {/* Col headers */}
          <div className="grid grid-cols-7 gap-1 mb-1 px-7">
            {COLS.map((c, i) => (
              <div key={c} className={`text-center text-[10px] text-text-muted font-bold ${i === 3 ? "col-start-4" : ""}`}>
                {i === 3 ? "" : c}
              </div>
            ))}
          </div>
          {Array.from({ length: SEAT_ROWS }, (_, r) => {
            const row = r + 1;
            return (
              <div key={row} className="flex items-center gap-1 mb-0.5">
                <span className="text-[10px] text-text-muted w-5 text-right font-mono">{row}</span>
                {COLS.map((col, i) => {
                  const seatId = `${row}${col}`;
                  const isBooked = bookedSeats.has(seatId);
                  const isSel = selected === seatId;
                  if (i === 3) return <div key="gap" className="w-3" />;
                  return (
                    <button
                      key={seatId}
                      disabled={isBooked}
                      onClick={() => setSelected(isSel ? null : seatId)}
                      className={`w-6 h-6 rounded text-[9px] font-bold transition-all ${
                        isBooked
                          ? "bg-bg-elevated border border-border opacity-30 cursor-not-allowed"
                          : isSel
                          ? "bg-flight border border-flight text-white"
                          : "bg-flight/15 border border-flight/30 text-flight hover:bg-flight/30"
                      }`}
                    >
                      {col}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
      {selected && (
        <p className="mt-3 text-sm text-flight font-medium">
          Selected: Seat {selected}
          <span className="text-text-muted font-normal ml-2">
            ({parseInt(selected) <= 6 ? "Front — extra legroom · +₹800" : parseInt(selected) <= 12 ? "Standard" : "Rear"})
          </span>
        </p>
      )}
    </div>
  );
}

export default function FlightDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [data, setData] = useState<DetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"details" | "seats" | "fare">("details");

  useEffect(() => {
    api<DetailResponse>(`/api/flights/${params.id}`)
      .then(d => setData(d))
      .catch(() => setLoading(false))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 py-8 space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="skeleton h-20 rounded-lg" />)}
        </main>
      </>
    );
  }

  if (!data) {
    return (
      <>
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 py-8 text-center">
          <Plane className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <h1 className="font-display text-xl font-bold mb-2">Flight not found</h1>
          <button onClick={() => router.back()} className="btn-secondary mt-4 inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Go Back
          </button>
        </main>
      </>
    );
  }

  const { schedule: s } = data;
  const total = s.base_fare + s.taxes_and_fees + 250; // +platform fee

  // Deterministic "booked" seats from schedule id
  const bookedSeats = new Set<string>();
  const seed = s.id.charCodeAt(0) + s.id.charCodeAt(1);
  for (let r = 1; r <= SEAT_ROWS; r++) {
    for (const c of COLS) {
      if (((r * 7 + c.charCodeAt(0) + seed) % 100) < BOOKED_RATE * 100) {
        bookedSeats.add(`${r}${c}`);
      }
    }
  }

  const journeyDate = new Date(s.journey_date).toLocaleDateString("en-IN", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-6 pb-28 md:pb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary mb-5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to search results
        </button>

        {/* Header */}
        <div className="card p-5 mb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span
                  className="text-sm font-bold"
                  style={{ color: s.airline.color || "#06B6D4" }}
                >
                  {s.airline.name}
                </span>
                <span className="font-mono text-xs text-text-muted">{data.flight_number}</span>
                <span className="chip text-[10px] bg-flight/10 text-flight border border-flight/20">{s.fare_type}</span>
                {s.has_meal && <span title="Meal"><Utensils className="w-3.5 h-3.5 text-text-muted" /></span>}
                {s.has_wifi && <span title="Wi-Fi"><Wifi className="w-3.5 h-3.5 text-text-muted" /></span>}
              </div>
              <div className="text-xs text-text-muted">{s.aircraft} · {s.cabin_class} · {journeyDate}</div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold font-mono">{s.departure_time}</div>
                <div className="text-xs font-semibold text-flight">{s.from_airport.iata}</div>
                <div className="text-[10px] text-text-muted">{s.from_airport.city}</div>
                {s.from_airport.terminal && (
                  <div className="text-[10px] text-text-muted">Terminal {s.from_airport.terminal}</div>
                )}
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="text-xs text-text-muted">{durStr(s.duration_min)}</div>
                <div className="flex items-center gap-1">
                  <div className="h-px w-8 bg-border" />
                  <Plane className="w-4 h-4 text-flight" />
                  <div className="h-px w-8 bg-border" />
                </div>
                <div className="text-[10px] text-text-muted">Non-stop</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold font-mono">{s.arrival_time}</div>
                <div className="text-xs font-semibold text-flight">{s.to_airport.iata}</div>
                <div className="text-[10px] text-text-muted">{s.to_airport.city}</div>
                {s.to_airport.terminal && (
                  <div className="text-[10px] text-text-muted">Terminal {s.to_airport.terminal}</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-border mb-5">
          {(["details", "seats", "fare"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px ${
                tab === t
                  ? "border-flight text-flight"
                  : "border-transparent text-text-secondary hover:text-text-primary"
              }`}
            >
              {t === "details" ? "Details" : t === "seats" ? "Seat Map" : "Fare"}
            </button>
          ))}
        </div>

        {/* Details tab */}
        {tab === "details" && (
          <div className="space-y-4">
            <div className="card p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Aircraft", value: s.aircraft },
                { label: "Duration", value: durStr(s.duration_min) },
                { label: "Baggage", value: `${s.baggage_kg}kg check-in` },
                { label: "On-time", value: `${s.on_time_percent}%` },
                { label: "Meal", value: s.has_meal ? "Included" : "Not included" },
                { label: "Wi-Fi", value: s.has_wifi ? "Available" : "Not available" },
                { label: "Refund", value: s.refund_policy },
                { label: "Seats left", value: `${s.available_seats}` },
              ].map(r => (
                <div key={r.label}>
                  <div className="text-xs text-text-muted font-medium mb-0.5">{r.label}</div>
                  <div className="text-sm font-semibold text-text-primary">{r.value}</div>
                </div>
              ))}
            </div>

            {/* Fare comparison */}
            <div className="card overflow-hidden">
              <div className="px-5 py-3 border-b border-border bg-bg-elevated">
                <h3 className="font-semibold text-sm">Fare Options</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border">
                    <tr>
                      <th className="text-left px-5 py-3 text-xs text-text-muted font-semibold">Fare</th>
                      <th className="text-center px-4 py-3 text-xs text-text-muted font-semibold">Baggage</th>
                      <th className="text-center px-4 py-3 text-xs text-text-muted font-semibold">Cancellation</th>
                      <th className="text-right px-5 py-3 text-xs text-text-muted font-semibold">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { type: "Saver", bag: `${s.baggage_kg}kg`, cancel: "Non-refundable", multi: 1.0 },
                      { type: "Value", bag: `${s.baggage_kg + 10}kg`, cancel: "₹3500 fee", multi: 1.18 },
                      { type: "Flexi", bag: `${s.baggage_kg + 15}kg`, cancel: "Full refund", multi: 1.4 },
                    ].map(r => (
                      <tr key={r.type} className={`border-b border-border last:border-0 ${s.fare_type === r.type ? "bg-flight/5" : ""}`}>
                        <td className="px-5 py-3 font-semibold flex items-center gap-2">
                          {s.fare_type === r.type && <span className="w-1.5 h-1.5 rounded-full bg-flight" />}
                          {r.type}
                        </td>
                        <td className="px-4 py-3 text-center text-text-secondary">{r.bag}</td>
                        <td className="px-4 py-3 text-center text-text-secondary">{r.cancel}</td>
                        <td className="px-5 py-3 text-right font-bold font-mono text-flight">
                          ₹{Math.round(s.base_fare * r.multi).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Seats tab */}
        {tab === "seats" && (
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-flight" />
              <p className="text-sm text-text-secondary">{s.available_seats} seats available</p>
            </div>
            <SeatMap bookedSeats={bookedSeats} />
            <p className="mt-4 text-xs text-text-muted flex items-start gap-1">
              <Info className="w-3 h-3 mt-0.5 shrink-0" />
              Seat selection is confirmed at checkout. Front rows (1-6) have extra legroom (+₹800).
            </p>
          </div>
        )}

        {/* Fare tab */}
        {tab === "fare" && (
          <div className="card p-5 space-y-3">
            <h3 className="font-semibold text-sm text-text-secondary uppercase tracking-wide">
              Fare Breakdown — {s.cabin_class}
            </h3>
            <div className="space-y-2 text-sm">
              {data.taxes_breakdown.map(row => (
                <div key={row.label} className="flex items-center justify-between text-text-secondary">
                  <span>{row.label}</span>
                  <span className="font-mono">₹{Math.round(row.amount).toLocaleString()}</span>
                </div>
              ))}
              <div className="flex items-center justify-between text-text-secondary">
                <span>Platform Fee</span>
                <span className="font-mono">₹250</span>
              </div>
              <div className="border-t border-border pt-2 flex items-center justify-between font-bold text-text-primary">
                <span>Total per person</span>
                <span className="text-flight text-lg font-mono">₹{Math.round(total).toLocaleString()}</span>
              </div>
            </div>
            <p className="text-xs text-text-muted flex items-start gap-1 pt-1">
              <Info className="w-3 h-3 mt-0.5 shrink-0" />
              {s.refund_policy} · Taxes are non-refundable in all fare types.
            </p>
          </div>
        )}

        {/* Book CTA */}
        <div className="fixed bottom-16 md:bottom-0 left-0 right-0 bg-bg-surface border-t border-border p-4 md:relative md:bg-transparent md:border-0 md:mt-6 md:p-0">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
            <div>
              <div className="text-xs text-text-muted">{s.cabin_class} · per person</div>
              <div className="text-2xl font-bold text-flight font-mono">₹{Math.round(total).toLocaleString()}</div>
            </div>
            <button
              onClick={() => router.push(`/checkout/flight/${params.id}`)}
              className="flex items-center gap-2 text-white font-semibold px-6 py-3 rounded-md transition-all active:scale-95 hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)" }}
            >
              Continue to Booking
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </main>
      <MobileNav />
    </>
  );
}
