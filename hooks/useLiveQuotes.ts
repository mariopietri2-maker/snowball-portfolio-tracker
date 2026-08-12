"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { fetchSpark } from "@/lib/prices";
import type { LiveQuote } from "@/types";

export function useLiveQuotes(symbols: string[], refreshSeconds = 60) {
  const [quotes, setQuotes] = useState<Record<string, LiveQuote>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const symbolsRef = useRef<string[]>([]);

  const normalized = symbols
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean)
    .filter((s, i, arr) => arr.indexOf(s) === i);
  const symbolsKey = normalized.join(",");

  symbolsRef.current = normalized;

  const refresh = useCallback(async () => {
    const syms = symbolsRef.current;
    if (syms.length === 0) {
      setQuotes({});
      setLoading(false);
      return;
    }
    try {
      const data = await fetchSpark(syms);
      setQuotes((prev) => ({ ...prev, ...data }));
      setError(false);
      setLastUpdated(new Date());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    refresh();
    const timer = setInterval(refresh, Math.max(refreshSeconds, 15) * 1000);
    return () => clearInterval(timer);
  }, [refresh, symbolsKey, refreshSeconds]);

  return { quotes, loading, error, lastUpdated, refresh };
}