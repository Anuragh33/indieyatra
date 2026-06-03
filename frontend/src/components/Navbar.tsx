"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Sparkles,
  Crown,
  User as UserIcon,
  LogOut,
  Sun,
  Moon,
  Bus,
  Train,
  Plane,
  Building2,
  TrendingDown,
} from "lucide-react";
import { useTheme } from "@/lib/theme";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useClerk } from "@clerk/nextjs";
import { useT } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useCurrency } from "@/lib/currency";

const verticals = [
  {
    href: "/buses",
    label: "Buses",
    icon: Bus,
    activeClass: "text-saffron border-b-2 border-saffron",
    matches: (p: string) => p === "/buses" || p === "/search" || p.startsWith("/bus"),
  },
  {
    href: "/trains",
    label: "Trains",
    icon: Train,
    activeClass: "text-train border-b-2 border-train",
    matches: (p: string) => p === "/trains" || p.startsWith("/trains/"),
  },
  {
    href: "/flights",
    label: "Flights",
    icon: Plane,
    activeClass: "text-flight border-b-2 border-flight",
    matches: (p: string) => p === "/flights" || p.startsWith("/flights/"),
  },
  {
    href: "/hotels",
    label: "Hotels",
    icon: Building2,
    activeClass: "text-hotel border-b-2 border-hotel",
    matches: (p: string) => p === "/hotels" || p.startsWith("/hotels/"),
  },
];

const BOOKING_PATHS = ["/checkout", "/seats", "/booking", "/payment", "/search"];
const showCurrency = (p: string) => BOOKING_PATHS.some((s) => p.includes(s));

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { signOut } = useClerk();
  const [menuOpen, setMenuOpen] = useState(false);
  const t = useT();
  const { currency, toggle: toggleCurrency } = useCurrency();
  const { theme, toggle: toggleTheme } = useTheme();

  const handleLogout = async () => {
    await signOut();
    logout();
    router.push("/");
  };

  const isHome = pathname === "/" || pathname === "/buses" || pathname === "/trains" || pathname === "/flights" || pathname === "/hotels";

  return (
    <nav className={`top-0 z-50 ${isHome
      ? "fixed left-0 right-0 bg-bg-primary/40 backdrop-blur-md border-b border-white/10"
      : "sticky glass-strong border-b border-border"
    }`}>
      {/* Main row */}
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <svg width="34" height="34" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="34" height="34" rx="10" fill="url(#navLogoGrad)"/>
            {/* Departure dot */}
            <circle cx="10" cy="24" r="2.8" fill="white"/>
            {/* Arrival location pin */}
            <circle cx="24" cy="10" r="3.2" fill="white"/>
            <circle cx="24" cy="10" r="1.4" fill="url(#navLogoGrad)"/>
            {/* Journey path */}
            <path d="M10 24 C10 17 17 10 24 10" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.55"/>
            <defs>
              <linearGradient id="navLogoGrad" x1="0" y1="0" x2="34" y2="34" gradientUnits="userSpaceOnUse">
                <stop stopColor="#7C3AED"/>
                <stop offset="1" stopColor="#4338CA"/>
              </linearGradient>
            </defs>
          </svg>
          <span className="font-display text-xl font-bold tracking-tight">
            Indie<span className="text-purple">Yatra</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/planner"
            className={`hidden md:flex btn-ghost items-center gap-2 ${pathname === "/planner" ? "text-text-primary" : ""}`}
          >
            <Sparkles className="w-4 h-4 text-purple" />
            {t("nav.aiAssistant")}
          </Link>
          <Link
            href="/alerts"
            className={`hidden md:flex btn-ghost items-center gap-2 font-medium ${
              pathname === "/alerts" ? "text-saffron" : "text-saffron/80 hover:text-saffron"
            }`}
          >
            <TrendingDown className="w-4 h-4" />
            {t("nav.bestPrices")}
          </Link>
          <button onClick={toggleTheme} className="btn-icon" aria-label="Toggle theme">
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          <LanguageSwitcher />

          {showCurrency(pathname) && (
            <button
              onClick={toggleCurrency}
              className="hidden md:flex btn-icon items-center gap-1 px-2 hover:text-saffron transition-colors"
              title="Toggle currency"
            >
              <span className="text-xs font-semibold">{currency}</span>
              <span className="text-text-muted">{currency === "INR" ? "₹" : "$"}</span>
            </button>
          )}

          {user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-bg-elevated"
              >
                {user.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatar_url}
                    alt={user.full_name}
                    className="w-7 h-7 rounded-full"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-gradient-purple flex items-center justify-center text-xs font-bold">
                    {user.full_name?.charAt(0) || "U"}
                  </div>
                )}
                {user.is_premium && (
                  <Crown className="w-3.5 h-3.5 text-saffron" />
                )}
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-bg-elevated border border-border rounded-md shadow-card py-1">
                  <div className="px-3 py-2 border-b border-border">
                    <div className="text-sm font-medium">{user.full_name}</div>
                    <div className="text-xs text-text-muted truncate">
                      {user.email}
                    </div>
                  </div>
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 px-3 py-2 hover:bg-bg-hover text-sm"
                    onClick={() => setMenuOpen(false)}
                  >
                    <UserIcon className="w-4 h-4" /> {t("profile.title")}
                  </Link>
                  <Link
                    href="/trips"
                    className="flex items-center gap-2 px-3 py-2 hover:bg-bg-hover text-sm"
                    onClick={() => setMenuOpen(false)}
                  >
                    <Crown className="w-4 h-4" /> {t("trips.title")}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-bg-hover text-sm text-danger"
                  >
                    <LogOut className="w-4 h-4" /> {t("profile.logout")}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login" className="btn-primary text-sm">
              {t("nav.signIn")}
            </Link>
          )}
        </div>
      </div>

      {/* Vertical tab bar — hidden on landing page */}
      {pathname !== "/" && (
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-0 border-t border-white/5">
          {verticals.map(({ href, label, icon: Icon, activeClass, matches }) => {
            const isActive = matches(pathname);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-all ${
                  isActive ? activeClass : "text-text-secondary hover:text-text-primary"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}
