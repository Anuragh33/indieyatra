export type City = {
  id: string;
  name: string;
  state: string;
  code: string;
  image_url?: string;
  bus_stands?: string;
  popularity?: number;
};

export type Route = {
  id: string;
  from_city_id: string;
  to_city_id: string;
  from_city?: City;
  to_city?: City;
  distance_km?: number;
  avg_duration_min?: number;
};

export type Bus = {
  id: string;
  bus_type: string;
  layout: string;
  total_seats: number;
  is_ac: boolean;
  is_sleeper: boolean;
  amenities: string;
  rating: number;
  total_reviews: number;
  operator?: Operator;
};

export type Operator = {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  rating: number;
  total_reviews: number;
  is_government?: boolean;
  is_electric?: boolean;
};

export type Schedule = {
  id: string;
  route_id: string;
  bus_id: string;
  operator_id: string;
  departure_at: string;
  arrival_at: string;
  duration_min: number;
  stops: number;
  base_fare: number;
  currency: string;
  seats_total: number;
  seats_available: number;
  route?: Route;
  bus?: Bus;
  operator?: Operator;
};

export type Seat = {
  id: string;
  schedule_id: string;
  seat_number: string;
  berth_type: string;
  seat_class: string;
  status: "available" | "booked" | "locked" | "ladies";
  price: number;
};

export type Booking = {
  id: string;
  booking_ref: string;
  status: string;
  total_amount: number;
  base_amount: number;
  tax_amount: number;
  currency: string;
  schedule_id: string;
  schedule?: Schedule;
  contact_email?: string;
  contact_phone?: string;
  created_at: string;
  passengers?: Passenger[];
};

export type Passenger = {
  id: string;
  full_name: string;
  age: number;
  gender: string;
  id_type: string;
  id_number: string;
  seat_number?: string;
};

export type PriceAlert = {
  id: string;
  from_city_id: string;
  to_city_id: string;
  from_city?: City;
  to_city?: City;
  date_from: string;
  date_to: string;
  price_threshold: number;
  current_price?: number;
  is_active: boolean;
};

export type Wishlist = {
  id: string;
  city_id: string;
  city?: City;
  notes?: string;
  target_price?: number;
};
