import { NextRequest, NextResponse } from "next/server";
import {
  getAccessToken,
  spotifyServerReady,
  startPlayback,
  pausePlayback,
  resumePlayback,
  nextTrack,
  setVolume,
  transferPlayback,
} from "@/lib/spotify-server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const refresh = req.cookies.get("spt_refresh")?.value;
  if (!refresh || !spotifyServerReady)
    return NextResponse.json({ loggedIn: false });
  return NextResponse.json({ loggedIn: true });
}

export async function POST(req: NextRequest) {
  const refresh = req.cookies.get("spt_refresh")?.value;
  if (!refresh || !spotifyServerReady)
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  let token: string;
  try {
    token = await getAccessToken(refresh);
  } catch {
    return NextResponse.json({ error: "Session expired" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    action?: string;
    query?: string;
    deviceId?: string;
    volume?: number;
  };
  const action = body.action ?? "";

  switch (action) {
    case "play": {
      const result = await startPlayback(token, {
        query: body.query,
        deviceId: body.deviceId,
      });
      if (!result.ok && result.reason)
        return NextResponse.json({ error: result.reason }, { status: result.status });
      return NextResponse.json({ ok: true });
    }
    case "pause":
      await pausePlayback(token);
      return NextResponse.json({ ok: true });
    case "resume":
      await resumePlayback(token);
      return NextResponse.json({ ok: true });
    case "next":
      await nextTrack(token);
      return NextResponse.json({ ok: true });
    case "volume":
      await setVolume(token, body.volume ?? 50);
      return NextResponse.json({ ok: true });
    case "transfer":
      if (!body.deviceId)
        return NextResponse.json({ error: "Missing deviceId" }, { status: 400 });
      await transferPlayback(token, body.deviceId);
      return NextResponse.json({ ok: true });
    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}