import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Multimodal Trip Optimizer — Cheapest, Fastest, Best Route",
  description:
    "Find the optimal combination of buses, trains, and flights for any journey in India. Compare cost, duration, and comfort across multimodal travel options.",
  openGraph: {
    title: "Multimodal Trip Optimizer | IndieYatra",
    description:
      "Mix buses, trains, and flights to find the cheapest or fastest way to travel anywhere in India.",
  },
};

export default function OptimizeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
