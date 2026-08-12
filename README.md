# ❄️ Snowball Portfolio Tracker

A modern, beautiful web app for stock portfolio tracking, CSV portfolio import, and dividend management — inspired by [Snowball (Xueqiu)](https://xueqiu.com).

**Unique twist:** Built-in **Snowball Growth Visualizer** that shows the power of dividend reinvestment and compound growth over time.

## ✨ Features

- 📊 **Portfolio Dashboard** — Overview of total value, daily P&L, allocation charts
- 📥 **CSV Portfolio Import** — Easily import holdings from brokers (supports common formats)
- 📈 **Holdings Tracker** — Live (or delayed) prices, cost basis, unrealized gains
- 💰 **Dividend Tracker** — Upcoming dividends, historical payments, yield on cost
- 🗓️ **Dividend Calendar** — Visual calendar of expected payouts
- ❄️ **Snowball Visualizer** (new!) — Interactive compound growth simulator with dividend reinvestment
- 📱 Responsive design (mobile-friendly)
- 🌙 Dark mode ready

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router) + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Charts**: Recharts
- **State**: Zustand + localStorage (no backend required for MVP)
- **Data**: Yahoo Finance / Finnhub (configurable)

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

## 📁 Project Structure

```
app/
  ├── page.tsx              # Dashboard
  ├── portfolio/            # Holdings & import
  ├── dividends/            # Dividend tracker & calendar
  ├── snowball/             # Growth visualizer
  └── layout.tsx
components/
  ├── ui/                   # shadcn components
  ├── PortfolioTable.tsx
  ├── DividendCalendar.tsx
  └── SnowballChart.tsx
lib/
  ├── store.ts              # Zustand store
  ├── csv-parser.ts
  └── finance.ts            # Price & dividend helpers
types/
  └── index.ts
```

## 🗺️ Roadmap

- [x] Project scaffolding
- [ ] CSV import parser
- [ ] Real-time / delayed price fetching
- [ ] Dividend data integration
- [ ] Snowball growth simulator
- [ ] Multi-currency support
- [ ] Tax estimate (optional)
- [ ] Export reports
- [ ] Optional backend (Supabase) for sync across devices

## 🤝 Contributing

PRs and ideas welcome! Open an issue first for larger changes.

## License

MIT
