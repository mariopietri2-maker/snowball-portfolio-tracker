import { describe, it, expect } from "vitest";
import { t212SymbolFromTicker, normalizeT212Position } from "@/lib/t212";

describe("t212SymbolFromTicker", () => {
  it("strips the exchange suffix", () => {
    expect(t212SymbolFromTicker("AAPL_US_EQ")).toBe("AAPL");
  });

  it("handles dotted tickers", () => {
    expect(t212SymbolFromTicker("BRK.B_US_EQ")).toBe("BRK.B");
  });

  it("handles undefined input", () => {
    expect(t212SymbolFromTicker(undefined)).toBe("");
  });
});

describe("normalizeT212Position", () => {
  it("maps instrument fields into a holding", () => {
    const result = normalizeT212Position({
      instrument: { ticker: "AAPL_US_EQ", name: "Apple Inc", currency: "USD" },
      quantity: 10,
      averagePricePaid: 150,
    });
    expect(result).toEqual({
      symbol: "AAPL",
      name: "Apple Inc",
      shares: 10,
      costBasis: 150,
      currency: "USD",
    });
  });

  it("returns null for missing symbols or zero quantity", () => {
    expect(normalizeT212Position({ quantity: 0 })).toBeNull();
    expect(normalizeT212Position({ quantity: 5 })).toBeNull();
    expect(normalizeT212Position({ instrument: { ticker: "" }, quantity: 3 })).toBeNull();
  });
});
