import { NextRequest, NextResponse } from "next/server";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const TEN_SECONDS = 15_000;
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

function isPrivateIPv4(addr: string): boolean {
  const parts = addr.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p))) return true;
  const [a, b] = parts;
  if (a === 10 || a === 127 || a === 0) return true;
  if (a === 169 && b === 254) return true; // link-local
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  return false;
}

async function isBlockedHost(hostname: string): Promise<boolean> {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) {
    return true;
  }
  const ip = isIP(host);
  if (ip === 4) return isPrivateIPv4(host);
  if (ip === 6) {
    return (
      host === "::1" ||
      host === "::" ||
      host.startsWith("fc") ||
      host.startsWith("fd") ||
      host.startsWith("fe8") ||
      host.startsWith("fe9") ||
      host.startsWith("fea") ||
      host.startsWith("feb")
    );
  }
  try {
    const { address } = await lookup(host);
    return isIP(address) === 4 ? isPrivateIPv4(address) : address === "::1";
  } catch {
    return true;
  }
}

export const dynamic = "force-dynamic";

/**
 * Generic JSON fetch proxy — lets the browser import portfolios from any
 * CORS-restricted API endpoint. Private/loopback hosts are blocked (SSRF guard).
 */
export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("url") ?? "";
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return NextResponse.json({ error: "invalid-url" }, { status: 400 });
  }
  if (!/^https?:$/.test(parsed.protocol)) {
    return NextResponse.json({ error: "http-only" }, { status: 400 });
  }
  if (await isBlockedHost(parsed.hostname)) {
    return NextResponse.json({ error: "host-blocked" }, { status: 400 });
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TEN_SECONDS);
    const res = await fetch(parsed, {
      signal: controller.signal,
      redirect: "manual",
      headers: { accept: "application/json", "User-Agent": UA },
      cache: "no-store",
    });
    clearTimeout(timer);
    if (!res.ok) {
      return NextResponse.json(
        { error: "upstream-error", status: res.status },
        { status: 502 }
      );
    }
    const text = await res.text();
    try {
      JSON.parse(text);
    } catch {
      return NextResponse.json({ error: "not-json" }, { status: 400 });
    }
    return new NextResponse(text, {
      status: 200,
      headers: { "content-type": "application/json", "cache-control": "no-store" },
    });
  } catch (err) {
    console.error("[proxy]", raw, err);
    return NextResponse.json({ error: "upstream-failure" }, { status: 502 });
  }
}
