import type {
  LiveQuote,
  StockInfo,
  NewsItem,
  PricePoint,
  ChartRange,
} from "@/types";

const API = "/api/yahoo";

export const CHART_INTERVALS: Record<ChartRange, string> = {
  "1d": "5m",
  "5d": "30m",
  "1mo": "1d",
  "6mo": "1d",
  "1y": "1d",
  "5y": "1wk",
};

export async function fetchSpark(
  symbols: string[],
  range = "1d",
  interval = "5m"
): Promise<Record<string, LiveQuote>> {
  if (symbols.length === 0) return {};
  const res = await fetch(
    `${API}?type=spark&symbols=${encodeURIComponent(symbols.join(","))}&range=${encodeURIComponent(range)}&interval=${encodeURIComponent(interval)}`
  );
  if (!res.ok) throw new Error(`spark ${res.status}`);
  return (await res.json()) as Record<string, LiveQuote>;
}

export interface ChartPayload {
  points: PricePoint[];
  price: number;
  prevClose: number;
  changePercent: number;
  name?: string;
  exchange?: string;
  currency: string;
  dayHigh?: number;
  dayLow?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  volume?: number;
}

export async function fetchChart(
  symbol: string,
  range: ChartRange = "1y"
): Promise<ChartPayload> {
  const interval = CHART_INTERVALS[range];
  const res = await fetch(
    `${API}?type=chart&symbol=${encodeURIComponent(symbol)}&range=${range}&interval=${interval}`
  );
  if (!res.ok) throw new Error(`chart ${res.status}`);
  return (await res.json()) as ChartPayload;
}

export async function fetchSearch(
  q: string,
  newsCount = 8
): Promise<{ quotes: StockInfo[]; news: NewsItem[] }> {
  const res = await fetch(
    `${API}?type=search&q=${encodeURIComponent(q)}&newsCount=${newsCount}`
  );
  if (!res.ok) throw new Error(`search ${res.status}`);
  return (await res.json()) as { quotes: StockInfo[]; news: NewsItem[] };
}

export async function fetchNews(
  q: string,
  newsCount = 10
): Promise<NewsItem[]> {
  const res = await fetch(
    `${API}?type=news&q=${encodeURIComponent(q)}&newsCount=${newsCount}`
  );
  if (!res.ok) throw new Error(`news ${res.status}`);
  const body = (await res.json()) as { news: NewsItem[] };
  return body.news ?? [];
}

const TEN_SECONDS = 10 * 1000;

export async function fetchStatStock(symbol: string): Promise<StockInfo | undefined> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TEN_SECONDS);
  try {
    const res = await fetch(`${API}?type=chart&symbol=${encodeURIComponent(symbol)}&range=1y&interval=1d`, {
      signal: controller.signal,
    });
    if (!res.ok) return undefined;
    const data = (await res.json()) as ChartPayload;
    if (!data.price) return undefined;
    return {
      symbol,
      name: data.name,
      exchange: data.exchange,
      price: data.price,
      prevClose: data.prevClose,
      changePercent: data.changePercent,
      dayHigh: data.dayHigh,
      dayLow: data.dayLow,
      fiftyTwoWeekHigh: data.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: data.fiftyTwoWeekLow,
      volume: data.volume,
    };
  } catch {
    return undefined;
  } finally {
    clearTimeout(timer);
  }
}