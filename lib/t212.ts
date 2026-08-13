export interface T212Position {
  instrument?: { ticker?: string; name?: string; currency?: string; isin?: string };
  ticker?: string;
  quantity?: number;
  quantityAvailableForTrading?: number;
  averagePricePaid?: number;
  averagePrice?: number;
  currencyCode?: string;
  currentPrice?: number;
  walletImpact?: {
    currentValue?: number;
    totalCost?: number;
    unrealizedProfitLoss?: number;
  };
}

export interface T212SummaryShape {
  currency?: string;
  currencyCode?: string;
  total?: number;
  cash?: number;
  invested?: number;
}

export interface T212Response {
  ok: boolean;
  configured: boolean;
  env?: "live" | "demo";
  positions?: T212Position[];
  summary?: T212SummaryShape;
  dividends?: unknown[];
  error?: string;
  authHint?: boolean;
}

/** "AAPL_US_EQ" → "AAPL", "BRK.B_US_EQ" → "BRK.B" */
export function t212SymbolFromTicker(ticker: string | undefined): string {
  if (!ticker) return "";
  const base = ticker.split("_")[0] ?? "";
  return base.trim().toUpperCase();
}

export function normalizeT212Position(
  p: T212Position
): { symbol: string; name?: string; shares: number; costBasis: number; currency: string } | null {
  const symbol = t212SymbolFromTicker(p.instrument?.ticker ?? p.ticker);
  const shares = Number(p.quantity ?? p.quantityAvailableForTrading ?? 0);
  if (!symbol || !(shares > 0)) return null;
  return {
    symbol,
    name: p.instrument?.name ?? undefined,
    shares,
    costBasis: Number(p.averagePricePaid ?? p.averagePrice ?? 0),
    currency: p.instrument?.currency ?? p.currencyCode ?? "USD",
  };
}