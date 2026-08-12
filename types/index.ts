export type BrokerPreset =
  | "generic"
  | "schwab"
  | "ibkr"
  | "robinhood"
  | "tastytrade";

export interface Holding {
  id: string;
  symbol: string;
  name?: string;
  shares: number;
  costBasis: number; // average cost per share
  currency?: string;
  exchange?: string;
  sector?: string;
  notes?: string;
  addedAt: string; // ISO date
}

export interface BrokerAccount {
  id: string;
  name: string;
  broker: BrokerPreset;
  currency: string;
  holdings: Holding[];
  createdAt: string;
}

export interface DividendEvent {
  id: string;
  symbol: string;
  amountPerShare: number;
  exDate: string; // ISO
  payDate: string; // ISO
  currency?: string;
  status: "upcoming" | "paid" | "estimated";
}

export interface PortfolioSnapshot {
  date: string; // ISO
  totalValue: number;
}

export interface SnowballProjection {
  year: number;
  portfolioValue: number;
  dividendsReceived: number;
  cumulativeDividends: number;
}

export interface LiveQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  prevClose?: number;
  currency?: string;
  series?: number[]; // sparkline (optional, for mini charts)
}

export interface NewsItem {
  title: string;
  publisher: string;
  link: string;
  providerPublishTime?: number;
  type?: string;
  thumbnail?: string | null;
  relatedTickers?: string[];
}

export interface StockInfo {
  symbol: string;
  name?: string;
  shortName?: string;
  exchange?: string;
  price?: number;
  changePercent?: number;
  prevClose?: number;
  dayHigh?: number;
  dayLow?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  volume?: number;
}

export interface PricePoint {
  timestamp: number;
  value: number;
}

export type ChartRange = "1d" | "5d" | "1mo" | "6mo" | "1y" | "5y";

export type AccentColor =
  | "sky"
  | "cyan"
  | "violet"
  | "emerald"
  | "rose"
  | "amber";

export interface PriceAlert {
  id: string;
  symbol: string;
  direction: "above" | "below";
  targetPrice: number;
  createdAt: string;
}

export interface UserPreferences {
  userName: string;
  avatarColor: string;
  currency: string;
  theme: "dark" | "light";
  accent: AccentColor;
  refreshSeconds: number;
  defaultYieldPct: number;
}