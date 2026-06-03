import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Book Train Tickets — Live Availability & Tatkal",
  description:
    "Search and book Indian Railways tickets with real-time seat availability, tatkal quota, PNR status, and delay alerts. 20,000+ trains across India.",
  openGraph: {
    title: "Book Train Tickets | IndieYatra",
    description:
      "Real-time train availability, tatkal booking, PNR status, and AI-powered delay alerts for 20,000+ Indian Railways trains.",
  },
};

export default function TrainsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
