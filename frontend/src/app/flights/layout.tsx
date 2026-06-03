import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Book Flights — Domestic & International",
  description:
    "Find and book the cheapest domestic and international flights from India. Compare fares across all major airlines, get fare alerts, and check live flight status.",
  openGraph: {
    title: "Book Flights | IndieYatra",
    description:
      "Compare fares across all major Indian airlines. Domestic and international flights with live status and fare alerts.",
  },
};

export default function FlightsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
