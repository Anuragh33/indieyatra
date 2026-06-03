"use client";
import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Building2, Search, Star, MapPin, Wifi, Waves, Utensils, Bed, Filter, SlidersHorizontal, Check, Sparkles, AlertTriangle } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { MobileNav } from "@/components/MobileNav";
import { api } from "@/lib/api";

interface HotelResult {
  id: string; name: string; city: string; state: string; address: string;
  star_rating: number; rating: number; total_reviews: number;
  description: string; image_url: string; amenities: string;
  tags: string; property_type: string; check_in_time: string; check_out_time: string;
  min_price_per_night: number;
  rooms: { id: string; room_type: string; bed_type: string; price_per_night: number; breakfast_incl: boolean; free_cancellation: boolean; }[];
}

function StarRow({ n }: { n: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`w-3 h-3 ${i < n ? "fill-hotel text-hotel" : "text-border"}`} />
      ))}
    </span>
  );
}

function HotelCard({ h, nights }: { h: HotelResult; nights: number }) {
  const router = useRouter();
  const amenityList = h.amenities.split(",").filter(Boolean);
  const amenityIcons: Record<string, React.ReactNode> = {
    wifi: <Wifi className="w-3 h-3" />, pool: <Waves className="w-3 h-3" />,
    restaurant: <Utensils className="w-3 h-3" />,
  };
  return (
    <div className="card overflow-hidden hover:border-hotel/40 transition-all group">
      <div className="flex flex-col md:flex-row">
        <div className="md:w-60 shrink-0 aspect-[4/3] md:aspect-auto relative overflow-hidden">
          <img src={h.image_url} alt={h.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          <div className="absolute top-2 left-2 chip bg-black/50 backdrop-blur border-white/10 text-white text-[10px]">{h.property_type}</div>
        </div>
        <div className="flex-1 p-4 flex flex-col gap-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <StarRow n={h.star_rating} />
              <h3 className="font-semibold text-base mt-1">{h.name}</h3>
              <div className="flex items-center gap-1 text-xs text-text-secondary mt-0.5">
                <MapPin className="w-3 h-3" />{h.city}, {h.state}
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-[10px] text-text-muted">from / night</div>
              <div className="text-xl font-bold text-hotel">₹{Math.round(h.min_price_per_night / Math.max(nights, 1)).toLocaleString()}</div>
              {nights > 1 && <div className="text-xs text-text-muted">₹{Math.round(h.min_price_per_night).toLocaleString()} total</div>}
            </div>
          </div>
          <p className="text-xs text-text-secondary line-clamp-2">{h.description}</p>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 text-text-secondary">
              <Star className="w-3 h-3 fill-hotel text-hotel" />
              <span className="font-semibold">{h.rating}</span>
              <span className="text-text-muted">({h.total_reviews.toLocaleString()})</span>
            </span>
            <div className="flex items-center gap-1 text-text-muted">
              {amenityList.slice(0, 4).map(a => (
                <span key={a} className="chip text-[9px] bg-bg-elevated border-border px-1.5 py-0.5 flex items-center gap-0.5">
                  {amenityIcons[a] ?? a}
                </span>
              ))}
            </div>
          </div>
          {h.rooms.length > 0 && (
            <div className="text-[10px] text-text-muted flex items-center gap-2 flex-wrap">
              {h.rooms.slice(0, 2).map(r => (
                <span key={r.id} className="flex items-center gap-1">
                  <Bed className="w-2.5 h-2.5" />{r.room_type}
                  {r.breakfast_incl && " · Bfast"}
                  {r.free_cancellation && " · Free cancel"}
                </span>
              ))}
            </div>
          )}
          <div className="flex items-center justify-between mt-auto pt-2">
            <div className="text-[10px] text-text-muted">Check-in {h.check_in_time} · Check-out {h.check_out_time}</div>
            <button onClick={() => router.push(`/hotels/${h.id}`)}
              className="text-white font-semibold px-4 py-1.5 rounded-md text-sm hover:opacity-90 active:scale-95 transition-all"
              style={{ background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" }}>
              View Rooms
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function HotelSearchInner() {
  const router = useRouter();
  const params = useSearchParams();

  const cityParam     = params.get("city") || "";
  const checkInParam  = params.get("check_in") || new Date().toISOString().slice(0, 10);
  const checkOutParam = params.get("check_out") || new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const guestsParam   = parseInt(params.get("guests") || "2");

  const [city, setCity]         = useState(cityParam);
  const [checkIn, setCheckIn]   = useState(checkInParam);
  const [checkOut, setCheckOut] = useState(checkOutParam);
  const [guests, setGuests]     = useState(guestsParam);

  const [results, setResults] = useState<HotelResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"rating"|"price_asc"|"price_desc"|"reviews">("rating");
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterStars, setFilterStars] = useState<number[]>([]);
  const [filterTypes, setFilterTypes] = useState<string[]>([]);

  const today = new Date().toISOString().slice(0, 10);
  const nights = Math.max(1, Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000));

  const doSearch = useCallback(async (c: string, ci: string, co: string, g: number) => {
    if (!c.trim()) return;
    setLoading(true);
    try {
      const r = await api<HotelResult[]>(`/api/hotels/search?city=${encodeURIComponent(c)}&check_in=${ci}&check_out=${co}&guests=${g}&sort=rating`);
      setResults(r ?? []);
    } catch { setResults([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (cityParam) doSearch(cityParam, checkInParam, checkOutParam, guestsParam);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = () => {
    if (!city.trim()) return;
    const q = new URLSearchParams({ city, check_in: checkIn, check_out: checkOut, guests: String(guests) });
    router.replace(`/hotels/search?${q}`, { scroll: false });
    doSearch(city, checkIn, checkOut, guests);
  };

  const allTypes = Array.from(new Set(results.map(r => r.property_type).filter(Boolean)));
  const filtered = results.filter(r => {
    if (filterStars.length && !filterStars.includes(r.star_rating)) return false;
    if (filterTypes.length && !filterTypes.includes(r.property_type)) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === "price_asc") return a.min_price_per_night - b.min_price_per_night;
    if (sortBy === "price_desc") return b.min_price_per_night - a.min_price_per_night;
    if (sortBy === "reviews") return b.total_reviews - a.total_reviews;
    return b.rating - a.rating;
  });
  const activeFilterCount = filterStars.length + filterTypes.length;
  const clearFilters = () => { setFilterStars([]); setFilterTypes([]); };
  const minPrice = results.length ? Math.min(...results.map(r => r.min_price_per_night / Math.max(nights, 1))) : 0;

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 pb-24 md:pb-12">
        {/* Re-search bar */}
        <div className="card p-4 mb-4">
          <div className="flex flex-col md:flex-row gap-3 items-end flex-wrap">
            <div className="flex-1 min-w-[160px]">
              <label className="text-xs text-text-muted font-medium block mb-1">Destination</label>
              <input className="input text-sm w-full" placeholder="City name" value={city}
                onChange={e => setCity(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSearch()} />
            </div>
            <div className="w-full md:w-auto">
              <label className="text-xs text-text-muted font-medium block mb-1">Check-in</label>
              <input type="date" className="input text-sm w-full md:w-36" value={checkIn} min={today} onChange={e => setCheckIn(e.target.value)} />
            </div>
            <div className="w-full md:w-auto">
              <label className="text-xs text-text-muted font-medium block mb-1">Check-out</label>
              <input type="date" className="input text-sm w-full md:w-36" value={checkOut} min={checkIn} onChange={e => setCheckOut(e.target.value)} />
            </div>
            <div className="w-full md:w-auto">
              <label className="text-xs text-text-muted font-medium block mb-1">Guests</label>
              <select className="input text-sm w-full md:w-24" value={guests} onChange={e => setGuests(parseInt(e.target.value))}>
                {[1,2,3,4].map(n => <option key={n} value={n}>{n} Guest{n>1?"s":""}</option>)}
              </select>
            </div>
            <button onClick={handleSearch}
              className="flex items-center gap-2 text-white font-semibold px-5 py-2.5 rounded-md hover:opacity-90 active:scale-95 transition-all w-full md:w-auto justify-center"
              style={{ background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" }}>
              <Search className="w-4 h-4" /> Search Hotels
            </button>
          </div>
          <div className="mt-3 flex items-center gap-2 text-sm">
            <span className="font-semibold">Hotels in {cityParam || "—"}</span>
            <span className="text-text-muted">· {nights} night{nights !== 1 ? "s" : ""} · {guestsParam} guest{guestsParam > 1 ? "s" : ""} ·</span>
            {loading ? <span className="text-text-muted animate-pulse">Searching…</span>
              : <span className="text-text-muted"><span className="text-text-primary font-semibold">{results.length}</span> hotels found</span>}
            {minPrice > 0 && !loading && <span className="text-text-muted">· from <span className="text-hotel font-semibold">₹{Math.round(minPrice).toLocaleString()}/night</span></span>}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_280px] gap-4">
          {/* Filters */}
          <aside className={`${filterOpen ? "block" : "hidden lg:block"} h-fit`}>
            <div className="card p-4 sticky top-4 space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-hotel" />
                  <span className="font-semibold text-sm">Filters</span>
                </div>
                {activeFilterCount > 0 && <button onClick={clearFilters} className="text-xs text-hotel hover:underline">Clear {activeFilterCount}</button>}
              </div>
              <div>
                <div className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">Star Rating</div>
                {[5,4,3,2,1].map(n => (
                  <label key={n} className="flex items-center gap-2 py-1 cursor-pointer">
                    <input type="checkbox" checked={filterStars.includes(n)} className="accent-hotel"
                      onChange={() => setFilterStars(p => p.includes(n) ? p.filter(x => x !== n) : [...p, n])} />
                    <span className="flex items-center gap-0.5">
                      {Array.from({length:5}).map((_,i) => <Star key={i} className={`w-3 h-3 ${i < n ? "fill-hotel text-hotel" : "text-border"}`} />)}
                    </span>
                    <span className="text-xs text-text-muted">{n} star{n>1?"s":""}</span>
                  </label>
                ))}
              </div>
              {allTypes.length > 1 && (
                <div>
                  <div className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">Property Type</div>
                  {allTypes.map(t => (
                    <label key={t} className="flex items-center gap-2 py-1 cursor-pointer">
                      <input type="checkbox" checked={filterTypes.includes(t)} className="accent-hotel"
                        onChange={() => setFilterTypes(p => p.includes(t) ? p.filter(x => x !== t) : [...p, t])} />
                      <span className="text-sm text-text-secondary">{t}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </aside>

          {/* Results */}
          <section>
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <button onClick={() => setFilterOpen(o => !o)} className="lg:hidden flex items-center gap-1.5 text-xs btn-secondary">
                  <SlidersHorizontal className="w-3.5 h-3.5" /> Filters
                  {activeFilterCount > 0 && <span className="bg-hotel text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">{activeFilterCount}</span>}
                </button>
                <span className="text-sm text-text-muted">
                  <span className="font-semibold text-text-primary">{filtered.length}</span>
                  {activeFilterCount > 0 && <span> of {results.length}</span>} hotels
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-text-muted mr-1">Sort:</span>
                {(["rating","price_asc","price_desc","reviews"] as const).map(s => (
                  <button key={s} onClick={() => setSortBy(s)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${sortBy === s ? "bg-hotel/10 text-hotel border border-hotel/30" : "text-text-secondary hover:bg-bg-elevated"}`}>
                    {s === "price_asc" ? "Price ↑" : s === "price_desc" ? "Price ↓" : s === "reviews" ? "Reviews" : "Rating"}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="card h-48 animate-pulse bg-bg-elevated" />)}</div>
            ) : filtered.length === 0 ? (
              <div className="card p-10 text-center">
                <Building2 className="w-10 h-10 text-text-muted mx-auto mb-3" />
                <div className="font-semibold mb-1">No hotels found</div>
                <p className="text-sm text-text-secondary mb-3">Try a different city or adjust your filters.</p>
                {activeFilterCount > 0 && <button onClick={clearFilters} className="btn-secondary text-sm">Clear filters</button>}
              </div>
            ) : (
              <div className="space-y-4">{filtered.map(h => <HotelCard key={h.id} h={h} nights={nights} />)}</div>
            )}
          </section>

          {/* Right sidebar */}
          <aside className="space-y-4 lg:sticky lg:top-4 h-fit">
            <div className="card p-5">
              <h3 className="font-semibold mb-3 text-sm">Why book with IndieYatra?</h3>
              {["Best price guarantee","Instant confirmation","Free cancellation on select rooms","24/7 customer support"].map(p => (
                <div key={p} className="flex items-center gap-2 text-sm text-text-secondary py-1.5 border-b border-border last:border-0">
                  <Check className="w-3.5 h-3.5 text-hotel shrink-0" />{p}
                </div>
              ))}
            </div>
            <div className="card p-5 border-teal/30 bg-teal/5">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-teal" />
                <span className="chip bg-teal/10 text-teal border border-teal/20">AI Insight</span>
              </div>
              <h3 className="font-semibold mb-1 text-sm">Weekday rates are 20% lower</h3>
              <p className="text-sm text-text-secondary">Hotels in {cityParam || "this city"} offer significantly better rates on Mon–Thu stays.</p>
            </div>
            <div className="card p-5 border-warning/30 bg-warning/5">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-warning" />
                <span className="chip bg-warning/10 text-warning border border-warning/20">High Demand</span>
              </div>
              <h3 className="font-semibold mb-1 text-sm">Filling up fast</h3>
              <p className="text-sm text-text-secondary">Several properties only have 1–2 rooms left for your selected dates.</p>
            </div>
          </aside>
        </div>
      </main>
      <MobileNav />
    </>
  );
}

export default function HotelSearchPage() {
  return (
    <Suspense fallback={<div className="p-8 text-text-muted">Loading…</div>}>
      <HotelSearchInner />
    </Suspense>
  );
}
