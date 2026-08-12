"use client";

import Link from "next/link";
import { usePortfolioStore } from "@/lib/store";
import { StockSearch } from "@/components/StockSearch";
import { Card, CardHeader, ChangeText } from "@/components/ui";
import { useLiveQuotes } from "@/hooks/useLiveQuotes";
import { formatCurrency } from "@/lib/finance";

const TRENDING = [
  "AAPL",
  "MSFT",
  "NVDA",
  "TSLA",
  "AMZN",
  "GOOGL",
  "META",
  "SPY",
  "QQQ",
  "VTI",
  "VOO",
  "NFLX",
];

export default function MarketsPage() {
  const currency = usePortfolioStore((s) => s.preferences.currency);
  const refreshSeconds = usePortfolioStore((s) => s.preferences.refreshSeconds);
  const toggleWatchlist = usePortfolioStore((s) => s.toggleWatchlist);
  const watchlist = usePortfolioStore((s) => s.watchlist);

  const { quotes } = useLiveQuotes(TRENDING, refreshSeconds);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Markets</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Search any ticker, see live prices, charts & news, and follow your favorites.
          </p>
        </div>
      </div>

      <div className="max-w-xl">
        <StockSearch autoFocus placeholder="Search ticker or company… e.g. NVDA" />
      </div>

      <Card className="p-5">
        <CardHeader title="Trending" subtitle="Popular tickers, live quotes" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
          {TRENDING.map((symbol) => {
            const q = quotes[symbol];
            const starred = watchlist.includes(symbol);
            return (
              <div
                key={symbol}
                className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 hover:border-accent/50 transition group"
              >
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/stocks/${symbol}`} className="min-w-0 flex-1">
                    <p className="font-semibold group-hover:text-accent transition">{symbol}</p>
                    {q && <ChangeText value={q.changePercent} className="text-xs" />}
                  </Link>
                  <button
                    onClick={() => toggleWatchlist(symbol)}
                    title={starred ? "Remove from watchlist" : "Add to watchlist"}
                    className={`text-lg leading-none transition ${
                      starred ? "text-amber-400" : "text-slate-400 hover:text-amber-400"
                    }`}
                  >
                    ★
                  </button>
                </div>
                <p className="mt-2 text-xl font-bold tabular-nums">
                  {q ? formatCurrency(q.price, q.currency ?? currency) : "—"}
                </p>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}