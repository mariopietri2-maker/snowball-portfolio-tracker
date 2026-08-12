"use client";

import { useEffect, useState } from "react";
import { usePortfolioStore } from "@/lib/store";
import { fetchSpark } from "@/lib/prices";
import type { LiveQuote } from "@/types";

const INDEXES = ["^GSPC", "^IXIC", "^DJI", "^RUT"];

const INDEX_NAMES: Record<string, string> = {
  "^GSPC": "S&P 500",
  "^IXIC": "NASDAQ",
  "^DJI": "DOW JONES",
  "^RUT": "RUSSELL 2K",
};

export function IndicesTicker() {
  const refreshSeconds = usePortfolioStore((s) => s.preferences.refreshSeconds);
  const [quotes, setQuotes] = useState<Record<string, LiveQuote>>({});

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const data = await fetchSpark(INDEXES, "1d", "5m");
        if (active) setQuotes(data);
      } catch {
        /* ignore, ticker is decorative */
      }
    };
    load();
    const timer = setInterval(load, Math.max(refreshSeconds, 15) * 1000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [refreshSeconds]);

  const items = INDEXES.map((s) => quotes[s]).filter(Boolean) as LiveQuote[];
  if (items.length === 0) {
    return (
      <div className="h-9 rounded-lg border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 animate-pulse" />
    );
  }

  const renderItem = (q: LiveQuote, keyOverride?: string) => (
    <div key={keyOverride ?? q.symbol} className="flex items-center gap-2 shrink-0">
      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
        {INDEX_NAMES[q.symbol] ?? q.symbol.replace("^", "")}
      </span>
      <span className="text-sm font-semibold tabular-nums">
        {q.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
      </span>
      <span
        className={`text-xs font-medium tabular-nums ${
          q.changePercent >= 0
            ? "text-emerald-500 dark:text-emerald-400"
            : "text-rose-500 dark:text-rose-400"
        }`}
      >
        {q.changePercent >= 0 ? "▲" : "▼"} {Math.abs(q.changePercent).toFixed(2)}%
      </span>
    </div>
  );

  return (
    <div className="relative overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/50">
      <div className="flex gap-8 px-4 py-2 w-max animate-marquee">
        {[...items, ...items].map((q, i) => renderItem(q, `${q.symbol}-${i}`))}
      </div>
    </div>
  );
}