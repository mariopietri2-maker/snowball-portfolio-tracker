"use client";

import { useState } from "react";
import { usePortfolioStore } from "@/lib/store";
import { mergeAccountHoldings, estimateDividendIncome, formatCurrency, formatPercent } from "@/lib/finance";
import { DividendCalendar } from "@/components/DividendCalendar";
import { Card, CardHeader, Button, Badge, EmptyState } from "@/components/ui";

export default function DividendsPage() {
  const { dividends, accounts, preferences, addDividend, removeDividend } =
    usePortfolioStore();
  const [symbol, setSymbol] = useState("");
  const [amount, setAmount] = useState("");
  const [payDate, setPayDate] = useState("");
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const holdings = mergeAccountHoldings(accounts);
  const income = estimateDividendIncome(
    holdings,
    dividends,
    preferences.defaultYieldPct
  );

  const upcoming = dividends
    .filter((d) => d.status !== "paid")
    .sort((a, b) => a.payDate.localeCompare(b.payDate));
  const paid = dividends
    .filter((d) => d.status === "paid")
    .sort((a, b) => b.payDate.localeCompare(a.payDate));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!symbol.trim() || isNaN(amt) || amt <= 0) return;
    addDividend({
      symbol: symbol.trim().toUpperCase(),
      amountPerShare: amt,
      exDate: payDate || new Date().toISOString().slice(0, 10),
      payDate: payDate || new Date().toISOString().slice(0, 10),
      status: "upcoming",
      currency: preferences.currency,
    });
    setSymbol("");
    setAmount("");
    setPayDate("");
    setStatusMsg("Dividend event recorded.");
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const upcomingTotal = upcoming.reduce(
    (s, d) => s + d.amountPerShare,
    0
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dividends</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Track payouts, see what&apos;s coming, and estimate annual income.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">Annual Income</p>
          <p className="text-xl font-bold tabular-nums text-emerald-500 dark:text-emerald-400">
            {formatCurrency(income.total, preferences.currency)}
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
            {formatCurrency(income.fromEvents, preferences.currency)} from events +{" "}
            {formatCurrency(income.estimated, preferences.currency)} estimated
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">Upcoming Payouts</p>
          <p className="text-xl font-bold tabular-nums">{upcoming.length}</p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
            {formatCurrency(upcomingTotal, preferences.currency)} total / share
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">Tracked Events</p>
          <p className="text-xl font-bold tabular-nums">{dividends.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">Yield on Cost</p>
          <p className="text-xl font-bold tabular-nums">
            {income.total > 0 ? formatPercent((income.total / Math.max(holdings.reduce((s, h) => s + h.shares * h.costBasis, 0), 1)) * 100) : "—"}
          </p>
        </Card>
      </div>

      <Card className="p-5">
        <CardHeader title="Dividend Calendar" subtitle="Expected payout dates" />
        <div className="pt-4">
          <DividendCalendar dividends={dividends} currency={preferences.currency} />
        </div>
      </Card>

      <Card className="p-5">
        <CardHeader title="Add Dividend Event" subtitle="Record an upcoming or paid payout" />
        <form onSubmit={submit} className="flex flex-wrap gap-3 items-end mt-4">
          <label className="flex-1 min-w-24">
            <span className="text-xs text-slate-500 dark:text-slate-400">Symbol</span>
            <input
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              placeholder="AAPL"
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none"
            />
          </label>
          <label className="flex-1 min-w-24">
            <span className="text-xs text-slate-500 dark:text-slate-400">Amount / share</span>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.25"
              inputMode="decimal"
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none"
            />
          </label>
          <label className="flex-1 min-w-32">
            <span className="text-xs text-slate-500 dark:text-slate-400">Pay date</span>
            <input
              type="date"
              value={payDate}
              onChange={(e) => setPayDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none"
            />
          </label>
          <Button type="submit" variant="primary">Add</Button>
        </form>
        {statusMsg && <p className="mt-3 text-sm text-accent">{statusMsg}</p>}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <CardHeader title="Upcoming" />
          <div className="pt-2 overflow-x-auto">
            {upcoming.length === 0 ? (
              <EmptyState title="No upcoming payouts" />
            ) : (
              <table className="w-full text-sm">
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {upcoming.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 font-medium">{d.symbol}</td>
                      <td className="py-2.5 tabular-nums">{formatCurrency(d.amountPerShare, d.currency ?? preferences.currency)}</td>
                      <td className="py-2.5 text-slate-500 dark:text-slate-400">{d.payDate}</td>
                      <td className="py-2.5 text-right">
                        <Badge tone="accent">{d.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>

        <Card className="p-5">
          <CardHeader title="Paid" />
          <div className="pt-2 overflow-x-auto">
            {paid.length === 0 ? (
              <EmptyState title="No paid events yet" />
            ) : (
              <table className="w-full text-sm">
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {paid.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 font-medium">{d.symbol}</td>
                      <td className="py-2.5 tabular-nums text-emerald-500 dark:text-emerald-400">
                        {formatCurrency(d.amountPerShare, d.currency ?? preferences.currency)}
                      </td>
                      <td className="py-2.5 text-slate-500 dark:text-slate-400">{d.payDate}</td>
                      <td className="py-2.5 text-right">
                        <button
                          onClick={() => removeDividend(d.id)}
                          className="text-xs text-slate-400 hover:text-rose-500 transition"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}