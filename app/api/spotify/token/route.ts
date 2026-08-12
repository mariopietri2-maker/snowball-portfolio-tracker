import { NextRequest, NextResponse } from "next/server";
import { getAccessToken, spotifyServerReady } from "@/lib/spotify-server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const refresh = req.cookies.get("spt_refresh")?.value;
  if (!refresh || !spotifyServerReady) {
    return NextResponse.json({ access_token: null }, { status: 401 });
  }
  try {
    const accessToken = await getAccessToken(refresh);
    return NextResponse.json({ access_token: accessToken });
  } catch {
    return NextResponse.json({ access_token: null }, { status: 401 });
  }
}