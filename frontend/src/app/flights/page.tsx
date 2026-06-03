"use client";
import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Plane, Search, ArrowLeftRight, Zap, TrendingUp, Crown, Clock, Mic } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { Navbar } from "@/components/Navbar";
import { MobileNav } from "@/components/MobileNav";
import { api } from "@/lib/api";
import { useVoiceSearch } from "@/hooks/useVoiceSearch";
import { PriceCalendar } from "@/components/PriceCalendar";
import { useT } from "@/lib/i18n";

interface Airport {
  id: string;
  iata: string;
  name: string;
  city: string;
  state: string;
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
    const close = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const onChange = (v: string) => {
    setQ(v);
    clearTimeout(timer.current);
    if (v.length < 2) { setOpts([]); setOpen(false); return; }
    timer.current = setTimeout(async () => {
      try {
        const res = await api<Airport[]>(`/api/flights/airports/autocomplete?q=${encodeURIComponent(v)}`);
        setOpts(res);
        setOpen(res.length > 0);
      } catch { setOpts([]); }
    }, 250);
  };

  return (
    <div ref={wrap} className="relative">
      <label className="text-xs text-text-muted font-medium block mb-1">{label}</label>
      <input
        className="input text-sm"
        placeholder={placeholder}
        value={q}
        onChange={e => onChange(e.target.value)}
        onFocus={() => opts.length > 0 && setOpen(true)}
        autoComplete="off"
      />
      {open && (
        <div className="absolute z-50 top-full mt-1 w-full min-w-[280px] bg-bg-elevated border border-border rounded-md shadow-card max-h-56 overflow-y-auto">
          {opts.map(a => (
            <button
              key={a.id}
              type="button"
              className="w-full text-left px-3 py-2.5 hover:bg-bg-hover transition-colors"
              onMouseDown={e => {
                e.preventDefault();
                setQ(`${a.iata} – ${a.city}`);
                setOpts([]); setOpen(false);
                onSelect(a);
              }}
            >
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-flight bg-flight/10 px-1.5 py-0.5 rounded font-mono">{a.iata}</span>
                <div>
                  <div className="text-sm font-medium text-text-primary">{a.city}</div>
                  <div className="text-xs text-text-muted">{a.name}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function FlightsLanding() {
  const router = useRouter();
  const t = useT();

  const [tripType, setTripType] = useState<"one-way"|"round-trip">("one-way");
  const [fromAirport, setFromAirport] = useState<Airport | null>(null);
  const [toAirport, setToAirport] = useState<Airport | null>(null);
  const [fromVal, setFromVal] = useState("");
  const [toVal, setToVal] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [returnDate, setReturnDate] = useState(new Date(Date.now() + 86400000).toISOString().slice(0, 10));
  const [adults, setAdults] = useState(1);
  const [cabin, setCabin] = useState<"economy"|"premium_economy"|"business"|"first">("economy");

  const today = new Date().toISOString().slice(0, 10);

  const { status: voiceStatus, start: startVoice, stop: stopVoice } = useVoiceSearch((r) => {
    setFromVal(r.from);
    setToVal(r.to);
    setDate(r.date);
    setAdults(r.travelers);
    setFromAirport(null);
    setToAirport(null);
  });

  const swap = () => {
    setFromAirport(toAirport); setFromVal(toVal);
    setToAirport(fromAirport); setToVal(fromVal);
  };

  const handleSearch = () => {
    const fromCode = fromAirport?.iata || fromVal.split(/[\s–-]+/)[0].trim().toUpperCase();
    const toCode   = toAirport?.iata   || toVal.split(/[\s–-]+/)[0].trim().toUpperCase();
    if (!fromCode || !toCode) return;
    const q = new URLSearchParams({ from: fromCode, to: toCode, date, adults: String(adults), cabin, trip_type: tripType });
    if (tripType === "round-trip") q.set("return_date", returnDate);
    router.push(`/flights/search?${q}`);
  };

  const quickRoutes = [
    { from: "BOM", to: "DEL", label: "Mumbai → Delhi" },
    { from: "DEL", to: "BLR", label: "Delhi → Bengaluru" },
    { from: "BOM", to: "GOI", label: "Mumbai → Goa" },
    { from: "DEL", to: "CCU", label: "Delhi → Kolkata" },
    { from: "BLR", to: "HYD", label: "Bengaluru → Hyderabad" },
    { from: "DEL", to: "JAI", label: "Delhi → Jaipur" },
    { from: "BOM", to: "COK", label: "Mumbai → Kochi" },
    { from: "DEL", to: "VNS", label: "Delhi → Varanasi" },
    { from: "DEL", to: "IXL", label: "Delhi → Leh" },
    { from: "DEL", to: "SXR", label: "Delhi → Srinagar" },
    { from: "BLR", to: "IXE", label: "Bengaluru → Mangaluru" },
    { from: "DEL", to: "ATQ", label: "Delhi → Amritsar" },
  ];

  return (
    <>
      <Navbar />
      <main className="min-h-screen pb-24 md:pb-8">
        <section className="relative overflow-hidden border-b border-border flex flex-col md:min-h-screen">
          <div className="relative aspect-video md:absolute md:inset-0 overflow-hidden pointer-events-none">
            <img
              src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1920&q=80"
              alt="Airplane in flight"
              className="w-full h-full object-cover object-center opacity-40"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-bg-primary/60 via-transparent to-bg-primary/90" />
          </div>
          <div className="hidden md:block absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute top-12 right-16 w-80 h-80 rounded-full bg-flight/30 blur-3xl" />
            <div className="absolute bottom-0 left-20 w-72 h-72 rounded-full bg-purple/20 blur-3xl" />
          </div>

          <div className="relative md:absolute md:inset-0 md:flex md:flex-col md:justify-end">
            <div className="max-w-7xl mx-auto px-6 py-8 md:pb-28 w-full">
              <div className="text-center max-w-3xl mx-auto mb-8">
                <div className="inline-flex items-center gap-2 chip bg-flight/10 text-flight border border-flight/20 mb-4">
                  <Plane className="w-3 h-3" /> {t("flights.chip")}
                </div>
                <h1 className="font-display text-4xl md:text-7xl font-bold tracking-tight mb-4">
                  {t("flights.heroTitle")} <span className="text-flight">{t("flights.heroTitleAccent")}</span>
                </h1>
                <p className="text-text-secondary text-base md:text-lg">
                  {t("flights.heroSub")}
                </p>
              </div>

              <div className="bg-bg-elevated border border-border rounded-xl shadow-card overflow-hidden">
                {/* Tabs */}
                <div className="flex border-b border-border px-4 pt-3">
                  {(["one-way", "round-trip"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setTripType(type)}
                      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
                        tripType === type
                          ? "border-flight text-flight"
                          : "border-transparent text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      {type === "one-way" ? t("flights.oneWay") : t("flights.roundTrip")}
                    </button>
                  ))}
                </div>

                <div className="p-4 space-y-3">
                  {/* Row 1: From | Swap | To */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <AirportInput
                        label={t("flights.fromLabel")}
                        initialValue={fromVal}
                        placeholder="City or airport code"
                        onSelect={a => { setFromAirport(a); setFromVal(`${a.iata} – ${a.city}`); }}
                      />
                    </div>
                    <button type="button" onClick={swap} className="btn-icon mt-5 shrink-0">
                      <ArrowLeftRight className="w-4 h-4" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <AirportInput
                        label={t("flights.toLabel")}
                        initialValue={toVal}
                        placeholder="City or airport code"
                        onSelect={a => { setToAirport(a); setToVal(`${a.iata} – ${a.city}`); }}
                      />
                    </div>
                  </div>

                  {/* Row 2: Dates + Adults */}
                  <div className="flex flex-col md:flex-row gap-2">
                    <div className="flex-1 min-w-0">
                      <label className="text-xs text-text-muted font-medium block mb-1">{t("flights.departureLabel")}</label>
                      <input
                        type="date"
                        className="input text-sm w-full"
                        value={date}
                        min={today}
                        onChange={e => setDate(e.target.value)}
                      />
                    </div>
                    {tripType === "round-trip" && (
                      <div className="flex-1 min-w-0">
                        <label className="text-xs text-text-muted font-medium block mb-1">{t("flights.returnLabel")}</label>
                        <input
                          type="date"
                          className="input text-sm w-full border-flight/40 focus:border-flight"
                          value={returnDate}
                          min={date}
                          onChange={e => setReturnDate(e.target.value)}
                        />
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 bg-bg-surface border border-border rounded-md px-3 h-[42px] mt-auto">
                      <select
                        className="bg-transparent text-sm text-text-primary border-none outline-none cursor-pointer"
                        value={adults}
                        onChange={e => setAdults(parseInt(e.target.value))}
                      >
                        {[1, 2, 3, 4, 5, 6].map(n => (
                          <option key={n} value={n}>{n} {n === 1 ? "Adult" : "Adults"}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Row 3: Cabin class chips */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="w-px h-4 bg-border flex-none" />
                    {([
                      { value: "economy",         label: "Economy" },
                      { value: "premium_economy", label: "Premium Economy" },
                      { value: "business",        label: "Business" },
                      { value: "first",           label: "First Class" },
                    ] as const).map(({ value, label }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setCabin(value)}
                        className={`flex items-center gap-1.5 px-2.5 h-[34px] rounded-md border text-xs font-medium transition whitespace-nowrap ${
                          cabin === value
                            ? "border-flight bg-flight/10 text-flight"
                            : "border-border hover:border-border-hover text-text-secondary"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* Row 4: Search + Voice */}
                  <div className="flex gap-2">
                    <button
                      onClick={handleSearch}
                      className="flex-1 flex items-center gap-2 text-white font-semibold px-5 h-[42px] rounded-md transition-all active:scale-95 hover:opacity-90 justify-center"
                      style={{ background: "linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)" }}
                    >
                      <Search className="w-4 h-4" />
                      {t("flights.searchBtn")}
                    </button>
                    <button
                      type="button"
                      onClick={voiceStatus === "listening" ? stopVoice : startVoice}
                      title={voiceStatus === "listening" ? "Stop" : "Voice search"}
                      className={`flex-none w-[42px] h-[42px] flex items-center justify-center rounded-md border transition-colors ${
                        voiceStatus === "listening"
                          ? "border-red-500 bg-red-500/10 text-red-400 animate-pulse"
                          : "border-border hover:border-flight text-text-muted hover:text-flight"
                      }`}
                    >
                      <Mic className="w-4 h-4" />
                    </button>
                  </div>

                  <PriceCalendar
                    from={fromAirport?.iata || ""}
                    to={toAirport?.iata || ""}
                    selectedDate={date}
                    onSelect={setDate}
                    vertical="flight"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 mt-6">
          {/* Quick routes */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {quickRoutes.map(r => (
              <button
                key={r.label}
                onClick={() => {
                  const d = new Date().toISOString().slice(0, 10);
                  router.push(`/flights/search?from=${r.from}&to=${r.to}&date=${d}&adults=1`);
                }}
                className="btn-secondary text-sm"
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Popular routes */}
          <section className="mb-12">
            <div className="flex items-end justify-between mb-5">
              <div>
                <div className="chip bg-flight/10 text-flight border border-flight/20 mb-2 inline-flex items-center gap-1.5">
                  <TrendingUp className="w-3 h-3" /> {t("flights.trendingRoutes")}
                </div>
                <h2 className="font-display text-2xl font-bold">{t("flights.popularRoutes")}</h2>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { from: "BOM", fromCity: "Mumbai", to: "DEL", toCity: "Delhi", dur: "2h 10m", fare: 3599, flights: 12 },
                { from: "DEL", fromCity: "Delhi", to: "BLR", toCity: "Bengaluru", dur: "2h 30m", fare: 4199, flights: 10 },
                { from: "BOM", fromCity: "Mumbai", to: "GOI", toCity: "Goa", dur: "1h 10m", fare: 2199, flights: 8 },
                { from: "BLR", fromCity: "Bengaluru", to: "HYD", toCity: "Hyderabad", dur: "1h 00m", fare: 1799, flights: 9 },
                { from: "DEL", fromCity: "Delhi", to: "CCU", toCity: "Kolkata", dur: "2h 20m", fare: 3999, flights: 7 },
                { from: "BOM", fromCity: "Mumbai", to: "MAA", toCity: "Chennai", dur: "2h 00m", fare: 3299, flights: 8 },
                { from: "DEL", fromCity: "Delhi", to: "VNS", toCity: "Varanasi", dur: "1h 15m", fare: 3799, flights: 5 },
                { from: "DEL", fromCity: "Delhi", to: "IXL", toCity: "Leh", dur: "1h 35m", fare: 6799, flights: 4 },
                { from: "DEL", fromCity: "Delhi", to: "SXR", toCity: "Srinagar", dur: "1h 25m", fare: 4799, flights: 6 },
                { from: "BOM", fromCity: "Mumbai", to: "COK", toCity: "Kochi", dur: "1h 50m", fare: 2899, flights: 7 },
                { from: "DEL", fromCity: "Delhi", to: "UDR", toCity: "Udaipur", dur: "1h 30m", fare: 3499, flights: 4 },
                { from: "BLR", fromCity: "Bengaluru", to: "IXE", toCity: "Mangaluru", dur: "0h 45m", fare: 1999, flights: 5 },
              ].map((r, i) => (
                <button
                  key={i}
                  onClick={() => {
                    const d = new Date().toISOString().slice(0, 10);
                    router.push(`/flights/search?from=${r.from}&to=${r.to}&date=${d}&adults=1`);
                  }}
                  className="card p-4 text-left hover:border-flight/40 transition-all flex items-center gap-4"
                >
                  <div className="w-11 h-11 rounded-lg bg-flight/10 border border-flight/20 flex items-center justify-center shrink-0">
                    <Plane className="w-5 h-5 text-flight" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm">{r.fromCity} → {r.toCity}</div>
                    <div className="text-xs text-text-muted">{r.dur} non-stop · {r.flights} airlines</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs text-text-muted">from</div>
                    <div className="font-semibold text-flight text-sm">₹{r.fare.toLocaleString()}</div>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Price trends + booking tip */}
          <section className="mb-12">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2 card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-display text-xl font-bold">{t("flights.fareTrends")}</h3>
                    <p className="text-xs text-text-muted mt-0.5">Mumbai → Delhi · Economy avg fare</p>
                  </div>
                  <span className="chip bg-flight/10 text-flight border border-flight/20">6 months</span>
                </div>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={[
                      { month: "Jan", fare: 4200 }, { month: "Feb", fare: 3800 },
                      { month: "Mar", fare: 5100 }, { month: "Apr", fare: 6200 },
                      { month: "May", fare: 4900 }, { month: "Jun", fare: 4500 },
                    ]}>
                      <XAxis dataKey="month" stroke="#6B7280" style={{ fontSize: 11 }} />
                      <YAxis stroke="#6B7280" style={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ background: "#1A2347", border: "1px solid #2A3560", borderRadius: 8, fontSize: 12 }} />
                      <Line type="monotone" dataKey="fare" stroke="#06B6D4" strokeWidth={2.5} dot={{ r: 4, fill: "#06B6D4" }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="card p-6 bg-gradient-to-br from-flight/10 via-bg-surface to-bg-surface border-flight/20">
                <Zap className="w-8 h-8 text-flight mb-3" />
                <h3 className="font-display text-xl font-bold mb-1">{t("flights.bestTimeTitle")}</h3>
                <p className="text-sm text-text-secondary mb-4">{t("flights.bestTimeSub")}</p>
                <ul className="space-y-2 text-sm text-text-secondary">
                  <li className="flex items-center gap-2"><span className="text-flight">✓</span> Tue/Wed cheapest days to fly</li>
                  <li className="flex items-center gap-2"><span className="text-flight">✓</span> 6 AM flights are 15% cheaper</li>
                  <li className="flex items-center gap-2"><span className="text-flight">✓</span> Flexi fares for changes</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Airlines */}
          <section className="mb-4">
            <div className="flex items-end justify-between mb-5">
              <div>
                <div className="chip bg-flight/10 text-flight border border-flight/20 mb-2 inline-flex items-center gap-1.5">
                  <Crown className="w-3 h-3" /> {t("flights.allCarriers")}
                </div>
                <h2 className="font-display text-2xl font-bold">{t("flights.airlinesTitle")}</h2>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { name: "IndiGo",   code: "6E", color: "#1B3A6B", routes: "80+ routes", onTime: "88%", logo: "https://images.kiwi.com/airlines/64/6E.png" },
                { name: "Air India",code: "AI", color: "#C8102E", routes: "60+ routes", onTime: "82%", logo: "https://images.kiwi.com/airlines/64/AI.png" },
                { name: "SpiceJet", code: "SG", color: "#E05000", routes: "50+ routes", onTime: "79%", logo: "https://images.kiwi.com/airlines/64/SG.png" },
                { name: "Vistara",  code: "UK", color: "#6A2875", routes: "40+ routes", onTime: "91%", logo: "https://images.kiwi.com/airlines/64/UK.png" },
                { name: "AirAsia",  code: "I5", color: "#FF0000", routes: "30+ routes", onTime: "81%", logo: "https://images.kiwi.com/airlines/64/I5.png" },
                { name: "Akasa Air",code: "QP", color: "#FF6600", routes: "25+ routes", onTime: "85%", logo: "https://images.kiwi.com/airlines/64/QP.png" },
              ].map(a => (
                <div key={a.code} className="card p-4 flex flex-col items-center gap-2 hover:border-flight/40 transition-all">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-white flex items-center justify-center">
                    <img
                      src={a.logo}
                      alt={a.name}
                      className="w-12 h-12 object-contain"
                      onError={e => {
                        const el = e.currentTarget;
                        el.style.display = "none";
                        const fb = el.nextElementSibling as HTMLElement | null;
                        if (fb) fb.style.display = "flex";
                      }}
                    />
                    <div
                      className="w-12 h-12 rounded-lg items-center justify-center text-white font-bold text-base hidden"
                      style={{ background: a.color }}
                    >
                      {a.code}
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-center">{a.name}</div>
                  <div className="text-[10px] text-text-muted text-center">{a.routes}</div>
                  <div className="text-[10px] text-success flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />{a.onTime} {t("flights.from") === "from" ? "on-time" : "on-time"}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
      <MobileNav />
    </>
  );
}

export default function FlightsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-text-muted">Loading…</div>}>
      <FlightsLanding />
    </Suspense>
  );
}
