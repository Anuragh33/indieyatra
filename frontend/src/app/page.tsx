import type { Metadata } from "next";
import Script from "next/script";
import Link from "next/link";
import { Bus, Train, Plane, Building2, ArrowRight } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { MobileNav } from "@/components/MobileNav";

const siteURL = process.env.NEXT_PUBLIC_APP_URL ?? "https://indieyatra.in";

export const metadata: Metadata = {
  title: "Book Buses, Trains, Flights & Hotels in India",
  description:
    "IndieYatra is India's travel super-app. Book intercity buses with live GPS tracking, train tickets with real-time availability, flights, and hotels — all in one place. AI trip planner included.",
  alternates: {
    canonical: siteURL,
  },
  openGraph: {
    title: "IndieYatra — Book Buses, Trains, Flights & Hotels in India",
    description:
      "India's travel super-app: live GPS tracking, AI trip planning, premium concierge, 500+ bus operators, 20,000+ trains, all major airlines.",
    url: siteURL,
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "IndieYatra",
  url: siteURL,
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${siteURL}/search?from={from}&to={to}&date={date}`,
    },
    "query-input": [
      "required name=from",
      "required name=to",
      "required name=date",
    ],
  },
};

const serviceJsonLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  serviceType: "Travel Booking",
  name: "IndieYatra Travel Super-App",
  provider: {
    "@type": "Organization",
    name: "IndieYatra",
    url: siteURL,
  },
  areaServed: {
    "@type": "Country",
    name: "India",
  },
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Travel Services",
    itemListElement: [
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Bus Booking" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Train Ticket Booking" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Flight Booking" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Hotel Booking" } },
    ],
  },
};
import { VerticalsShowcase } from "@/components/landing/VerticalsShowcase";
import { OptimizerTeaser } from "@/components/landing/OptimizerTeaser";
import { ConciergeShowcase } from "@/components/landing/ConciergeShowcase";
import { VernacularSection } from "@/components/landing/VernacularSection";
import { AIPlannerShowcase } from "@/components/landing/AIPlannerShowcase";
import { LiveTrackingTeaser } from "@/components/landing/LiveTrackingTeaser";
import { PremiumSection } from "@/components/landing/PremiumSection";
import { SocialProof } from "@/components/landing/SocialProof";
import { DownloadApp } from "@/components/landing/DownloadApp";
import { FinalCTA } from "@/components/landing/FinalCTA";

const VERTICALS = [
  {
    href: "/buses",
    label: "Buses",
    sub: "500+ operators",
    desc: "Premium intercity travel with live tracking and AI-powered booking",
    icon: Bus,
    accent: "#FF6B1A",
    border: "border-saffron/40",
    glow: "group-hover:shadow-[0_0_40px_rgba(255,107,26,0.25)]",
    badge: null,
    image: "https://images.unsplash.com/photo-1570118054363-ff4d296962f5?w=900&q=80",
  },
  {
    href: "/trains",
    label: "Trains",
    sub: "20,000+ trains",
    desc: "IRCTC availability, tatkal & general quotas, PNR tracking",
    icon: Train,
    accent: "#6366F1",
    border: "border-train/40",
    glow: "group-hover:shadow-[0_0_40px_rgba(99,102,241,0.25)]",
    badge: null,
    image: "https://images.unsplash.com/photo-1442570468985-f63ed5de9086?w=900&q=80",
  },
  {
    href: "/flights",
    label: "Flights",
    sub: "All Indian airlines",
    desc: "Real-time fares, seat selection, and live delay alerts",
    icon: Plane,
    accent: "#06B6D4",
    border: "border-flight/40",
    glow: "group-hover:shadow-[0_0_40px_rgba(6,182,212,0.25)]",
    badge: "Coming Soon",
    image: "https://images.unsplash.com/photo-1529074963764-98f45c47344b?w=900&q=80",
  },
  {
    href: "/hotels",
    label: "Hotels",
    sub: "500+ cities",
    desc: "Budget guesthouses to palace hotels, verified reviews",
    icon: Building2,
    accent: "#F59E0B",
    border: "border-hotel/40",
    glow: "group-hover:shadow-[0_0_40px_rgba(245,158,11,0.25)]",
    badge: "Coming Soon",
    image: "https://images.unsplash.com/photo-1724947052687-e580b3010aad?w=900&q=80",
  },
] as const;

export default function LandingPage() {
  return (
    <>
      <Script
        id="jsonld-website"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <Script
        id="jsonld-service"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }}
      />
      <Navbar />
      <main className="min-h-[calc(100vh-56px)] flex flex-col justify-start pb-16 md:pb-0">
        {/* Branding */}
        <div className="text-center px-6 pt-14 md:pt-20 mb-8 relative z-10">
          <p className="text-xs text-text-muted uppercase tracking-[0.25em] font-semibold mb-12">
            India&apos;s Premium Travel Super-App
          </p>
          <h1 className="font-display text-5xl md:text-7xl font-bold tracking-wide mb-12 leading-tight">
            Indie<span className="text-purple">Yatra</span>, to every journey<br />
            across <span className="text-purple">India</span>
          </h1>
          <p className="text-text-secondary text-lg max-w-lg mx-auto mb-20">
            Buses · Trains · Flights · Hotels — book, track, and manage all your travel in one place
          </p>
          {/* Trust strip */}
          <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
            {[
              { label: "10M+ trips booked" },
              { label: "500+ operators" },
              { label: "₹0 booking fee" },
              { label: "Live tracking" },
            ].map(({ label }) => (
              <span
                key={label}
                className="text-xs font-medium px-3.5 py-1.5 rounded-full border border-white/10 bg-white/5 text-text-secondary backdrop-blur-sm"
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* 4 cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 px-4 md:px-6 gap-3 md:gap-4" style={{ height: 260 }}>
          {VERTICALS.map(({ href, label, sub, desc, icon: Icon, accent, border, glow, badge, image }) => (
            <Link
              key={href}
              href={href}
              className={`group relative overflow-hidden rounded-3xl border border-white/10 ${glow} transition-all duration-500 ease-out hover:-translate-y-2 hover:scale-[1.01] flex flex-col shadow-xl`}
            >
              {/* Background photo */}
              <img
                src={image}
                alt={label}
                className="absolute inset-0 w-full h-full object-cover opacity-55 group-hover:opacity-70 group-hover:scale-110 transition-all duration-700 ease-out"
              />

              {/* Silky gradient — fades smoothly, not harshly */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
              {/* Subtle top vignette */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-transparent" />
              {/* Accent color bloom at bottom */}
              <div className="absolute bottom-0 left-0 right-0 h-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: `radial-gradient(ellipse at 50% 120%, ${accent}22 0%, transparent 70%)` }}
              />

              {/* Coming soon badge */}
              {badge && (
                <div className="absolute top-4 right-4 z-10">
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-sm bg-black/40 text-white/80 border border-white/20 uppercase tracking-widest">
                    {badge}
                  </span>
                </div>
              )}

              {/* Content at bottom */}
              <div className="relative z-10 mt-auto p-4 md:p-5">
                {/* Icon */}
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
                  {badge ? "Explore" : "Book Now"}
                  <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>

      {/* Landing page enhancement sections */}
      <VerticalsShowcase />
      <OptimizerTeaser />
      <ConciergeShowcase />
      <VernacularSection />
      <AIPlannerShowcase />
      <LiveTrackingTeaser />
      <PremiumSection />
      <SocialProof />
      <DownloadApp />
      <FinalCTA />

      <MobileNav />
    </>
  );
}
