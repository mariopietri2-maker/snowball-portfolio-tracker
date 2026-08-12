export interface Holding {
  id: string;
  symbol: string;
  name?: string;
  shares: number;
  costBasis: number; // average cost per share
  currency?: string;
  exchange?: string;
  notes?: string;
  addedAt: string; // ISO date
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
  date: string;
  totalValue: number;
  totalCost: number;
  totalGain: number;
  totalGainPercent: number;
}

export interface SnowballProjection {
  year: number;
  portfolioValue: number;
  dividendsReceived: number;
  cumulativeDividends: number;
}
