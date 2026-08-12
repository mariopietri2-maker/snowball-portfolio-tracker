"use client";

import Link from "next/link";
import { usePortfolioStore } from "@/lib/store";
import { useLiveQuotes } from "@/hooks/useLiveQuotes";
import { formatCurrency, formatPercent } from "@/lib/finance";
import { Card, EmptyState, Spinner } from "@/components/ui";

function MiniSparkline({ series, up }: { series: number[]; up: boolean }) {
  if (series.length === 0) return null;
  const min = Math.min(...series);
  const max = Math.max(...series);
  const span = max - min || 1;
  const w = 88;
  const h = 32;
  const step = w / (series.length - 1);
  const points = series.map((v, i) => `${(i * step).toFixed(1)},${(h - ((v - min) / span) * h + 2).toFixed(1)}`);
  const color = up ? "#10b981" : "#f43f5e";
  return (
    <svg width={w} height={h} className="shrink-0">
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
      />
    </svg>
  );
}

export function WatchlistGrid({ limit }: { limit?: number }) {
  const watchlist = usePortfolioStore((s) => s.watchlist);
  const currency = usePortfolioStore((s) => s.preferences.currency);
  const refreshSeconds = usePortfolioStore((s) => s.preferences.refreshSeconds);
  const toggleWatchlist = usePortfolioStore((s) => s.toggleWatchlist);

  const { quotes, loading } = useLiveQuotes(watchlist, refreshSeconds);

  if (watchlist.length === 0)
    return (
      <EmptyState
        title="Watchlist is empty"
        hint="Search the Markets page and tap the star to follow stocks."
      />
    );

  const items = watchlist.slice(0, limit ?? watchlist.length);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {loading && items.length === 0 ? <Spinner label="Loading prices…" /> : null}
      {items.map((symbol) => {
        const q = quotes[symbol];
        const up = (q?.changePercent ?? 0) >= 0;
        return (
          <Card key={symbol} className="p-4 group hover:border-accent/50 transition">
            <div className="flex items-start justify-between gap-2">
              <Link href={`/stocks/${symbol}`} className="min-w-0 flex-1">
                <p className="font-semibold">{symbol}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                  {q ? formatPercent(q.changePercent) : "Loading…"}
                </p>
              </Link>
              <button
                onClick={() => toggleWatchlist(symbol)}
                title="Remove from watchlist"
                className="text-amber-400 hover:text-amber-300 transition"
              >
                ★
              </button>
            </div>
            <div className="flex items-end justify-between mt-2 gap-2">
              <p className="text-lg font-bold tabular-nums">
                {q ? formatCurrency(q.price, q.currency ?? currency) : "—"}
              </p>
              <MiniSparkline series={q?.series ?? []} up={up} />
            </div>
          </Card>
        );
      })}
    </div>
  );
}