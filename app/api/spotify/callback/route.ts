import { NextRequest, NextResponse } from "next/server";
import { exchangeCode, spotifyServerReady } from "@/lib/spotify-server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const origin = url.origin;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const stored = req.cookies.get("spt_state")?.value;

  const res = NextResponse.redirect(`${origin}/?spotify=${
    code && state && state === stored ? "ok" : "denied"
  }`);
  res.cookies.set("spt_state", "", { path: "/", maxAge: 0 });

  if (!code || !spotifyServerReady || state !== stored) {
    return res;
  }

  try {
    const redirectUri = `${origin}/api/spotify/callback`;
    const { accessToken, refreshToken, expiresIn } = await exchangeCode(
      code,
      redirectUri
    );
    res.cookies.set("spt_refresh", refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
    res.cookies.set("spt_access", accessToken, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: Math.max(expiresIn - 30, 300),
    });
  } catch {
    return NextResponse.redirect(`${origin}/?spotify=error`);
  }
  return res;
}