"use client";
import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plane, Search, ArrowLeftRight, SlidersHorizontal, Wifi, Utensils, Luggage, Zap, Filter, Sparkles, AlertTriangle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { Navbar } from "@/components/Navbar";
import { MobileNav } from "@/components/MobileNav";
import { api } from "@/lib/api";

interface Airport { id: string; iata: string; name: string; city: string; state: string; }
interface FlightResult {
  schedule_id: string; flight_number: string; airline_code: string; airline_name: string;
  airline_color: string; from_iata: string; from_city: string; to_iata: string; to_city: string;
  departure_time: string; arrival_time: string; duration_min: number; aircraft: string;
  available_seats: number; base_fare: number; taxes_and_fees: number; total_fare: number;
  baggage_kg: number; has_meal: boolean; has_wifi: boolean; on_time_percent: number;
  fare_type: string; refund_policy: string;
}

function AirportInput({ label, initialValue, onSelect, placeholder }: {
  label: string; initialValue: string; onSelect: (a: Airport) => void; placeholder: string;
}) {
  const [q, setQ] = useState(initialValue);
  const [opts, setOpts] = useState<Airport[]>([]);
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const wrap = useRef<HTMLDivElement>(null);
  useEffect(() => { setQ(initialValue); }, [initialValue]);
  useEffect(() => {
    const close = (e: MouseEvent) => { if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  const onChange = (v: string) => {
    setQ(v); clearTimeout(timer.current);
    if (v.length < 2) { setOpts([]); setOpen(false); return; }
    timer.current = setTimeout(async () => {
      try { const r = await api<Airport[]>(`/api/flights/airports/autocomplete?q=${encodeURIComponent(v)}`); setOpts(r); setOpen(r.length > 0); }
      catch { setOpts([]); }
    }, 250);
  };
  return (
    <div ref={wrap} className="relative flex-1 min-w-0">
      <label className="text-xs text-text-muted font-medium block mb-1">{label}</label>
      <input className="input text-sm w-full" placeholder={placeholder} value={q}
        onChange={e => onChange(e.target.value)} onFocus={() => opts.length > 0 && setOpen(true)} autoComplete="off" />
      {open && (
        <div className="absolute z-50 top-full mt-1 w-full min-w-[260px] bg-bg-elevated border border-border rounded-md shadow-card max-h-52 overflow-y-auto">
          {opts.map(a => (
            <button key={a.id} type="button" className="w-full text-left px-3 py-2.5 hover:bg-bg-hover transition-colors"
              onMouseDown={e => { e.preventDefault(); setQ(`${a.iata} – ${a.city}`); setOpts([]); setOpen(false); onSelect(a); }}>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-flight bg-flight/10 px-1.5 py-0.5 rounded font-mono">{a.iata}</span>
                <div><div className="text-sm font-medium">{a.city}</div><div className="text-xs text-text-muted">{a.name}</div></div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const fareColors: Record<string, string> = {
  Saver: "bg-success/10 text-success border-success/20",
  Value: "bg-flight/10 text-flight border-flight/20",
  Flexi: "bg-purple/10 text-purple border-purple/20",
};

function durStr(min: number) { return `${Math.floor(min / 60)}h ${String(min % 60).padStart(2, "0")}m`; }

function FlightCard({ f }: { f: FlightResult }) {
  const router = useRouter();
  return (
    <div className="card p-4 md:p-5 hover:border-flight/40 transition-all">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="md:w-40 shrink-0">
          <div className="text-sm font-bold mb-0.5" style={{ color: f.airline_color || "#06B6D4" }}>{f.airline_name}</div>
          <div className="text-xs font-mono text-text-muted">{f.flight_number}</div>
          <div className="text-[10px] text-text-muted mt-1">{f.aircraft}</div>
          <span className={`chip text-[10px] border mt-1.5 ${fareColors[f.fare_type] || "bg-bg-elevated border-border text-text-secondary"}`}>{f.fare_type}</span>
        </div>
        <div className="flex-1 flex items-center gap-3 min-w-0">
          <div className="text-center shrink-0">
            <div className="text-xl font-bold font-mono">{f.departure_time}</div>
            <div className="text-xs font-semibold text-flight">{f.from_iata}</div>
            <div className="text-[10px] text-text-muted">{f.from_city}</div>
          </div>
          <div className="flex-1 flex flex-col items-center gap-1 min-w-0">
            <div className="text-[10px] text-text-muted">{durStr(f.duration_min)}</div>
            <div className="w-full flex items-center gap-1">
              <div className="h-px flex-1 bg-border" />
              <Plane className="w-3.5 h-3.5 text-flight shrink-0" />
              <div className="h-px flex-1 bg-border" />
            </div>
            <div className="text-[10px] text-text-muted">Non-stop</div>
          </div>
          <div className="text-center shrink-0">
            <div className="text-xl font-bold font-mono">{f.arrival_time}</div>
            <div className="text-xs font-semibold text-flight">{f.to_iata}</div>
            <div className="text-[10px] text-text-muted">{f.to_city}</div>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2.5 shrink-0">
          <span className="text-text-muted text-xs flex items-center gap-1"><Luggage className="w-3.5 h-3.5" />{f.baggage_kg}kg</span>
          {f.has_meal && <span title="Meal"><Utensils className="w-3.5 h-3.5 text-text-muted" /></span>}
          {f.has_wifi && <span title="Wi-Fi"><Wifi className="w-3.5 h-3.5 text-text-muted" /></span>}
          <span className={`text-[10px] font-medium flex items-center gap-1 ${f.on_time_percent >= 85 ? "text-success" : "text-warning"}`}>
            <Zap className="w-3 h-3" />{f.on_time_percent}%
          </span>
        </div>
        <div className="hidden md:flex flex-col items-end gap-2 shrink-0">
          <div className="text-right">
            <div className="text-[10px] text-text-muted">per person</div>
            <div className="text-xl font-bold text-flight font-mono">₹{Math.round(f.total_fare).toLocaleString()}</div>
            <div className="text-[10px] text-text-muted">incl. taxes</div>
          </div>
          <button onClick={() => router.push(`/flights/${f.schedule_id}`)}
            className="text-white font-semibold px-4 py-2 rounded-md text-sm hover:opacity-90 active:scale-95 transition-all"
            style={{ background: "linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)" }}>
            View Details
          </button>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-border flex items-center justify-between md:hidden">
        <div>
          <div className="text-lg font-bold text-flight font-mono">₹{Math.round(f.total_fare).toLocaleString()}</div>
          <div className="text-[10px] text-text-muted">{f.baggage_kg}kg · {f.refund_policy}</div>
        </div>
        <button onClick={() => router.push(`/flights/${f.schedule_id}`)}
          className="text-white font-semibold px-4 py-1.5 rounded-md text-sm"
          style={{ background: "linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)" }}>
          View
        </button>
      </div>
    </div>
  );
}

function FlightSearchInner() {
  const router = useRouter();
  const params = useSearchParams();

  const fromParam = params.get("from") || "";
  const toParam   = params.get("to")   || "";
  const dateParam = params.get("date") || new Date().toISOString().slice(0, 10);
  const adultsParam = parseInt(params.get("adults") || "1");

  const [fromAirport, setFromAirport] = useState<Airport | null>(null);
  const [toAirport, setToAirport] = useState<Airport | null>(null);
  const [fromVal, setFromVal] = useState(fromParam);
  const [toVal, setToVal] = useState(toParam);
  const [date, setDate] = useState(dateParam);
  const [adults, setAdults] = useState(adultsParam);

  const [results, setResults] = useState<FlightResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<"fare"|"departure"|"duration"|"ontime">("fare");
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterAirlines, setFilterAirlines] = useState<string[]>([]);
  const [fareTypes, setFareTypes] = useState<string[]>([]);
  const [maxDur, setMaxDur] = useState(0);

  const today = new Date().toISOString().slice(0, 10);

  const doSearch = useCallback(async (from: string, to: string, d: string) => {
    if (!from || !to || !d) return;
    setLoading(true);
    try {
      const r = await api<FlightResult[]>(`/api/flights/search?from=${from}&to=${to}&date=${d}`);
      setResults(r ?? []);
    } catch { setResults([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (fromParam && toParam && dateParam) {
      setFromAirport({ id:"", iata: fromParam, name: fromParam, city: fromParam, state:"" });
      setToAirport({ id:"", iata: toParam, name: toParam, city: toParam, state:"" });
      doSearch(fromParam, toParam, dateParam);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const swap = () => {
    const fv = fromVal; setFromVal(toVal); setToVal(fv);
    const fa = fromAirport; setFromAirport(toAirport); setToAirport(fa);
  };

  const handleSearch = () => {
    const fromCode = fromAirport?.iata || fromVal.split(/[\s–-]+/)[0].trim().toUpperCase();
    const toCode   = toAirport?.iata   || toVal.split(/[\s–-]+/)[0].trim().toUpperCase();
    if (!fromCode || !toCode) return;
    const q = new URLSearchParams({ from: fromCode, to: toCode, date, adults: String(adults) });
    router.replace(`/flights/search?${q}`, { scroll: false });
    doSearch(fromCode, toCode, date);
  };

  const hhmm = (s: string) => { const [h, m] = s.split(":").map(Number); return h * 60 + m; };
  const allAirlines = Array.from(new Set(results.map(r => r.airline_name)));
  const filtered = results.filter(f => {
    if (filterAirlines.length && !filterAirlines.includes(f.airline_name)) return false;
    if (fareTypes.length && !fareTypes.includes(f.fare_type)) return false;
    if (maxDur && f.duration_min > maxDur) return false;
    return true;
  });
  const sorted = [...filtered].sort((a, b) => {
    if (sort === "fare") return a.total_fare - b.total_fare;
    if (sort === "departure") return hhmm(a.departure_time) - hhmm(b.departure_time);
    if (sort === "duration") return a.duration_min - b.duration_min;
    return b.on_time_percent - a.on_time_percent;
  });
  const activeFilterCount = filterAirlines.length + fareTypes.length + (maxDur ? 1 : 0);
  const clearFilters = () => { setFilterAirlines([]); setFareTypes([]); setMaxDur(0); };
  const minFare = results.length ? Math.min(...results.map(r => r.total_fare)) : 0;

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 pb-24 md:pb-12">
        {/* Re-search bar */}
        <div className="card p-4 mb-4">
          <div className="flex flex-col md:flex-row gap-3 items-end flex-wrap">
            <AirportInput label="From" initialValue={fromVal} placeholder="City or IATA code"
              onSelect={a => { setFromAirport(a); setFromVal(`${a.iata} – ${a.city}`); }} />
            <button type="button" onClick={swap} className="btn-icon self-end mb-0.5 shrink-0">
              <ArrowLeftRight className="w-4 h-4" />
            </button>
            <AirportInput label="To" initialValue={toVal} placeholder="City or IATA code"
              onSelect={a => { setToAirport(a); setToVal(`${a.iata} – ${a.city}`); }} />
            <div className="w-full md:w-auto">
              <label className="text-xs text-text-muted font-medium block mb-1">Date</label>
              <input type="date" className="input text-sm w-full md:w-36" value={date} min={today} onChange={e => setDate(e.target.value)} />
            </div>
            <div className="w-full md:w-auto">
              <label className="text-xs text-text-muted font-medium block mb-1">Adults</label>
              <select className="input text-sm w-full md:w-24" value={adults} onChange={e => setAdults(parseInt(e.target.value))}>
                {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} Adult{n>1?"s":""}</option>)}
              </select>
            </div>
            <button onClick={handleSearch}
              className="flex items-center gap-2 text-white font-semibold px-5 py-2.5 rounded-md hover:opacity-90 active:scale-95 transition-all w-full md:w-auto justify-center"
              style={{ background: "linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)" }}>
              <Search className="w-4 h-4" /> Search Flights
            </button>
          </div>
          <div className="mt-3 flex items-center gap-2 text-sm">
            <span className="font-semibold">{fromParam || "—"} → {toParam || "—"}</span>
            <span className="text-text-muted">· {dateParam} · {adultsParam} adult{adultsParam > 1 ? "s" : ""} ·</span>
            {loading ? <span className="text-text-muted animate-pulse">Searching…</span>
              : <span className="text-text-muted"><span className="text-text-primary font-semibold">{results.length}</span> flights found</span>}
            {minFare > 0 && !loading && <span className="text-text-muted">· from <span className="text-flight font-semibold">₹{Math.round(minFare).toLocaleString()}</span></span>}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_280px] gap-4">
          {/* Filters */}
          <aside className={`${filterOpen ? "block" : "hidden lg:block"} h-fit`}>
            <div className="card p-4 sticky top-4 space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-flight" />
                  <span className="font-semibold text-sm">Filters</span>
                </div>
                {activeFilterCount > 0 && <button onClick={clearFilters} className="text-xs text-flight hover:underline">Clear {activeFilterCount}</button>}
              </div>
              {allAirlines.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">Airlines</div>
                  {allAirlines.map(a => (
                    <label key={a} className="flex items-center gap-2 py-1 cursor-pointer">
                      <input type="checkbox" checked={filterAirlines.includes(a)} className="accent-flight"
                        onChange={e => setFilterAirlines(p => e.target.checked ? [...p, a] : p.filter(x => x !== a))} />
                      <span className="text-sm text-text-secondary">{a}</span>
                    </label>
                  ))}
                </div>
              )}
              <div>
                <div className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">Fare Type</div>
                {["Saver","Value","Flexi"].map(f => (
                  <label key={f} className="flex items-center gap-2 py-1 cursor-pointer">
                    <input type="checkbox" checked={fareTypes.includes(f)} className="accent-flight"
                      onChange={e => setFareTypes(p => e.target.checked ? [...p, f] : p.filter(x => x !== f))} />
                    <span className="text-sm text-text-secondary">{f}</span>
                  </label>
                ))}
              </div>
              <div>
                <div className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">Max Duration</div>
                {([0,90,120,180] as const).map(max => (
                  <label key={max} className="flex items-center gap-2 py-1 cursor-pointer">
                    <input type="radio" checked={maxDur === max} className="accent-flight" onChange={() => setMaxDur(max)} />
                    <span className="text-sm text-text-secondary">
                      {max === 0 ? "Any" : max === 90 ? "Under 1.5h" : max === 120 ? "Under 2h" : "Under 3h"}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </aside>

          {/* Results */}
          <section>
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <button onClick={() => setFilterOpen(o => !o)} className="lg:hidden flex items-center gap-1.5 text-xs btn-secondary">
                  <SlidersHorizontal className="w-3.5 h-3.5" /> Filters
                  {activeFilterCount > 0 && <span className="bg-flight text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">{activeFilterCount}</span>}
                </button>
                <span className="text-sm text-text-muted">
                  <span className="font-semibold text-text-primary">{sorted.length}</span>
                  {activeFilterCount > 0 && <span> of {results.length}</span>} flights
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-text-muted mr-1">Sort:</span>
                {(["fare","departure","duration","ontime"] as const).map(s => (
                  <button key={s} onClick={() => setSort(s)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${sort === s ? "bg-flight/10 text-flight border border-flight/30" : "text-text-secondary hover:bg-bg-elevated"}`}>
                    {s === "ontime" ? "On-time" : s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="card p-5 h-32 animate-pulse bg-bg-elevated" />)}</div>
            ) : sorted.length === 0 ? (
              <div className="card p-10 text-center">
                <Plane className="w-10 h-10 text-text-muted mx-auto mb-3" />
                <div className="font-semibold mb-1">No flights found</div>
                <p className="text-sm text-text-secondary mb-3">Try a different date or adjust filters.</p>
                {activeFilterCount > 0 && <button onClick={clearFilters} className="btn-secondary text-sm">Clear filters</button>}
              </div>
            ) : (
              <div className="space-y-3">{sorted.map(f => <FlightCard key={f.schedule_id} f={f} />)}</div>
            )}
          </section>

          {/* Right sidebar */}
          <aside className="space-y-4 lg:sticky lg:top-4 h-fit">
            <div className="card p-5">
              <h3 className="font-semibold mb-1">Fare Trend</h3>
              <p className="text-xs text-text-muted mb-3">Economy class · last 6 months</p>
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={[
                    {month:"Jan",fare:4200},{month:"Feb",fare:3800},{month:"Mar",fare:5100},
                    {month:"Apr",fare:6200},{month:"May",fare:5500},{month:"Jun",fare:4800},
                  ]}>
                    <XAxis dataKey="month" stroke="#6B7280" style={{fontSize:10}} />
                    <YAxis hide />
                    <Tooltip contentStyle={{background:"#1A2235",border:"1px solid #1F2937",borderRadius:8,fontSize:12}} />
                    <Line type="monotone" dataKey="fare" stroke="#06B6D4" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="card p-5 border-teal/30 bg-teal/5">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-teal" />
                <span className="chip bg-teal/10 text-teal border border-teal/20">AI Insight</span>
              </div>
              <h3 className="font-semibold mb-1 text-sm">Tuesday departures are cheapest</h3>
              <p className="text-sm text-text-secondary">Fares on Tue–Wed are typically 15–20% lower than weekend flights on domestic routes.</p>
            </div>
            <div className="card p-5 border-warning/30 bg-warning/5">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-warning" />
                <span className="chip bg-warning/10 text-warning border border-warning/20">Price Alert</span>
              </div>
              <h3 className="font-semibold mb-1 text-sm">Fares rising this week</h3>
              <p className="text-sm text-text-secondary">Prices on this route have gone up 12% in the last 3 days. Book now to lock in today&apos;s fare.</p>
            </div>
          </aside>
        </div>
      </main>
      <MobileNav />
    </>
  );
}

export default function FlightSearchPage() {
  return (
    <Suspense fallback={<div className="p-8 text-text-muted">Loading…</div>}>
      <FlightSearchInner />
    </Suspense>
  );
}
