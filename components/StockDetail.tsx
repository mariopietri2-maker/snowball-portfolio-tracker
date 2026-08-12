"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePortfolioStore } from "@/lib/store";
import { fetchSearch, fetchChart } from "@/lib/prices";
import { formatCurrency, formatCompact } from "@/lib/finance";
import { StockPriceChart } from "@/components/StockPriceChart";
import { NewsFeed } from "@/components/NewsFeed";
import { Card, CardHeader, Badge, Button, Spinner, ChangeText } from "@/components/ui";
import type { NewsItem, StockInfo } from "@/types";

export function StockDetail({ symbol }: { symbol: string }) {
  const { preferences, watchlist, toggleWatchlist, alerts, addAlert, removeAlert } =
    usePortfolioStore();
  const [quote, setQuote] = useState<StockInfo | undefined>();
  const [loading, setLoading] = useState(true);
  const [shares, setShares] = useState("");
  const [cost, setCost] = useState("");
  const [added, setAdded] = useState<string | null>(null);
  const [alertDirection, setAlertDirection] = useState<"above" | "below">("above");
  const [alertTarget, setAlertTarget] = useState("");
  const [alertAdded, setAlertAdded] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([
      fetchChart(symbol, "1y").catch(() => undefined),
      fetchSearch(symbol, 0).catch(() => ({ quotes: [], news: [] as NewsItem[] })),
    ])
      .then(([chart, search]) => {
        if (!active) return;
        const info: StockInfo = {
          symbol,
          name: chart?.name ?? search.quotes[0]?.name,
          exchange: chart?.exchange ?? search.quotes[0]?.exchange,
          price: chart?.price,
          prevClose: chart?.prevClose,
          changePercent: chart?.changePercent,
          dayHigh: chart?.dayHigh,
          dayLow: chart?.dayLow,
          fiftyTwoWeekHigh: chart?.fiftyTwoWeekHigh,
          fiftyTwoWeekLow: chart?.fiftyTwoWeekLow,
          volume: chart?.volume,
        };
        setQuote(info);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [symbol]);

  const starred = watchlist.includes(symbol);
  const symbolAlerts = alerts.filter((a) => a.symbol === symbol);
  const stats = useMemo(
    () => [
      { label: "Previous Close", value: quote?.prevClose != null ? formatCurrency(quote.prevClose, preferences.currency) : "—" },
      { label: "Day Range", value: quote?.dayHigh != null && quote?.dayLow != null ? `${formatCurrency(quote.dayLow, preferences.currency)} – ${formatCurrency(quote.dayHigh, preferences.currency)}` : "—" },
      { label: "52-Week High", value: quote?.fiftyTwoWeekHigh != null ? formatCurrency(quote.fiftyTwoWeekHigh, preferences.currency) : "—" },
      { label: "52-Week Low", value: quote?.fiftyTwoWeekLow != null ? formatCurrency(quote.fiftyTwoWeekLow, preferences.currency) : "—" },
      { label: "Volume", value: quote?.volume != null ? formatCompact(quote.volume) : "—" },
      { label: "Exchange", value: quote?.exchange ?? "—" },
    ],
    [quote, preferences.currency]
  );

  const submitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const n = parseFloat(shares);
    if (!n || n <= 0) return;
    usePortfolioStore
      .getState()
      .addManualHolding({
        symbol,
        shares: n,
        costBasis: parseFloat(cost) || 0,
        currency: preferences.currency,
        name: quote?.name,
      });
    setAdded(`Added ${symbol} to your portfolio.`);
    setShares("");
    setCost("");
    setTimeout(() => setAdded(null), 4000);
  };

  const submitAlert = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseFloat(alertTarget);
    if (!target || target <= 0) return;
    addAlert({ symbol, direction: alertDirection, targetPrice: target });
    setAlertAdded(
      `Alert set — when ${symbol} is ${alertDirection === "above" ? "≥" : "≤"} ${formatCurrency(
        target,
        preferences.currency
      )}, you'll see it on the dashboard.`
    );
    setAlertTarget("");
    setTimeout(() => setAlertAdded(null), 5000);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            <Link href="/stocks" className="hover:text-accent">← Markets</Link>
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-3 mt-1">
            {quote?.name ?? symbol}
            <Badge tone="slate">{symbol}</Badge>
            <button
              onClick={() => toggleWatchlist(symbol)}
              title="Watchlist"
              className={`text-2xl leading-none transition ${starred ? "text-amber-400" : "text-slate-400 hover:text-amber-400"}`}
            >
              ★
            </button>
          </h1>
          {quote?.price != null && (
            <p className="mt-1 flex items-center gap-2">
              <span className="text-xl font-bold tabular-nums">
                {formatCurrency(quote.price, preferences.currency)}
              </span>
              <ChangeText value={quote.changePercent ?? 0} />
              {quote.exchange && (
                <span className="text-xs text-slate-500 dark:text-slate-400">{quote.exchange}</span>
              )}
            </p>
          )}
        </div>
      </div>

      <Card className="p-5">
        <StockPriceChart symbol={symbol} currency={preferences.currency} />
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map((s) => (
          <Card key={s.label} className="p-3">
            <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">{s.label}</p>
            <p className="text-sm font-semibold mt-1 tabular-nums truncate">{s.value}</p>
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <CardHeader title="Add Position" subtitle={`Buy ${symbol} into your portfolio`} />
        <form onSubmit={submitAdd} className="flex flex-wrap gap-3 items-end mt-4">
          <label className="flex-1 min-w-24">
            <span className="text-xs text-slate-500 dark:text-slate-400">Shares</span>
            <input
              value={shares}
              onChange={(e) => setShares(e.target.value)}
              placeholder="10"
              inputMode="decimal"
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none"
            />
          </label>
          <label className="flex-1 min-w-24">
            <span className="text-xs text-slate-500 dark:text-slate-400">Avg cost / share</span>
            <input
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              placeholder={`${quote?.price ?? 0}`}
              inputMode="decimal"
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none"
            />
          </label>
          <Button type="submit" variant="primary" disabled={!shares}>
            + Add to Portfolio
          </Button>
        </form>
        {added && <p className="mt-3 text-sm text-accent">{added}</p>}
      </Card>

      <Card className="p-5">
        <CardHeader
          title="Price Alerts"
          subtitle="Get notified when the price crosses a target (shown on your dashboard)"
        />
        <form onSubmit={submitAlert} className="flex flex-wrap gap-3 items-end mt-4">
          <label className="flex-1 min-w-24">
            <span className="text-xs text-slate-500 dark:text-slate-400">When price is</span>
            <select
              value={alertDirection}
              onChange={(e) => setAlertDirection(e.target.value as "above" | "below")}
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none"
            >
              <option value="above">Above (≥)</option>
              <option value="below">Below (≤)</option>
            </select>
          </label>
          <label className="flex-1 min-w-24">
            <span className="text-xs text-slate-500 dark:text-slate-400">Target price</span>
            <input
              value={alertTarget}
              onChange={(e) => setAlertTarget(e.target.value)}
              placeholder={`${quote?.price ?? 0}`}
              inputMode="decimal"
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none"
            />
          </label>
          <Button type="submit" variant="primary" disabled={!alertTarget}>
            + Set Alert
          </Button>
        </form>
        {alertAdded && <p className="mt-3 text-sm text-accent">{alertAdded}</p>}
        {symbolAlerts.length > 0 && (
          <div className="mt-4 space-y-2">
            {symbolAlerts.map((a) => {
              const hit =
                quote?.price != null
                  ? a.direction === "above"
                    ? quote.price >= a.targetPrice
                    : quote.price <= a.targetPrice
                  : false;
              return (
                <div
                  key={a.id}
                  className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm ${
                    hit
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "border-slate-300 dark:border-slate-700"
                  }`}
                >
                  <span>
                    {a.direction === "above" ? "≥" : "≤"}{" "}
                    {formatCurrency(a.targetPrice, preferences.currency)}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {hit
                      ? "triggered ✓"
                      : quote?.price != null
                      ? `now ${formatCurrency(quote.price, preferences.currency)}`
                      : "waiting for a price"}
                  </span>
                  <button
                    onClick={() => removeAlert(a.id)}
                    className="text-slate-400 hover:text-rose-500 transition"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card className="p-5">
        <CardHeader title="News" subtitle={`Latest headlines for ${symbol}`} />
        <div className="pt-3">
          {loading ? <Spinner label="Loading news…" /> : <NewsFeed queries={[symbol]} limit={8} />}
        </div>
      </Card>
    </div>
  );
}