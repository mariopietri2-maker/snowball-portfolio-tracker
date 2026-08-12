"use client";

import Link from "next/link";
import { usePortfolioStore } from "@/lib/store";
import { WatchlistGrid } from "@/components/WatchlistGrid";
import { StockSearch } from "@/components/StockSearch";
import { Card } from "@/components/ui";

export default function WatchlistPage() {
  const watchlist = usePortfolioStore((s) => s.watchlist);
  const toggleWatchlist = usePortfolioStore((s) => s.toggleWatchlist);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Watchlist</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Follow stocks and keep an eye on their live performance.
        </p>
      </div>

      <div className="max-w-xl">
        <StockSearch
          placeholder="Search to add to watchlist…"
          onSelect={(symbol) => {
            if (!watchlist.includes(symbol)) toggleWatchlist(symbol);
          }}
        />
      </div>

      {watchlist.length === 0 && (
        <Card className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">
          Your watchlist is empty. Use the search above or the star buttons on the{" "}
          <Link href="/stocks" className="text-accent hover:underline">
            Markets page
          </Link>{" "}
          to follow tickers.
        </Card>
      )}

      <WatchlistGrid />
    </div>
  );
}