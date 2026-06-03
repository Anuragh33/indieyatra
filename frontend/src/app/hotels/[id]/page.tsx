"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import {
  Building2, Star, MapPin, Wifi, Waves, Mountain, Utensils, Coffee,
  Dumbbell, Car, Wine, ArrowLeft, Check, X, Bed, Users, ChevronDown, ChevronUp
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { MobileNav } from "@/components/MobileNav";
import { api } from "@/lib/api";

interface Hotel {
  id: string;
  name: string;
  city: string;
  state: string;
  address: string;
  star_rating: number;
  rating: number;
  total_reviews: number;
  description: string;
  image_url: string;
  images: string;
  amenities: string;
  tags: string;
  property_type: string;
  check_in_time: string;
  check_out_time: string;
  policies: string;
}

interface Room {
  id: string;
  room_type: string;
  bed_type: string;
  max_occupancy: number;
  size_sqft: number;
  price_per_night: number;
  original_price: number;
  tax_percent: number;
  total_rooms: number;
  available_rooms: number;
  amenities: string;
  breakfast_incl: boolean;
  free_cancellation: boolean;
  cancellation_hours: number;
  is_active: boolean;
}

const AMENITY_ICONS: Record<string, React.ReactNode> = {
  wifi: <Wifi className="w-4 h-4" />,
  pool: <Waves className="w-4 h-4" />,
  spa: <span className="text-xs font-medium">Spa</span>,
  gym: <Dumbbell className="w-4 h-4" />,
  restaurant: <Utensils className="w-4 h-4" />,
  parking: <Car className="w-4 h-4" />,
  ac: <span className="text-xs font-medium">AC</span>,
  bar: <Wine className="w-4 h-4" />,
  beach: <span className="text-xs font-medium">Beach</span>,
  mountain: <Mountain className="w-4 h-4" />,
};

const AMENITY_LABELS: Record<string, string> = {
  wifi: "Free Wi-Fi", pool: "Swimming Pool", spa: "Spa & Wellness", gym: "Fitness Centre",
  restaurant: "Restaurant", parking: "Parking", ac: "Air Conditioning", bar: "Bar & Lounge",
  beach: "Beach Access", mountain: "Mountain View",
};

function StarRow({ n, size = "sm" }: { n: number; size?: "sm" | "md" }) {
  const cls = size === "md" ? "w-4 h-4" : "w-3 h-3";
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`${cls} ${i < n ? "fill-hotel text-hotel" : "text-border"}`} />
      ))}
    </span>
  );
}

function RoomCard({ room, nights, checkIn, checkOut, guests, hotelId }: {
  room: Room; nights: number; checkIn: string; checkOut: string; guests: number; hotelId: string;
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const roomAmenities = room.amenities.split(",").filter(Boolean);
  const totalPrice = Math.round(room.price_per_night * nights);
  const originalTotal = Math.round(room.original_price * nights);
  const discountPct = Math.round(((room.original_price - room.price_per_night) / room.original_price) * 100);

  const goToCheckout = () => {
    const q = new URLSearchParams({
      room_id: room.id,
      check_in: checkIn,
      check_out: checkOut,
      guests: String(guests),
    });
    router.push(`/checkout/hotel/${hotelId}?${q}`);
  };

  return (
    <div className="card p-4 hover:border-hotel/40 transition-all">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <h3 className="font-semibold">{room.room_type}</h3>
              <div className="flex items-center gap-2 text-xs text-text-secondary mt-0.5">
                <span className="flex items-center gap-1"><Bed className="w-3 h-3" />{room.bed_type} bed</span>
                <span className="flex items-center gap-1"><Users className="w-3 h-3" />Up to {room.max_occupancy}</span>
                {room.size_sqft > 0 && <span>{room.size_sqft} sq ft</span>}
              </div>
            </div>
            <div className="text-right shrink-0">
              {discountPct > 0 && (
                <div className="text-[10px] text-text-muted line-through">₹{originalTotal.toLocaleString()}</div>
              )}
              <div className="text-xl font-bold text-hotel">₹{totalPrice.toLocaleString()}</div>
              <div className="text-[10px] text-text-muted">for {nights} night{nights !== 1 ? "s" : ""} + taxes</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-2">
            {room.breakfast_incl && (
              <span className="chip bg-success/10 text-success border-success/20 text-[10px] flex items-center gap-1">
                <Coffee className="w-2.5 h-2.5" /> Breakfast included
              </span>
            )}
            {room.free_cancellation && (
              <span className="chip bg-success/10 text-success border-success/20 text-[10px] flex items-center gap-1">
                <Check className="w-2.5 h-2.5" /> Free cancellation
              </span>
            )}
            {!room.free_cancellation && (
              <span className="chip bg-warning/10 text-warning border-warning/20 text-[10px] flex items-center gap-1">
                <X className="w-2.5 h-2.5" /> Non-refundable
              </span>
            )}
            <span className="chip border-border text-text-secondary text-[10px]">
              {room.available_rooms} left
            </span>
          </div>

          {expanded && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {roomAmenities.map(a => (
                <span key={a} className="chip border-border text-text-secondary text-[10px]">{a}</span>
              ))}
            </div>
          )}

          <button
            className="text-xs text-hotel flex items-center gap-1 mt-1"
            onClick={() => setExpanded(p => !p)}
          >
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {expanded ? "Less" : "Room details"}
          </button>
        </div>

        <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-2 md:w-36 shrink-0">
          <div className="hidden md:block text-xs text-text-muted text-right">
            ₹{Math.round(room.price_per_night).toLocaleString()} / night
            {discountPct > 0 && (
              <span className="ml-1 text-success font-semibold">{discountPct}% off</span>
            )}
          </div>
          <button
            onClick={goToCheckout}
            disabled={room.available_rooms === 0}
            className="text-white font-semibold px-5 py-2 rounded-md text-sm hover:opacity-90 active:scale-95 transition-all w-full text-center disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" }}
          >
            {room.available_rooms === 0 ? "Sold Out" : "Book Now"}
          </button>
        </div>
      </div>
    </div>
  );
}

function HotelDetailInner() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const params = useSearchParams();

  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

  const [checkIn, setCheckIn] = useState(params.get("check_in") || today);
  const [checkOut, setCheckOut] = useState(params.get("check_out") || tomorrow);
  const [guests, setGuests] = useState(parseInt(params.get("guests") || "2"));

  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "rooms" | "location">("rooms");

  const nights = Math.max(1, Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000));

  useEffect(() => {
    api<{ hotel: Hotel; rooms: Room[] }>(`/api/hotels/${id}`)
      .then(data => {
        setHotel(data.hotel);
        setRooms(data.rooms);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="max-w-7xl mx-auto px-6 py-12 pb-24 md:pb-12">
          <div className="h-64 bg-bg-elevated animate-pulse rounded-xl mb-6" />
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              {[1, 2].map(i => <div key={i} className="h-40 bg-bg-elevated animate-pulse rounded-xl" />)}
            </div>
            <div className="h-48 bg-bg-elevated animate-pulse rounded-xl" />
          </div>
        </main>
        <MobileNav />
      </>
    );
  }

  if (!hotel) {
    return (
      <>
        <Navbar />
        <main className="max-w-7xl mx-auto px-6 py-20 text-center pb-24">
          <Building2 className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <div className="font-semibold text-lg mb-2">Hotel not found</div>
          <button onClick={() => router.push("/hotels")} className="btn-primary">Back to Hotels</button>
        </main>
        <MobileNav />
      </>
    );
  }

  const amenityList = hotel.amenities.split(",").filter(Boolean);
  const minPrice = rooms.length > 0 ? Math.min(...rooms.map(r => r.price_per_night)) : 0;

  return (
    <>
      <Navbar />
      <main className="pb-28 md:pb-12">
        {/* Hero image */}
        <div className="relative h-72 md:h-96 overflow-hidden">
          <img src={hotel.image_url} alt={hotel.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <button
            onClick={() => router.back()}
            className="absolute top-4 left-4 w-9 h-9 rounded-full bg-black/50 backdrop-blur flex items-center justify-center hover:bg-black/70 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-white" />
          </button>
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <StarRow n={hotel.star_rating} size="md" />
            <h1 className="font-display text-3xl md:text-4xl font-bold text-white mt-1">{hotel.name}</h1>
            <div className="flex items-center gap-1 text-white/80 text-sm mt-1">
              <MapPin className="w-3.5 h-3.5" />{hotel.address}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-6">
          {/* Rating + quick stats */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-hotel">{hotel.rating}</div>
              <div>
                <StarRow n={Math.round(hotel.rating)} />
                <div className="text-xs text-text-muted">{hotel.total_reviews.toLocaleString()} reviews</div>
              </div>
            </div>
            <span className="chip bg-hotel/10 text-hotel border-hotel/20">{hotel.property_type}</span>
            {hotel.tags.split(",").filter(Boolean).map(t => (
              <span key={t} className="chip border-border text-text-secondary">{t}</span>
            ))}
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Main content */}
            <div className="md:col-span-2 space-y-6">
              {/* Tabs */}
              <div className="flex gap-1 border-b border-border">
                {(["rooms", "overview", "location"] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`px-4 py-2 text-sm font-medium capitalize border-b-2 -mb-px transition-colors ${
                      tab === t ? "border-hotel text-hotel" : "border-transparent text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {tab === "rooms" && (
                <div className="space-y-4">
                  {rooms.length === 0 ? (
                    <div className="card p-8 text-center text-text-muted">No rooms available for these dates.</div>
                  ) : (
                    rooms.map(room => (
                      <RoomCard
                        key={room.id}
                        room={room}
                        nights={nights}
                        checkIn={checkIn}
                        checkOut={checkOut}
                        guests={guests}
                        hotelId={hotel.id}
                      />
                    ))
                  )}
                </div>
              )}

              {tab === "overview" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="font-semibold mb-2">About this property</h2>
                    <p className="text-sm text-text-secondary leading-relaxed">{hotel.description}</p>
                  </div>

                  <div>
                    <h2 className="font-semibold mb-3">Amenities</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {amenityList.map(a => (
                        <div key={a} className="flex items-center gap-2 text-sm text-text-secondary">
                          <span className="text-hotel">{AMENITY_ICONS[a] ?? <Check className="w-4 h-4" />}</span>
                          {AMENITY_LABELS[a] ?? a}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h2 className="font-semibold mb-3">Hotel Policies</h2>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-text-muted text-xs uppercase tracking-wider mb-1">Check-in</div>
                        <div className="font-medium">{hotel.check_in_time}</div>
                      </div>
                      <div>
                        <div className="text-text-muted text-xs uppercase tracking-wider mb-1">Check-out</div>
                        <div className="font-medium">{hotel.check_out_time}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {tab === "location" && (
                <div>
                  <h2 className="font-semibold mb-2">Location</h2>
                  <p className="text-sm text-text-secondary mb-4">{hotel.address}</p>
                  <div className="rounded-xl overflow-hidden border border-border h-64 bg-bg-elevated flex items-center justify-center">
                    <div className="text-center text-text-muted">
                      <MapPin className="w-8 h-8 mx-auto mb-2" />
                      <div className="text-sm">{hotel.city}, {hotel.state}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar — date picker */}
            <div className="space-y-4">
              <div className="card p-4 sticky top-4">
                <div className="text-sm font-semibold mb-3">Change dates</div>
                <div className="space-y-2 mb-3">
                  <div>
                    <label className="text-xs text-text-muted block mb-1">Check-in</label>
                    <input
                      type="date" className="input text-sm w-full"
                      value={checkIn} min={today}
                      onChange={e => setCheckIn(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-text-muted block mb-1">Check-out</label>
                    <input
                      type="date" className="input text-sm w-full"
                      value={checkOut} min={checkIn}
                      onChange={e => setCheckOut(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-text-muted block mb-1">Guests</label>
                    <select
                      className="input text-sm w-full"
                      value={guests}
                      onChange={e => setGuests(parseInt(e.target.value))}
                    >
                      {[1, 2, 3, 4].map(n => (
                        <option key={n} value={n}>{n} {n === 1 ? "Guest" : "Guests"}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="border-t border-border pt-3">
                  <div className="text-xs text-text-muted mb-1">{nights} night{nights !== 1 ? "s" : ""} from</div>
                  <div className="text-2xl font-bold text-hotel">
                    ₹{Math.round(minPrice * nights).toLocaleString()}
                  </div>
                  <div className="text-xs text-text-muted">+taxes & fees</div>
                </div>
                <button
                  onClick={() => setTab("rooms")}
                  className="btn-primary w-full mt-3 text-center"
                  style={{ background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" }}
                >
                  View Available Rooms
                </button>
              </div>

              <div className="card p-4 text-sm space-y-2">
                <div className="font-semibold text-sm mb-2">Why book with IndieYatra?</div>
                {["Best price guarantee", "Instant confirmation", "24/7 customer support", "Free cancellation on select rooms"].map(p => (
                  <div key={p} className="flex items-center gap-2 text-text-secondary">
                    <Check className="w-3.5 h-3.5 text-hotel shrink-0" />{p}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
      <MobileNav />
    </>
  );
}

export default function HotelDetailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-text-muted text-sm">Loading hotel…</div>
      </div>
    }>
      <HotelDetailInner />
    </Suspense>
  );
}
