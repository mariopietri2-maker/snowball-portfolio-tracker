import type { BrokerPreset } from "@/types";

/**
 * Column aliases (lowercased) used to find each field in a broker CSV export.
 * `sharesFields` are quantity columns; `costFields` are average-cost columns.
 * "amount"-style money columns are intentionally excluded from shares to avoid
 * misparsing exports where Amount means money, not quantity.
 */
export interface BrokerPresetMapping {
  symbol: string[];
  shares: string[];
  cost: string[];
  name: string[];
  exchange?: string[];
}

export const BROKER_PRESETS: Record<BrokerPreset, BrokerPresetMapping> = {
  generic: {
    symbol: ["symbol", "ticker", "ticker symbol", "stock", "security"],
    shares: ["shares", "quantity", "qty", "units", "position size"],
    cost: [
      "cost basis",
      "avg cost",
      "average cost",
      "cost",
      "price",
      "unit cost",
      "average price",
    ],
    name: ["name", "description", "company", "security name"],
  },
  schwab: {
    symbol: ["symbol", "ticker"],
    shares: ["quantity", "qty", "shares"],
    cost: ["cost basis", "avg cost", "average cost", "unit cost"],
    name: ["security name", "security description", "name"],
  },
  ibkr: {
    symbol: ["symbol", "ticker", "conid symbol"],
    shares: ["quantity", "position", "shares", "qty"],
    cost: ["cost basis", "avg cost", "average price", "open price"],
    name: ["name", "security", "description"],
  },
  robinhood: {
    symbol: ["symbol", "ticker"],
    shares: ["quantity", "qty", "shares"],
    cost: ["average buy price", "avg buy price", "average_buy_price", "cost basis"],
    name: ["name", "security name"],
  },
  tastytrade: {
    symbol: ["symbol", "underlying symbol"],
    shares: ["quantity", "qty", "shares"],
    cost: ["cost basis per share", "avg cost", "basis"],
    name: ["underlying symbol name", "name"],
  },
};

export const BROKER_LABELS: Record<BrokerPreset, string> = {
  generic: "Generic",
  schwab: "Charles Schwab",
  ibkr: "Interactive Brokers",
  robinhood: "Robinhood",
  tastytrade: "tastytrade",
};

export function presetFromId(id: string): BrokerPreset {
  return (BROKER_PRESETS[id as BrokerPreset] ? id : "generic") as BrokerPreset;
}