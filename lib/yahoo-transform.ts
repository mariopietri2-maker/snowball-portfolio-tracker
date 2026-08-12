/* Transforms for Yahoo Finance responses. Kept out of the route module
   because Next.js route files may only export HTTP handlers. */

export interface SparkResult {
  symbol: string;
  response: Array<{
    meta?: {
      regularMarketPrice?: number;
      chartPreviousClose?: number;
      currency?: string;
    };
    timestamp?: number[];
    indicators?: { quote?: Array<{ close?: Array<number | null> }> };
  }>;
}

export interface SparkFlat {
  symbol?: string;
  timestamp?: number[];
  close?: Array<number | null>;
  previousClose?: number;
  chartPreviousClose?: number;
}

export function transformSpark(doc: Record<string, unknown>) {
  const out: Record<string, unknown> = {};

  // Legacy shape: { spark: { result: [ { symbol, response: [...] } ] } }
  const legacy = (doc as { spark?: { result?: SparkResult[] } }).spark?.result;
  if (Array.isArray(legacy) && legacy.length > 0) {
    for (const r of legacy) {
      const resp = r.response?.[0];
      const meta = resp?.meta ?? {};
      const closes = resp?.indicators?.quote?.[0]?.close ?? [];
      const last =
        typeof meta.regularMarketPrice === "number"
          ? meta.regularMarketPrice
          : closes[closes.length - 1];
      const prev =
        meta.chartPreviousClose ??
        (closes.length > 1 ? closes[closes.length - 2] : last);
      const price = typeof last === "number" ? last : 0;
      const prevPrice = typeof prev === "number" ? prev : price;
      const change = price - prevPrice;
      out[r.symbol] = {
        symbol: r.symbol,
        price,
        change,
        changePercent: prevPrice ? (change / prevPrice) * 100 : 0,
        prevClose: prevPrice,
        currency: meta.currency ?? "USD",
        series: closes
          .filter((c): c is number => typeof c === "number")
          .slice(-120),
      };
    }
    return out;
  }

  // New flat shape: { "AAPL": { timestamp, close, previousClose, chartPreviousClose } }
  for (const [sym, raw] of Object.entries(doc)) {
    const f = raw as SparkFlat | undefined;
    if (!f || !Array.isArray(f.close)) continue;
    const symbol = f.symbol ?? sym;
    const closes = f.close.filter((c): c is number => typeof c === "number");
    const last = closes.length ? closes[closes.length - 1] : 0;
    const prev = f.previousClose ?? f.chartPreviousClose ?? last;
    const price = typeof last === "number" ? last : 0;
    const prevPrice = typeof prev === "number" ? prev : price;
    const change = price - prevPrice;
    out[symbol] = {
      symbol,
      price,
      change,
      changePercent: prevPrice ? (change / prevPrice) * 100 : 0,
      prevClose: prevPrice,
      currency: "USD",
      series: closes.slice(-120),
    };
  }
  return out;
}

interface ChartDoc {
  chart?: {
    result?: Array<{
      meta?: {
        regularMarketPrice?: number;
        chartPreviousClose?: number;
        previousClose?: number;
        currency?: string;
        longName?: string;
        shortName?: string;
        exchangeName?: string;
        fiftyTwoWeekHigh?: number;
        fiftyTwoWeekLow?: number;
        regularMarketDayHigh?: number;
        regularMarketDayLow?: number;
        regularMarketVolume?: number;
      };
      timestamp?: number[];
      indicators?: { quote?: Array<{ close?: Array<number | null> }> };
    }>;
    error?: { code?: string; description?: string };
  };
}

export interface ChartDocShape {
  chart?: ChartDoc["chart"];
}

export function transformChart(doc: ChartDocShape) {
  const result = doc.chart?.result?.[0];
  const meta = result?.meta ?? {};
  const closes = result?.indicators?.quote?.[0]?.close ?? [];
  const times = result?.timestamp ?? [];

  const points = times
    .map((t, i) => ({ timestamp: t, value: closes[i] }))
    .filter((p): p is { timestamp: number; value: number } =>
      typeof p.value === "number" && !Number.isNaN(p.value)
    );

  const prices = closes.filter((c): c is number => typeof c === "number");
  const last = meta.regularMarketPrice ?? prices[prices.length - 1] ?? 0;
  const prev = meta.chartPreviousClose ?? meta.previousClose ?? last;
  const changePercent = prev ? ((last - prev) / prev) * 100 : 0;

  return {
    points,
    name: meta.longName ?? meta.shortName ?? undefined,
    exchange: meta.exchangeName,
    currency: meta.currency ?? "USD",
    price: last,
    prevClose: prev,
    changePercent,
    dayHigh: meta.regularMarketDayHigh,
    dayLow: meta.regularMarketDayLow,
    fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh,
    fiftyTwoWeekLow: meta.fiftyTwoWeekLow,
    volume: meta.regularMarketVolume,
    error: doc.chart?.error,
  };
}

interface SearchDoc {
  quotes?: Array<{
    symbol?: string;
    shortname?: string;
    longname?: string;
    exchDisp?: string;
    regularMarketPrice?: number;
    regularMarketChangePercent?: number;
  }>;
  news?: Array<{
    title?: string;
    publisher?: string;
    link?: string;
    providerPublishTime?: number;
    type?: string;
    relatedTickers?: string[];
    thumbnail?: { resolutions?: Array<{ url?: string }> };
  }>;
}

export interface SearchDocShape {
  quotes?: SearchDoc["quotes"];
  news?: SearchDoc["news"];
}

export function transformSearch(doc: SearchDocShape) {
  const quotes = (doc.quotes ?? [])
    .filter((q) => q.symbol)
    .map((q) => ({
      symbol: q.symbol as string,
      name: q.longname ?? q.shortname,
      exchange: q.exchDisp,
      price: q.regularMarketPrice,
      changePercent: q.regularMarketChangePercent,
    }));

  const news = (doc.news ?? [])
    .filter((n) => n.title && n.link)
    .map((n) => ({
      title: n.title as string,
      publisher: n.publisher ?? "News",
      link: n.link as string,
      providerPublishTime: n.providerPublishTime,
      type: n.type,
      relatedTickers: n.relatedTickers,
      thumbnail: n.thumbnail?.resolutions?.[0]?.url ?? null,
    }));

  return { quotes, news };
}