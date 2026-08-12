"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePortfolioStore } from "@/lib/store";
import { mergeAccountHoldings, calculatePortfolioMetrics, formatCurrency, formatPercent } from "@/lib/finance";
import { useLiveQuotes } from "@/hooks/useLiveQuotes";
import { HoldingsTable, type HoldingRow } from "@/components/HoldingsTable";
import { Card, Button, Spinner, Badge } from "@/components/ui";

export default function PortfolioPage() {
  const { accounts, preferences, addManualHolding, removeHoldingBySymbol } =
    usePortfolioStore();
  const [symbolInput, setSymbolInput] = useState("");
  const [sharesInput, setSharesInput] = useState("");
  const [costInput, setCostInput] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const holdings = useMemo(() => mergeAccountHoldings(accounts), [accounts]);
  const symbols = useMemo(() => holdings.map((h) => h.symbol), [holdings]);
  const { quotes, loading, error, lastUpdated } = useLiveQuotes(symbols, preferences.refreshSeconds);

  const prices: Record<string, number> = {};
  for (const h of holdings) {
    prices[h.symbol] = quotes[h.symbol]?.price ?? h.costBasis;
  }
  const metrics = calculatePortfolioMetrics(holdings, prices);

  const rows: HoldingRow[] = metrics.holdings.map((h) => ({
    ...h,
    weightPct: metrics.totalValue > 0 ? (h.marketValue / metrics.totalValue) * 100 : 0,
  }));

  const submitManual = (e: React.FormEvent) => {
    e.preventDefault();
    const shares = parseFloat(sharesInput);
    const cost = parseFloat(costInput);
    if (!symbolInput.trim() || isNaN(shares) || shares <= 0) {
      setMsg("Enter a symbol and a valid share count.");
      return;
    }
    addManualHolding({
      symbol: symbolInput.trim().toUpperCase(),
      shares,
      costBasis: isNaN(cost) ? 0 : cost,
      currency: preferences.currency,
    });
    setSymbolInput("");
    setSharesInput("");
    setCostInput("");
    setMsg(`Added ${symbolInput.trim().toUpperCase()} to your portfolio.`);
    setTimeout(() => setMsg(null), 4000);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Portfolio</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Live prices · merged across {accounts.length} account
            {accounts.length === 1 ? "" : "s"}
            {lastUpdated && !error
              ? ` · updated ${lastUpdated.toLocaleTimeString()}`
              : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/brokers">
            <Button variant="secondary">Broker Accounts</Button>
          </Link>
          <Link href="/stocks">
            <Button variant="primary">Add from Markets</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">Total Value</p>
          <p className="text-xl font-bold tabular-nums">{formatCurrency(metrics.totalValue, preferences.currency)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">Total Cost</p>
          <p className="text-xl font-semibold tabular-nums">{formatCurrency(metrics.totalCost, preferences.currency)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">Unrealized Gain</p>
          <p className={`text-xl font-bold tabular-nums ${metrics.totalGain >= 0 ? "text-emerald-500 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400"}`}>
            {formatCurrency(metrics.totalGain, preferences.currency)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">Return</p>
          <p className={`text-xl font-bold tabular-nums ${metrics.totalGainPercent >= 0 ? "text-emerald-500 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400"}`}>
            {formatPercent(metrics.totalGainPercent)}
          </p>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="p-5 pb-3 flex items-center justify-between flex-wrap gap-2">
          <h2 className="font-semibold">Holdings</h2>
          {error && <Badge tone="warn">Live prices unavailable — using cost basis</Badge>}
        </div>
        {loading && symbols.length > 0 ? (
          <Spinner label="Fetching live prices…" />
        ) : (
          <HoldingsTable
            rows={rows}
            quotes={quotes}
            currency={preferences.currency}
            totalValue={metrics.totalValue}
            onRemove={(row) => {
              if (confirm(`Remove all ${row.symbol} positions from every account?`)) {
                removeHoldingBySymbol(row.symbol);
              }
            }}
          />
        )}
        <div className="p-4 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800">
          Prices are delayed and provided for informational purposes only. Data is
          stored locally in your browser. Use the <Link href="/brokers" className="text-accent hover:underline">Brokers</Link> page to import CSV exports.
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="font-semibold mb-3">Quick Add Position</h2>
        <form onSubmit={submitManual} className="flex flex-wrap gap-3 items-end">
          <label className="flex-1 min-w-40">
            <span className="text-xs text-slate-500 dark:text-slate-400">Symbol</span>
            <input
              value={symbolInput}
              onChange={(e) => setSymbolInput(e.target.value)}
              placeholder="AAPL"
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none"
            />
          </label>
          <label className="flex-1 min-w-28">
            <span className="text-xs text-slate-500 dark:text-slate-400">Shares</span>
            <input
              value={sharesInput}
              onChange={(e) => setSharesInput(e.target.value)}
              placeholder="10"
              inputMode="decimal"
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none"
            />
          </label>
          <label className="flex-1 min-w-28">
            <span className="text-xs text-slate-500 dark:text-slate-400">Avg Cost / share</span>
            <input
              value={costInput}
              onChange={(e) => setCostInput(e.target.value)}
              placeholder="150.00"
              inputMode="decimal"
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none"
            />
          </label>
          <Button type="submit" variant="primary">
            + Add
          </Button>
        </form>
        {msg && <p className="mt-3 text-sm text-accent">{msg}</p>}
      </Card>
    </div>
  );
}