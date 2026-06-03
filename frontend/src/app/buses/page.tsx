"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { MobileNav } from "@/components/MobileNav";
import { SearchWidget } from "@/components/SearchWidget";
import { apiGet } from "@/lib/api";
import type { City, Route } from "@/lib/types";
import { useCurrency } from "@/lib/currency";
import { Star, TrendingUp, Crown, Sparkles, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { useT } from "@/lib/i18n";

export default function Home() {
  const router = useRouter();
  const t = useT();
  const { format: formatPrice } = useCurrency();
  const [cities, setCities] = useState<City[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [priceTrend, setPriceTrend] = useState<{ month: string; price: number }[]>([]);

  useEffect(() => {
    apiGet<City[]>("/api/destinations/top").then(setCities).catch(() => {});
    apiGet<Route[]>("/api/routes/popular")
      .then((r) => {
        setRoutes(r);
        if (r.length > 0) {
          apiGet<{ date: string; avg_price: number }[]>(
            `/api/price-history?route_id=${r[0].id}`
          )
            .then((hist) => {
              if (hist.length > 0) {
                setPriceTrend(
                  hist.slice(-6).map((h) => ({
                    month: new Date(h.date).toLocaleDateString("en-IN", { month: "short" }),
                    price: Math.round(h.avg_price),
                  }))
                );
              } else {
                // Fallback: realistic bus price trend for Delhi-Mumbai
                setPriceTrend([
                  { month: "Jan", price: 1250 }, { month: "Feb", price: 1180 },
                  { month: "Mar", price: 1420 }, { month: "Apr", price: 1350 },
                  { month: "May", price: 1190 }, { month: "Jun", price: 1480 },
                ]);
              }
            })
            .catch(() => {
              setPriceTrend([
                { month: "Jan", price: 1250 }, { month: "Feb", price: 1180 },
                { month: "Mar", price: 1420 }, { month: "Apr", price: 1350 },
                { month: "May", price: 1190 }, { month: "Jun", price: 1480 },
              ]);
            });
        }
      })
      .catch(() => {});
  }, []);

  return (
    <>
      <Navbar />
      <main className="pb-24 md:pb-12">
        {/* HERO */}
        <section className="relative overflow-hidden bg-hero-atmosphere border-b border-border flex flex-col md:min-h-screen">
          {/* Image: natural 16:9 on mobile (no crop), absolute fill on desktop */}
          <div className="relative aspect-video md:absolute md:inset-0 overflow-hidden pointer-events-none">
            <img
              src="https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=1920&q=80"
              alt="Indian highway bus journey"
              className="w-full h-full object-cover object-center opacity-40"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-bg-primary/60 via-transparent to-bg-primary/90" />
          </div>
          <div className="hidden md:block absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute top-20 left-10 w-96 h-96 rounded-full bg-saffron/20 blur-3xl" />
            <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-purple/20 blur-3xl" />
          </div>

          {/* Content: below image on mobile, overlaid at bottom on desktop */}
          <div className="relative md:absolute md:inset-0 md:flex md:flex-col md:justify-end">
            <div className="max-w-7xl mx-auto px-6 py-8 md:pb-28 w-full">
              <div className="text-center max-w-3xl mx-auto mb-8">
                <div className="inline-flex items-center gap-2 chip bg-saffron/10 text-saffron border border-saffron/20 mb-4">
                  <Sparkles className="w-3 h-3" />
                  {t("home.chip")}
                </div>
                <h1 className="font-display text-4xl md:text-7xl font-bold tracking-tight mb-4">
                  {t("home.heroTitle1")} <span className="text-gradient-saffron">{t("home.heroTitleAccent")}</span> {t("home.heroTitle2")}
                </h1>
                <p className="text-text-secondary text-base md:text-lg">
                  {t("home.heroSubtitle")}
                </p>
              </div>

              <SearchWidget />
            </div>
          </div>
        </section>

        {/* TOP DESTINATIONS */}
        <section className="max-w-7xl mx-auto px-6 py-16">
          <div className="flex items-end justify-between mb-6">
            <div>
              <div className="chip bg-teal/10 text-teal border border-teal/20 mb-2">
                <TrendingUp className="w-3 h-3" /> Trending
              </div>
              <h2 className="font-display text-3xl font-bold">{t("home.topDestinations")}</h2>
              <p className="text-text-secondary text-sm mt-1">
                {t("home.topDestinationsSub")}
              </p>
            </div>
            <button onClick={() => router.push("/search")} className="text-sm text-saffron hover:underline">{t("home.viewAll")}</button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {cities.slice(0, 8).map((city, i) => (
              <motion.button
                key={city.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.06 }}
                onClick={() => router.push(`/search?from=MUM&to=${city.code}`)}
                className="group card card-hover overflow-hidden text-left"
              >
                <div className="aspect-[4/3] bg-bg-elevated relative overflow-hidden">
                  {city.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={city.image_url}
                      alt={city.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <MapPin className="w-8 h-8 text-text-muted" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <div className="font-semibold text-white">{city.name}</div>
                    <div className="text-xs text-white/70">{city.state}</div>
                  </div>
                </div>
                <div className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-text-secondary">
                    <Star className="w-3 h-3 fill-saffron text-saffron" />
                    {((city.popularity || 90) / 20).toFixed(1)}
                  </div>
                  <div className="text-xs">
                    {t("home.from")} <span className="text-saffron font-semibold">{formatPrice(380 + (city.popularity || 0))}</span>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </section>

        {/* PRICE TRENDS */}
        <section className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 card p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-display text-xl font-bold">{t("home.priceTrends")}</h3>
                  <p className="text-xs text-text-muted mt-0.5">
                    {t("home.priceTrendsSub")}
                  </p>
                </div>
                <span className="chip bg-teal/10 text-teal border border-teal/20">
                  {t("home.priceDrop")}
                </span>
              </div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={priceTrend}>
                    <XAxis
                      dataKey="month"
                      stroke="#6B7280"
                      style={{ fontSize: 11 }}
                    />
                    <YAxis stroke="#6B7280" style={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        background: "#1A2235",
                        border: "1px solid #1F2937",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke="#FF6B1A"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: "#FF6B1A" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card p-6 bg-gradient-to-br from-saffron/10 via-bg-surface to-bg-surface border-saffron/20">
              <Crown className="w-8 h-8 text-saffron mb-3" />
              <h3 className="font-display text-xl font-bold mb-1">
                {t("home.premium")}
              </h3>
              <p className="text-sm text-text-secondary mb-4">
                {t("home.premiumSub")}
              </p>
              <ul className="space-y-2 text-sm text-text-secondary mb-4">
                <li className="flex items-center gap-2">
                  <span className="text-teal">✓</span> {t("home.perkDeals")}
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-teal">✓</span> {t("home.perkSupport")}
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-teal">✓</span> {t("home.perkNoFees")}
                </li>
              </ul>
              <button onClick={() => router.push("/profile")} className="btn-primary w-full">{t("home.upgradeNow")}</button>
            </div>
          </div>
        </section>

        {/* POPULAR ROUTES */}
        <section className="max-w-7xl mx-auto px-6 py-12">
          <h2 className="font-display text-3xl font-bold mb-6">{t("home.popularRoutes")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {routes.slice(0, 6).map((r, i) => (
              <motion.button
                key={r.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.07 }}
                onClick={() =>
                  router.push(
                    `/search?from=${r.from_city?.code}&to=${r.to_city?.code}`
                  )
                }
                className="card p-4 text-left card-hover flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-md bg-gradient-saffron flex items-center justify-center text-white font-display text-lg font-bold">
                  {r.from_city?.code?.charAt(0) || "?"}
                </div>
                <div className="flex-1">
                  <div className="font-semibold">
                    {r.from_city?.name} → {r.to_city?.name}
                  </div>
                  <div className="text-xs text-text-muted">
                    {r.distance_km} km · ~{Math.round((r.avg_duration_min || 0) / 60)}h
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-text-muted">{t("home.from")}</div>
                  <div className="font-semibold text-saffron">
                    {formatPrice(450 + (r.distance_km || 0))}
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </section>

        {/* FEATURED BUSES */}
        <section className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-end justify-between mb-6">
            <div>
              <div className="chip bg-saffron/10 text-saffron border border-saffron/20 mb-2">
                <Crown className="w-3 h-3" /> Premium fleet
              </div>
              <h2 className="font-display text-3xl font-bold">{t("home.featuredBuses")}</h2>
              <p className="text-text-secondary text-sm mt-1">
                {t("home.featuredBusesSub")}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: "Volvo B11R Multi-Axle", tag: "AC Sleeper", img: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&q=80", seats: 36, fare: 1899 },
              { name: "Mercedes Benz Multi-Axle", tag: "AC Seater", img: "https://images.unsplash.com/photo-1556122071-e404eaedb77f?w=800&q=80", seats: 45, fare: 1499 },
              { name: "Scania Metrolink", tag: "AC Sleeper", img: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=800&q=80", seats: 40, fare: 1699 },
              { name: "NueGo Electric", tag: "Electric", img: "https://images.unsplash.com/photo-1494522855154-9297ac14b55f?w=800&q=80", seats: 40, fare: 1299 },
            ].map((b, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.08 }}
                className="card overflow-hidden card-hover group"
              >
                <div className="aspect-[4/3] bg-bg-elevated relative overflow-hidden">
                  <img
                    src={b.img}
                    alt={b.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute top-2 left-2 chip bg-black/50 backdrop-blur border-white/10 text-white text-[10px]">
                    {b.tag}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <div className="font-semibold text-white text-sm">{b.name}</div>
                    <div className="text-[10px] text-white/70">{b.seats} {t("home.seats")} · {t("home.from")} {formatPrice(b.fare)}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </main>
      <MobileNav />
    </>
  );
}
