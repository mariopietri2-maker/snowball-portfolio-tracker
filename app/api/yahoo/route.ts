import { NextRequest, NextResponse } from "next/server";
import {
  transformSpark,
  transformChart,
  transformSearch,
  type ChartDocShape,
  type SearchDocShape,
} from "@/lib/yahoo-transform";

const YH = "https://query1.finance.yahoo.com";

const cache = new Map<string, { at: number; data: unknown }>();

function cached(key: string, ttlMs: number) {
  const rec = cache.get(key);
  if (rec && Date.now() - rec.at < ttlMs) return rec.data;
  return undefined;
}

function put(key: string, data: unknown) {
  if (cache.size > 500) {
    const oldest = Array.from(cache.keys()).shift();
    if (oldest) cache.delete(oldest);
  }
  cache.set(key, { at: Date.now(), data });
}

async function yahoo<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        accept: "application/json",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
      },
    });
    if (!res.ok) throw new Error(`Yahoo responded ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

export async function GET(req: NextRequest) {
  const p = new URL(req.url).searchParams;
  const type = p.get("type") ?? "spark";
  const symbols = (p.get("symbols") ?? "").split(",").filter(Boolean).slice(0, 50);
  const symbol = (p.get("symbol") ?? "").trim().toUpperCase();
  const range = p.get("range") ?? "3mo";
  const interval = p.get("interval") ?? "1d";
  const q = (p.get("q") ?? "").trim();
  const newsCount = p.get("newsCount") ?? "10";

  try {
    if (type === "spark") {
      const key = `spark:${symbols.join(",")}:${range}:${interval}`;
      const hit = cached(key, 60_000);
      if (hit) return NextResponse.json(hit);
      const doc = await yahoo<Record<string, unknown>>(
        `${YH}/v8/finance/spark?symbols=${symbols.join(",")}&range=${encodeURIComponent(range)}&interval=${encodeURIComponent(interval)}`
      );
      const data = transformSpark(doc);
      put(key, data);
      return NextResponse.json(data);
    }

    if (type === "chart") {
      const key = `chart:${symbol}:${range}:${interval}`;
      const hit = cached(key, 15 * 60_000);
      if (hit) return NextResponse.json(hit);
      const doc = await yahoo<ChartDocShape>(
        `${YH}/v8/finance/chart/${symbol}?range=${encodeURIComponent(range)}&interval=${encodeURIComponent(interval)}&includePrePost=false`
      );
      const data = transformChart(doc);
      put(key, data);
      return NextResponse.json(data);
    }

    if (type === "search" || type === "news") {
      const key = `${type}:${q}:${newsCount}`;
      const hit = cached(key, 5 * 60_000);
      if (hit) return NextResponse.json(hit);
      const doc = await yahoo<SearchDocShape>(
        `${YH}/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=8&newsCount=${newsCount}`
      );
      const transformed = transformSearch(doc);
      put(key, transformed);
      const body = type === "news" ? { news: transformed.news } : transformed;
      return NextResponse.json(body);
    }

    return NextResponse.json({ error: "unknown-type" }, { status: 400 });
  } catch (err) {
    console.error("[yahoo]", type, err);
    return NextResponse.json({ error: "upstream-failure" }, { status: 502 });
  }
}