import type {
  Holding,
  DividendEvent,
  BrokerAccount,
  SnowballProjection,
} from "@/types";

export function mergeAccountHoldings(accounts: BrokerAccount[]): Holding[] {
  const bySymbol = new Map<string, Holding>();
  for (const acc of accounts) {
    for (const h of acc.holdings) {
      const existing = bySymbol.get(h.symbol);
      if (!existing) {
        bySymbol.set(h.symbol, { ...h });
        continue;
      }
      const totalShares = existing.shares + h.shares;
      const totalCost = existing.shares * existing.costBasis + h.shares * h.costBasis;
      bySymbol.set(h.symbol, {
        ...existing,
        shares: totalShares,
        costBasis: totalShares > 0 ? totalCost / totalShares : 0,
        name: existing.name || h.name,
        sector: existing.sector || h.sector,
        exchange: existing.exchange || h.exchange,
      });
    }
  }
  return Array.from(bySymbol.values());
}

export function calculatePortfolioMetrics(
  holdings: Holding[],
  prices: Record<string, number> = {}
) {
  let totalCost = 0;
  let totalValue = 0;

  const detailed = holdings.map((h) => {
    const price = prices[h.symbol] ?? h.costBasis; // fallback to cost if no live price
    const marketValue = h.shares * price;
    const cost = h.shares * h.costBasis;
    const gain = marketValue - cost;
    const gainPercent = cost > 0 ? (gain / cost) * 100 : 0;

    totalCost += cost;
    totalValue += marketValue;

    return {
      ...h,
      currentPrice: price,
      marketValue,
      cost,
      gain,
      gainPercent,
    };
  });

  const totalGain = totalValue - totalCost;
  const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

  return {
    holdings: detailed,
    totalCost,
    totalValue,
    totalGain,
    totalGainPercent,
  };
}

export function allocationByHolding(detailed: ReturnType<typeof calculatePortfolioMetrics>["holdings"]) {
  const sorted = [...detailed].sort((a, b) => b.marketValue - a.marketValue);
  const top = sorted.slice(0, 8);
  const rest = sorted.slice(8);
  const total = detailed.reduce((s, h) => s + h.marketValue, 0);

  const data = top.map((h) => ({
    name: h.symbol,
    value: h.marketValue,
    pct: total > 0 ? (h.marketValue / total) * 100 : 0,
  }));

  const restValue = rest.reduce((s, h) => s + h.marketValue, 0);
  if (restValue > 0 && total > 0) {
    data.push({
      name: "Other",
      value: restValue,
      pct: (restValue / total) * 100,
    });
  }

  return { data, total };
}

export function estimateDividendIncome(
  holdings: Holding[],
  dividends: DividendEvent[],
  defaultYieldPct: number
) {
  const sharesBySymbol = new Map<string, number>();
  for (const h of holdings) {
    sharesBySymbol.set(h.symbol, (sharesBySymbol.get(h.symbol) ?? 0) + h.shares);
  }

  const now = Date.now();
  const yearMs = 365 * 24 * 60 * 60 * 1000;

  let fromEvents = 0;
  const eventSymbols = new Set<string>();
  for (const d of dividends) {
    if (d.status !== "paid") continue;
    eventSymbols.add(d.symbol);
    const paidAt = new Date(d.payDate).getTime();
    if (!Number.isNaN(paidAt) && now - paidAt <= yearMs) {
      const shares = sharesBySymbol.get(d.symbol) ?? 0;
      fromEvents += shares * d.amountPerShare;
    }
  }

  let estimated = 0;
  for (const h of holdings) {
    if (eventSymbols.has(h.symbol)) continue;
    estimated += h.shares * h.costBasis * (defaultYieldPct / 100);
  }

  return {
    fromEvents,
    estimated,
    total: fromEvents + estimated,
  };
}

/**
 * Simple snowball (compound growth) projection.
 * Assumes annual dividend yield and reinvestment + optional additional yearly contribution.
 */
export function projectSnowball({
  startingValue,
  annualContribution = 0,
  expectedReturn = 0.08, // 8%
  dividendYield = 0.025, // 2.5%
  years = 20,
  reinvestDividends = true,
}: {
  startingValue: number;
  annualContribution?: number;
  expectedReturn?: number;
  dividendYield?: number;
  years?: number;
  reinvestDividends?: boolean;
}): SnowballProjection[] {
  const projections: SnowballProjection[] = [];
  let value = startingValue;
  let cumulativeDividends = 0;

  for (let year = 1; year <= years; year++) {
    const dividends = value * dividendYield;
    cumulativeDividends += dividends;

    // Capital appreciation (ex-dividend return approx)
    const capitalReturn = expectedReturn - dividendYield;
    value = value * (1 + capitalReturn);

    if (reinvestDividends) {
      value += dividends;
    }

    value += annualContribution;

    projections.push({
      year,
      portfolioValue: Math.round(value),
      dividendsReceived: Math.round(dividends),
      cumulativeDividends: Math.round(cumulativeDividends),
    });
  }

  return projections;
}

export function formatCurrency(value: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCompact(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatPercent(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatTime(ts?: number) {
  if (!ts) return "";
  return new Date(ts * 1000).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function timeAgo(ts?: number) {
  if (!ts) return "";
  const diff = Math.max(0, Date.now() / 1000 - ts);
  const mins = Math.floor(diff / 60);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const PALLETTE = ["#0ea5e9", "#8b5cf6", "#10b981", "#f59e0b", "#f43f5e", "#06b6d4", "#84cc16", "#eab308"];

export function colorForSymbol(symbol: string) {
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) {
    hash = (hash * 31 + symbol.charCodeAt(i)) >>> 0;
  }
  return PALLETTE[hash % PALLETTE.length];
}