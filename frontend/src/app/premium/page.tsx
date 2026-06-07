"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Crown, Check, Loader2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { MobileNav } from "@/components/MobileNav";
import { PremiumSection } from "@/components/landing/PremiumSection";
import { apiPost } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function PremiumPage() {
  const router = useRouter();
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isPremium = user?.is_premium === true;

  async function subscribe() {
    if (!user) {
      router.push("/login?next=/premium");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await apiPost("/api/users/premium/subscribe", {});
      setUser({ ...user, is_premium: true });
    } catch {
      setError("Could not activate Premium. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Navbar />
      <main className="pb-24 md:pb-12">
        <PremiumSection />

        <section className="max-w-xl mx-auto px-4 md:px-6 pb-16 text-center">
          {isPremium ? (
            <div className="card p-8">
              <Crown className="w-10 h-10 text-hotel mx-auto mb-3" />
              <h2 className="font-display text-2xl font-bold mb-2">You&apos;re on Premium</h2>
              <p className="text-text-secondary mb-6">
                Enjoy free cancellations, zero convenience fees, and full AI Concierge access.
              </p>
              <Link href="/trips" className="btn-primary inline-flex items-center gap-2">
                Go to My Trips
              </Link>
            </div>
          ) : (
            <div className="card p-8">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Check className="w-5 h-5 text-teal" />
                <span className="text-sm text-text-secondary">7-day free trial · cancel anytime</span>
              </div>
              <h2 className="font-display text-2xl font-bold mb-4">Start your Premium membership</h2>
              <button
                onClick={subscribe}
                disabled={loading}
                className="btn-primary inline-flex items-center gap-2 text-base px-8 py-3 disabled:opacity-60"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Activating…</>
                ) : (
                  <><Crown className="w-4 h-4" /> Get Premium — ₹799/year</>
                )}
              </button>
              {error && <p className="text-sm text-red-400 mt-3">{error}</p>}
              {!user && (
                <p className="text-xs text-text-muted mt-3">
                  You&apos;ll be asked to sign in first.
                </p>
              )}
            </div>
          )}
        </section>
      </main>
      <MobileNav />
    </>
  );
}
