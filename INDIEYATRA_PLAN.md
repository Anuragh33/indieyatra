# IndieYatra — Build Plan
> IndieYatra is 75% done. This plan extends it into a 4-vertical travel super-app.
> Work through phases top to bottom. Check off tasks as they complete.

---

## Vertical Color System
| Vertical | Color    | Hex       | Usage |
|----------|----------|-----------|-------|
| Brand    | Purple   | #7C3AED   | IndieYatra navbar, rewards, global CTAs |
| Bus      | Saffron  | #FF6B1A   | Existing — keep as-is |
| Train    | Indigo   | #4F46E5   | Train tab, train cards, train badges |
| Flights  | Cyan     | #06B6D4   | Flight tab, flight cards, flight badges |
| Hotels   | Amber    | #F59E0B   | Hotel tab, hotel cards, hotel badges |

---

## Design System Tokens (new values for IndieYatra)
```
Background:    #080B1A   (was #0A0E1A)
Surface:       #0F1729   (was #111827)
Elevated:      #1A2347   (was #1A2235)
Border:        #2A3560   (was #1F2937)
Text Primary:  #FFFFFF
Text Secondary:#94A3B8
Text Muted:    #4B5563
```
Typography: Clash Display (headings) + DM Sans (body) — already loaded.

---

## Phase 0 — Foundation (do first, everything builds on this)
- [x] Rename product to IndieYatra in metadata, layout, manifest
- [x] Update Tailwind/CSS tokens to new background/surface/border values
- [x] Add Train / Flights / Hotels accent colors to tailwind.config.ts
- [x] Update Navbar: add vertical tab bar (Bus / Train / Flights / Hotels)
      - Pill/segmented control style below the logo row
      - Active tab uses vertical's accent color
      - Tab URLs: / (bus) · /trains · /flights · /hotels
- [x] Update MobileNav: add Train / Flights / Hotels icons to bottom bar
- [x] Home page hero: 4-vertical chooser (LandingHero cards route to each
      vertical's own search page — resolved via card grid, not in-place swap)
- [x] Update sidebar nav (if any) with new verticals

---

## Phase 1 — Trains Vertical 🚂
### Backend
- [ ] DB: create tables — trains, train_routes, train_schedules, train_classes, train_berths, train_bookings
- [ ] Seed: 20+ Indian trains (Rajdhani, Shatabdi, Vande Bharat, Duronto, Express)
- [ ] Seed: stations with codes (CSTM, NDLS, BCT, MAS, HWH, PUNE, SBC, BZA…)
- [ ] API: GET /api/trains/stations/autocomplete?q=
- [ ] API: GET /api/trains/search?from=&to=&date=&class=&quota=&travelers=
- [ ] API: GET /api/trains/:id  (with route stops + timing)
- [ ] API: GET /api/trains/:id/seats?class=&coach=
- [ ] API: GET /api/trains/pnr/:pnr
- [ ] API: POST /api/trains/bookings/create (auth required)

### Frontend
- [ ] /trains — Train search results page
      - TrainSearchWidget (From/To station, date, class selector, quota selector)
      - Sort: Best · Cheapest · Fastest · Earliest
      - Filter sidebar: departure time, train type, quota, class, duration
      - TrainCard: train number + name, type badge, dep→arr times, 
                   duration, stops, days-of-week indicators,
                   per-class availability + fare (1A/2A/3A/SL/CC/2S),
                   AVAILABLE/RAC/WL/REGRET status badges
      - Right sidebar: PNR checker widget, Tatkal countdown, price trend
- [ ] /trains/[id] — Train details page
      - Tabs: Details · Coach Layout · Stations · Reviews · Rules
      - Details tab: all intermediate stations + times + platform numbers
      - Coach Layout tab: interactive berth map (Lower/Middle/Upper/SL/SU)
        color coded: Available(indigo) / Selected / Booked / Ladies(pink)
        coach selector: S1 S2 … B1 B2 … A1 A2
      - Fare tab: base + reservation + superfast + GST + catering breakdown
      - Tatkal fare comparison
      - "Continue to Booking" CTA
- [ ] Extend /checkout for train passenger details:
      - Name, Age, Gender, Berth Preference per passenger
      - ID Proof: Aadhaar / PAN / Passport
      - Meal preference (Rajdhani/Shatabdi only)
      - Senior citizen / Student concession toggle
      - Travel insurance add-on ₹35/person
      - IRCTC booking fee shown in breakdown
- [ ] /pnr — PNR status checker page (public)
      - PNR input → show train name, route, date, 
        per-passenger status (CNF/RAC/WL#), chart prep status,
        coach + berth if confirmed

---

## Phase 2 — Flights Vertical ✈️
### Backend
- [ ] DB: airports, airlines, flights, flight_schedules, flight_seats, flight_bookings
- [ ] Seed: 10 Indian airports (BOM, DEL, MAA, CCU, BLR, HYD, COK, AMD, JAI, GOI)
- [ ] Seed: Indian airlines (IndiGo, Air India, SpiceJet, Vistara, AirAsia, Akasa)
- [ ] Seed: 50+ domestic route schedules
- [ ] API: GET /api/flights/airports/autocomplete?q=
- [ ] API: GET /api/flights/search?from=&to=&date=&return_date=&adults=&children=&cabin=
- [ ] API: GET /api/flights/:id
- [ ] API: GET /api/flights/:id/seats
- [ ] API: GET /api/flights/fare-calendar?from=&to=&month=
- [ ] API: POST /api/flights/bookings/create (auth required)

### Frontend
- [ ] /flights — Flight search results page
      - FlightSearchWidget (From/To airport, trip type, dates, travelers, cabin)
      - Sort tabs: Best · Cheapest · Fastest · Recommended
      - Filter sidebar: stops, airlines, departure/arrival time, duration, fare type
      - FlightCard: airline logo + name + flight number, aircraft type,
                    dep→arr times, duration + stops,
                    amenity icons (meal/wifi/usb), baggage allowance,
                    price per person, fare type badge (Saver/Flexi/Full Flexi),
                    "View Deal" CTA
      - Right sidebar: price trend chart, fare calendar (±3 days), 
                       deal confidence score, AI booking insight
- [ ] /flights/[id] — Flight details page
      - Tabs: Details · Seats · Baggage · Fare Rules · Reviews
      - Details: terminals, aircraft type, on-time %, meal info
      - Seats: interactive cabin map (3-3 narrow body / 2-4-2 wide body)
               Standard / Extra Legroom / Front row pricing
      - Fare Comparison: Saver vs Flexi vs Full Flexi table
                         (baggage, change fee, refund policy per tier)
      - "Continue to Booking" CTA
- [ ] Extend /checkout for flight passenger details:
      - Title, First/Last Name, DOB, Gender, Nationality
      - Passport / Aadhaar number, Frequent Flyer (optional)
      - Add-ons: extra baggage, meal preference, travel insurance, airport transfer
      - Fare breakdown: base + fuel surcharge + airline fee + GST(5%) + platform fee

---

## Phase 3 — Hotels Vertical 🏨
### Backend
- [ ] DB: hotels, hotel_rooms, hotel_inventory, hotel_bookings
- [ ] Seed: 20+ hotels across 5 Indian cities (Goa, Mumbai, Delhi, Bangalore, Jaipur)
- [ ] API: GET /api/hotels/destinations/autocomplete?q=
- [ ] API: GET /api/hotels/search?city=&checkin=&checkout=&rooms=&adults=&children=
- [ ] API: GET /api/hotels/:id
- [ ] API: GET /api/hotels/:id/rooms?checkin=&checkout=
- [ ] API: POST /api/hotels/bookings/create (auth required)

### Frontend
- [ ] /hotels — Hotel search results page
      - HotelSearchWidget (destination, date range picker, rooms/guests, property type)
      - Sort: Recommended · Price Low-High · Price High-Low · Stars · Rating
      - Filter sidebar: star rating, guest rating, price range slider,
                        property type, amenities checkboxes, locality,
                        free cancellation toggle, meal plan
      - HotelCard: image carousel (3 photos), hotel name + stars,
                   location + distance from beach/center/airport,
                   guest rating score + label + review count,
                   amenity icons, room type available,
                   cancellation policy badge (Free / Non-refundable),
                   price/night + taxes + total for stay,
                   "View Rooms" CTA + wishlist heart
      - Map view toggle: list left + hotel pins on map right
                         click pin → mini card preview
- [ ] /hotels/[id] — Hotel details page
      - Hero image carousel (5-8 photos, full width)
      - Tabs: Overview · Rooms · Amenities · Reviews · Policies
      - Overview: about, amenity icon grid, nearby attractions with distance
      - Rooms: RoomCard per type — photos, size/floor/view, occupancy,
               bed type, inclusions, cancellation policy, meal options,
               price/night + total, "Select Room" CTA
      - Reviews: score breakdown (Cleanliness/Location/Staff/Value/Facilities/Comfort)
                 individual reviews with avatar, country flag, stay type, rating
      - Policies: check-in/out times, cancellation detail, child/pet policy,
                  accepted IDs, payment methods
- [ ] Extend /checkout for hotel guest details:
      - Lead guest: name, email, phone
      - Special requests text field
      - Add-ons: airport transfer, breakfast, extra bed, insurance
      - Fare breakdown: room rate × nights + GST(12%/18%) + platform fee + add-ons

---

## Phase 4 — Cross-Vertical Features
- [ ] /trips — Unified My Trips dashboard
      - Tabs: All · Buses · Trains · Flights · Hotels
      - Trip cards with vertical icon + accent color
      - Status badges: Confirmed / Upcoming / Completed / Cancelled
      - Upcoming countdown ("Mumbai→Delhi in 3 days")
      - Download all tickets button
      - Share itinerary (WhatsApp / Email)
- [ ] /alerts — Unified Price Alerts
      - Create alerts for any vertical (bus/train/flight/hotel)
      - Vertical icon on each alert card
      - Price history sparkline per alert
      - Alert types: drop below ₹X / availability opens / Tatkal opens
- [ ] /planner — AI Trip Planner (extend existing)
      - Cross-vertical itinerary generation
      - "Plan 7-day Rajasthan for 2 under ₹50k" → 
        AI returns: flights + trains + buses + hotels per day
      - Day-by-day breakdown with all legs
      - Total cost breakdown: Flights + Trains + Buses + Hotels
      - "Book All" → adds everything to cart
      - "Book Individually" → opens each vertical
- [ ] /rewards — IndieYatra Rewards
      - Points balance + tier display (Explorer/Voyager/Elite/Legend)
      - Points per vertical: Bus 1pt/₹10, Train 1pt/₹8, Flight 1pt/₹5, Hotel 1pt/₹6
      - Transaction history
      - Redeem points on checkout
- [ ] Combo deals ("Flight + Hotel", "Train + Hotel", "Bus + Hotel")
      - "Bundle & Save" banner on search results
      - API: POST /api/combos/search
- [ ] IndieYatra Premium subscription screen
      - ₹799/year, list all perks
      - Upgrade CTA from profile/checkout

---

## Phase 5 — WhatsApp-First Delivery (all verticals)
- [ ] Bus tickets → WhatsApp immediately after booking ✓ (existing)
- [ ] Train e-tickets → WhatsApp + PDF
- [ ] PNR status updates → WhatsApp for trains
- [ ] Flight e-tickets → WhatsApp + Email
- [ ] Flight delay alerts → WhatsApp
- [ ] Hotel vouchers → WhatsApp + PDF
- [ ] Hotel check-in reminders (24h before) → WhatsApp

---

## Phase 6 — PWA + Mobile Polish
- [ ] Bottom nav: Home / Search / Trips / Alerts / Profile (already exists for buses)
      Update to show all 4 verticals in search
- [ ] App manifest: rename to IndieYatra
- [ ] Installable on Android home screen (already PWA capable)

---

## Current Status (audited 2026-06-06 against the actual codebase)
> The phase checkboxes above predate the build and were never updated. Verified
> against backend (`go build ./...` clean) and frontend (`tsc --noEmit` clean).
- Phase 0: DONE — IndieYatra rebrand, tokens, vertical tabs, navbar + mobile nav,
  hero vertical chooser all shipped.
- Phase 1 (Trains): BUILT — models, seed (trains + stations + class availability),
  search/schedule/PNR/booking APIs, /trains, /trains/[id] (with berth map),
  /trains/search, /trains/booking/[id], train checkout. WhatsApp e-ticket on book.
- Phase 2 (Flights): BUILT — models, seed, search/detail/booking APIs, /flights,
  /flights/[id] (with seat map + fare tabs), /flights/search, flight checkout.
  Fare calendar now wired (backend `fare_calendar` param, 2026-06-06).
- Phase 3 (Hotels): BUILT — models, seed, cities/search/detail/booking APIs,
  /hotels, /hotels/[id], /hotels/search, hotel checkout. WhatsApp voucher on book.
- Phase 4 (Cross-vertical): BUILT — /trips, /rewards, /alerts, /planner,
  /concierge, /optimize, /wishlist all present and API-wired. Premium page +
  /api/users/premium/subscribe added 2026-06-06. Combo deals (Flight/Train/Bus +
  Hotel bundles, POST /api/combos/search + ComboBanner "Bundle & Save" on
  flights search) added 2026-06-06.
- Phase 5 (WhatsApp delivery): DONE for all 4 verticals + worker alerts
  (SendWhatsApp wired in bus/train/flight/hotel booking handlers).
- Phase 6 (PWA): Partially done (PWA infra + manifest rename exist).

### Verified remaining gaps
- [ ] Granular sub-resource APIs (/flights/:id/seats, /trains/:id/seats,
      /hotels/:id/rooms) — seat/berth/room maps are currently rendered
      client-side from deterministic data, not a dedicated backend endpoint.
- [ ] Premium subscribe is recorded directly (no real payment capture step);
      wire to Razorpay if real billing is required.

## Notes
- Never rebuild the existing bus vertical — only extend/integrate it
- All verticals share: auth, Razorpay checkout UI, My Trips, Alerts, Rewards, AI Planner
- Only the passenger/guest details section of checkout changes per vertical
- The dark theme stays consistent — only small accent color badges change per vertical
- Backend is Go (Echo v4) + GORM + PostgreSQL (NeonDB) + Redis
