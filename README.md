# ❄️ Snowball Portfolio Tracker

A modern, beautiful web app for stock portfolio tracking, CSV portfolio import, and dividend management — inspired by [Snowball (Xueqiu)](https://xueqiu.com).

**Unique twist:** Built-in **Snowball Growth Visualizer** that shows the power of dividend reinvestment and compound growth over time.

## ✨ Features

- 📊 **Personalized Dashboard** — Greeting, live index ticker, portfolio value, day change, gains, estimated income, allocation donut, and portfolio history chart
- 📥 **CSV Broker Import** — Link multiple brokerage accounts and import positions with per-broker layouts (Schwab, Interactive Brokers, Robinhood, tastytrade, Trading 212, generic); duplicates are merged with weighted-average cost basis
- 🔌 **Trading 212 API Sync** — Pull your real open positions straight from your Trading 212 account with a single click (live or demo env); your API key never leaves the server
- 🌐 **Generic JSON API Import** — Pull positions from any JSON endpoint (or paste JSON directly) with flexible field mapping; CORS is handled server-side
- 📈 **Live Prices** — Real-time/delayed quotes for your holdings via Yahoo Finance (cached server-side)
- 🔍 **Markets & Stock Screener** — Search any ticker, live quotes, star favorites
- 📰 **Stock News** — Headlines for your holdings and any ticker's detail page
- 📈 **Stock Detail Pages** — Interactive price chart (1D–5Y), 52-week range, volume, add-position
- 🔔 **Price Alerts** — Set "above"/"below" alerts per symbol and see which ones have triggered
- 🏆 **Snowball Score** — A composite score summarizing your portfolio's gain, size, income, and momentum
- 👤 **Personalization** — Profile name, avatar, base currency, dark/light theme, accent color, refresh rate, yield assumption
- 💬 **Community Chat** — realtime public chat with categories (General/Bullish/Bearish/Dividends/Q&A), anonymous names, server-side spam guard, powered by Supabase
- 🎧 **Spotify Mini Player** — log in with your own Spotify account and play/pause music right from the dashboard
- 💰 **Dividend Tracker & Calendar** — Manual events, upcoming payouts, income estimate, calendar view, annual income progress
- ❄️ **Snowball Visualizer** — Interactive compound growth simulator with dividend reinvestment
- 📤 **Data Export** — One-click export of your full portfolio backup (JSON) or holdings/dividends (CSV)
- ☁️ **Optional Cloud Sync** — Sign in from the header or Settings to sync your portfolio across devices. The app stays fully usable without an account (localStorage only)
- 📱 Responsive design (mobile-friendly, bottom nav on mobile)

> Data is stored in your browser's localStorage — no backend required. Prices are delayed, provided for informational purposes only.

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router) + TypeScript
- **Styling**: Tailwind CSS (light/dark themes + accents)
- **Charts**: Recharts
- **State**: Zustand + localStorage (no backend required for MVP)
- **Market data**: Yahoo Finance via a cached server route (`/api/yahoo`)
- **Realtime**: Supabase (auth, cloud sync, community chat)
- **CSV**: PapaParse

## 🚀 Getting Started

```bash
# Clone the repo
git clone https://github.com/mariopietri2-maker/snowball-portfolio-tracker.git
cd snowball-portfolio-tracker

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The app works immediately with no configuration — add your first holding on the dashboard, or hit **Load sample portfolio** on the Brokers page.

**Scripts**

```bash
npm run dev            # start the dev server
npm run build          # production build
npm run start          # run the production build
npm run lint           # ESLint
npm run typecheck      # TypeScript type check
npm run test           # run unit tests once
npm run test:watch     # run unit tests in watch mode
```

**CI:** a GitHub Actions workflow (`.github/workflows/ci.yml`) runs lint, typecheck, unit tests, and a production build on every push/PR.

### Optional configuration

Copy `.env.example` to `.env.local` and fill in only what you need:

**Accounts & cloud sync (Supabase):**
1. Run `supabase/schema.sql` in the Supabase SQL Editor (creates tables + Row-Level Security, incl. the realtime `chat_messages` table and price `alerts`).
2. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local` (or as Vercel env vars).
3. In Supabase → Authentication: add your site URL to "Redirect URLs" and (for dev) disable "Confirm email".

The app runs fine without Supabase (localStorage only); auth enables per-user cloud sync.

**Spotify mini player (dashboard):**
1. Create an app at [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard) → Edit settings → add Redirect URI: `http://localhost:3000/api/spotify/callback` (add your production URL too).
2. Set `NEXT_PUBLIC_SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` in `.env.local` (the secret is server-side only — do not expose it).
3. The player uses your personal Spotify account. Spotify policy requires a manual tap to start playback (no autoplay).

**Trading 212 API sync (Brokers page):**
1. In the Trading 212 app go to **Settings → API (Beta)** and generate an API key (you'll get a key *and* a secret).
2. Set `T212_API_KEY` and `T212_API_SECRET` in `.env.local` (or Vercel env vars), then restart the dev server / redeploy.
3. Optional: `T212_ENV=demo` to sync your paper-trading account instead of live.

## 📁 Project Structure

```
app/
  ├── page.tsx                  # Personalized dashboard
  ├── portfolio/                # Merged holdings + quick add
  ├── brokers/                  # Broker accounts + CSV import + Trading 212 sync + JSON API import
  ├── stocks/                   # Markets screener + [symbol] detail (charts/news)
  ├── watchlist/                # Followed tickers
  ├── dividends/                # Dividend tracker + calendar
  ├── snowball/                 # Growth visualizer
  ├── chat/                     # Realtime community chat
  ├── settings/                 # Profile, theme, currency, exports, sign out
  ├── api/
  │   ├── yahoo/                # Cached Yahoo Finance proxy (quotes/charts/search/news)
  │   ├── t212/                 # Trading 212 API proxy (positions/summary/dividends)
  │   ├── proxy/                # Generic JSON fetch proxy (CORS-safe, SSRF-guarded)
  │   └── spotify/              # Spotify auth + playback proxy
  └── layout.tsx
components/
  ├── ui.tsx                    # Card, Button, Badge, Spinner, EmptyState
  ├── AuthProvider.tsx          # Supabase auth session provider
  ├── ThemeProvider.tsx
  ├── SiteHeader.tsx            # Desktop nav + mobile bottom nav
  ├── IndicesTicker.tsx         # Live index marquee
  ├── StockPriceChart.tsx
  ├── AllocationChart.tsx
  ├── PortfolioHistoryChart.tsx
  ├── NewsFeed.tsx
  ├── StockSearch.tsx
  ├── WatchlistGrid.tsx
  ├── DividendCalendar.tsx
  ├── HoldingsTable.tsx
  ├── DashboardStocks.tsx
  ├── SnowballScore.tsx
  ├── PriceAlertBar.tsx
  ├── JsonImportCard.tsx       # Generic JSON API import (URL fetch or paste)
  ├── ChatPage.tsx / CommunityPreview.tsx
  ├── SpotifyPlayer.tsx
  └── StatCard.tsx
hooks/
  └── useLiveQuotes.ts          # Polling quotes hook (dedupes + prunes stale symbols)
lib/
  ├── store.ts                  # Zustand store (accounts, dividends, watchlist, prefs, alerts)
  ├── finance.ts                # Metrics, allocation, dividend income, snowball projection
  ├── csv-parser.ts             # Broker preset CSV parsing
  ├── broker-presets.ts         # Per-broker CSV column mappings
  ├── prices.ts                 # Client fetch helpers for /api/yahoo
  ├── yahoo-transform.ts        # Yahoo response → app models
  ├── t212.ts                   # Trading 212 response normalization
  ├── json-import.ts            # Generic JSON API portfolio parser
  ├── export.ts                 # JSON backup + CSV exports
  ├── chat.ts                   # Chat identity helpers
  ├── spotify.ts / spotify-server.ts
  ├── supabase.ts / supabase-cloud.ts
  └── uuid.ts
supabase/
  └── schema.sql                # Full Supabase schema (tables, RLS, triggers, realtime)
tests/
  └── *.test.ts                 # Unit tests (finance, csv-parser, json-import, t212, store)
types/
  └── index.ts
```

## 🗺️ Roadmap

- [x] Project scaffolding
- [x] CSV import parser (with duplicate merge)
- [x] Snowball growth simulator
- [x] Live / delayed price fetching
- [x] Broker account management
- [x] Watchlist + personalized dashboard
- [x] Market news
- [x] Price alerts + Snowball Score
- [x] Data exports (JSON backup / CSV)
- [x] Trading 212 API sync
- [ ] Plaid-style broker linking
- [ ] Full multi-user accounts (Supabase sync hardening)
- [ ] Multi-currency conversions
- [ ] Tax estimate (optional)
- [ ] Export reports

## 🤝 Contributing

PRs and ideas welcome! Open an issue first for larger changes.

## License

MIT
