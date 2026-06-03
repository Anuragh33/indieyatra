import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Book Hotels — Budget to Luxury Across India",
  description:
    "Find and book hotels, resorts, and homestays across India. Curated stays from budget guesthouses to luxury properties with free cancellation options.",
  openGraph: {
    title: "Book Hotels in India | IndieYatra",
    description:
      "Curated hotels from budget to luxury across India. Book stays alongside your bus, train, or flight — all in one app.",
  },
};

export default function HotelsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
