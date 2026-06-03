"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MapPin, Sparkles, Crown, Bell } from "lucide-react";

const items = [
  {
    href: "/",
    icon: Home,
    label: "Home",
    activeClass: "text-text-primary",
    matches: (p: string) => p === "/",
  },
  {
    href: "/trips",
    icon: MapPin,
    label: "Trips",
    activeClass: "text-saffron",
    matches: (p: string) => p === "/trips" || p.startsWith("/trips/") || p.startsWith("/bookings/"),
  },
  {
    href: "/planner",
    icon: Sparkles,
    label: "Planner",
    activeClass: "text-purple",
    matches: (p: string) => p === "/planner",
  },
  {
    href: "/rewards",
    icon: Crown,
    label: "Rewards",
    activeClass: "text-hotel",
    matches: (p: string) => p === "/rewards",
  },
  {
    href: "/alerts",
    icon: Bell,
    label: "Alerts",
    activeClass: "text-flight",
    matches: (p: string) => p === "/alerts",
  },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-strong border-t border-border">
      <div className="flex items-center justify-around h-16">
        {items.map(({ href, icon: Icon, label, activeClass, matches }) => {
          const active = matches(pathname);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 px-3 py-2 ${
                active ? activeClass : "text-text-secondary"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
