"use client";
import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Train, Search, Zap, Coffee, ArrowLeftRight, SlidersHorizontal, X,
  Sparkles, AlertTriangle, Filter,
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { Navbar } from "@/components/Navbar";
import { MobileNav } from "@/components/MobileNav";
import { api } from "@/lib/api";

interface TrainStation { id: string; code: string; name: string; city: string; state: string; }
interface ClassInfo {
  class: string; available: number; rac: number; waitlist: number;
  status: "AVAILABLE" | "RAC" | "WL" | "REGRET"; fare: number; tatkal_fare: number;
}
interface TrainResult {
  schedule_id: string; train_number: string; train_name: string;
  train_type: string; is_superfast: boolean; has_pantry: boolean; runs_on: string;
  from_code: string; from_name: string; to_code: string; to_name: string;
  departure_time: string; arrival_time: string; arrival_day: number;
  duration_min: number; duration_str: string; date: string; classes: ClassInfo[];
}

function StationInput({ label, initialValue, onSelect, placeholder }: {
  label: string; initialValue: string; onSelect: (s: TrainStation) => void; placeholder: string;
}) {
  const [q, setQ] = useState(initialValue);
  const [opts, setOpts] = useState<TrainStation[]>([]);
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
      try { const r = await api<TrainStation[]>(`/api/trains/stations/autocomplete?q=${encodeURIComponent(v)}`); setOpts(r); setOpen(r.length > 0); }
      catch { setOpts([]); }
    }, 250);
  };
  return (
    <div ref={wrap} className="relative flex-1 min-w-0">
      <label className="text-xs text-text-muted font-medium block mb-1">{label}</label>
      <input className="input text-sm w-full" placeholder={placeholder} value={q}
        onChange={e => onChange(e.target.value)} onFocus={() => opts.length > 0 && setOpen(true)} autoComplete="off" />
      {open && (
        <div className="absolute z-50 top-full mt-1 w-full min-w-[240px] bg-bg-elevated border border-border rounded-md shadow-card max-h-52 overflow-y-auto">
          {opts.map(s => (
            <button key={s.id} type="button" className="w-full text-left px-3 py-2 hover:bg-bg-hover transition-colors"
              onMouseDown={e => { e.preventDefault(); setQ(`${s.code} – ${s.name}`); setOpts([]); setOpen(false); onSelect(s); }}>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-train bg-train/10 px-1.5 py-0.5 rounded font-mono">{s.code}</span>
                <div><div className="text-sm font-medium">{s.name}</div><div className="text-xs text-text-muted">{s.city}</div></div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const typeColors: Record<string, string> = {
  "Rajdhani": "bg-purple/10 text-purple border-purple/20",
  "Shatabdi": "bg-teal/10 text-teal border-teal/20",
  "Vande Bharat": "bg-train/10 text-train border-train/20",
  "Duronto": "bg-saffron/10 text-saffron border-saffron/20",
  "Garib Rath": "bg-success/10 text-success border-success/20",
  "Superfast": "bg-flight/10 text-flight border-flight/20",
};

const statusColors: Record<string, string> = {
  AVAILABLE: "border-success/30 text-success bg-success/5",
  RAC: "border-warning/30 text-warning bg-warning/5",
  WL: "border-saffron/30 text-saffron bg-saffron/5",
  REGRET: "border-border text-text-muted bg-bg-elevated opacity-50 cursor-not-allowed",
};

function TrainCard({ t, selClass, onClass }: { t: TrainResult; selClass: string | null; onClass: (c: string) => void }) {
  const router = useRouter();
  const dayBadge = t.arrival_day > 1 ? `+${t.arrival_day - 1}` : "";
  return (
    <div className="card p-4 md:p-5 hover:border-train/40 transition-all">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="md:w-48 shrink-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs text-text-muted">{t.train_number}</span>
            {t.is_superfast && <Zap className="w-3 h-3 text-saffron" />}
            {t.has_pantry && <Coffee className="w-3 h-3 text-teal" />}
          </div>
          <div className="font-semibold text-sm leading-tight mb-1.5">{t.train_name}</div>
          <span className={`chip text-[10px] border ${typeColors[t.train_type] || "bg-bg-elevated text-text-secondary border-border"}`}>{t.train_type}</span>
          <div className="text-[10px] text-text-muted mt-1">{t.runs_on}</div>
        </div>
        <div className="flex-1 flex items-center gap-3 min-w-0">
          <div className="text-center shrink-0">
            <div className="text-xl font-bold font-mono">{t.departure_time}</div>
            <div className="text-xs font-semibold text-train">{t.from_code}</div>
          </div>
          <div className="flex-1 flex flex-col items-center gap-1 min-w-0">
            <div className="text-[10px] text-text-muted">{t.duration_str}</div>
            <div className="w-full flex items-center gap-1">
              <div className="h-px flex-1 bg-border" />
              <Train className="w-3.5 h-3.5 text-train shrink-0" />
              <div className="h-px flex-1 bg-border" />
            </div>
            <div className="text-[10px] text-text-muted">{t.classes.length} classes</div>
          </div>
          <div className="text-center shrink-0">
            <div className="text-xl font-bold font-mono">
              {t.arrival_time}{dayBadge && <span className="text-xs text-warning ml-0.5">{dayBadge}</span>}
            </div>
            <div className="text-xs font-semibold text-train">{t.to_code}</div>
          </div>
        </div>
        <div className="hidden md:flex flex-col items-end gap-2 shrink-0">
          {selClass && (
            <div className="text-right">
              <div className="text-[10px] text-text-muted">Selected · {selClass}</div>
              <div className="text-lg font-bold text-train">₹{Math.round(t.classes.find(c => c.class === selClass)?.fare ?? 0)}</div>
            </div>
          )}
          <button onClick={() => router.push(`/trains/${t.schedule_id}`)}
            className="text-white font-semibold px-4 py-2 rounded-md text-sm hover:opacity-90 active:scale-95 transition-all"
            style={{ background: "linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)" }}>
            View Details
          </button>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-border flex flex-wrap items-center gap-2 justify-between">
        <div className="flex flex-wrap gap-1.5">
          {t.classes.map(cls => (
            <button key={cls.class} type="button" disabled={cls.status === "REGRET"}
              onClick={() => onClass(cls.class)}
              className={`flex flex-col items-center gap-0 px-2.5 py-1.5 rounded-md border text-xs transition-all ${statusColors[cls.status] || ""} ${selClass === cls.class ? "ring-2 ring-train" : ""}`}>
              <span className="font-bold font-mono">{cls.class}</span>
              <span className="text-[10px]">₹{Math.round(cls.fare)}</span>
              <span className="text-[9px] opacity-80">
                {cls.status === "AVAILABLE" ? `${cls.available} AVL` : cls.status === "RAC" ? `RAC ${cls.rac}` : cls.status === "WL" ? `WL ${cls.waitlist}` : "REGRET"}
              </span>
            </button>
          ))}
        </div>
        <button onClick={() => router.push(`/trains/${t.schedule_id}`)}
          className="md:hidden text-white font-semibold px-4 py-1.5 rounded-md text-sm"
          style={{ background: "linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)" }}>
          View
        </button>
      </div>
    </div>
  );
}

function TrainSearchInner() {
  const router = useRouter();
  const params = useSearchParams();

  const fromParam = params.get("from") || "";
  const toParam = params.get("to") || "";
  const dateParam = params.get("date") || new Date().toISOString().slice(0, 10);
  const quotaParam = params.get("quota") || "GN";
  const classParam = params.get("class") || "";

  const [fromSt, setFromSt] = useState<TrainStation | null>(null);
  const [toSt, setToSt] = useState<TrainStation | null>(null);
  const [fromVal, setFromVal] = useState(fromParam);
  const [toVal, setToVal] = useState(toParam);
  const [date, setDate] = useState(dateParam);
  const [classFilter, setClassFilter] = useState(classParam);
  const [quota, setQuota] = useState(quotaParam);

  const [results, setResults] = useState<TrainResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selClasses, setSelClasses] = useState<Record<string, string>>({});
  const [sort, setSort] = useState<"departure" | "duration" | "fare">("departure");
  const [filterOpen, setFilterOpen] = useState(false);
  const [depTimes, setDepTimes] = useState<string[]>([]);
  const [trainTypes, setTrainTypes] = useState<string[]>([]);
  const [durationMax, setDurationMax] = useState(0);
  const [superfast, setSuperfast] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const maxDate = new Date(Date.now() + 120 * 86400000).toISOString().slice(0, 10);

  const depSlot = (t: string) => {
    const h = parseInt(t.split(":")[0]);
    if (h >= 4 && h < 12) return "Morning";
    if (h >= 12 && h < 17) return "Afternoon";
    if (h >= 17 && h < 22) return "Evening";
    return "Night";
  };
  const hhmm = (s: string) => { const [h, m] = s.split(":").map(Number); return h * 60 + m; };

  const doSearch = useCallback(async (from: string, to: string, d: string, cls: string) => {
    if (!from || !to || !d) return;
    setLoading(true);
    try {
      const r = await api<TrainResult[]>(`/api/trains/search?from=${from}&to=${to}&date=${d}${cls ? `&class=${cls}` : ""}`);
      setResults(r ?? []);
    } catch { setResults([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (fromParam && toParam && dateParam) {
      setFromSt({ id: "", code: fromParam, name: fromParam, city: "", state: "" });
      setToSt({ id: "", code: toParam, name: toParam, city: "", state: "" });
      doSearch(fromParam, toParam, dateParam, classParam);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = () => {
    const fromCode = fromSt?.code || fromVal.split(/[\s–-]+/)[0].trim().toUpperCase();
    const toCode   = toSt?.code   || toVal.split(/[\s–-]+/)[0].trim().toUpperCase();
    if (!fromCode || !toCode) return;
    const q = new URLSearchParams({ from: fromCode, to: toCode, date, quota });
    if (classFilter) q.set("class", classFilter);
    router.replace(`/trains/search?${q}`, { scroll: false });
    doSearch(fromCode, toCode, date, classFilter);
  };

  const swap = () => {
    const fv = fromVal; setFromVal(toVal); setToVal(fv);
    const fs = fromSt; setFromSt(toSt); setToSt(fs);
  };

  const allTypes = Array.from(new Set(results.map(r => r.train_type)));
  const filtered = results.filter(t => {
    if (depTimes.length && !depTimes.includes(depSlot(t.departure_time))) return false;
    if (trainTypes.length && !trainTypes.includes(t.train_type)) return false;
    if (durationMax && t.duration_min > durationMax) return false;
    if (superfast && !t.is_superfast) return false;
    return true;
  });
  const sorted = [...filtered].sort((a, b) => {
    if (sort === "departure") return hhmm(a.departure_time) - hhmm(b.departure_time);
    if (sort === "duration") return a.duration_min - b.duration_min;
    return (a.classes[0]?.fare ?? 9999) - (b.classes[0]?.fare ?? 9999);
  });
  const activeFilterCount = depTimes.length + trainTypes.length + (durationMax ? 1 : 0) + (superfast ? 1 : 0);
  const clearFilters = () => { setDepTimes([]); setTrainTypes([]); setDurationMax(0); setSuperfast(false); };

  const minFare = results.length ? Math.min(...results.flatMap(r => r.classes.map(c => c.fare))) : 0;

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 pb-24 md:pb-12">
        {/* Header re-search bar */}
        <div className="card p-4 mb-4">
          <div className="flex flex-col md:flex-row gap-3 items-end flex-wrap">
            <StationInput label="From" initialValue={fromVal} placeholder="Station code"
              onSelect={s => { setFromSt(s); setFromVal(`${s.code} – ${s.name}`); }} />
            <button type="button" onClick={swap} className="btn-icon self-end mb-0.5 shrink-0">
              <ArrowLeftRight className="w-4 h-4" />
            </button>
            <StationInput label="To" initialValue={toVal} placeholder="Station code"
              onSelect={s => { setToSt(s); setToVal(`${s.code} – ${s.name}`); }} />
            <div className="w-full md:w-auto">
              <label className="text-xs text-text-muted font-medium block mb-1">Date</label>
              <input type="date" className="input text-sm w-full md:w-36" value={date} min={today} max={maxDate} onChange={e => setDate(e.target.value)} />
            </div>
            <div className="w-full md:w-auto">
              <label className="text-xs text-text-muted font-medium block mb-1">Class</label>
              <select className="input text-sm w-full md:w-28" value={classFilter} onChange={e => setClassFilter(e.target.value)}>
                <option value="">All Classes</option>
                {["1A","2A","3A","SL","CC","EC","2S"].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="w-full md:w-auto">
              <label className="text-xs text-text-muted font-medium block mb-1">Quota</label>
              <select className="input text-sm w-full md:w-24" value={quota} onChange={e => setQuota(e.target.value)}>
                <option value="GN">General</option>
                <option value="TQ">Tatkal</option>
                <option value="LD">Ladies</option>
                <option value="SS">Sr. Citizen</option>
              </select>
            </div>
            <button onClick={handleSearch}
              className="flex items-center gap-2 text-white font-semibold px-5 py-2.5 rounded-md hover:opacity-90 active:scale-95 transition-all w-full md:w-auto justify-center"
              style={{ background: "linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)" }}>
              <Search className="w-4 h-4" /> Search Trains
            </button>
          </div>
          <div className="mt-3 flex items-center gap-2 text-sm">
            <span className="font-semibold">{fromParam || "—"} → {toParam || "—"}</span>
            <span className="text-text-muted">· {dateParam} ·</span>
            {loading ? <span className="text-text-muted animate-pulse">Searching…</span>
              : <span className="text-text-muted"><span className="text-text-primary font-semibold">{results.length}</span> trains found</span>}
            {minFare > 0 && !loading && <span className="text-text-muted">· from <span className="text-train font-semibold">₹{Math.round(minFare)}</span></span>}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_280px] gap-4">
          {/* Filters */}
          <aside className={`${filterOpen ? "block" : "hidden lg:block"} h-fit`}>
            <div className="card p-4 sticky top-4 space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-train" />
                  <span className="font-semibold text-sm">Filters</span>
                </div>
                {activeFilterCount > 0 && <button onClick={clearFilters} className="text-xs text-train hover:underline">Clear {activeFilterCount}</button>}
              </div>
              <div>
                <div className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">Departure</div>
                {(["Morning","Afternoon","Evening","Night"] as const).map(slot => (
                  <label key={slot} className="flex items-center gap-2 py-1 cursor-pointer">
                    <input type="checkbox" checked={depTimes.includes(slot)} className="accent-train"
                      onChange={e => setDepTimes(p => e.target.checked ? [...p, slot] : p.filter(x => x !== slot))} />
                    <span className="text-sm text-text-secondary">{slot}</span>
                    <span className="text-[10px] text-text-muted ml-auto">
                      {slot === "Morning" ? "06–12" : slot === "Afternoon" ? "12–17" : slot === "Evening" ? "17–22" : "22–06"}
                    </span>
                  </label>
                ))}
              </div>
              {allTypes.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">Train Type</div>
                  {allTypes.map(type => (
                    <label key={type} className="flex items-center gap-2 py-1 cursor-pointer">
                      <input type="checkbox" checked={trainTypes.includes(type)} className="accent-train"
                        onChange={e => setTrainTypes(p => e.target.checked ? [...p, type] : p.filter(x => x !== type))} />
                      <span className="text-sm text-text-secondary">{type}</span>
                    </label>
                  ))}
                </div>
              )}
              <div>
                <div className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">Duration</div>
                {([0, 300, 600, 720] as const).map(max => (
                  <label key={max} className="flex items-center gap-2 py-1 cursor-pointer">
                    <input type="radio" checked={durationMax === max} className="accent-train" onChange={() => setDurationMax(max)} />
                    <span className="text-sm text-text-secondary">
                      {max === 0 ? "Any" : max === 300 ? "Under 5h" : max === 600 ? "Under 10h" : "Under 12h"}
                    </span>
                  </label>
                ))}
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={superfast} className="accent-train" onChange={e => setSuperfast(e.target.checked)} />
                <span className="text-sm text-text-secondary flex items-center gap-1"><Zap className="w-3.5 h-3.5 text-saffron" /> Superfast only</span>
              </label>
            </div>
          </aside>

          {/* Results */}
          <section>
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <button onClick={() => setFilterOpen(o => !o)} className="lg:hidden flex items-center gap-1.5 text-xs btn-secondary">
                  <SlidersHorizontal className="w-3.5 h-3.5" /> Filters
                  {activeFilterCount > 0 && <span className="bg-train text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">{activeFilterCount}</span>}
                </button>
                <span className="text-sm text-text-muted">
                  <span className="font-semibold text-text-primary">{sorted.length}</span>
                  {activeFilterCount > 0 && <span> of {results.length}</span>} trains
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-text-muted mr-1">Sort:</span>
                {(["departure","duration","fare"] as const).map(s => (
                  <button key={s} onClick={() => setSort(s)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${sort === s ? "bg-train/10 text-train border border-train/30" : "text-text-secondary hover:bg-bg-elevated"}`}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <div key={i} className="card p-5 h-32 animate-pulse bg-bg-elevated" />)}
              </div>
            ) : sorted.length === 0 ? (
              <div className="card p-10 text-center">
                <Train className="w-10 h-10 text-text-muted mx-auto mb-3" />
                <div className="font-semibold mb-1">No trains found</div>
                <p className="text-sm text-text-secondary mb-3">Try a different date or adjust filters.</p>
                {activeFilterCount > 0 && <button onClick={clearFilters} className="btn-secondary text-sm">Clear filters</button>}
              </div>
            ) : (
              <div className="space-y-3">
                {sorted.map(t => (
                  <TrainCard key={t.schedule_id} t={t}
                    selClass={selClasses[t.schedule_id] ?? null}
                    onClass={cls => setSelClasses(p => ({ ...p, [t.schedule_id]: cls }))} />
                ))}
              </div>
            )}
          </section>

          {/* Right sidebar */}
          <aside className="space-y-4 lg:sticky lg:top-4 h-fit">
            <div className="card p-5">
              <h3 className="font-semibold mb-1">Fare Trend</h3>
              <p className="text-xs text-text-muted mb-3">Sleeper class · last 6 months</p>
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={[
                    {month:"Jan",fare:485},{month:"Feb",fare:450},{month:"Mar",fare:510},
                    {month:"Apr",fare:620},{month:"May",fare:580},{month:"Jun",fare:540},
                  ]}>
                    <XAxis dataKey="month" stroke="#6B7280" style={{fontSize:10}} />
                    <YAxis hide />
                    <Tooltip contentStyle={{background:"#1A2235",border:"1px solid #1F2937",borderRadius:8,fontSize:12}} />
                    <Line type="monotone" dataKey="fare" stroke="#6366F1" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="card p-5 border-teal/30 bg-teal/5">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-teal" />
                <span className="chip bg-teal/10 text-teal border border-teal/20">AI Insight</span>
              </div>
              <h3 className="font-semibold mb-1 text-sm">Book 3–4 days ahead</h3>
              <p className="text-sm text-text-secondary">Sleeper fares are lowest when booked 72–96 hours before departure on this route.</p>
            </div>
            <div className="card p-5 border-warning/30 bg-warning/5">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-warning" />
                <span className="chip bg-warning/10 text-warning border border-warning/20">Tatkal</span>
              </div>
              <h3 className="font-semibold mb-1 text-sm">Last-minute seats</h3>
              <p className="text-sm text-text-secondary">Tatkal quota opens 1 day before departure. Select Tatkal quota above to see availability.</p>
            </div>
          </aside>
        </div>
      </main>
      <MobileNav />
    </>
  );
}

export default function TrainSearchPage() {
  return (
    <Suspense fallback={<div className="p-8 text-text-muted">Loading…</div>}>
      <TrainSearchInner />
    </Suspense>
  );
}
