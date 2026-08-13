import { NextResponse } from "next/server";

const API_KEY = process.env.T212_API_KEY ?? "";
const API_SECRET = process.env.T212_API_SECRET ?? "";
const ENV = process.env.T212_ENV === "demo" ? "demo" : "live";
const BASE = `https://${ENV}.trading212.com/api/v0`;

export const dynamic = "force-dynamic";

async function t212Fetch(path: string, headers: Record<string, string>) {
  const res = await fetch(`${BASE}${path}`, {
    headers,
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw Object.assign(new Error(`T212 ${res.status}`), {
      status: res.status,
      body: text.slice(0, 200),
    } as Error & { status: number; body: string });
  }
  return res.json();
}

export async function GET() {
  if (!API_KEY) {
    return NextResponse.json({
      ok: false,
      configured: false,
      error: "T212_API_KEY is not set in the environment.",
    });
  }

  const headers: Record<string, string> = { Accept: "application/json" };
  if (API_SECRET) {
    headers.Authorization = `Basic ${Buffer.from(`${API_KEY}:${API_SECRET}`).toString(
      "base64"
    )}`;
  } else {
    headers.Authorization = `Bearer ${API_KEY}`;
  }

  try {
    const [positions, summary, dividends] = await Promise.all([
      t212Fetch("/equity/positions", headers),
      t212Fetch("/equity/account/summary", headers),
      t212Fetch("/equity/history/dividends", headers),
    ]);
    return NextResponse.json({
      ok: true,
      configured: true,
      env: ENV,
      positions,
      summary,
      dividends,
    });
  } catch (err) {
    const e = err as Error & { status?: number };
    return NextResponse.json({
      ok: false,
      configured: true,
      env: ENV,
      error: e.message,
      authHint: e.status === 401,
    });
  }
}