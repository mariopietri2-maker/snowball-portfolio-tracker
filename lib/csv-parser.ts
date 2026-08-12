import Papa from "papaparse";
import { Holding } from "@/types";
import { BROKER_PRESETS, BrokerPresetMapping } from "@/lib/broker-presets";

export interface ParsedHolding {
  symbol: string;
  shares: number;
  costBasis: number;
  name?: string;
  currency?: string;
}

function findRow(row: Record<string, string>, fields: string[]): string | undefined {
  for (const f of fields) {
    const v = row[f];
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return undefined;
}

/**
 * Parses a broker CSV export using a preset column mapping.
 * Looks for symbol / quantity / average-cost columns per broker type.
 * Duplicate symbols are merged with a weighted-average cost basis.
 */
export function parsePortfolioCSV(
  csvText: string,
  mapping: BrokerPresetMapping = BROKER_PRESETS.generic
): ParsedHolding[] {
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
    const symbol = findRow(row, mapping.symbol);
    const sharesStr = findRow(row, mapping.shares);

    if (!symbol || !sharesStr) continue;

    const shares = parseFloat(sharesStr.replace(/,/g, ""));
    if (isNaN(shares) || shares <= 0) continue;

    const costStr = findRow(row, mapping.cost);
    const costBasis = costStr ? parseFloat(costStr.replace(/[$,]/g, "")) : 0;

    holdings.push({
      symbol: symbol.toUpperCase().trim(),
      shares,
      costBasis: isNaN(costBasis) ? 0 : costBasis,
      name: findRow(row, mapping.name),
      currency: row["currency"] || "USD",
    });
  }

  // Merge duplicate symbols with a weighted-average cost basis
  const bySymbol = new Map<string, ParsedHolding>();
  for (const h of holdings) {
    const existing = bySymbol.get(h.symbol);
    if (!existing) {
      bySymbol.set(h.symbol, h);
      continue;
    }
    const totalShares = existing.shares + h.shares;
    const totalCost = existing.shares * existing.costBasis + h.shares * h.costBasis;
    bySymbol.set(h.symbol, {
      ...existing,
      shares: totalShares,
      costBasis: totalShares > 0 ? totalCost / totalShares : 0,
      name: existing.name || h.name,
    });
  }

  return Array.from(bySymbol.values());
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