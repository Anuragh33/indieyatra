"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { MobileNav } from "@/components/MobileNav";
import { apiPost, apiGet } from "@/lib/api";
import { useCurrency } from "@/lib/currency";
import { useToast } from "@/components/Toast";
import type { City } from "@/lib/types";
import { Sparkles, Send, MapPin, Calendar, Wallet, Star, Heart, ChevronRight, Sun, Mountain, Umbrella, Tent, Coffee, Bus, Train, Plane, Building2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useT } from "@/lib/i18n";

type Destination = {
  name: string;
  image_url: string;
  state: string;
  temperature: string;
  duration_days: number;
  price_from_inr: number;
  best_match: boolean;
  tags: string[];
};
type ItineraryDay = { day: number; title: string; details: string; icon: string };
type BudgetItem = { label: string; value: number };
type PlanOutput = {
  destinations: Destination[];
  itinerary: ItineraryDay[];
  match_score: number;
  tags: string[];
  summary: string;
  budget?: BudgetItem[];
  budget_total?: number;
  duration_days?: number;
};

const SAMPLE_PROMPTS = [
  "Delhi to Manali 5 days July under ₹3000",
  "Weekend trip from Bangalore to Goa, beach + party",
  "Mumbai to Jaipur heritage tour, 4 days, mid-range",
  "Pune to Himachal backpacking, 7 days, budget",
];

const ICON_MAP: Record<string, any> = {
  "🗓": Calendar, "🏔": Mountain, "🏖": Umbrella, "🌲": Tent, "☕": Coffee, "☀": Sun,
};

export default function PlannerPage() {
  const t = useT();
  const router = useRouter();
  const { format: formatPrice } = useCurrency();
  const { success: toastSuccess, error: toastError, info: toastInfo } = useToast();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PlanOutput | null>(null);
  const [savedNames, setSavedNames] = useState<Set<string>>(new Set());
  const [savingTrip, setSavingTrip] = useState(false);
  const [activeTab, setActiveTab] = useState<"itinerary" | "buses" | "trains" | "flights" | "hotels" | "activities" | "budget">("itinerary");
  const [showResults, setShowResults] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (showResults) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [showResults]);

  const plan = async (text?: string) => {
    const q = (text ?? prompt).trim();
    if (!q) return;
    setLoading(true);
    setShowResults(true);
    try {
      // Best-effort: pull a destination guess from the prompt for the rule-based fallback
      const lc = q.toLowerCase();
      let toCity = "Himachal";
      if (lc.includes("goa")) toCity = "Goa";
      else if (lc.includes("jaipur") || lc.includes("rajasthan")) toCity = "Rajasthan";
      else if (lc.includes("kerala") || lc.includes("kochi")) toCity = "Kerala";
      else if (lc.includes("manali")) toCity = "Manali";

      let durationDays = 5;
      const d = q.match(/(\d+)\s*(?:day|night|d\b)/);
      if (d) durationDays = Math.min(14, Math.max(1, parseInt(d[1])));
      let budget = 3000;
      const b = q.match(/[₹$]?\s*(\d{3,5})/);
      if (b) budget = parseInt(b[1]);

      const out = await apiPost<PlanOutput>("/api/ai/plan-trip", {
        prompt: q,
        to_city: toCity,
        duration_days: durationDays,
        budget_inr: budget,
      });
      setResult(out);
    } catch (e) {
      setResult({
        destinations: [],
        itinerary: [],
        match_score: 0,
        tags: ["Error"],
        summary: "Could not reach AI planner. Try again in a moment.",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleSave = (name: string) => {
    setSavedNames((s) => {
      const n = new Set(s);
      if (n.has(name)) n.delete(name);
      else n.add(name);
      return n;
    });
  };

  const viewBuses = async (destName: string) => {
    try {
      const cities = await apiGet<City[]>(`/api/search/suggestions?q=${encodeURIComponent(destName)}`);
      const city = cities[0];
      const today = new Date().toISOString().split("T")[0];
      router.push(city ? `/search?to=${city.code}&date=${today}` : `/search?date=${today}`);
    } catch {
      router.push("/search");
    }
  };

  const viewTrains = (destName: string) => {
    const today = new Date().toISOString().split("T")[0];
    router.push(`/trains/search?to=${encodeURIComponent(destName)}&date=${today}`);
  };

  const viewFlights = (destName: string) => {
    const today = new Date().toISOString().split("T")[0];
    router.push(`/flights/search?to=${encodeURIComponent(destName)}&date=${today}&adults=1`);
  };

  const viewHotels = (destName: string) => {
    router.push(`/hotels?city=${encodeURIComponent(destName)}`);
  };

  const addToTrips = async () => {
    if (!result || result.destinations.length === 0) return;
    const best = result.destinations.find((d) => d.best_match) ?? result.destinations[0];
    setSavingTrip(true);
    try {
      const cities = await apiGet<City[]>(`/api/search/suggestions?q=${encodeURIComponent(best.name)}`);
      const city = cities[0];
      if (!city) {
        toastInfo("Could not find city — search manually in Trips");
        return;
      }
      await apiPost("/api/wishlist/add", { city_id: city.id, notes: best.state, target_price: best.price_from_inr });
      toastSuccess(`${best.name} added to your wishlist`);
    } catch (e: any) {
      toastError(e.message || "Could not save to wishlist");
    } finally {
      setSavingTrip(false);
    }
  };

  // Empty state — welcome prompt
  if (!showResults) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen pb-24 md:pb-12">
          <section className="relative overflow-hidden bg-hero-atmosphere border-b border-border">
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <div className="absolute top-20 left-10 w-96 h-96 rounded-full bg-purple/30 blur-3xl" />
              <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-saffron/20 blur-3xl" />
            </div>
            <div className="max-w-4xl mx-auto px-6 py-20 relative text-center">
              <div className="inline-flex items-center gap-2 chip bg-purple/10 text-purple border border-purple/20 mb-6">
                <Sparkles className="w-3 h-3" /> {t("planner.chip")}
              </div>
              <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tight mb-4">
                {t("planner.title1")}
                <br />
                <span className="text-gradient-saffron">{t("planner.title2")}</span>
              </h1>
              <p className="text-text-secondary text-lg mb-10 max-w-2xl mx-auto">
                {t("planner.sub")}
              </p>

              <div className="bg-bg-elevated border border-border rounded-2xl p-3 shadow-card max-w-2xl mx-auto">
                <textarea
                  ref={inputRef}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      plan();
                    }
                  }}
                  placeholder={t("planner.placeholder")}
                  rows={3}
                  className="w-full bg-transparent border-0 focus:outline-none focus:ring-0 resize-none text-text-primary placeholder:text-text-muted px-3 py-2"
                />
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <div className="flex items-center gap-1 text-xs text-text-muted">
                    <Sparkles className="w-3 h-3" /> Powered by IndieYatra AI
                  </div>
                  <button
                    onClick={() => plan()}
                    disabled={!prompt.trim() || loading}
                    className="btn-primary flex items-center gap-2 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" /> {t("planner.planBtn")}
                  </button>
                </div>
              </div>

              <div className="mt-10">
                <p className="text-xs uppercase tracking-wider text-text-muted mb-3">
                  {t("planner.tryOne")}
                </p>
                <div className="flex flex-wrap gap-2 justify-center max-w-3xl mx-auto">
                  {SAMPLE_PROMPTS.map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setPrompt(s);
                        plan(s);
                      }}
                      className="chip bg-bg-elevated hover:bg-bg-hover border border-border text-text-secondary hover:text-text-primary"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </main>
        <MobileNav />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 pb-24 md:pb-12">
        {/* Mini composer at top */}
        <div className="card p-3 mb-6 flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-purple flex-shrink-0" />
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && plan()}
            placeholder="Ask anything about your trip…"
            className="flex-1 bg-transparent border-0 focus:outline-none text-text-primary placeholder:text-text-muted text-sm"
          />
          <button
            onClick={() => plan()}
            disabled={loading}
            className="btn-primary text-sm flex items-center gap-1 disabled:opacity-50"
          >
            <Send className="w-3 h-3" />
            Send
          </button>
        </div>

        {loading && !result && (
          <div className="card p-12 text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-saffron flex items-center justify-center"
            >
              <Sparkles className="w-6 h-6 text-white" />
            </motion.div>
            <h3 className="font-semibold mb-1">{t("planner.planning")}</h3>
            <p className="text-sm text-text-muted">{t("planner.planningSub")}</p>
          </div>
        )}

        {result && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
            <div>
              {/* Tags */}
              {result.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {result.tags.map((t) => (
                    <span
                      key={t}
                      className="chip bg-purple/10 text-purple border border-purple/20"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}

              <h2 className="font-display text-2xl md:text-3xl font-bold mb-2">
                {result.summary}
              </h2>
              <p className="text-text-secondary mb-6 text-sm">
                Based on your prompt, here's what we recommend.
              </p>

              {/* Destination cards */}
              {result.destinations.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  {result.destinations.map((d, i) => (
                    <motion.div
                      key={d.name}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={`card overflow-hidden card-hover ${
                        d.best_match ? "ring-2 ring-saffron/40" : ""
                      }`}
                    >
                      <div className="aspect-[4/3] bg-bg-elevated relative overflow-hidden">
                        <img
                          src={d.image_url}
                          alt={d.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        {d.best_match && (
                          <div className="absolute top-2 left-2 chip bg-saffron text-white border-saffron">
                            <Star className="w-3 h-3 fill-white" /> Best Match
                          </div>
                        )}
                        <button
                          onClick={() => toggleSave(d.name)}
                          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/40 backdrop-blur flex items-center justify-center"
                        >
                          <Heart
                            className={`w-4 h-4 ${
                              savedNames.has(d.name)
                                ? "fill-danger text-danger"
                                : "text-white"
                            }`}
                          />
                        </button>
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          <div className="font-semibold text-white text-lg">
                            {d.name}
                          </div>
                          <div className="text-xs text-white/80">
                            {d.state}
                          </div>
                        </div>
                      </div>
                      <div className="p-3">
                        <div className="flex items-center gap-3 text-xs text-text-secondary mb-2">
                          <span className="flex items-center gap-1">
                            <Sun className="w-3 h-3" /> {d.temperature}
                          </span>
                          <span>·</span>
                          <span>{d.duration_days} days</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mb-3">
                          {d.tags.map((t) => (
                            <span
                              key={t}
                              className="chip bg-bg-elevated text-text-secondary border border-border text-[10px]"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                        <div>
                          <div className="text-[10px] text-text-muted uppercase mb-2">Travel from</div>
                          <div className="flex flex-wrap gap-1.5">
                            <button
                              onClick={() => viewBuses(d.name)}
                              className="flex items-center gap-1 px-2 py-1 rounded-md bg-saffron/10 text-saffron border border-saffron/20 text-[10px] font-semibold hover:bg-saffron/20 transition-colors"
                            >
                              <Bus className="w-2.5 h-2.5" /> Bus {formatPrice(d.price_from_inr)}
                            </button>
                            <button
                              onClick={() => viewTrains(d.name)}
                              className="flex items-center gap-1 px-2 py-1 rounded-md bg-train/10 text-train border border-train/20 text-[10px] font-semibold hover:bg-train/20 transition-colors"
                            >
                              <Train className="w-2.5 h-2.5" /> Train
                            </button>
                            <button
                              onClick={() => viewFlights(d.name)}
                              className="flex items-center gap-1 px-2 py-1 rounded-md bg-flight/10 text-flight border border-flight/20 text-[10px] font-semibold hover:bg-flight/20 transition-colors"
                            >
                              <Plane className="w-2.5 h-2.5" /> Fly
                            </button>
                            <button
                              onClick={() => viewHotels(d.name)}
                              className="flex items-center gap-1 px-2 py-1 rounded-md bg-hotel/10 text-hotel border border-hotel/20 text-[10px] font-semibold hover:bg-hotel/20 transition-colors"
                            >
                              <Building2 className="w-2.5 h-2.5" /> Stay
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="card p-10 text-center text-text-muted">
                  {t("planner.noDestinations")}
                </div>
              )}
            </div>

            {/* Right side: itinerary panel */}
            <aside className="card p-5 h-fit lg:sticky lg:top-20">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-display text-xl font-bold">{t("planner.yourItinerary")}</h3>
                  <div className="text-xs text-text-muted">
                    {t("planner.aiGen")} · 92% {t("planner.match")}
                  </div>
                </div>
                <div className="chip bg-teal/10 text-teal border border-teal/20">
                  <Star className="w-3 h-3 fill-teal" /> 92%
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 mb-4 border-b border-border overflow-x-auto">
                {([
                  ["itinerary", t("planner.tabs.itinerary")],
                  ["buses",     t("planner.tabs.buses")    ],
                  ["trains",    "Trains"                   ],
                  ["flights",   "Flights"                  ],
                  ["hotels",    t("planner.tabs.hotels")   ],
                  ["activities",t("planner.tabs.activities")],
                  ["budget",    t("planner.tabs.budget")   ],
                ] as const).map(
                  ([k, l]) => (
                    <button
                      key={k}
                      onClick={() => setActiveTab(k)}
                      className={`px-3 py-2 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
                        activeTab === k
                          ? "border-saffron text-saffron"
                          : "border-transparent text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      {l}
                    </button>
                  )
                )}
              </div>

              {activeTab === "itinerary" && (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {result.itinerary.length > 0 ? (
                    result.itinerary.map((day) => {
                      const Icon = ICON_MAP[day.icon] ?? Calendar;
                      return (
                        <div key={day.day} className="flex gap-3">
                          <div className="flex-shrink-0 w-10 h-10 rounded-md bg-saffron/10 text-saffron flex items-center justify-center">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[10px] uppercase tracking-wider text-text-muted">
                              {t("planner.day", day.day)}
                            </div>
                            <div className="font-semibold text-sm mb-0.5">
                              {day.title}
                            </div>
                            <div className="text-xs text-text-secondary leading-relaxed">
                              {day.details}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-sm text-text-muted">
                      Itinerary will appear once you describe your trip.
                    </div>
                  )}
                </div>
              )}

              {activeTab === "buses" && (
                <div className="space-y-2 text-sm">
                  {result.destinations.slice(0, 3).map((d) => (
                    <div
                      key={d.name}
                      className="p-3 bg-bg-elevated rounded-md flex items-center justify-between"
                    >
                      <div>
                        <div className="font-medium text-xs flex items-center gap-1.5">
                          <Bus className="w-3 h-3 text-saffron" />
                          {t("planner.busesTo", d.name)}
                        </div>
                        <div className="text-[10px] text-text-muted">from {d.state}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="font-display text-saffron font-bold">{formatPrice(d.price_from_inr)}</div>
                        <button onClick={() => viewBuses(d.name)} className="text-[10px] text-saffron hover:underline">Search</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "trains" && (
                <div className="space-y-2 text-sm">
                  {result.destinations.slice(0, 3).map((d) => (
                    <div
                      key={d.name}
                      className="p-3 bg-bg-elevated rounded-md flex items-center justify-between"
                    >
                      <div>
                        <div className="font-medium text-xs flex items-center gap-1.5">
                          <Train className="w-3 h-3 text-train" />
                          Trains to {d.name}
                        </div>
                        <div className="text-[10px] text-text-muted">from {d.state} · sleeper & AC classes</div>
                      </div>
                      <button onClick={() => viewTrains(d.name)} className="text-[10px] text-train hover:underline font-semibold">Search</button>
                    </div>
                  ))}
                  <div className="p-3 bg-train/5 border border-train/20 rounded-md text-xs text-text-secondary">
                    <Train className="w-3 h-3 text-train inline mr-1" />
                    Tatkal quota opens 1 day before departure for last-minute bookings.
                  </div>
                </div>
              )}

              {activeTab === "flights" && (
                <div className="space-y-2 text-sm">
                  {result.destinations.slice(0, 3).map((d) => (
                    <div
                      key={d.name}
                      className="p-3 bg-bg-elevated rounded-md flex items-center justify-between"
                    >
                      <div>
                        <div className="font-medium text-xs flex items-center gap-1.5">
                          <Plane className="w-3 h-3 text-flight" />
                          Flights to {d.name}
                        </div>
                        <div className="text-[10px] text-text-muted">
                          Economy · book 3–6 weeks ahead for best fares
                        </div>
                      </div>
                      <button onClick={() => viewFlights(d.name)} className="text-[10px] text-flight hover:underline font-semibold">Search</button>
                    </div>
                  ))}
                  <div className="p-3 bg-flight/5 border border-flight/20 rounded-md text-xs text-text-secondary">
                    <Plane className="w-3 h-3 text-flight inline mr-1" />
                    Tuesday & Wednesday departures are typically 10–15% cheaper.
                  </div>
                </div>
              )}

              {activeTab === "hotels" && (
                <div className="text-sm text-text-secondary space-y-2">
                  {result.destinations.slice(0, 2).map((d) => (
                    <div key={d.name} className="p-3 bg-bg-elevated rounded-md flex items-center justify-between">
                      <div className="font-medium text-text-primary text-xs flex items-center gap-1.5">
                        <Building2 className="w-3 h-3 text-hotel" /> Hotels in {d.name}
                      </div>
                      <button onClick={() => viewHotels(d.name)} className="text-[10px] text-hotel hover:underline font-semibold">Search</button>
                    </div>
                  ))}
                  {([
                    { label: "3-star hotels",        lo: 1200, hi: 2500 },
                    { label: "Hostels / Backpacker",  lo: 400,  hi: 800  },
                    { label: "Premium resorts",       lo: 3500, hi: 8000 },
                  ] as const).map(({ label, lo, hi }) => (
                    <div key={label} className="p-3 bg-bg-elevated rounded-md">
                      <div className="font-medium text-text-primary text-xs">{label}</div>
                      <div className="text-[10px] text-text-muted">{formatPrice(lo)}–{formatPrice(hi)}/night</div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "activities" && (
                <div className="text-sm text-text-secondary space-y-2">
                  {[
                    "Local guided tours",
                    "Adventure sports",
                    "Cooking classes",
                    "Cultural performances",
                    "Day treks",
                  ].map((a) => (
                    <div key={a} className="flex items-center gap-2 p-2 hover:bg-bg-elevated rounded">
                      <ChevronRight className="w-3 h-3 text-saffron" />
                      <span className="text-xs">{a}</span>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "budget" && (() => {
                const nights = Math.max(1, (result.duration_days ?? 5) - 1);
                const cheapestBus = result.destinations.length > 0
                  ? Math.min(...result.destinations.map((d) => d.price_from_inr))
                  : 800;
                const defaultBudget: BudgetItem[] = [
                  { label: `Buses (round trip)`,        value: cheapestBus * 2                },
                  { label: `Hotels (${nights} nights)`, value: Math.round(nights * 1200)      },
                  { label: "Food",                      value: Math.round(nights * 500)        },
                  { label: "Activities",                value: Math.round(nights * 400)        },
                ];
                const items = result.budget && result.budget.length > 0
                  ? result.budget
                  : defaultBudget;
                const total = result.budget_total ?? items.reduce((s, i) => s + i.value, 0);
                return (
                  <div className="space-y-2 text-sm">
                    {items.map((r) => (
                      <div
                        key={r.label}
                        className="flex items-center justify-between p-2 bg-bg-elevated rounded"
                      >
                        <span className="text-xs text-text-secondary">{r.label}</span>
                        <span className="text-xs font-semibold">{formatPrice(r.value)}</span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between p-3 bg-saffron/10 border border-saffron/20 rounded mt-2">
                      <span className="font-semibold text-sm">Total estimate</span>
                      <span className="font-display text-lg font-bold text-saffron">
                        {formatPrice(total)}
                      </span>
                    </div>
                  </div>
                );
              })()}

              <div className="mt-5 pt-5 border-t border-border space-y-2">
                <button
                  onClick={addToTrips}
                  disabled={savingTrip}
                  className="btn-primary w-full disabled:opacity-60"
                >
                  {savingTrip ? "Saving…" : t("planner.addToTrips")}
                </button>
                <button
                  onClick={() => { setShowResults(false); setResult(null); setPrompt(""); }}
                  className="btn-secondary w-full text-sm"
                >
                  {t("planner.customize")}
                </button>
              </div>
            </aside>
          </div>
        )}
      </main>
      <MobileNav />
    </>
  );
}
