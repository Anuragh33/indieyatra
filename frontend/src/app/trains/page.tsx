"use client";
import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import {
  Train, Search, Zap, ArrowLeftRight, TrendingUp, Crown, Clock, MapPin, Mic,
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { Navbar } from "@/components/Navbar";
import { MobileNav } from "@/components/MobileNav";
import { api } from "@/lib/api";
import { useVoiceSearch } from "@/hooks/useVoiceSearch";
import { PriceCalendar } from "@/components/PriceCalendar";
import { useT } from "@/lib/i18n";

interface TrainStation {
  id: string;
  code: string;
  name: string;
  city: string;
  state: string;
}

function StationInput({
  label, initialValue, onSelect, placeholder,
}: {
  label: string;
  initialValue: string;
  onSelect: (s: TrainStation) => void;
  placeholder: string;
}) {
  const [q, setQ] = useState(initialValue);
  const [opts, setOpts] = useState<TrainStation[]>([]);
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
        const res = await api<TrainStation[]>(`/api/trains/stations/autocomplete?q=${encodeURIComponent(v)}`);
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
        <div className="absolute z-50 top-full mt-1 w-full min-w-[260px] bg-bg-elevated border border-border rounded-md shadow-card max-h-56 overflow-y-auto">
          {opts.map(s => (
            <button
              key={s.id}
              type="button"
              className="w-full text-left px-3 py-2.5 hover:bg-bg-hover transition-colors"
              onMouseDown={e => {
                e.preventDefault();
                setQ(`${s.code} – ${s.name}`);
                setOpts([]);
                setOpen(false);
                onSelect(s);
              }}
            >
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-train bg-train/10 px-1.5 py-0.5 rounded font-mono">{s.code}</span>
                <div>
                  <div className="text-sm font-medium text-text-primary">{s.name}</div>
                  <div className="text-xs text-text-muted">{s.city}, {s.state}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function TrainsLanding() {
  const router = useRouter();
  const t = useT();

  const [tripType, setTripType] = useState<"one-way"|"round-trip">("one-way");
  const [fromSt, setFromSt] = useState<TrainStation | null>(null);
  const [toSt, setToSt] = useState<TrainStation | null>(null);
  const [fromVal, setFromVal] = useState("");
  const [toVal, setToVal] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [returnDate, setReturnDate] = useState(new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10));
  const [classFilter, setClassFilter] = useState("");
  const [quota, setQuota] = useState("GN");
  const [dayTrainOnly, setDayTrainOnly] = useState(false);
  const [superfastOnly, setSuperfastOnly] = useState(false);

  const { status: voiceStatus, start: startVoice, stop: stopVoice } = useVoiceSearch((r) => {
    setFromVal(r.from);
    setToVal(r.to);
    setDate(r.date);
    setFromSt(null);
    setToSt(null);
  });

  const today = new Date().toISOString().slice(0, 10);
  const maxDate = new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const swap = () => {
    setFromSt(toSt); setFromVal(toVal);
    setToSt(fromSt); setToVal(fromVal);
  };

  const handleSearch = () => {
    const fromCode = fromSt?.code || fromVal.split(/[\s–-]+/)[0].trim().toUpperCase();
    const toCode   = toSt?.code   || toVal.split(/[\s–-]+/)[0].trim().toUpperCase();
    if (!fromCode || !toCode) return;
    const q = new URLSearchParams({ from: fromCode, to: toCode, date, quota, trip_type: tripType });
    if (classFilter)                   q.set("class", classFilter);
    if (dayTrainOnly)                  q.set("day_only", "1");
    if (superfastOnly)                 q.set("superfast", "1");
    if (tripType === "round-trip")     q.set("return_date", returnDate);
    router.push(`/trains/search?${q}`);
  };

  const quickRoutes = [
    { from: "NDLS", to: "HWH", label: "Delhi → Kolkata" },
    { from: "MMCT", to: "NZM", label: "Mumbai → Delhi" },
    { from: "NZM", to: "SBC", label: "Delhi → Bengaluru" },
    { from: "MAS", to: "SBC", label: "Chennai → Bengaluru" },
    { from: "NDLS", to: "BSB", label: "Delhi → Varanasi" },
    { from: "MMCT", to: "ADI", label: "Mumbai → Ahmedabad" },
    { from: "SBC", to: "MYS", label: "Bengaluru → Mysuru" },
    { from: "MAS", to: "CBE", label: "Chennai → Coimbatore" },
    { from: "NDLS", to: "DDN", label: "Delhi → Dehradun" },
    { from: "HWH", to: "BBS", label: "Kolkata → Bhubaneswar" },
    { from: "NDLS", to: "JP", label: "Delhi → Jaipur" },
    { from: "CSTM", to: "PUNE", label: "Mumbai → Pune" },
  ];

  return (
    <>
      <Navbar />
      <main className="min-h-screen pb-24 md:pb-8">
        <section className="relative overflow-hidden border-b border-border flex flex-col md:min-h-screen">
          <div className="relative aspect-video md:absolute md:inset-0 overflow-hidden pointer-events-none">
            <img
              src="https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=1920&q=80"
              alt="Indian railway train"
              className="w-full h-full object-cover object-center opacity-40"
              onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-bg-primary/60 via-transparent to-bg-primary/90" />
          </div>
          <div className="hidden md:block absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute top-10 left-16 w-80 h-80 rounded-full bg-train/30 blur-3xl" />
            <div className="absolute bottom-0 right-20 w-72 h-72 rounded-full bg-purple/20 blur-3xl" />
          </div>

          <div className="relative md:absolute md:inset-0 md:flex md:flex-col md:justify-end">
            <div className="max-w-7xl mx-auto px-6 py-8 md:pb-28 w-full">
              <div className="text-center max-w-3xl mx-auto mb-8">
                <div className="inline-flex items-center gap-2 chip bg-train/10 text-train border border-train/20 mb-4">
                  <Train className="w-3 h-3" /> {t("trains.chip")}
                </div>
                <h1 className="font-display text-4xl md:text-7xl font-bold tracking-tight mb-4">
                  {t("trains.heroTitle")} <span className="text-gradient-purple">{t("trains.heroTitleAccent")}</span>
                </h1>
                <p className="text-text-secondary text-base md:text-lg">
                  {t("trains.heroSub")}
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
                          ? "border-train text-train"
                          : "border-transparent text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      {type === "one-way" ? t("trains.oneWay") : t("trains.roundTrip")}
                    </button>
                  ))}
                </div>

                <div className="p-4 space-y-3">
                  {/* Row 1: From | Swap | To */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <StationInput
                        label={t("trains.fromLabel")}
                        initialValue={fromVal}
                        placeholder="City or station code"
                        onSelect={s => { setFromSt(s); setFromVal(`${s.code} – ${s.name}`); }}
                      />
                    </div>
                    <button type="button" onClick={swap} className="btn-icon mt-5 shrink-0">
                      <ArrowLeftRight className="w-4 h-4" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <StationInput
                        label={t("trains.toLabel")}
                        initialValue={toVal}
                        placeholder="City or station code"
                        onSelect={s => { setToSt(s); setToVal(`${s.code} – ${s.name}`); }}
                      />
                    </div>
                  </div>

                  {/* Row 2: Date | Return | Class | Quota */}
                  <div className="flex flex-col md:flex-row gap-2">
                    <div className="flex-1 min-w-0">
                      <label className="text-xs text-text-muted font-medium block mb-1">{t("trains.dateLabel")}</label>
                      <input
                        type="date"
                        className="input text-sm w-full"
                        value={date}
                        min={today}
                        max={maxDate}
                        onChange={e => setDate(e.target.value)}
                      />
                    </div>
                    {tripType === "round-trip" && (
                      <div className="flex-1 min-w-0">
                        <label className="text-xs text-text-muted font-medium block mb-1">{t("trains.returnLabel")}</label>
                        <input
                          type="date"
                          className="input text-sm w-full border-train/40 focus:border-train"
                          value={returnDate}
                          min={date}
                          max={maxDate}
                          onChange={e => setReturnDate(e.target.value)}
                        />
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 bg-bg-surface border border-border rounded-md px-3 h-[42px] mt-auto">
                      <select
                        className="bg-transparent text-sm text-text-primary border-none outline-none cursor-pointer"
                        value={classFilter}
                        onChange={e => setClassFilter(e.target.value)}
                      >
                        <option value="">{t("trains.allClasses")}</option>
                        {["1A", "2A", "3A", "SL", "CC", "EC", "2S"].map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center gap-1.5 bg-bg-surface border border-border rounded-md px-3 h-[42px] mt-auto">
                      <select
                        className="bg-transparent text-sm text-text-primary border-none outline-none cursor-pointer"
                        value={quota}
                        onChange={e => setQuota(e.target.value)}
                      >
                        <option value="GN">General</option>
                        <option value="TQ">Tatkal</option>
                        <option value="LD">Ladies</option>
                        <option value="SS">Sr. Citizen</option>
                        <option value="HP">HP</option>
                      </select>
                    </div>
                  </div>

                  {/* Row 3: Train type filter chips */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="w-px h-4 bg-border flex-none" />
                    {[
                      { state: dayTrainOnly,  set: setDayTrainOnly,  label: "Day Trains Only",     desc: "Departs & arrives same day" },
                      { state: superfastOnly, set: setSuperfastOnly, label: "Superfast / Express", desc: "Rajdhani, Shatabdi, Vande Bharat…" },
                    ].map(f => (
                      <label
                        key={f.label}
                        className={`flex items-center gap-1.5 px-2.5 h-[34px] rounded-md border cursor-pointer text-xs transition whitespace-nowrap ${
                          f.state ? "border-train bg-train/5 text-train" : "border-border hover:border-border-hover text-text-secondary"
                        }`}
                      >
                        <input type="checkbox" checked={f.state} onChange={e => f.set(e.target.checked)} className="accent-train w-3 h-3" />
                        {f.label}
                      </label>
                    ))}
                  </div>

                  {/* Row 4: Search + Voice */}
                  <div className="flex gap-2">
                    <button
                      onClick={handleSearch}
                      className="flex-1 flex items-center gap-2 text-white font-semibold px-5 h-[42px] rounded-md transition-all active:scale-95 hover:opacity-90 justify-center disabled:opacity-40"
                      style={{ background: "linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)" }}
                    >
                      <Search className="w-4 h-4" />
                      {t("trains.searchBtn")}
                    </button>
                    <button
                      type="button"
                      onClick={voiceStatus === "listening" ? stopVoice : startVoice}
                      title={voiceStatus === "listening" ? "Stop" : "Voice search"}
                      className={`flex-none w-[42px] h-[42px] flex items-center justify-center rounded-md border transition-colors ${
                        voiceStatus === "listening"
                          ? "border-red-500 bg-red-500/10 text-red-400 animate-pulse"
                          : "border-border hover:border-train text-text-muted hover:text-train"
                      }`}
                    >
                      <Mic className="w-4 h-4" />
                    </button>
                  </div>

                  <PriceCalendar
                    from={fromSt?.code || ""}
                    to={toSt?.code || ""}
                    selectedDate={date}
                    onSelect={setDate}
                    vertical="train"
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
                  router.push(`/trains/search?from=${r.from}&to=${r.to}&date=${d}`);
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
                <div className="chip bg-train/10 text-train border border-train/20 mb-2 inline-flex items-center gap-1.5">
                  <TrendingUp className="w-3 h-3" /> {t("trains.trendingRoutes")}
                </div>
                <h2 className="font-display text-2xl font-bold">{t("trains.popularRoutes")}</h2>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { from: "NDLS", fromCity: "New Delhi", to: "HWH", toCity: "Kolkata", dist: "1443 km", dur: "17h", fare: 565, trains: 8 },
                { from: "MMCT", fromCity: "Mumbai", to: "NZM", toCity: "Delhi", dist: "1148 km", dur: "16h", fare: 490, trains: 12 },
                { from: "NZM", fromCity: "Delhi", to: "SBC", toCity: "Bengaluru", dist: "2444 km", dur: "33h", fare: 890, trains: 6 },
                { from: "MAS", fromCity: "Chennai", to: "SBC", toCity: "Bengaluru", dist: "357 km", dur: "5h", fare: 210, trains: 14 },
                { from: "CSTM", fromCity: "Mumbai", to: "PUNE", toCity: "Pune", dist: "192 km", dur: "3h", fare: 125, trains: 22 },
                { from: "SBC", fromCity: "Bengaluru", to: "SC", toCity: "Hyderabad", dist: "576 km", dur: "10h", fare: 285, trains: 9 },
                { from: "NDLS", fromCity: "New Delhi", to: "BSB", toCity: "Varanasi", dist: "763 km", dur: "8h 30m", fare: 395, trains: 10 },
                { from: "MMCT", fromCity: "Mumbai", to: "ADI", toCity: "Ahmedabad", dist: "492 km", dur: "6h 20m", fare: 245, trains: 18 },
                { from: "NDLS", fromCity: "New Delhi", to: "AGC", toCity: "Agra", dist: "195 km", dur: "2h 10m", fare: 135, trains: 28 },
                { from: "MAS", fromCity: "Chennai", to: "CBE", toCity: "Coimbatore", dist: "497 km", dur: "7h 45m", fare: 220, trains: 12 },
                { from: "HWH", fromCity: "Kolkata", to: "BBS", toCity: "Bhubaneswar", dist: "441 km", dur: "7h", fare: 195, trains: 16 },
                { from: "NDLS", fromCity: "New Delhi", to: "JP", toCity: "Jaipur", dist: "308 km", dur: "4h 10m", fare: 165, trains: 20 },
              ].map((r, i) => (
                <button
                  key={i}
                  onClick={() => {
                    const d = new Date().toISOString().slice(0, 10);
                    router.push(`/trains/search?from=${r.from}&to=${r.to}&date=${d}`);
                  }}
                  className="card p-4 text-left hover:border-train/40 transition-all flex items-center gap-4"
                >
                  <div className="w-11 h-11 rounded-lg bg-train/10 border border-train/20 flex items-center justify-center shrink-0">
                    <Train className="w-5 h-5 text-train" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm">{r.fromCity} → {r.toCity}</div>
                    <div className="text-xs text-text-muted">{r.dist} · ~{r.dur} · {r.trains} trains daily</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs text-text-muted">from</div>
                    <div className="font-semibold text-train text-sm">₹{r.fare}</div>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Price trend + Tatkal card */}
          <section className="mb-12">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2 card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-display text-xl font-bold">{t("trains.fareTrends")}</h3>
                    <p className="text-xs text-text-muted mt-0.5">Delhi → Mumbai · Sleeper class avg fare</p>
                  </div>
                  <span className="chip bg-train/10 text-train border border-train/20">6 months</span>
                </div>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={[
                      { month: "Jan", fare: 485 }, { month: "Feb", fare: 450 },
                      { month: "Mar", fare: 510 }, { month: "Apr", fare: 620 },
                      { month: "May", fare: 580 }, { month: "Jun", fare: 540 },
                    ]}>
                      <XAxis dataKey="month" stroke="#6B7280" style={{ fontSize: 11 }} />
                      <YAxis stroke="#6B7280" style={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ background: "#1A2347", border: "1px solid #2A3560", borderRadius: 8, fontSize: 12 }} />
                      <Line type="monotone" dataKey="fare" stroke="#6366F1" strokeWidth={2.5} dot={{ r: 4, fill: "#6366F1" }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="card p-6 bg-gradient-to-br from-train/10 via-bg-surface to-bg-surface border-train/20">
                <Zap className="w-8 h-8 text-saffron mb-3" />
                <h3 className="font-display text-xl font-bold mb-1">{t("trains.tatkalTitle")}</h3>
                <p className="text-sm text-text-secondary mb-4">{t("trains.tatkalSub")}</p>
                <ul className="space-y-2 text-sm text-text-secondary mb-4">
                  <li className="flex items-center gap-2"><span className="text-train">✓</span> Confirmed berth guaranteed</li>
                  <li className="flex items-center gap-2"><span className="text-train">✓</span> AC &amp; Sleeper classes</li>
                  <li className="flex items-center gap-2"><span className="text-train">✓</span> Non-refundable fare</li>
                </ul>
                <button onClick={() => router.push("/pnr")} className="w-full px-4 py-2 rounded-md text-sm font-semibold border border-train/30 text-train hover:bg-train/10 transition-all">
                  {t("trains.checkPnr")}
                </button>
              </div>
            </div>
          </section>

          {/* Featured trains */}
          <section className="mb-4">
            <div className="flex items-end justify-between mb-5">
              <div>
                <div className="chip bg-train/10 text-train border border-train/20 mb-2 inline-flex items-center gap-1.5">
                  <Crown className="w-3 h-3" /> {t("trains.premiumTrains")}
                </div>
                <h2 className="font-display text-2xl font-bold">{t("trains.featuredTrains")}</h2>
                <p className="text-text-secondary text-sm mt-1">{t("trains.featuredSub")}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { name: "Vande Bharat Express", type: "Vande Bharat", img: "https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=800&q=80", route: "Delhi → Varanasi", fare: 1755, feat: "180 km/h · AC Chair Car" },
                { name: "Rajdhani Express", type: "Rajdhani", img: "https://images.unsplash.com/photo-1442570468985-f63ed5de9086?w=800&q=80", route: "Delhi → Mumbai", fare: 2305, feat: "Meals included · 1A/2A/3A" },
                { name: "Shatabdi Express", type: "Shatabdi", img: "https://images.unsplash.com/photo-1535920527002-b35e96722eb9?w=800&q=80", route: "Delhi → Chandigarh", fare: 590, feat: "Day train · CC/EC" },
                { name: "Duronto Express", type: "Duronto", img: "https://images.unsplash.com/photo-1583147610148-5dacdd7d4c79?w=800&q=80", route: "Mumbai → Kolkata", fare: 1250, feat: "Non-stop · 1A/2A/3A/SL" },
              ].map((t, i) => (
                <div key={i} className="card overflow-hidden group cursor-pointer hover:border-train/40 transition-all">
                  <div className="aspect-[4/3] bg-bg-elevated relative overflow-hidden">
                    <img
                      src={t.img}
                      alt={t.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute top-2 left-2">
                      <span className="chip bg-black/50 backdrop-blur border-white/10 text-white text-[10px]">{t.type}</span>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <div className="font-semibold text-white text-sm">{t.name}</div>
                      <div className="text-[10px] text-white/70 flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5" />{t.route}
                      </div>
                    </div>
                  </div>
                  <div className="p-3 flex items-center justify-between">
                    <div className="text-xs text-text-secondary flex items-center gap-1">
                      <Clock className="w-3 h-3" />{t.feat}
                    </div>
                    <div className="text-xs text-right">
                      <div className="text-[10px] text-text-muted">from</div>
                      <div className="font-semibold text-train">₹{t.fare}</div>
                    </div>
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

export default function TrainsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-text-muted">Loading…</div>}>
      <TrainsLanding />
    </Suspense>
  );
}
