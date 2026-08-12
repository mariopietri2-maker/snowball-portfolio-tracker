import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { spotifyServerReady, SPOTIFY_SCOPES } from "@/lib/spotify-server";

export const runtime = "nodejs";

export async function GET(req: Request) {
  if (!spotifyServerReady) {
    return NextResponse.json({ error: "Spotify not configured" }, { status: 503 });
  }
  const origin = new URL(req.url).origin;
  const redirectUri = `${origin}/api/spotify/callback`;
  const state = randomBytes(16).toString("hex");
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.SPOTIFY_CLIENT_ID ?? "",
    scope: SPOTIFY_SCOPES,
    redirect_uri: redirectUri,
    state,
  });
  const res = NextResponse.redirect(
    `https://accounts.spotify.com/authorize?${params.toString()}`
  );
  res.cookies.set("spt_state", state, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  return res;
}