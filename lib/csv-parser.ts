import Papa from "papaparse";
import { Holding } from "@/types";

export interface ParsedHolding {
  symbol: string;
  shares: number;
  costBasis: number;
  name?: string;
  currency?: string;
}

/**
 * Attempts to parse common portfolio CSV exports.
 * Looks for columns like: Symbol / Ticker, Shares / Quantity, Cost / Avg Cost / Price
 */
export function parsePortfolioCSV(csvText: string): ParsedHolding[] {
  const result = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase(),
  });

  if (result.errors.length > 0) {
    console.warn("CSV parse warnings:", result.errors);
  }

  const rows = result.data as Record<string, string>[];

  const holdings: ParsedHolding[] = [];

  for (const row of rows) {
    const symbol =
      row["symbol"] ||
      row["ticker"] ||
      row["ticker symbol"] ||
      row["stock"] ||
      row["security"];

    const sharesStr =
      row["shares"] ||
      row["quantity"] ||
      row["qty"] ||
      row["units"] ||
      row["amount"];

    const costStr =
      row["cost basis"] ||
      row["avg cost"] ||
      row["average cost"] ||
      row["cost"] ||
      row["price"] ||
      row["unit cost"] ||
      row["average price"];

    if (!symbol || !sharesStr) continue;

    const shares = parseFloat(sharesStr.replace(/,/g, ""));
    const costBasis = costStr ? parseFloat(costStr.replace(/[$,]/g, "")) : 0;

    if (isNaN(shares) || shares <= 0) continue;

    holdings.push({
      symbol: symbol.toUpperCase().trim(),
      shares,
      costBasis: isNaN(costBasis) ? 0 : costBasis,
      name: row["name"] || row["description"] || row["company"],
      currency: row["currency"] || "USD",
    });
  }

  return holdings;
}

export function holdingsFromParsed(
  parsed: ParsedHolding[]
): Omit<Holding, "id" | "addedAt">[] {
  return parsed.map((p) => ({
    symbol: p.symbol,
    shares: p.shares,
    costBasis: p.costBasis,
    name: p.name,
    currency: p.currency || "USD",
  }));
}
