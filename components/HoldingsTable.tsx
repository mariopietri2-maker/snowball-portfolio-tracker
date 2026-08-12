"use client";

import Link from "next/link";
import type { LiveQuote } from "@/types";
import { formatCurrency, formatPercent, formatNumber } from "@/lib/finance";

export interface HoldingRow {
  id: string;
  symbol: string;
  name?: string;
  shares: number;
  costBasis: number;
  currentPrice: number;
  marketValue: number;
  cost: number;
  gain: number;
  gainPercent: number;
  weightPct: number;
}

export function HoldingsTable({
  rows,
  quotes,
  currency,
  totalValue,
  onRemove,
}: {
  rows: HoldingRow[];
  quotes: Record<string, LiveQuote>;
  currency: string;
  totalValue: number;
  onRemove?: (row: HoldingRow) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[640px]">
        <thead className="text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
          <tr>
            <th className="text-left px-4 py-3 font-medium">Symbol</th>
            <th className="text-right px-4 py-3 font-medium">Shares</th>
            <th className="text-right px-4 py-3 font-medium">Avg Cost</th>
            <th className="text-right px-4 py-3 font-medium">Price</th>
            <th className="text-right px-4 py-3 font-medium">Market Value</th>
            <th className="text-right px-4 py-3 font-medium">Gain</th>
            <th className="text-right px-4 py-3 font-medium">Weight</th>
            {onRemove && <th className="text-right px-4 py-3 font-medium" />}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                No holdings yet. Import a broker CSV or add positions manually.
              </td>
            </tr>
          ) : (
            rows.map((h) => {
              const q = quotes[h.symbol];
              const live = q && typeof q.price === "number";
              return (
                <tr key={h.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                  <td className="px-4 py-3">
                    <Link href={`/stocks/${h.symbol}`} className="font-semibold hover:text-accent">
                      {h.symbol}
                    </Link>
                    {h.name && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[180px] truncate">
                        {h.name}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatNumber(h.shares)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatCurrency(h.costBasis, currency)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {live
                      ? formatCurrency(q.price, q.currency ?? currency)
                      : formatCurrency(h.costBasis, currency)}
                    {live && (
                      <p
                        className={`text-[11px] ${
                          q.changePercent >= 0
                            ? "text-emerald-500"
                            : "text-rose-500"
                        }`}
                      >
                        {formatPercent(q.changePercent)}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium">
                    {formatCurrency(h.marketValue, currency)}
                  </td>
                  <td
                    className={`px-4 py-3 text-right tabular-nums ${
                      h.gain >= 0
                        ? "text-emerald-500 dark:text-emerald-400"
                        : "text-rose-500 dark:text-rose-400"
                    }`}
                  >
                    {formatCurrency(h.gain, currency)}{" "}
                    <span className="text-[11px]">({formatPercent(h.gainPercent)})</span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-500 dark:text-slate-400">
                    {totalValue > 0 ? `${((h.marketValue / totalValue) * 100).toFixed(1)}%` : "—"}
                  </td>
                  {onRemove && (
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => onRemove(h)}
                        className="text-xs text-slate-400 hover:text-rose-500 transition"
                      >
                        Remove
                      </button>
                    </td>
                  )}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}