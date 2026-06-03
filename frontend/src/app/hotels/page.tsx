"use client";
import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Building2, Star, Wifi, Coffee, TrendingUp, Crown, MapPin, Waves, Mountain, Utensils, Search } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { MobileNav } from "@/components/MobileNav";
import { useT } from "@/lib/i18n";

const POPULAR_DESTINATIONS = [
  { city: "Goa", state: "Goa", hotels: 1240, from: 650, img: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800&q=80", tag: "Beach" },
  { city: "Jaipur", state: "Rajasthan", hotels: 860, from: 1800, img: "https://images.unsplash.com/photo-1599661046289-e31897846e41?w=800&q=80", tag: "Heritage" },
  { city: "Mumbai", state: "Maharashtra", hotels: 2100, from: 2500, img: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800&q=80", tag: "City" },
  { city: "Shimla", state: "Himachal Pradesh", hotels: 450, from: 650, img: "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800&q=80", tag: "Mountains" },
  { city: "Kochi", state: "Kerala", hotels: 620, from: 1600, img: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&q=80", tag: "Backwaters" },
  { city: "Delhi", state: "Delhi", hotels: 1900, from: 2200, img: "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800&q=80", tag: "Capital" },
  { city: "Varanasi", state: "Uttar Pradesh", hotels: 390, from: 1100, img: "https://images.unsplash.com/photo-1561361058-c24cecae35ca?w=800&q=80", tag: "Spiritual" },
  { city: "Rishikesh", state: "Uttarakhand", hotels: 280, from: 900, img: "https://images.unsplash.com/photo-1588083949404-c4f1ed1323b3?w=800&q=80", tag: "Adventure" },
  { city: "Udaipur", state: "Rajasthan", hotels: 420, from: 1400, img: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&q=80", tag: "Lake City" },
  { city: "Agra", state: "Uttar Pradesh", hotels: 510, from: 1200, img: "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800&q=80", tag: "Taj Mahal" },
  { city: "Manali", state: "Himachal Pradesh", hotels: 320, from: 750, img: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800&q=80", tag: "Mountains" },
  { city: "Mysuru", state: "Karnataka", hotels: 340, from: 1100, img: "https://images.unsplash.com/photo-1601897823538-6ce0e73f5f7b?w=800&q=80", tag: "Heritage" },
  { city: "Amritsar", state: "Punjab", hotels: 290, from: 900, img: "https://images.unsplash.com/photo-1609691534257-bfb1e7a1a9a5?w=800&q=80", tag: "Spiritual" },
  { city: "Kolkata", state: "West Bengal", hotels: 1100, from: 1800, img: "https://images.unsplash.com/photo-1558431382-27e303142255?w=800&q=80", tag: "Cultural" },
  { city: "Hyderabad", state: "Telangana", hotels: 1400, from: 1900, img: "https://images.unsplash.com/photo-1565374395542-0ce18882c857?w=800&q=80", tag: "City" },
  { city: "Bengaluru", state: "Karnataka", hotels: 1850, from: 2000, img: "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=800&q=80", tag: "City" },
];

function HotelsLanding() {
  const router = useRouter();
  const t = useT();

  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

  const [city, setCity] = useState("");
  const [checkIn, setCheckIn] = useState(today);
  const [checkOut, setCheckOut] = useState(tomorrow);
  const [guests, setGuests] = useState(2);

  const handleSearch = () => {
    if (!city.trim()) return;
    const q = new URLSearchParams({ city, check_in: checkIn, check_out: checkOut, guests: String(guests) });
    router.push(`/hotels/search?${q}`);
  };

  return (
    <>
      <Navbar />
      <main className="pb-24 md:pb-0">
        <section className="relative overflow-hidden border-b border-border min-h-screen flex flex-col">
          <div className="absolute inset-0 pointer-events-none">
            <img
              src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1920&q=80"
              alt="Luxury hotel lobby"
              className="w-full h-full object-cover object-center opacity-40"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-bg-primary/60 via-transparent to-bg-primary/90" />
          </div>
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute top-12 left-16 w-80 h-80 rounded-full bg-hotel/30 blur-3xl" />
            <div className="absolute bottom-0 right-20 w-72 h-72 rounded-full bg-saffron/20 blur-3xl" />
          </div>

          <div className="flex-1 flex flex-col justify-center relative">
            <div className="max-w-7xl mx-auto px-6 py-12 w-full">
              <div className="text-center max-w-2xl mx-auto mb-8">
                <div className="inline-flex items-center gap-2 chip bg-hotel/10 text-hotel border border-hotel/20 mb-4">
                  <Building2 className="w-3 h-3" /> {t("hotels.chip")}
                </div>
                <h1 className="font-display text-5xl md:text-6xl font-bold tracking-tight mb-3">
                  {t("hotels.heroTitle")} <span className="text-hotel">{t("hotels.heroTitleAccent")}</span>
                </h1>
                <p className="text-text-secondary text-base">
                  {t("hotels.heroSub")}
                </p>
              </div>

              <div className="bg-bg-surface/80 backdrop-blur-md border border-border rounded-xl p-4">
                <div className="flex flex-col md:flex-row gap-3 items-end flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                    <label className="text-xs text-text-muted font-medium block mb-1">{t("hotels.destinationLabel")}</label>
                    <input
                      className="input text-sm w-full"
                      placeholder={t("hotels.destinationPlaceholder")}
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleSearch()}
                    />
                  </div>
                  <div className="w-full md:w-auto">
                    <label className="text-xs text-text-muted font-medium block mb-1">{t("hotels.checkInLabel")}</label>
                    <input
                      type="date"
                      className="input text-sm w-full md:w-36"
                      value={checkIn}
                      min={today}
                      onChange={e => setCheckIn(e.target.value)}
                    />
                  </div>
                  <div className="w-full md:w-auto">
                    <label className="text-xs text-text-muted font-medium block mb-1">{t("hotels.checkOutLabel")}</label>
                    <input
                      type="date"
                      className="input text-sm w-full md:w-36"
                      value={checkOut}
                      min={checkIn}
                      onChange={e => setCheckOut(e.target.value)}
                    />
                  </div>
                  <div className="w-full md:w-auto">
                    <label className="text-xs text-text-muted font-medium block mb-1">{t("hotels.guestsLabel")}</label>
                    <select
                      className="input text-sm w-full md:w-28"
                      value={guests}
                      onChange={e => setGuests(parseInt(e.target.value))}
                    >
                      {[1, 2, 3, 4].map(n => (
                        <option key={n} value={n}>{t("hotels.guest", n)}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={handleSearch}
                    className="flex items-center gap-2 text-white font-semibold px-5 py-2.5 rounded-md w-full md:w-auto justify-center hover:opacity-90 active:scale-95 transition-all"
                    style={{ background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" }}
                  >
                    <Search className="w-4 h-4" />
                    {t("hotels.searchBtn")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-6">
          {/* Popular destinations */}
          <section className="py-14">
            <div className="flex items-end justify-between mb-6">
              <div>
                <div className="chip bg-hotel/10 text-hotel border border-hotel/20 mb-2 inline-flex items-center gap-1.5">
                  <TrendingUp className="w-3 h-3" /> {t("hotels.trending")}
                </div>
                <h2 className="font-display text-3xl font-bold">{t("hotels.popularDestinations")}</h2>
                <p className="text-text-secondary text-sm mt-1">{t("hotels.popularSub")}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {POPULAR_DESTINATIONS.map((d, i) => (
                <button
                  key={i}
                  className="group card overflow-hidden cursor-pointer hover:border-hotel/40 transition-all text-left"
                  onClick={() => {
                    const q = new URLSearchParams({ city: d.city, check_in: checkIn, check_out: checkOut, guests: String(guests) });
                    router.push(`/hotels/search?${q}`);
                  }}
                >
                  <div className="aspect-[4/3] bg-bg-elevated relative overflow-hidden">
                    <img
                      src={d.img}
                      alt={d.city}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute top-2 left-2">
                      <span className="chip bg-black/50 backdrop-blur border-white/10 text-white text-[10px]">{d.tag}</span>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <div className="font-semibold text-white">{d.city}</div>
                      <div className="text-xs text-white/70">{d.state}</div>
                    </div>
                  </div>
                  <div className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-text-secondary">
                      <Building2 className="w-3 h-3" />{t("hotels.hotelsCount", d.hotels)}
                    </div>
                    <div className="text-xs">{t("hotels.from")} <span className="text-hotel font-semibold">₹{d.from.toLocaleString()}</span></div>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Features + Premium */}
          <section className="py-4 mb-10">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { icon: Star, labelKey: "reviews" as const, descKey: "reviewsDesc" as const },
                  { icon: Wifi, labelKey: "cancel" as const, descKey: "cancelDesc" as const },
                  { icon: Coffee, labelKey: "breakfast" as const, descKey: "breakfastDesc" as const },
                  { icon: Waves, labelKey: "pool" as const, descKey: "poolDesc" as const },
                  { icon: Mountain, labelKey: "views" as const, descKey: "viewsDesc" as const },
                  { icon: Utensils, labelKey: "dining" as const, descKey: "diningDesc" as const },
                ].map(f => (
                  <div key={f.labelKey} className="card p-5">
                    <f.icon className="w-5 h-5 text-hotel mb-3" />
                    <h3 className="font-semibold text-sm mb-1">{t(`hotels.features.${f.labelKey}`)}</h3>
                    <p className="text-xs text-text-secondary leading-relaxed">{t(`hotels.features.${f.descKey}`)}</p>
                  </div>
                ))}
              </div>
              <div className="card p-6 bg-gradient-to-br from-hotel/10 via-bg-surface to-bg-surface border-hotel/20">
                <Crown className="w-8 h-8 text-hotel mb-3" />
                <h3 className="font-display text-xl font-bold mb-1">{t("hotels.premiumTitle")}</h3>
                <p className="text-sm text-text-secondary mb-4">{t("hotels.premiumSub")}</p>
                <ul className="space-y-2 text-sm text-text-secondary mb-5">
                  <li className="flex items-center gap-2"><span className="text-hotel">✓</span> {t("hotels.perks.discount")}</li>
                  <li className="flex items-center gap-2"><span className="text-hotel">✓</span> {t("hotels.perks.upgrade")}</li>
                  <li className="flex items-center gap-2"><span className="text-hotel">✓</span> {t("hotels.perks.checkout")}</li>
                  <li className="flex items-center gap-2"><span className="text-hotel">✓</span> {t("hotels.perks.concierge")}</li>
                </ul>
                <button
                  onClick={() => router.push("/profile")}
                  className="btn-primary w-full text-center"
                  style={{ background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" }}
                >
                  {t("hotels.upgradeNow")}
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>
      <MobileNav />
    </>
  );
}

export default function HotelsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-text-muted text-sm">Loading hotels…</div>
      </div>
    }>
      <HotelsLanding />
    </Suspense>
  );
}
