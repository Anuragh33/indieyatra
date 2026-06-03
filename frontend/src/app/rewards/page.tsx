"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { MobileNav } from "@/components/MobileNav";
import { apiGet } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useCurrency } from "@/lib/currency";
import {
  Crown, Star, Zap, Gift, Bus, Train, Plane, Building2,
  ChevronRight, Shield, TrendingUp,
} from "lucide-react";

type RewardsSummary = {
  points: number;
  tier: string;
  next_tier: string;
  next_tier_points: number;
  total_bookings: number;
  bus_bookings: number;
  train_bookings: number;
  flight_bookings: number;
  hotel_bookings: number;
};

const TIERS = [
  { name: "Bronze",   min: 0,    color: "#CD7F32", bg: "bg-amber-900/20",   border: "border-amber-700/30"  },
  { name: "Silver",   min: 500,  color: "#9CA3AF", bg: "bg-slate-500/20",   border: "border-slate-400/30"  },
  { name: "Gold",     min: 2000, color: "#F59E0B", bg: "bg-yellow-500/20",  border: "border-yellow-400/30" },
  { name: "Platinum", min: 5000, color: "#818CF8", bg: "bg-purple/20",      border: "border-purple/30"     },
];

const HOW_TO_EARN = [
  { icon: Bus,       label: "Bus booking",     pts: "50 pts",  desc: "per confirmed trip" },
  { icon: Train,     label: "Train booking",   pts: "80 pts",  desc: "per confirmed trip" },
  { icon: Plane,     label: "Flight booking",  pts: "150 pts", desc: "per confirmed trip" },
  { icon: Building2, label: "Hotel booking",   pts: "100 pts", desc: "per confirmed stay" },
  { icon: Star,      label: "Write a review",  pts: "25 pts",  desc: "per verified review" },
  { icon: Zap,       label: "Refer a friend",  pts: "200 pts", desc: "when they book" },
];

const REDEEM_OPTIONS = [
  { label: "₹50 off next bus booking",     pts: 250,  color: "text-saffron" },
  { label: "₹100 off next train ticket",   pts: 500,  color: "text-train"   },
  { label: "₹200 off next flight",         pts: 1000, color: "text-flight"  },
  { label: "₹150 off next hotel stay",     pts: 750,  color: "text-hotel"   },
  { label: "Free seat upgrade (train)",    pts: 2000, color: "text-purple"  },
  { label: "Priority check-in (flight)",   pts: 3000, color: "text-flight"  },
];

export default function RewardsPage() {
  const { user } = useAuth();
  const { format: fmt } = useCurrency();
  const [rewards, setRewards] = useState<RewardsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    apiGet<RewardsSummary>("/api/rewards/me")
      .then(r => { setRewards(r); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user]);

  const currentTier = TIERS.find(t => t.name === rewards?.tier) ?? TIERS[0];
  const progress = rewards?.next_tier_points
    ? Math.min(100, Math.round((rewards.points / rewards.next_tier_points) * 100))
    : 100;

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 pb-24 md:pb-12">
        {/* Header */}
        <div className="flex items-end justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-6 h-6 text-saffron" />
              <h1 className="font-display text-3xl md:text-4xl font-bold">Rewards</h1>
            </div>
            <p className="text-text-secondary text-sm">Earn points on every booking. Redeem for discounts and upgrades.</p>
          </div>
          <Link href="/trips" className="hidden md:flex btn-secondary items-center gap-2 text-sm">
            <TrendingUp className="w-4 h-4" /> My Trips
          </Link>
        </div>

        {!user ? (
          <div className="card p-10 text-center">
            <Crown className="w-10 h-10 text-saffron/40 mx-auto mb-3" />
            <h3 className="font-semibold text-lg mb-2">Sign in to view your rewards</h3>
            <p className="text-sm text-text-muted mb-4">Earn points on every trip you book.</p>
            <Link href="/login" className="btn-primary inline-flex">Sign In</Link>
          </div>
        ) : loading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => <div key={i} className="card h-28 skeleton" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
            <div className="space-y-6">
              {/* Points + tier card */}
              <div className={`card p-6 border-2 ${currentTier.border} ${currentTier.bg} relative overflow-hidden`}>
                <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-5 blur-3xl" style={{ background: currentTier.color }} />
                <div className="relative">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-text-muted mb-1">IndieYatra Rewards</div>
                      <div className="font-display text-5xl font-bold" style={{ color: currentTier.color }}>
                        {(rewards?.points ?? 0).toLocaleString()}
                      </div>
                      <div className="text-sm text-text-secondary mt-1">points available</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Tier</div>
                      <div className="font-display text-2xl font-bold" style={{ color: currentTier.color }}>
                        {currentTier.name}
                      </div>
                      <div className="flex items-center gap-1 mt-1 justify-end">
                        {[0,1,2,3].map(i => (
                          <Crown key={i} className={`w-3.5 h-3.5 ${i < TIERS.indexOf(currentTier) + 1 ? "" : "opacity-20"}`} style={{ color: currentTier.color }} />
                        ))}
                      </div>
                    </div>
                  </div>

                  {rewards?.next_tier && (
                    <div>
                      <div className="flex items-center justify-between text-xs text-text-muted mb-1.5">
                        <span>{currentTier.name}</span>
                        <span>{rewards.next_tier} ({rewards.next_tier_points.toLocaleString()} pts)</span>
                      </div>
                      <div className="h-2 bg-bg-elevated rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${progress}%`, background: currentTier.color }}
                        />
                      </div>
                      <div className="text-xs text-text-muted mt-1.5">
                        {Math.max(0, (rewards.next_tier_points - rewards.points)).toLocaleString()} pts to {rewards.next_tier}
                      </div>
                    </div>
                  )}
                  {!rewards?.next_tier && (
                    <div className="text-sm text-text-secondary flex items-center gap-2">
                      <Shield className="w-4 h-4" style={{ color: currentTier.color }} />
                      You&apos;ve reached the highest tier — Platinum
                    </div>
                  )}
                </div>
              </div>

              {/* Booking breakdown */}
              {rewards && (
                <div className="card p-5">
                  <h3 className="font-semibold mb-4">Bookings Breakdown</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { icon: Bus,       label: "Buses",   count: rewards.bus_bookings,    color: "text-saffron", bg: "bg-saffron/10" },
                      { icon: Train,     label: "Trains",  count: rewards.train_bookings,  color: "text-train",   bg: "bg-train/10"   },
                      { icon: Plane,     label: "Flights", count: rewards.flight_bookings, color: "text-flight",  bg: "bg-flight/10"  },
                      { icon: Building2, label: "Hotels",  count: rewards.hotel_bookings,  color: "text-hotel",   bg: "bg-hotel/10"   },
                    ].map(v => (
                      <div key={v.label} className={`rounded-xl p-4 ${v.bg}`}>
                        <v.icon className={`w-5 h-5 ${v.color} mb-2`} />
                        <div className={`font-display text-2xl font-bold ${v.color}`}>{v.count}</div>
                        <div className="text-xs text-text-muted">{v.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* How to earn */}
              <div className="card p-5">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-saffron" /> How to Earn Points
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {HOW_TO_EARN.map(e => (
                    <div key={e.label} className="flex items-center gap-3 p-3 bg-bg-elevated rounded-lg">
                      <e.icon className="w-4 h-4 text-text-muted shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">{e.label}</div>
                        <div className="text-xs text-text-muted">{e.desc}</div>
                      </div>
                      <span className="text-saffron font-semibold text-sm shrink-0">+{e.pts}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right sidebar — redeem options */}
            <aside className="space-y-4">
              <div className="card p-5">
                <h3 className="font-semibold mb-1 flex items-center gap-2">
                  <Gift className="w-4 h-4 text-purple" /> Redeem Points
                </h3>
                <p className="text-xs text-text-muted mb-4">
                  You have <span className="font-semibold text-saffron">{(rewards?.points ?? 0).toLocaleString()} pts</span>
                </p>
                <div className="space-y-2">
                  {REDEEM_OPTIONS.map(r => {
                    const canRedeem = (rewards?.points ?? 0) >= r.pts;
                    return (
                      <div key={r.label} className={`p-3 rounded-lg border transition-all ${canRedeem ? "border-border hover:border-saffron/40 cursor-pointer" : "border-border opacity-40"}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium">{r.label}</div>
                            <div className={`text-xs font-semibold mt-0.5 ${r.color}`}>{r.pts.toLocaleString()} pts</div>
                          </div>
                          <ChevronRight className={`w-4 h-4 shrink-0 ${canRedeem ? "text-text-secondary" : "text-text-muted"}`} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="card p-5 bg-gradient-to-br from-purple/10 via-bg-surface to-bg-surface border-purple/20">
                <Crown className="w-8 h-8 text-saffron mb-3" />
                <h3 className="font-display text-lg font-bold mb-1">IndieYatra Premium</h3>
                <p className="text-sm text-text-secondary mb-4">Upgrade to earn 2x points on every booking and unlock exclusive deals.</p>
                <ul className="space-y-1.5 text-sm text-text-secondary mb-4">
                  <li className="flex items-center gap-2"><span className="text-saffron">✓</span> 2x points on all bookings</li>
                  <li className="flex items-center gap-2"><span className="text-saffron">✓</span> Priority customer support</li>
                  <li className="flex items-center gap-2"><span className="text-saffron">✓</span> Free cancellation upgrades</li>
                </ul>
                <Link
                  href="/profile"
                  className="btn-primary w-full text-center block"
                  style={{ background: "linear-gradient(135deg, #FF6B1A 0%, #FF8A3D 100%)" }}
                >
                  Upgrade Now
                </Link>
              </div>
            </aside>
          </div>
        )}
      </main>
      <MobileNav />
    </>
  );
}
