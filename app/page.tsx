"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { usePortfolioStore } from "@/lib/store";
import { mergeAccountHoldings, calculatePortfolioMetrics, allocationByHolding, estimateDividendIncome, formatCurrency, formatPercent, formatCompact } from "@/lib/finance";
import { useLiveQuotes } from "@/hooks/useLiveQuotes";
import { IndicesTicker } from "@/components/IndicesTicker";
import { StatCard } from "@/components/StatCard";
import { AllocationChart, AllocationLegend } from "@/components/AllocationChart";
import { PortfolioHistoryChart } from "@/components/PortfolioHistoryChart";
import { WatchlistGrid } from "@/components/WatchlistGrid";
import { NewsFeed } from "@/components/NewsFeed";
import { Card, CardHeader, Badge, Button } from "@/components/ui";

export default function DashboardPage() {
  const { accounts, snapshots, dividends, preferences } =
    usePortfolioStore();

  const holdings = useMemo(() => mergeAccountHoldings(accounts), [accounts]);
  const symbols = useMemo(() => holdings.map((h) => h.symbol), [holdings]);

  const { quotes, loading } = useLiveQuotes(symbols, preferences.refreshSeconds);

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
    preferences.defaultYieldPct
  );

  const dayChange = holdings.reduce((sum, h) => {
    const q = quotes[h.symbol];
    if (!q?.price) return sum;
    return sum + h.shares * q.price * (q.changePercent / 100);
  }, 0);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const name = preferences.userName.trim() || "Investor";

  const priorValue = metrics.totalValue - dayChange;
  const dayChangePct = priorValue > 0 ? (dayChange / priorValue) * 100 : 0;

  const newsQueries = holdings.slice(0, 3).map((h) => h.name ?? h.symbol);

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

      {holdings.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="text-3xl mb-3">❄️</p>
          <h2 className="text-lg font-semibold">Build your snowball</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            Import positions from your broker with CSV, or add them manually, and
            watch your portfolio grow with live prices, dividends, and news.
          </p>
          <div className="mt-5 flex justify-center gap-3 flex-wrap">
            <Link href="/brokers">
              <Button variant="primary">Connect a Broker</Button>
            </Link>
            <Link href="/portfolio">
              <Button variant="secondary">Add Manually</Button>
            </Link>
          </div>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Value"
              value={formatCurrency(metrics.totalValue, preferences.currency)}
              icon="💼"
              sub={
                <span>
                  {holdings.length} positions · {accounts.length} account{accounts.length === 1 ? "" : "s"}
                </span>
              }
            />
            <StatCard
              label="Day Change"
              value={`${dayChange >= 0 ? "+" : "-"}${formatCurrency(Math.abs(dayChange), preferences.currency)}`}
              icon="📅"
              trend={dayChange >= 0 ? "up" : "down"}
              sub={
                <span>
                  vs previous close ·{" "}
                  <span className="tabular-nums">
                    {dayChangePct >= 0 ? "+" : ""}
                    {dayChangePct.toFixed(2)}%
                  </span>
                </span>
              }
            />
            <StatCard
              label="Total Gain"
              value={formatCurrency(metrics.totalGain, preferences.currency)}
              icon="📈"
              trend={metrics.totalGain >= 0 ? "up" : "down"}
              sub={<span>{formatPercent(metrics.totalGainPercent)} since purchase</span>}
            />
            <StatCard
              label="Est. Annual Income"
              value={formatCurrency(income.total, preferences.currency)}
              icon="💰"
              sub={<span>dividends · yield assumption {preferences.defaultYieldPct}%</span>}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="p-5">
              <CardHeader
                title="Portfolio History"
                subtitle="Tracked over time from your live snapshots"
                right={<Badge tone="slate">{formatCompact(metrics.totalValue)}</Badge>}
              />
              <div className="pt-4">
                <PortfolioHistoryChart snapshots={snapshots} currency={preferences.currency} />
              </div>
            </Card>
            <Card className="p-5">
              <CardHeader title="Allocation" subtitle="By holding" />
              <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
                <div className="w-44 h-44 shrink-0">
                  <AllocationChart detailed={allocation.data} currency={preferences.currency} />
                </div>
                <div className="flex-1 w-full">
                  <AllocationLegend detailed={allocation.data} currency={preferences.currency} />
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="p-5">
              <CardHeader
                title="Watchlist"
                subtitle="Your followed tickers"
                right={
                  <Link href="/watchlist" className="text-sm text-accent hover:underline">
                    Manage →
                  </Link>
                }
              />
              <div className="pt-4">
                <WatchlistGrid limit={3} />
              </div>
            </Card>
            <Card className="p-5">
              <CardHeader
                title="Market News"
                subtitle="Headlines for your holdings"
                right={
                  <Link href="/stocks" className="text-sm text-accent hover:underline">
                    Browse →
                  </Link>
                }
              />
              <div className="pt-3">
                <NewsFeed queries={newsQueries.length ? newsQueries : ["stock market"]} limit={6} />
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}