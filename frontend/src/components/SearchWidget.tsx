"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Calendar, Users, Bus, ArrowLeftRight, Search, Plus, X, Mic } from "lucide-react";
import { apiGet } from "@/lib/api";
import type { City } from "@/lib/types";
import { format, addDays } from "date-fns";
import { useVoiceSearch } from "@/hooks/useVoiceSearch";
import { PriceCalendar } from "@/components/PriceCalendar";

type TripMode = "one-way" | "round-trip" | "multi-city";
type Leg = { from: City | null; fromQuery: string; to: City | null; toQuery: string; date: string };

const defaultDate = () => format(addDays(new Date(), 7), "yyyy-MM-dd");

function CityInput({ value, query, suggestions, onQueryChange, onSelect, placeholder, accent }: {
  value: City | null; query: string; suggestions: City[];
  onQueryChange: (q: string) => void; onSelect: (c: City) => void;
  placeholder: string; accent?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative flex-1 min-w-0">
      <MapPin className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 z-10 pointer-events-none ${accent ? "text-saffron" : "text-teal"}`} />
      <input
        type="text"
        value={value?.name || query}
        onChange={(e) => { onQueryChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        className="input pl-9 w-full"
      />
      {open && suggestions.length > 0 && (
        <div className="absolute z-30 left-0 right-0 top-full mt-1 bg-bg-elevated border border-border rounded-md shadow-card max-h-56 overflow-auto">
          {suggestions.map((c) => (
            <button key={c.id} onMouseDown={() => { onSelect(c); setOpen(false); }}
              className="w-full text-left px-3 py-2 hover:bg-bg-hover flex items-center justify-between text-sm">
              <span className="font-medium">{c.name} <span className="text-text-muted font-normal text-xs">· {c.state}</span></span>
              <span className="text-xs text-text-muted font-mono ml-2">{c.code}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function useCitySuggestions(query: string) {
  const [suggestions, setSuggestions] = useState<City[]>([]);
  useEffect(() => {
    if (query.length < 2) { setSuggestions([]); return; }
    const t = setTimeout(() => {
      apiGet<City[]>(`/api/search/suggestions?q=${query}`).then(setSuggestions).catch(() => setSuggestions([]));
    }, 200);
    return () => clearTimeout(t);
  }, [query]);
  return suggestions;
}

export function SearchWidget() {
  const router = useRouter();
  const [mode, setMode] = useState<TripMode>("one-way");

  const { status: voiceStatus, start: startVoice, stop: stopVoice } = useVoiceSearch((r) => {
    if (r.vertical !== "bus" && r.vertical !== undefined) {
      router.push(`/${r.vertical}s?from=${encodeURIComponent(r.from)}&to=${encodeURIComponent(r.to)}&date=${r.date}&travelers=${r.travelers}`);
      return;
    }
    setFromQuery(r.from);
    setToQuery(r.to);
    setDepartDate(r.date);
    setTravelers(r.travelers);
  });

  const [from, setFrom] = useState<City | null>(null);
  const [to, setTo]     = useState<City | null>(null);
  const [fromQuery, setFromQuery] = useState("");
  const [toQuery,   setToQuery]   = useState("");
  const [departDate, setDepartDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [travelers,  setTravelers]  = useState(1);
  const [busType,    setBusType]    = useState("any");
  const [acOnly,    setAcOnly]    = useState(false);
  const [govtOnly,  setGovtOnly]  = useState(false);
  const [flexDates, setFlexDates] = useState(false);
  const [addBags,   setAddBags]   = useState(false);

  const [legs, setLegs] = useState<Leg[]>([
    { from: null, fromQuery: "", to: null, toQuery: "", date: "" },
    { from: null, fromQuery: "", to: null, toQuery: "", date: "" },
  ]);

  useEffect(() => {
    const d7  = defaultDate();
    const d14 = format(addDays(new Date(), 14), "yyyy-MM-dd");
    const d10 = format(addDays(new Date(), 10), "yyyy-MM-dd");
    setDepartDate(d7);
    setReturnDate(d14);
    setLegs([
      { from: null, fromQuery: "", to: null, toQuery: "", date: d7  },
      { from: null, fromQuery: "", to: null, toQuery: "", date: d10 },
    ]);
  }, []);

  const fromSugg = useCitySuggestions(fromQuery);
  const toSugg   = useCitySuggestions(toQuery);
  const lFS0 = useCitySuggestions(legs[0]?.fromQuery ?? "");
  const lTS0 = useCitySuggestions(legs[0]?.toQuery   ?? "");
  const lFS1 = useCitySuggestions(legs[1]?.fromQuery ?? "");
  const lTS1 = useCitySuggestions(legs[1]?.toQuery   ?? "");
  const lFS2 = useCitySuggestions(legs[2]?.fromQuery ?? "");
  const lTS2 = useCitySuggestions(legs[2]?.toQuery   ?? "");
  const lFS3 = useCitySuggestions(legs[3]?.fromQuery ?? "");
  const lTS3 = useCitySuggestions(legs[3]?.toQuery   ?? "");
  const legFromSuggs = [lFS0, lFS1, lFS2, lFS3];
  const legToSuggs   = [lTS0, lTS1, lTS2, lTS3];

  const swap = () => {
    const t = from; setFrom(to); setTo(t);
    const q = fromQuery; setFromQuery(toQuery); setToQuery(q);
  };
  const updateLeg = (i: number, p: Partial<Leg>) =>
    setLegs(prev => prev.map((l, idx) => idx === i ? { ...l, ...p } : l));
  const addLeg = () => {
    if (legs.length >= 4) return;
    const last = legs[legs.length - 1];
    setLegs([...legs, { from: last.to, fromQuery: last.to?.name ?? "", to: null, toQuery: "",
      date: format(addDays(new Date(last.date || new Date()), 3), "yyyy-MM-dd") }]);
  };
  const removeLeg = (i: number) => setLegs(prev => prev.filter((_, idx) => idx !== i));

  const handleSearch = () => {
    if (mode === "multi-city") {
      const f = legs[0];
      if (!f.from || !f.to) return;
      router.push(`/search?${new URLSearchParams({ from: f.from.code, to: f.to.code, date: f.date, travelers: String(travelers), trip_type: "multi" })}`);
      return;
    }
    if (!from || !to) return;
    router.push(`/search?${new URLSearchParams({
      from: from.code, to: to.code, date: departDate, travelers: String(travelers),
      trip_type: mode === "round-trip" ? "round" : "one-way",
      ...(mode === "round-trip" ? { return_date: returnDate } : {}),
      ...(acOnly    ? { ac_only: "1" } : {}),
      ...(govtOnly  ? { govt_only: "1" } : {}),
      ...(flexDates ? { flex_dates: "1" } : {}),
      ...(addBags   ? { add_bags: "1" } : {}),
    })}`);
  };

  return (
    <div className="bg-bg-elevated border border-border rounded-xl shadow-card overflow-hidden">

      {/* ── Tabs ── */}
      <div className="flex border-b border-border px-4 pt-3">
        {(["one-way", "round-trip", "multi-city"] as TripMode[]).map((m) => {
          const label = m === "one-way" ? "One Way" : m === "round-trip" ? "Round Trip" : "Multi City";
          return (
            <button key={m} onClick={() => setMode(m)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
                mode === m ? "border-saffron text-saffron" : "border-transparent text-text-secondary hover:text-text-primary"
              }`}>
              {label}
            </button>
          );
        })}
      </div>

      <div className="p-4 space-y-3">

        {/* ── Main input row ── */}
        {mode !== "multi-city" ? (
          <div className="flex flex-col md:flex-row md:items-center gap-2">
            {/* From / swap / To — full-width on mobile, inline on desktop */}
            <div className="flex items-center gap-2 md:flex-1">
              <CityInput value={from} query={fromQuery} suggestions={fromSugg}
                onQueryChange={(q) => { setFrom(null); setFromQuery(q); }}
                onSelect={(c) => { setFrom(c); setFromQuery(c.name); }}
                placeholder="From — Mumbai, Delhi…" />
              <button onClick={swap} aria-label="Swap"
                className="flex-none w-8 h-8 flex items-center justify-center rounded-md border border-border hover:border-saffron hover:text-saffron text-text-muted transition-colors shrink-0">
                <ArrowLeftRight className="w-3.5 h-3.5" />
              </button>
              <CityInput value={to} query={toQuery} suggestions={toSugg}
                onQueryChange={(q) => { setTo(null); setToQuery(q); }}
                onSelect={(c) => { setTo(c); setToQuery(c.name); }}
                placeholder="To — Goa, Bangalore…" accent />
            </div>

            {/* Dates row — side by side on mobile too */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 md:flex-none md:w-[130px]">
                <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" />
                <input type="date" value={departDate} onChange={(e) => setDepartDate(e.target.value)}
                  className="input pl-8 w-full text-sm" />
              </div>
              {mode === "round-trip" && (
                <div className="relative flex-1 md:flex-none md:w-[130px]">
                  <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-saffron pointer-events-none" />
                  <input type="date" value={returnDate} min={departDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="input pl-8 w-full text-sm border-saffron/40 focus:border-saffron" />
                </div>
              )}
            </div>

            {/* Search + voice */}
            <div className="flex items-center gap-2">
              <button onClick={handleSearch} disabled={!from || !to}
                className="flex-1 md:flex-none btn-primary flex items-center justify-center gap-1.5 px-5 h-[42px] disabled:opacity-40">
                <Search className="w-4 h-4" />
                <span className="font-medium">Search</span>
              </button>
              <button
                type="button"
                onClick={voiceStatus === "listening" ? stopVoice : startVoice}
                title={voiceStatus === "listening" ? "Stop listening" : "Voice search"}
                className={`flex-none w-[42px] h-[42px] flex items-center justify-center rounded-lg border transition-colors ${
                  voiceStatus === "listening"
                    ? "border-red-500 bg-red-500/10 text-red-400 animate-pulse"
                    : voiceStatus === "unsupported"
                    ? "border-border text-text-muted opacity-40 cursor-not-allowed"
                    : "border-border hover:border-teal text-text-muted hover:text-teal"
                }`}
              >
                <Mic className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* ── Multi-city legs ── */
          <div className="space-y-2">
            {legs.map((leg, i) => (
              <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-2">
                <span className="flex-none text-xs text-text-muted sm:w-12 sm:text-right">Leg {i + 1}</span>
                <div className="flex items-center gap-2 flex-1">
                  <CityInput value={leg.from} query={leg.fromQuery} suggestions={legFromSuggs[i] ?? []}
                    onQueryChange={(q) => updateLeg(i, { fromQuery: q, from: null })}
                    onSelect={(c) => updateLeg(i, { from: c, fromQuery: c.name })}
                    placeholder="From city" />
                  <CityInput value={leg.to} query={leg.toQuery} suggestions={legToSuggs[i] ?? []}
                    onQueryChange={(q) => updateLeg(i, { toQuery: q, to: null })}
                    onSelect={(c) => updateLeg(i, { to: c, toQuery: c.name })}
                    placeholder="To city" accent />
                </div>
                <div className="relative flex-1 sm:flex-none sm:w-[130px]">
                  <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" />
                  <input type="date" value={leg.date} onChange={(e) => updateLeg(i, { date: e.target.value })}
                    className="input pl-8 w-full text-sm" />
                </div>
                {legs.length > 2 && (
                  <button onClick={() => removeLeg(i)}
                    className="flex-none w-7 h-7 flex items-center justify-center rounded-md text-danger hover:bg-danger/10 transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}

            <div className="flex items-center gap-3 pt-1">
              {legs.length < 4 && (
                <button onClick={addLeg} className="flex items-center gap-1.5 text-sm text-saffron hover:underline">
                  <Plus className="w-3.5 h-3.5" /> Add city
                </button>
              )}
              <div className="flex-1" />
              <button onClick={handleSearch} disabled={!legs[0].from || !legs[0].to}
                className="btn-primary flex items-center gap-1.5 px-5 h-[38px] disabled:opacity-40">
                <Search className="w-4 h-4" />
                <span className="font-medium">Search</span>
              </button>
            </div>
          </div>
        )}

        {/* ── Price calendar — shown when both cities are selected ── */}
        {mode !== "multi-city" && from && to && (
          <PriceCalendar
            from={from.code}
            to={to.code}
            selectedDate={departDate}
            onSelect={setDepartDate}
            vertical="bus"
          />
        )}

        {/* ── Options row — Travelers, Bus Type, filters ── */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-bg-surface border border-border rounded-md px-3 h-[34px]">
            <Users className="w-3.5 h-3.5 text-text-muted flex-none" />
            <select value={travelers} onChange={(e) => setTravelers(parseInt(e.target.value))}
              className="bg-transparent text-sm text-text-primary border-none outline-none cursor-pointer">
              {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} {n === 1 ? "Traveler" : "Travelers"}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-bg-surface border border-border rounded-md px-3 h-[34px]">
            <Bus className="w-3.5 h-3.5 text-text-muted flex-none" />
            <select value={busType} onChange={(e) => setBusType(e.target.value)}
              className="bg-transparent text-sm text-text-primary border-none outline-none cursor-pointer">
              <option value="any">Any Type</option>
              <option value="ac_sleeper">AC Sleeper</option>
              <option value="volvo">Volvo Multi-Axle</option>
              <option value="seater">AC Seater</option>
              <option value="non_ac">Non-AC</option>
            </select>
          </div>

          <div className="w-px h-4 bg-border flex-none" />

          {[
            { label: "Flexible Dates", state: flexDates, set: setFlexDates },
            { label: "AC Only",        state: acOnly,    set: setAcOnly    },
            { label: "Govt Buses",     state: govtOnly,  set: setGovtOnly  },
            { label: "Add Bags",       state: addBags,   set: setAddBags   },
          ].map((f) => (
            <label key={f.label}
              className={`flex items-center gap-1.5 px-2.5 h-[34px] rounded-md border cursor-pointer text-xs transition whitespace-nowrap ${
                f.state ? "border-saffron bg-saffron/5 text-saffron" : "border-border hover:border-border-hover text-text-secondary"
              }`}>
              <input type="checkbox" checked={f.state} onChange={(e) => f.set(e.target.checked)} className="accent-saffron w-3 h-3" />
              {f.label}
            </label>
          ))}
        </div>

      </div>
    </div>
  );
}
