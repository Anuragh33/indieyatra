import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Travel Concierge — 24/7 Smart Travel Assistant",
  description:
    "Your personal AI travel concierge. Get real-time delay alerts, tatkal reminders, price drop notifications, and a 24/7 AI chat assistant for all your India travel needs.",
  openGraph: {
    title: "AI Travel Concierge | IndieYatra",
    description:
      "24/7 AI travel assistant with delay alerts, tatkal reminders, price drop notifications, and personalized trip briefings.",
  },
};

export default function ConciergeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
