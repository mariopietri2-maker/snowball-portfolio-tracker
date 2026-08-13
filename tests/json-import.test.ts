import { describe, it, expect } from "vitest";
import { parsePortfolioJSON } from "@/lib/json-import";

describe("parsePortfolioJSON", () => {
  it("parses a top-level array with camelCase fields", () => {
    const parsed = parsePortfolioJSON(
      '[{"symbol":"AAPL","shares":10,"costBasis":150,"name":"Apple Inc"}]'
    );
    expect(parsed).toEqual([
      { symbol: "AAPL", shares: 10, costBasis: 150, name: "Apple Inc", currency: "USD" },
    ]);
  });

  it("finds positions wrapped in an object", () => {
    const parsed = parsePortfolioJSON(
      JSON.stringify({ positions: [{ ticker: "MSFT", quantity: 5, averagePrice: 200 }] })
    );
    expect(parsed[0]).toMatchObject({ symbol: "MSFT", shares: 5, costBasis: 200 });
  });

  it("supports snake_case and alias field names", () => {
    const parsed = parsePortfolioJSON(
      JSON.stringify({ holdings: [{ symbol: "AAPL", qty: 4, avg_cost: 100 }] })
    );
    expect(parsed[0]).toMatchObject({ symbol: "AAPL", shares: 4, costBasis: 100 });
  });

  it("keeps a provided currency", () => {
    const parsed = parsePortfolioJSON(
      JSON.stringify([{ symbol: "SHEL", shares: 1, currency: "GBP" }])
    );
    expect(parsed[0].currency).toBe("GBP");
  });

  it("merges duplicate symbols with weighted-average cost basis", () => {
    const parsed = parsePortfolioJSON(
      '[{"symbol":"AAPL","shares":10,"price":100},{"symbol":"AAPL","shares":30,"price":200}]'
    );
    expect(parsed).toHaveLength(1);
    expect(parsed[0]).toMatchObject({ shares: 40, costBasis: 175 });
  });

  it("throws a helpful error on invalid JSON", () => {
    expect(() => parsePortfolioJSON("{not json")).toThrow(/not valid JSON/i);
  });

  it("throws when no positions array exists", () => {
    expect(() => parsePortfolioJSON('{"foo":"bar"}')).toThrow(/list of positions/i);
  });

  it("throws when no item has a valid symbol + quantity", () => {
    expect(() => parsePortfolioJSON('[{"name":"X"}]')).toThrow(/No valid positions/i);
  });
});
