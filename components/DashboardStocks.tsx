"use client";

import Link from "next/link";
import { Card, CardHeader, Badge, Button } from "@/components/ui";
import { AllocationChart, AllocationLegend } from "@/components/AllocationChart";
import { PortfolioHistoryChart } from "@/components/PortfolioHistoryChart";
import {
  colorForSymbol,
  formatCurrency,
  formatCompact,
} from "@/lib/finance";
import type { LiveQuote, PortfolioSnapshot } from "@/types";

type DetailedHolding = {
  symbol: string;
  name?: string;
  shares: number;
  costBasis: number;
  currentPrice: number;
  marketValue: number;
  gain: number;
  gainPercent: number;
};
type Allocation = { data: Array<{ name: string; value: number; pct: number }> };

function daysUntil(iso: string): number | null {
  const t = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(t.getTime())) return null;
  const d = Math.ceil((t.getTime() - Date.now()) / 86400000);
  return d < 0 ? 0 : d;
}

function Sparkline({
  series,
  up,
}: {
  series?: number[];
  up: boolean;
}) {
  if (!series || series.length < 2) return null;
  const min = Math.min(...series);
  const max = Math.max(...series);
  const span = max - min || 1;
  const w = 60;
  const h = 24;
  const pts = series
    .map((v, i) => {
      const x = (i / (series.length - 1)) * w;
      const y = h - 2 - ((v - min) / span) * (h - 4);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-16 h-7 shrink-0" aria-hidden>
      <polyline
        points={pts}
        fill="none"
        stroke={up ? "#10b981" : "#f43f5e"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function DashboardStocks({
  detailed,
  quotes,
  loading,
  metrics,
  allocation,
  snapshots,
  currency,
  dayChange,
  dayChangePct,
  income,
  upcoming,
}: {
  detailed: DetailedHolding[];
  quotes: Record<string, LiveQuote>;
  loading: boolean;
  metrics: {
    totalValue: number;
    totalGain: number;
    totalGainPercent: number;
  };
  allocation: Allocation;
  snapshots: PortfolioSnapshot[];
  currency: string;
  dayChange: number;
  dayChangePct: number;
  income: { total: number; fromEvents: number; estimated: number };
  upcoming: { symbol: string; payDate: string; amount: number }[];
}) {
  if (detailed.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-2xl mb-2">❄️</p>
        <h2 className="font-semibold">Build your snowball</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Import from a broker CSV or add positions manually — live prices and
          news kick in right away.
        </p>
        <div className="mt-4 flex justify-center gap-2 flex-wrap">
          <Link href="/brokers">
            <Button variant="primary">Connect a Broker</Button>
          </Link>
          <Link href="/portfolio">
            <Button variant="secondary">Add Manually</Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-3">
          <p className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Day
          </p>
          <p
            className={`text-sm font-bold tabular-nums mt-0.5 ${
              dayChange >= 0
                ? "text-emerald-500 dark:text-emerald-400"
                : "text-rose-500 dark:text-rose-400"
            }`}
          >
            {dayChange >= 0 ? "+" : "-"}
            {formatCurrency(Math.abs(dayChange), currency)}
          </p>
          <p className="text-[10px] text-slate-500">
            {dayChangePct >= 0 ? "+" : ""}
            {dayChangePct.toFixed(1)}%
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-3">
          <p className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Gain
          </p>
          <p
            className={`text-sm font-bold tabular-nums mt-0.5 ${
              metrics.totalGain >= 0
                ? "text-emerald-500 dark:text-emerald-400"
                : "text-rose-500 dark:text-rose-400"
            }`}
          >
            {metrics.totalGain > 0 ? "+" : ""}
            {formatCurrency(metrics.totalGain, currency)}
          </p>
          <p className="text-[10px] text-slate-500">
            {metrics.totalGainPercent >= 0 ? "+" : ""}
            {metrics.totalGainPercent.toFixed(1)}%
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-3">
          <p className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Income
          </p>
          <p className="text-sm font-bold tabular-nums mt-0.5">
            {formatCurrency(income.total, currency)}
          </p>
          <p className="text-[10px] text-slate-500">est./yr</p>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="p-4 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold">Your stocks</h3>
            <Link
              href="/portfolio"
              className="text-sm text-accent hover:underline"
            >
              + Add
            </Link>
          </div>
        </div>
        <div className="divide-y divide-slate-200 dark:divide-slate-800">
          {detailed.map((h) => {
            const quote = quotes[h.symbol];
            const price = quote?.price ?? h.currentPrice;
            const changePct = quote?.changePercent ?? h.gainPercent;
            const up = (quote?.changePercent ?? 0) >= 0;
            return (
              <Link
                href={`/stocks/${h.symbol}`}
                key={h.symbol}
                className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
              >
                <span
                  className="w-9 h-9 rounded-lg grid place-items-center text-xs font-bold shrink-0"
                  style={{
                    backgroundColor: `${colorForSymbol(h.symbol)}22`,
                    color: colorForSymbol(h.symbol),
                  }}
                >
                  {h.symbol}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {h.name ?? h.symbol}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {h.shares.toLocaleString()} sh &middot;{" "}
                    {formatCurrency(price, currency)}
                  </p>
                </div>
                <Sparkline series={quote?.series} up={up} />
                <div className="text-right shrink-0">
                  <p className="text-sm font-medium tabular-nums">
                    {formatCurrency(h.marketValue, currency)}
                  </p>
                  <p
                    className={`text-xs tabular-nums ${
                      changePct >= 0
                        ? "text-emerald-500 dark:text-emerald-400"
                        : "text-rose-500 dark:text-rose-400"
                    }`}
                  >
                    {changePct >= 0 ? "+" : ""}
                    {changePct.toFixed(2)}%
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
        <div className="p-4 bg-gradient-to-br from-accent/10 to-transparent border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Total value
            </p>
            <p className="text-xl font-bold tabular-nums">
              {formatCurrency(metrics.totalValue, currency)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {loading ? "…" : "Today"}
            </p>
            <p className="text-sm font-semibold tabular-nums">
              <span
                className={
                  dayChange >= 0
                    ? "text-emerald-500 dark:text-emerald-400"
                    : "text-rose-500 dark:text-rose-400"
                }
              >
                {dayChange >= 0 ? "+" : "-"}
                {formatCurrency(Math.abs(dayChange), currency)} ·{" "}
                {dayChangePct >= 0 ? "+" : ""}
                {dayChangePct.toFixed(1)}%
              </span>
            </p>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="p-4 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold">Dividends</h3>
            <Link href="/dividends" className="text-sm text-accent hover:underline">
              Manage →
            </Link>
          </div>
        </div>
        <div className="p-4 space-y-3">
          <div className="rounded-xl bg-emerald-500/10 dark:bg-emerald-500/10 border border-emerald-500/25 px-3 py-2.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400">Annual income</span>
              <span className="font-bold tabular-nums text-emerald-500 dark:text-emerald-400">
                {formatCurrency(income.total, currency)}
              </span>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-emerald-500/20 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500"
                style={{
                  width: `${Math.min(
                    100,
                    income.total > 0 ? (income.fromEvents / income.total) * 100 : 0
                  )}%`,
                }}
              />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
              {formatCurrency(income.fromEvents, currency)} paid
              {income.total > income.fromEvents && (
                <>
                  {" "}
                  · {formatCurrency(income.total - income.fromEvents, currency)} ahead
                </>
              )}
            </p>
          </div>

          {upcoming.length === 0 ? (
            <Link
              href="/dividends"
              className="block rounded-xl border border-dashed border-slate-300 dark:border-slate-700 px-3 py-3 text-center text-sm text-slate-500 dark:text-slate-400 hover:border-accent hover:text-accent transition"
            >
              No upcoming payouts — add your first →
            </Link>
          ) : (
            <div className="space-y-2">
              {upcoming.map((d, i) => {
                const days = daysUntil(d.payDate);
                const label =
                  days === null
                    ? d.payDate
                    : days === 0
                      ? "today"
                      : `in ${days} day${days === 1 ? "" : "s"}`;
                return (
                  <div
                    key={`${d.symbol}-${d.payDate}-${i}`}
                    className="flex items-center gap-3 rounded-xl bg-slate-100 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 px-3 py-2"
                  >
                    <span
                      className="w-9 h-9 rounded-lg grid place-items-center text-xs font-bold shrink-0"
                      style={{
                        backgroundColor: `${colorForSymbol(d.symbol)}22`,
                        color: colorForSymbol(d.symbol),
                      }}
                    >
                      {d.symbol}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">
                        {formatCurrency(d.amount, currency)}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Payout {label} ·{" "}
                        {new Date(`${d.payDate}T00:00:00`).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    {i === 0 && (
                      <Badge tone="up">
                        {days === 0 ? "Paying today" : "Next"}
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>

      <Card className="p-5">
        <CardHeader
          title="Portfolio history"
          subtitle="From your live snapshots"
          right={
            <Badge tone="slate">{formatCompact(metrics.totalValue)}</Badge>
          }
        />
        <div className="pt-4">
          <PortfolioHistoryChart
            snapshots={snapshots}
            currency={currency}
          />
        </div>
      </Card>

      <Card className="p-5">
        <CardHeader title="Allocation" subtitle="By holding" />
        <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
          <div className="w-32 h-32 shrink-0">
            <AllocationChart
              detailed={allocation.data}
              currency={currency}
            />
          </div>
          <div className="flex-1 w-full">
            <AllocationLegend
              detailed={allocation.data}
              currency={currency}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}