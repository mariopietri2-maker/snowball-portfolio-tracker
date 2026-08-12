"use client";

import Link from "next/link";
import { usePortfolioStore } from "@/lib/store";
import { useLiveQuotes } from "@/hooks/useLiveQuotes";
import { formatCurrency } from "@/lib/finance";
import type { PriceAlert } from "@/types";

export function PriceAlertBar({ currency = "USD" }: { currency?: string }) {
  const alerts = usePortfolioStore((s) => s.alerts);
  const removeAlert = usePortfolioStore((s) => s.removeAlert);

  const symbols = alerts.map((a) => a.symbol);
  const { quotes } = useLiveQuotes(symbols, 60);

  if (alerts.length === 0) return null;

  const isHit = (a: PriceAlert) => {
    const price = quotes[a.symbol]?.price;
    if (price == null) return false;
    return a.direction === "above" ? price >= a.targetPrice : price <= a.targetPrice;
  };

  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="font-semibold flex items-center gap-2 text-sm">
          🔔 Price Alerts
          <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
            {alerts.filter(isHit).length} triggered
          </span>
        </h2>
        <Link
          href="/stocks"
          className="text-xs text-accent hover:underline"
        >
          Set new alert →
        </Link>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {alerts.map((a) => {
          const price = quotes[a.symbol]?.price;
          const hit = isHit(a);
          return (
            <div
              key={a.id}
              className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm ${
                hit
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "border-slate-300 dark:border-slate-700"
              }`}
            >
              <span className="font-semibold">{a.symbol}</span>
              <span className="text-slate-500 dark:text-slate-400 text-xs">
                {a.direction === "above" ? "≥" : "≤"}{" "}
                {formatCurrency(a.targetPrice, currency)}
              </span>
              {price != null && (
                <span className="tabular-nums text-xs">
                  · now {formatCurrency(price, currency)}
                </span>
              )}
              {hit && (
                <span className="text-[10px] font-bold uppercase tracking-wide">
                  hit
                </span>
              )}
              <button
                onClick={() => removeAlert(a.id)}
                title="Remove alert"
                className="text-slate-400 hover:text-rose-500 transition px-1"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}