import { Holding, SnowballProjection } from "@/types";

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

export function formatPercent(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}
