import { describe, it, expect } from "vitest";
import {
  mergeAccountHoldings,
  calculatePortfolioMetrics,
  allocationByHolding,
  estimateDividendIncome,
  projectSnowball,
  colorForSymbol,
  formatPercent,
} from "@/lib/finance";
import type { BrokerAccount, Holding, DividendEvent } from "@/types";

function makeHolding(
  symbol: string,
  shares: number,
  costBasis: number,
  name?: string
): Holding {
  return {
    id: `${symbol}-1`,
    symbol,
    shares,
    costBasis,
    name,
    addedAt: new Date().toISOString(),
  };
}

function account(id: string, holdings: Holding[]): BrokerAccount {
  return { id, name: id, broker: "generic", currency: "USD", createdAt: "", holdings };
}

describe("mergeAccountHoldings", () => {
  it("merges the same symbol across accounts with weighted-average cost", () => {
    const accounts = [
      account("a", [makeHolding("AAPL", 10, 100), makeHolding("MSFT", 5, 200)]),
      account("b", [makeHolding("AAPL", 30, 200)]),
    ];
    const merged = mergeAccountHoldings(accounts);
    expect(merged).toHaveLength(2);
    const aapl = merged.find((h) => h.symbol === "AAPL")!;
    expect(aapl.shares).toBe(40);
    expect(aapl.costBasis).toBe(175); // (10*100 + 30*200) / 40
  });

  it("combines names across duplicate symbols", () => {
    const accounts = [
      account("a", [makeHolding("AAPL", 1, 100, "Apple Inc")]),
      account("b", [makeHolding("AAPL", 2, 100)]),
    ];
    const [aapl] = mergeAccountHoldings(accounts);
    expect(aapl.name).toBe("Apple Inc");
  });
});

describe("calculatePortfolioMetrics", () => {
  it("falls back to cost basis when a live price is missing", () => {
    const m = calculatePortfolioMetrics([makeHolding("AAPL", 10, 100)]);
    expect(m.totalValue).toBe(1000);
    expect(m.totalGain).toBe(0);
    expect(m.totalGainPercent).toBe(0);
  });

  it("computes gain with live prices", () => {
    const m = calculatePortfolioMetrics([makeHolding("AAPL", 10, 100)], { AAPL: 150 });
    expect(m.totalValue).toBe(1500);
    expect(m.totalGain).toBe(500);
    expect(m.totalGainPercent).toBe(50);
    expect(m.holdings[0].currentPrice).toBe(150);
    expect(m.holdings[0].marketValue).toBe(1500);
  });
});

describe("allocationByHolding", () => {
  it("groups holdings beyond the top 8 into Other", () => {
    const holdings = Array.from({ length: 10 }, (_, i) => makeHolding(`T${i}`, 1, 100));
    const detailed = calculatePortfolioMetrics(holdings).holdings;
    const alloc = allocationByHolding(detailed);
    expect(alloc.data).toHaveLength(9);
    expect(alloc.data[8].name).toBe("Other");
    expect(alloc.data[8].value).toBe(200);
  });
});

describe("estimateDividendIncome", () => {
  const paidDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  it("counts paid events within the last year", () => {
    const dividends: DividendEvent[] = [
      { id: "d1", symbol: "AAPL", amountPerShare: 2, exDate: paidDate, payDate: paidDate, status: "paid" },
    ];
    const income = estimateDividendIncome([makeHolding("AAPL", 10, 100)], dividends, 2);
    expect(income.fromEvents).toBe(20);
    expect(income.estimated).toBe(0);
    expect(income.total).toBe(20);
  });

  it("estimates yield at market price when available", () => {
    const income = estimateDividendIncome([makeHolding("MSFT", 10, 100)], [], 5, {
      MSFT: 300,
    });
    expect(income.estimated).toBe(150); // 10 * 300 * 5%
  });

  it("falls back to cost basis without a price", () => {
    const income = estimateDividendIncome([makeHolding("MSFT", 10, 100)], [], 5);
    expect(income.estimated).toBe(50); // 10 * 100 * 5%
  });
});

describe("projectSnowball", () => {
  it("compounds with dividend reinvestment", () => {
    const [p] = projectSnowball({
      startingValue: 1000,
      annualContribution: 0,
      expectedReturn: 0.1,
      dividendYield: 0.02,
      years: 1,
      reinvestDividends: true,
    });
    // capitalReturn = 10% - 2% = 8%; dividends = 1000*2% = 20 → 1080 + 20 = 1100
    expect(p.portfolioValue).toBe(1100);
    expect(p.dividendsReceived).toBe(20);
    expect(p.cumulativeDividends).toBe(20);
  });
});

describe("formatting helpers", () => {
  it("formats percent with a sign", () => {
    expect(formatPercent(0.5)).toBe("+0.50%");
    expect(formatPercent(-1.25)).toBe("-1.25%");
  });

  it("returns a deterministic hex color", () => {
    expect(colorForSymbol("AAPL")).toBe(colorForSymbol("AAPL"));
    expect(colorForSymbol("AAPL")).toMatch(/^#[0-9a-f]{6}$/i);
  });
});
