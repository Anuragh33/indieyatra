"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Plane, Train, Bus, Building2, Sparkles, ArrowRight, Star } from "lucide-react";
import { apiPost } from "@/lib/api";

interface ComboTransport {
  vertical: string; operator: string; from: string; to: string;
  duration_min: number; fare_per_head: number;
}
interface ComboHotel {
  hotel_id: string; name: string; city: string; star_rating: number;
  rating: number; image_url: string; price_per_night: number;
}
interface ComboDeal {
  tag: string; transport: ComboTransport; hotel: ComboHotel;
  travelers: number; nights: number;
  transport_cost: number; hotel_cost: number; bundle_saving: number; total_cost: number;
}
interface ComboResponse { deals: ComboDeal[]; from: string; to: string; }

const VERT_ICON: Record<string, typeof Plane> = {
  flight: Plane, train: Train, bus: Bus,
};

const rupee = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

export function ComboBanner({
  from, to, date, travelers = 1, nights = 2,
}: { from: string; to: string; date: string; travelers?: number; nights?: number }) {
  const [deals, setDeals] = useState<ComboDeal[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!from || !to || !date) return;
    setLoading(true);
    apiPost<ComboResponse>("/api/combos/search", { from, to, date, travelers, nights })
      .then((r) => setDeals(r?.deals ?? []))
      .catch(() => setDeals([]))
      .finally(() => setLoading(false));
  }, [from, to, date, travelers, nights]);

  if (loading || deals.length === 0) return null;

  return (
    <div className="card p-4 mb-4 border-purple/30 bg-gradient-to-br from-purple/10 via-bg-surface to-bg-surface">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-purple" />
        <span className="font-display font-bold text-sm">Bundle &amp; Save</span>
        <span className="text-xs text-text-muted">
          Add a {deals[0].hotel.city} stay and save 10% on the hotel
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {deals.slice(0, 3).map((d) => {
          const Icon = VERT_ICON[d.transport.vertical] ?? Plane;
          return (
            <div key={d.tag} className="rounded-xl border border-white/10 bg-bg-elevated/60 p-3 flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4 text-purple shrink-0" />
                <span className="text-xs font-semibold">{d.tag}</span>
                <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal/15 text-teal border border-teal/25">
                  Save {rupee(d.bundle_saving)}
                </span>
              </div>

              <div className="flex items-center gap-2 mb-2">
                {d.hotel.image_url && (
                  <img src={d.hotel.image_url} alt={d.hotel.name}
                    className="w-12 h-12 rounded-lg object-cover shrink-0" />
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-1 text-xs">
                    <Building2 className="w-3 h-3 text-hotel shrink-0" />
                    <span className="truncate font-medium">{d.hotel.name}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-text-muted">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    {d.hotel.rating.toFixed(1)} · {d.nights} night{d.nights > 1 ? "s" : ""}
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-text-muted space-y-0.5 mb-2">
                <div className="flex justify-between">
                  <span>{d.transport.operator || d.transport.vertical} × {d.travelers}</span>
                  <span>{rupee(d.transport_cost)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Hotel × {d.nights}</span>
                  <span>{rupee(d.hotel_cost)}</span>
                </div>
              </div>

              <div className="mt-auto flex items-center justify-between pt-2 border-t border-white/10">
                <div>
                  <div className="text-[10px] text-text-muted uppercase">Bundle total</div>
                  <div className="font-display font-bold text-base text-purple">{rupee(d.total_cost)}</div>
                </div>
                <Link href={`/hotels/${d.hotel.hotel_id}`}
                  className="flex items-center gap-1 text-xs font-semibold text-purple hover:gap-2 transition-all">
                  View <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
