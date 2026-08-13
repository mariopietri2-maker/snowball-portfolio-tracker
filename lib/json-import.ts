import type { ParsedHolding } from "@/lib/csv-parser";

function asString(v: unknown): string | undefined {
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  return undefined;
}

function asNumber(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = parseFloat(v.replace(/[$,]/g, ""));
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

function pick(rec: Record<string, unknown>, keys: string[]): unknown {
  for (const k of keys) {
    if (rec[k] !== undefined && rec[k] !== null && rec[k] !== "") return rec[k];
  }
  return undefined;
}

const SYMBOL_KEYS = ["symbol", "ticker", "stock", "tickerSymbol", "ticker_symbol"];
const SHARES_KEYS = [
  "shares",
  "qty",
  "quantity",
  "units",
  "positionSize",
  "position_size",
  "quantityAvailableForTrading",
];
const COST_KEYS = [
  "costBasis",
  "cost_basis",
  "avgCost",
  "avg_cost",
  "averagePrice",
  "average_price",
  "avgPrice",
  "avg_price",
  "averageCost",
  "average_cost",
  "entryPrice",
  "entry_price",
  "price",
  "cost",
];
const NAME_KEYS = [
  "name",
  "company",
  "description",
  "securityName",
  "security_name",
  "longName",
  "long_name",
];
const CURRENCY_KEYS = ["currency", "currencyCode", "currency_code"];

function findPositionsArray(root: unknown): unknown[] | null {
  if (Array.isArray(root)) return root;
  if (root && typeof root === "object") {
    const rec = root as Record<string, unknown>;
    for (const key of [
      "positions",
      "holdings",
      "assets",
      "items",
      "data",
      "results",
      "portfolio",
    ]) {
      if (Array.isArray(rec[key])) return rec[key] as unknown[];
    }
    for (const key of Object.keys(rec)) {
      if (Array.isArray(rec[key])) return rec[key] as unknown[];
    }
  }
  return null;
}

function extractRecord(item: unknown): Record<string, unknown> | null {
  if (item && typeof item === "object" && !Array.isArray(item)) {
    return item as Record<string, unknown>;
  }
  return null;
}

/**
 * Parses a portfolio payload from a generic JSON API.
 * Accepts a top-level array of positions or an object wrapping one
 * (e.g. `{ positions: [...] }`). Field names are flexible:
 * symbol/ticker, shares/qty/quantity, costBasis/averagePrice/price, name, currency.
 * Duplicate symbols are merged with a weighted-average cost basis.
 */
export function parsePortfolioJSON(text: string): ParsedHolding[] {
  let root: unknown;
  try {
    root = JSON.parse(text);
  } catch {
    throw new Error("That's not valid JSON. Check for missing brackets, quotes, or commas.");
  }

  const list = findPositionsArray(root);
  if (!list || list.length === 0) {
    throw new Error(
      "Couldn't find a list of positions in the JSON. Expected an array like [{symbol, shares, costBasis}] or an object with a positions/holdings array."
    );
  }

  const holdings: ParsedHolding[] = [];
  for (const item of list) {
    const rec = extractRecord(item);
    if (!rec) continue;
    const symbol = asString(pick(rec, SYMBOL_KEYS));
    const shares = asNumber(pick(rec, SHARES_KEYS));
    if (!symbol || !(shares && shares > 0)) continue;

    holdings.push({
      symbol: symbol.toUpperCase().trim(),
      shares,
      costBasis: asNumber(pick(rec, COST_KEYS)) ?? 0,
      name: asString(pick(rec, NAME_KEYS)),
      currency: asString(pick(rec, CURRENCY_KEYS)) || "USD",
    });
  }

  if (holdings.length === 0) {
    throw new Error(
      "No valid positions found in the JSON. Each item needs at least a symbol and a positive quantity."
    );
  }

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
