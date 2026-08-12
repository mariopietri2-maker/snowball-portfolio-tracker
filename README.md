# ❄️ Snowball Portfolio Tracker

A modern, beautiful web app for stock portfolio tracking, CSV portfolio import, and dividend management — inspired by [Snowball (Xueqiu)](https://xueqiu.com).

**Unique twist:** Built-in **Snowball Growth Visualizer** that shows the power of dividend reinvestment and compound growth over time.

## ✨ Features

- 📊 **Personalized Dashboard** — Greeting, live index ticker, portfolio value, day change, gains, estimated income, allocation donut, and portfolio history chart
- 📥 **CSV Broker Import** — Link multiple brokerage accounts and import positions with per-broker layouts (Schwab, Interactive Brokers, Robinhood, tastytrade, generic); duplicates are merged with weighted-average cost basis
- 📈 **Live Prices** — Real-time/delayed quotes for your holdings via Yahoo Finance (cached server-side)
- 🔍 **Markets & Stock Screener** — Search any ticker, live quotes, star favorites
- 📰 **Stock News** — Headlines for your holdings and any ticker's detail page
- 📈 **Stock Detail Pages** — Interactive price chart (1D–5Y), 52-week range, volume, add-position
- 👤 **Personalization** — Profile name, avatar, base currency, dark/light theme, accent color, refresh rate, yield assumption
- 💬 **Community Chat** — realtime public chat with categories (Bullish/Bearish/Dividends/Q&A), anonymous names, powered by Supabase
- 🎧 **Spotify Mini Player** — log in with your own Spotify account and play/pause music right from the dashboard
- 💰 **Dividend Tracker & Calendar** — Manual events, upcoming payouts, income estimate, calendar view
- ❄️ **Snowball Visualizer** — Interactive compound growth simulator with dividend reinvestment
- 📱 Responsive design (mobile-friendly, bottom nav on mobile)

> Data is stored in your browser's localStorage — no backend required. Prices are delayed, provided for informational purposes only.

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router) + TypeScript
- **Styling**: Tailwind CSS (light/dark themes + accents)
- **Charts**: Recharts
- **State**: Zustand + localStorage (no backend required for MVP)
- **Market data**: Yahoo Finance via a cached server route (`/api/yahoo`)

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

**Optional — accounts & cloud sync (Supabase):**
1. Run `supabase/schema.sql` in the Supabase SQL Editor (creates tables + Row-Level Security, incl. the realtime `chat_messages` table).
2. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local` (or as Vercel env vars).
3. In Supabase → Authentication: add your site URL to "Redirect URLs" and (for dev) disable "Confirm email".

The app runs fine without Supabase (localStorage only); auth enables per-user cloud sync.

**Optional — Spotify mini player (dashboard):**
1. Create an app at [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard) → Edit settings → add Redirect URI: `http://localhost:3000/api/spotify/callback` (add your production URL too).
2. Set `NEXT_PUBLIC_SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` in `.env.local` (the secret is server-side only — do not expose it).
3. The player uses your personal Spotify account. Spotify policy requires a manual tap to start playback (no autoplay).

## 📁 Project Structure

```
app/
  ├── page.tsx              # Personalized dashboard
  ├── portfolio/            # Merged holdings + quick add
  ├── brokers/              # Broker accounts + CSV import
  ├── stocks/               # Markets screener + [symbol] detail (charts/news)
  ├── watchlist/            # Followed tickers
  ├── dividends/            # Dividend tracker + calendar
  ├── snowball/             # Growth visualizer
  ├── settings/             # Profile, theme, currency
  ├── api/yahoo/            # Cached Yahoo Finance proxy
  └── layout.tsx
components/
  ├── ui.tsx                # Card, Button, Badge, Spinner
  ├── IndicesTicker.tsx     # Live index marquee
  ├── StockPriceChart.tsx
  ├── AllocationChart.tsx
  ├── PortfolioHistoryChart.tsx
  ├── NewsFeed.tsx
  ├── StockSearch.tsx
  ├── WatchlistGrid.tsx
  ├── DividendCalendar.tsx
  ├── HoldingsTable.tsx
  ├── StatCard.tsx
  ├── SiteHeader.tsx
  └── ThemeProvider.tsx
hooks/
  └── useLiveQuotes.ts      # Polling quotes hook
lib/
  ├── store.ts              # Zustand store (accounts, watchlist, prefs)
  ├── csv-parser.ts         # Broker preset CSV parsing
  ├── broker-presets.ts
  ├── prices.ts             # Client fetch helpers
  ├── yahoo-transform.ts
  ├── finance.ts
  └── uuid.ts
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
- [ ] Plaid-style broker linking
- [ ] True multi-user accounts (Supabase backend)
- [ ] Multi-currency conversions
- [ ] Tax estimate (optional)
- [ ] Export reports

## 🤝 Contributing

PRs and ideas welcome! Open an issue first for larger changes.

## License

MIT
