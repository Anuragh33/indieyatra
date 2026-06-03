<div align="center">

<br/>

<img src="frontend/public/icon-512.svg" width="96" height="96" alt="IndieYatra Logo" />

<br/>
<br/>

# IndieYatra

### India's Premium Travel Super-App

*Book buses. Chase trains. Catch flights. Find the perfect stay.*
*All of India. One app.*

<br/>

[![Next.js](https://img.shields.io/badge/Next.js_14-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![Go](https://img.shields.io/badge/Go_1.24-00ADD8?style=for-the-badge&logo=go&logoColor=white)](https://go.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://postgresql.org)
[![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com)

<br/>

**[🌐 Live Demo](https://indiebus.vercel.app)** &nbsp;·&nbsp; **[🐛 Report a Bug](https://github.com/Anuragh33/indieyatra/issues)** &nbsp;·&nbsp; **[✨ Request a Feature](https://github.com/Anuragh33/indieyatra/issues)**

<br/>

---

</div>

## What is IndieYatra?

IndieYatra is a full-stack travel booking platform built for India — a country where 1.4 billion people navigate a patchwork of buses, railways, airlines, and hotels daily. We unified it all.

From a rickety state bus between two forgotten towns to a last-minute flight from Mumbai to Goa, IndieYatra handles it. Real-time. Multi-lingual. Mobile-first.

> Built from scratch. No shortcuts. No third-party booking wrappers. Just raw engineering.

<br/>

## Features

### Core Verticals

| | Vertical | Highlights |
|---|---|---|
| 🚌 | **Buses** | 500+ operators · Live GPS tracking · AC/Sleeper/Volvo · Voice search · Tatkal-style booking |
| 🚆 | **Trains** | 20,000+ trains · IRCTC-style availability · PNR tracking · Tatkal & General quotas · All 7 classes |
| ✈️ | **Flights** | All Indian airlines · Real-time fares · Seat selection · Live delay alerts · 28 airports |
| 🏨 | **Hotels** | 500+ cities · Budget to palace · Verified reviews · Free cancellation · Instant confirmation |

### Platform Features

- **AI Trip Planner** — Natural-language itinerary builder powered by Claude. "Plan a 5-day Rajasthan trip under ₹20,000" just works.
- **Live GPS Tracking** — WebSocket-driven real-time bus position on a live map. Know exactly where your bus is before you leave home.
- **Price Intelligence** — Historical fare charts, best-day-to-book alerts, and fare-drop notifications via the Alerts system.
- **Smart Search** — Voice-activated search, fuzzy city autocomplete, and a price calendar that shows cheapest dates at a glance.
- **Concierge Mode** — Premium users get a dedicated assistant for complex multi-leg trips, hotel upgrades, and last-minute rescues.
- **Trip Optimizer** — Enter multiple destinations and a budget; the optimizer finds the cheapest combination of transport + stay.
- **PNR Tracker** — Paste any Indian Railways PNR and get live status, coach position, and delay predictions.
- **Rewards & Premium** — Loyalty points, premium discounts up to 25%, free room upgrades, and late checkout guarantees.
- **8 Languages** — Full UI localisation in English, हिन्दी, मराठी, தமிழ், ಕನ್ನಡ, తెలుగు, বাংলা, and ગુજરાતી. Switching is instant, persistent, and covers every string.
- **Multi-currency** — Toggle between INR and USD globally.
- **Dark / Light theme** — System-aware, persisted, and beautiful in both.

<br/>

## Architecture

```
indiebus/
├── frontend/                   # Next.js 14 App Router
│   ├── src/
│   │   ├── app/                # 25+ routes
│   │   │   ├── buses/          # Bus booking & search
│   │   │   ├── trains/         # Train booking & PNR
│   │   │   ├── flights/        # Flight search & booking
│   │   │   ├── hotels/         # Hotel discovery & booking
│   │   │   ├── checkout/       # Unified checkout flows
│   │   │   ├── planner/        # AI trip planner
│   │   │   ├── concierge/      # Premium concierge
│   │   │   ├── optimize/       # Trip optimizer
│   │   │   ├── tracking/       # Live GPS tracking
│   │   │   ├── bookings/       # Booking management
│   │   │   ├── trips/          # Trip history
│   │   │   ├── alerts/         # Price alert dashboard
│   │   │   ├── rewards/        # Loyalty program
│   │   │   ├── pnr/            # PNR status checker
│   │   │   └── profile/        # User profile & settings
│   │   ├── components/         # Shared UI components
│   │   ├── lib/
│   │   │   ├── i18n/           # 8-language translation system
│   │   │   ├── auth.ts         # Clerk auth integration
│   │   │   ├── currency.ts     # INR/USD toggle
│   │   │   └── theme.ts        # Dark/light theme
│   │   └── hooks/              # useVoiceSearch, etc.
│   └── messages/               # next-intl server-side locale files
│
└── backend/                    # Go + Echo REST API
    ├── cmd/server/             # Entry point
    └── internal/
        ├── api/                # Route handlers
        ├── models/             # GORM models
        ├── services/           # Business logic
        ├── seed/               # Rich seed data (30 cities, 57 stations, 28 airports, 45+ hotels)
        ├── workers/            # Background jobs (price tracking, alerts)
        ├── websocket/          # Live GPS hub
        └── auth/               # Clerk JWT middleware
```

### System Design

```
                    ┌─────────────────────────────────────────┐
                    │              Vercel Edge                 │
                    │        (CDN + Serverless Functions)      │
                    └──────────────────┬──────────────────────┘
                                       │
                    ┌──────────────────▼──────────────────────┐
                    │           Next.js 14 Frontend            │
                    │   App Router · Clerk Auth · Zustand      │
                    │   Tailwind · Framer Motion · Recharts    │
                    └──────────────────┬──────────────────────┘
                                       │ REST + WebSocket
                    ┌──────────────────▼──────────────────────┐
                    │            Go Echo API Server            │
                    │   JWT Middleware · GORM ORM · Workers    │
                    └──────────┬──────────────────┬───────────┘
                               │                  │
              ┌────────────────▼───┐    ┌─────────▼──────────┐
              │    PostgreSQL      │    │       Redis         │
              │  (Primary Store)   │    │  (Cache · Sessions  │
              │  GORM migrations   │    │   · Price Alerts)   │
              └────────────────────┘    └────────────────────┘
```

<br/>

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| [Next.js](https://nextjs.org) | 14.2 | React framework, App Router, SSR/SSG |
| [TypeScript](https://typescriptlang.org) | 5.x | Type safety across the entire codebase |
| [Tailwind CSS](https://tailwindcss.com) | 3.x | Utility-first styling with custom design tokens |
| [Clerk](https://clerk.com) | 7.x | Authentication — signup, signin, session management |
| [Zustand](https://zustand-demo.pmnd.rs) | 5.x | Global state (auth, i18n, theme, currency) |
| [Framer Motion](https://framer.com/motion) | 11.x | Animations and page transitions |
| [Recharts](https://recharts.org) | 2.x | Price trend charts and data visualisation |
| [Radix UI](https://radix-ui.com) | 2.x | Accessible headless UI primitives |
| [next-intl](https://next-intl-docs.vercel.app) | 4.x | Server-side internationalisation |
| [Lucide React](https://lucide.dev) | 0.46 | Icon library |
| [SWR](https://swr.vercel.app) | 2.x | Data fetching with stale-while-revalidate |
| [date-fns](https://date-fns.org) | 4.x | Date manipulation |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| [Go](https://go.dev) | 1.24 | High-performance API server |
| [Echo](https://echo.labstack.com) | 4.x | HTTP framework with middleware |
| [GORM](https://gorm.io) | 1.25 | ORM with PostgreSQL driver |
| [PostgreSQL](https://postgresql.org) | 15+ | Primary relational database |
| [Redis](https://redis.io) | 7+ | Caching, sessions, price-alert queues |
| [Gorilla WebSocket](https://github.com/gorilla/websocket) | 1.5 | Live GPS tracking hub |
| [Clerk SDK Go](https://clerk.com/docs/references/go) | 2.x | JWT verification middleware |
| [Razorpay Go](https://razorpay.com/docs/payments/server-integration/go) | 1.4 | Payment gateway integration |
| [godotenv](https://github.com/joho/godotenv) | 1.5 | Environment variable loading |

<br/>

## Getting Started

### Prerequisites

- Node.js 20+
- Go 1.24+
- PostgreSQL 15+
- Redis 7+

### 1. Clone the repository

```bash
git clone https://github.com/Anuragh33/indieyatra.git
cd indieyatra
```

### 2. Configure the backend

```bash
cd backend
cp .env.example .env
```

Edit `.env` and fill in your values:

```env
DATABASE_URL=postgres://user:password@localhost:5432/indiebus
REDIS_URL=redis://localhost:6379
CLERK_SECRET_KEY=sk_test_...
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
PORT=8080
```

### 3. Run database migrations and seed data

```bash
cd backend
go run ./cmd/server --migrate --seed
```

This seeds **30 cities**, **57 train stations**, **28 airports**, **18 bus operators**, **45+ hotels**, and hundreds of routes across India.

### 4. Start the backend

```bash
go run ./cmd/server
# API running at http://localhost:8080
```

### 5. Configure the frontend

```bash
cd frontend
cp .env.local.example .env.local   # or create manually
```

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_WS_URL=ws://localhost:8080/ws
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/register
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
```

### 6. Start the frontend

```bash
cd frontend
npm install
npm run dev
# App running at http://localhost:3000
```

### One-command start (both services)

```bash
# From repo root
./start.sh
```

<br/>

## Seed Data Coverage

The backend ships with production-grade seed data covering every major travel corridor in India:

| Category | Count | Coverage |
|---|---|---|
| Cities | 30 | Metro + Tier-2 (Delhi, Mumbai, Bengaluru, Hyderabad, Jaipur, Goa, Varanasi, Rishikesh...) |
| Bus Operators | 18 | KSRTC, UPSRTC, GSRTC, TNSTC, VRL, Orange Tours, Kallada, Sharma Transports, Paulo Travels... |
| Bus Routes | 51 | Metro ↔ Metro, Metro → Tier-2, Tier-2 ↔ Tier-2 |
| Train Stations | 57 | All major zones: NR, WR, SR, SCR, ER, ECoR, NER |
| Trains | 35+ | Vande Bharat, Rajdhani, Shatabdi, Duronto, Superfast, Express |
| Airports | 28 | DEL, BOM, BLR, HYD, MAA, CCU + 18 tier-2 (NAG, PNQ, UDR, IXL, SXR, GAU...) |
| Hotels | 45+ | 5-star luxury to budget hostels across 15 destination cities |
| Flight Routes | 100+ | Every major domestic corridor with multiple airline options |

<br/>

## Internationalisation

IndieYatra supports **8 languages** with a custom dual-layer i18n system:

- **Client-side** (`useT()` hook backed by Zustand + `persist`) — instant switching, zero flash, persisted across sessions
- **Server-side** (next-intl + cookie sync) — SEO-friendly locale resolution for server components

```
English    हिन्दी (Hindi)    মराठी (Marathi)    தமிழ் (Tamil)
ಕನ್ನಡ (Kannada)    తెలుగు (Telugu)    বাংলা (Bengali)    ગુજરાતી (Gujarati)
```

Every language covers 100% of UI strings with graceful English fallback for any missing key.

<br/>

## API Overview

The Go backend exposes a RESTful API at `/api/*`:

```
GET  /api/destinations/top          Top cities by popularity
GET  /api/routes/popular            Popular bus routes
GET  /api/search/suggestions        City autocomplete
GET  /api/buses/search              Search buses between cities
GET  /api/trains/stations/autocomplete  Station autocomplete
GET  /api/trains/search             Search trains between stations
GET  /api/flights/airports/autocomplete Airport autocomplete
GET  /api/flights/search            Search flights
GET  /api/hotels/search             Search hotels by city & dates
GET  /api/price-history             Historical price data for charts
GET  /api/pnr/:pnr                  PNR status lookup
POST /api/bookings                  Create booking
GET  /api/bookings                  List user bookings
WS   /ws                            Live GPS tracking WebSocket hub
```

All endpoints require a valid Clerk JWT except public search endpoints.

<br/>

## Deployment

The app is deployed as a **Vercel monorepo** with both services configured in `vercel.json`:

```json
{
  "experimentalServices": {
    "frontend": { "entrypoint": "frontend", "routePrefix": "/", "framework": "nextjs" },
    "backend":  { "entrypoint": "backend",  "routePrefix": "/_/backend" }
  }
}
```

**Production**: [https://indiebus.vercel.app](https://indiebus.vercel.app)

Every push to `main` triggers an automatic production deployment.

<br/>

## Project Structure Decisions

**Why Go for the backend?**
Concurrency is free. The live GPS WebSocket hub handles hundreds of simultaneous bus connections without breaking a sweat. Go's goroutine model is a natural fit for real-time transport data.

**Why Next.js App Router with client-side i18n?**
Server components handle SEO and initial load. The `useT()` Zustand store handles instantaneous language switching on the client without re-fetching anything. Best of both worlds.

**Why a custom i18n layer instead of just next-intl?**
next-intl is great for server components but switching languages at runtime without a page reload requires client-side state. The dual-layer approach — Zustand on the client, next-intl cookies synced to the server — means language preference persists properly across SSR and client navigation.

**Why seed data instead of live APIs?**
IRCTC, OYO, and airline APIs cost money and require partnerships. The seed data is comprehensive enough for a fully functional demo and can be swapped for live APIs by changing the service layer — the models are already shaped correctly.

<br/>

## Roadmap

- [ ] Razorpay payment flow (wired up, needs merchant account)
- [ ] Google Maps integration for live bus tracking map
- [ ] Claude AI concierge (NLP trip planning endpoint)
- [ ] Bus seat map selection (visual seat picker)
- [ ] Progressive Web App (offline support, push notifications)
- [ ] iOS / Android native app (React Native)
- [ ] IRCTC API integration (production train booking)
- [ ] Hotel partner API (Agoda / MakeMyTrip wholesale)

<br/>

## Contributing

Pull requests are welcome. For major changes, open an issue first to discuss what you'd like to change.

```bash
# Fork → Clone → Branch → Code → Test → PR
git checkout -b feature/your-amazing-feature
git commit -m "Add your amazing feature"
git push origin feature/your-amazing-feature
# Open a Pull Request
```

<br/>

## License

MIT — do whatever you want with it. Build something great for India.

<br/>

---

<div align="center">

Built with obsession by **[Anuragh](https://github.com/Anuragh33)**

*If this project helped you, consider giving it a ⭐*

</div>
