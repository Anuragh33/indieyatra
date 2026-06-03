"use client";
import Link from "next/link";
import { Bus, Train, Plane, Building2, ArrowRight } from "lucide-react";
import { useT } from "@/lib/i18n";

export function LandingHero() {
  const t = useT();

  const VERTICALS = [
    {
      href: "/buses",
      label: "Buses",
      sub: t("landing.busSub"),
      desc: t("landing.busDesc"),
      icon: Bus,
      accent: "#FF6B1A",
      glow: "group-hover:shadow-[0_0_40px_rgba(255,107,26,0.25)]",
      badge: null,
      image: "https://images.unsplash.com/photo-1570118054363-ff4d296962f5?w=900&q=80",
    },
    {
      href: "/trains",
      label: "Trains",
      sub: t("landing.trainSub"),
      desc: t("landing.trainDesc"),
      icon: Train,
      accent: "#6366F1",
      glow: "group-hover:shadow-[0_0_40px_rgba(99,102,241,0.25)]",
      badge: null,
      image: "https://images.unsplash.com/photo-1442570468985-f63ed5de9086?w=900&q=80",
    },
    {
      href: "/flights",
      label: "Flights",
      sub: t("landing.flightSub"),
      desc: t("landing.flightDesc"),
      icon: Plane,
      accent: "#06B6D4",
      glow: "group-hover:shadow-[0_0_40px_rgba(6,182,212,0.25)]",
      badge: t("landing.comingSoon"),
      image: "https://images.unsplash.com/photo-1529074963764-98f45c47344b?w=900&q=80",
    },
    {
      href: "/hotels",
      label: "Hotels",
      sub: t("landing.hotelSub"),
      desc: t("landing.hotelDesc"),
      icon: Building2,
      accent: "#F59E0B",
      glow: "group-hover:shadow-[0_0_40px_rgba(245,158,11,0.25)]",
      badge: t("landing.comingSoon"),
      image: "https://images.unsplash.com/photo-1724947052687-e580b3010aad?w=900&q=80",
    },
  ] as const;

  return (
    <>
      {/* Branding */}
      <div className="text-center px-6 pt-14 md:pt-20 mb-8 relative z-10">
        <p className="text-xs text-text-muted uppercase tracking-[0.25em] font-semibold mb-12">
          {t("landing.tagline")}
        </p>
        <h1 className="font-display text-5xl md:text-7xl font-bold tracking-wide mb-12 leading-tight">
          {t("landing.heroTitle")}<span className="text-purple">{t("landing.heroTitleMid")}</span><br />
          <span className="text-purple">{t("landing.heroTitleEnd")}</span>
        </h1>
        <p className="text-text-secondary text-lg max-w-lg mx-auto mb-20">
          {t("landing.heroSub")}
        </p>
        {/* Trust strip */}
        <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
          {[t("landing.trust1"), t("landing.trust2"), t("landing.trust3"), t("landing.trust4")].map((label) => (
            <span
              key={label}
              className="text-xs font-medium px-3.5 py-1.5 rounded-full border border-white/10 bg-white/5 text-text-secondary backdrop-blur-sm"
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* 4 vertical cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 px-4 md:px-6 gap-3 md:gap-4 h-[320px] md:h-[260px]">
        {VERTICALS.map(({ href, label, sub, desc, icon: Icon, accent, glow, badge, image }) => (
          <Link
            key={href}
            href={href}
            className={`group relative overflow-hidden rounded-3xl border border-white/10 ${glow} transition-all duration-500 ease-out hover:-translate-y-2 hover:scale-[1.01] flex flex-col shadow-xl`}
          >
            <img
              src={image}
              alt={label}
              className="absolute inset-0 w-full h-full object-cover opacity-55 group-hover:opacity-70 group-hover:scale-110 transition-all duration-700 ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-transparent" />
            <div
              className="absolute bottom-0 left-0 right-0 h-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{ background: `radial-gradient(ellipse at 50% 120%, ${accent}22 0%, transparent 70%)` }}
            />

            {badge && (
              <div className="absolute top-4 right-4 z-10">
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-sm bg-black/40 text-white/80 border border-white/20 uppercase tracking-widest">
                  {badge}
                </span>
              </div>
            )}

            <div className="relative z-10 mt-auto p-4 md:p-5">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 backdrop-blur-sm"
                style={{ background: `${accent}18`, border: `1px solid ${accent}40` }}
              >
                <Icon className="w-4 h-4" style={{ color: accent }} />
              </div>

              <div className="font-display text-xl md:text-2xl font-bold text-white mb-0.5 tracking-tight">
                {label}
              </div>
              <div className="text-xs font-semibold mb-2 tracking-wide" style={{ color: accent }}>
                {sub}
              </div>
              <p className="text-white/55 text-xs leading-relaxed mb-3 hidden md:block">
                {desc}
              </p>

              <div
                className="flex items-center gap-1.5 text-sm font-semibold group-hover:gap-3 transition-all duration-300 opacity-80 group-hover:opacity-100"
                style={{ color: accent }}
              >
                {badge ? t("landing.explore") : t("landing.bookNow")}
                <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
