"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchSearch } from "@/lib/prices";
import type { StockInfo } from "@/types";

export function StockSearch({
  onSelect,
  placeholder = "Search ticker or company…",
  autoFocus = false,
}: {
  onSelect?: (symbol: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<StockInfo[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!q.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }
    let active = true;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const { quotes } = await fetchSearch(q, 0);
        if (active) {
          setResults(quotes.slice(0, 7));
          setOpen(true);
        }
      } catch {
        if (active) setResults([]);
      } finally {
        if (active) setLoading(false);
      }
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [q]);

  const go = (symbol: string) => {
    setOpen(false);
    setQ("");
    if (onSelect) onSelect(symbol);
    else router.push(`/stocks/${symbol}`);
  };

  return (
    <div ref={boxRef} className="relative w-full">
      <div className="relative">
        <input
          value={q}
          autoFocus={autoFocus}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => q.trim() && setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && results[0]) go(results[0].symbol);
          }}
          placeholder={placeholder}
          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-9 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 placeholder:text-slate-400 dark:placeholder:text-slate-500"
        />
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        {loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-accent border-t-transparent animate-spin" />
        )}
      </div>

      {open && results.length > 0 && (
        <ul className="absolute z-30 mt-2 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl max-h-80 overflow-auto">
          {results.map((r) => (
            <li key={r.symbol}>
              <button
                type="button"
                onClick={() => go(r.symbol)}
                className="w-full text-left px-4 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between gap-3"
              >
                <span className="min-w-0">
                  <span className="font-semibold">{r.symbol}</span>
                  <span className="ml-2 text-xs text-slate-500 dark:text-slate-400 truncate">
                    {r.name}
                  </span>
                </span>
                {typeof r.price === "number" && (
                  <span className="text-xs tabular-nums text-slate-500 dark:text-slate-400 shrink-0">
                    {r.price.toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}