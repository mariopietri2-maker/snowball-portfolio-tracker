"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { usePortfolioStore } from "@/lib/store";
import {
  mergeAccountHoldings,
  calculatePortfolioMetrics,
  allocationByHolding,
  estimateDividendIncome,
} from "@/lib/finance";
import { useLiveQuotes } from "@/hooks/useLiveQuotes";
import { IndicesTicker } from "@/components/IndicesTicker";
import { NewsFeed } from "@/components/NewsFeed";
import { DashboardStocks } from "@/components/DashboardStocks";
import { CommunityPreview } from "@/components/CommunityPreview";
import { SpotifyPlayer } from "@/components/SpotifyPlayer";
import { PriceAlertBar } from "@/components/PriceAlertBar";
import { SnowballScore } from "@/components/SnowballScore";
import { Card, Button } from "@/components/ui";

export default function DashboardPage() {
  const { accounts, snapshots, dividends, preferences } =
    usePortfolioStore();

  const holdings = useMemo(() => mergeAccountHoldings(accounts), [accounts]);
  const symbols = useMemo(() => holdings.map((h) => h.symbol), [holdings]);

  const { quotes, loading, error } = useLiveQuotes(symbols, preferences.refreshSeconds);

  useEffect(() => {
    if (!loading && holdings.length > 0) {
      const prices: Record<string, number> = {};
      for (const h of holdings) {
        const q = quotes[h.symbol];
        prices[h.symbol] = q?.price ?? h.costBasis;
      }
      const m = calculatePortfolioMetrics(holdings, prices);
      usePortfolioStore.getState().pushSnapshot(m.totalValue);
    }
    // only snapshot after a fresh quote cycle, not on every chart tick
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  const prices: Record<string, number> = {};
  for (const h of holdings) {
    prices[h.symbol] = quotes[h.symbol]?.price ?? h.costBasis;
  }
  const metrics = calculatePortfolioMetrics(holdings, prices);
  const allocation = allocationByHolding(metrics.holdings);
  const income = estimateDividendIncome(
    holdings,
    dividends,
    preferences.defaultYieldPct,
    prices
  );

  const dayChange = holdings.reduce((sum, h) => {
    const q = quotes[h.symbol];
    if (!q?.price) return sum;
    return sum + h.shares * q.price * (q.changePercent / 100);
  }, 0);
  const priorValue = metrics.totalValue - dayChange;
  const dayChangePct = priorValue > 0 ? (dayChange / priorValue) * 100 : 0;

  const sharesBySymbol = new Map<string, number>();
  for (const h of holdings) {
    sharesBySymbol.set(h.symbol, (sharesBySymbol.get(h.symbol) ?? 0) + h.shares);
  }
  const upcomingDividends = dividends
    .filter((d) => d.status !== "paid")
    .sort((a, b) => a.payDate.localeCompare(b.payDate))
    .slice(0, 3)
    .map((d) => ({
      symbol: d.symbol,
      payDate: d.payDate,
      amount: ((sharesBySymbol.get(d.symbol) ?? 0) * d.amountPerShare) || d.amountPerShare,
    }));

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const name = preferences.userName.trim() || "Investor";

  const newsQueries = holdings
    .slice(0, 3)
    .map((h) => h.name ?? h.symbol);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {greeting}, {name}
            <span className="ml-2 inline-block align-middle">👋</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}{" "}
            · Market prices are delayed
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/stocks">
            <Button variant="secondary">Explore Markets</Button>
          </Link>
          <Link href="/portfolio">
            <Button variant="primary">+ Add Holding</Button>
          </Link>
        </div>
      </div>

      <IndicesTicker />

      {error && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-700 dark:text-amber-400">
          Live quotes unavailable right now — showing last known prices.
        </div>
      )}

      <PriceAlertBar currency={preferences.currency} />

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)_minmax(0,0.9fr)] gap-4 items-start">
        <Card className="p-5">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
            <h2 className="font-semibold flex items-center gap-2">
              Market News
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                Live
              </span>
            </h2>
            <Link
              href="/stocks"
              className="text-sm text-accent hover:underline"
            >
              Browse →
            </Link>
          </div>
          <NewsFeed
            queries={newsQueries.length ? newsQueries : ["Stock Market"]}
            limit={6}
          />
        </Card>

        <DashboardStocks
          detailed={metrics.holdings}
          quotes={quotes}
          loading={loading}
          metrics={metrics}
          allocation={allocation}
          snapshots={snapshots}
          currency={preferences.currency}
          dayChange={dayChange}
          dayChangePct={dayChangePct}
          income={income}
          upcoming={upcomingDividends}
        />

        <div className="space-y-4">
          <Card className="p-4">
            <SnowballScore
              totalGainPercent={metrics.totalGainPercent}
              totalValue={metrics.totalValue}
              annualIncome={income.total}
              snapshots={snapshots}
              currency={preferences.currency}
            />
          </Card>
          <CommunityPreview />
          <SpotifyPlayer />
        </div>
      </div>
    </div>
  );
}