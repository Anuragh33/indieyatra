import type { Metadata } from "next";
import Script from "next/script";
import { Navbar } from "@/components/Navbar";
import { MobileNav } from "@/components/MobileNav";
import { LandingHero } from "@/components/landing/LandingHero";
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
        <LandingHero />
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
