import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Book Intercity Buses — 500+ Operators, Live Tracking",
  description:
    "Book premium intercity bus tickets across India with live GPS tracking, AI seat recommendations, and instant e-tickets on WhatsApp. 500+ verified operators.",
  openGraph: {
    title: "Book Intercity Buses | IndieYatra",
    description:
      "500+ verified bus operators with live GPS tracking. AC sleeper, Volvo, and government buses — all with instant WhatsApp e-tickets.",
  },
};

export default function BusesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
