import { describe, it, expect } from "vitest";
import { parsePortfolioCSV, holdingsFromParsed } from "@/lib/csv-parser";
import { BROKER_PRESETS } from "@/lib/broker-presets";

describe("parsePortfolioCSV", () => {
  it("parses a generic CSV export", () => {
    const csv = "Symbol,Shares,Avg Cost,Name\nAAPL,10,150,Apple Inc\nMSFT,5,200,Microsoft";
    const parsed = parsePortfolioCSV(csv, BROKER_PRESETS.generic);
    expect(parsed).toHaveLength(2);
    expect(parsed[0]).toMatchObject({
      symbol: "AAPL",
      shares: 10,
      costBasis: 150,
      name: "Apple Inc",
    });
  });

  it("uppercases and trims symbols", () => {
    const csv = "symbol,quantity,price\n  aapl ,10,100";
    const parsed = parsePortfolioCSV(csv, BROKER_PRESETS.generic);
    expect(parsed[0].symbol).toBe("AAPL");
  });

  it("merges duplicate symbols with weighted-average cost basis", () => {
    const csv = "Symbol,Shares,Avg Cost\nAAPL,10,100\nAAPL,30,200";
    const parsed = parsePortfolioCSV(csv, BROKER_PRESETS.generic);
    expect(parsed).toHaveLength(1);
    expect(parsed[0]).toMatchObject({ shares: 40, costBasis: 175 });
  });

  it("skips rows without a symbol or positive shares", () => {
    const csv = "Symbol,Shares,Avg Cost\nAAPL,10,100\nMSFT,,200\n,5,100";
    const parsed = parsePortfolioCSV(csv, BROKER_PRESETS.generic);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].symbol).toBe("AAPL");
  });
});

describe("holdingsFromParsed", () => {
  it("converts parsed rows to holding-shaped objects", () => {
    const parsed = parsePortfolioCSV(
      "Symbol,Shares,Avg Cost\nAAPL,10,150",
      BROKER_PRESETS.generic
    );
    const holdings = holdingsFromParsed(parsed);
    expect(holdings[0]).toEqual({
      symbol: "AAPL",
      shares: 10,
      costBasis: 150,
      name: undefined,
      currency: "USD",
    });
  });
});
