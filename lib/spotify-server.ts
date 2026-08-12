const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID ?? "";
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET ?? "";

export const spotifyServerReady = Boolean(CLIENT_ID && CLIENT_SECRET);

const API = "https://api.spotify.com/v1";
const TOKEN_URL = "https://accounts.spotify.com/api/token";

export const SPOTIFY_SCOPES = [
  "streaming",
  "user-read-email",
  "user-read-private",
  "user-modify-playback-state",
  "user-read-playback-state",
  "user-read-currently-playing",
].join(" ");

async function exchange(body: URLSearchParams): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(
        `${CLIENT_ID}:${CLIENT_SECRET}`
      ).toString("base64")}`,
    },
    body,
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Spotify token exchange failed: ${res.status} ${text}`);
  }
  return (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };
}

export async function getAccessToken(refreshToken: string): Promise<string> {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
  const data = await exchange(body);
  return data.access_token;
}

export async function exchangeCode(
  code: string,
  redirectUri: string
): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  });
  const data = await exchange(body);
  if (!data.refresh_token) throw new Error("Spotify did not return a refresh token");
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  };
}

async function apiFetch(token: string, path: string, init?: RequestInit) {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  return res;
}

export async function searchTrack(
  token: string,
  query: string,
  limit = 1
): Promise<string | null> {
  const res = await apiFetch(
    token,
    `/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}`
  );
  if (!res.ok) return null;
  const data = (await res.json()) as {
    tracks?: { items?: Array<{ uri: string } | null> };
  };
  return data.tracks?.items?.[0]?.uri ?? null;
}

export async function startPlayback(
  token: string,
  opts: { query?: string; deviceId?: string } = {}
): Promise<{ ok: boolean; status: number; reason?: string }> {
  let uri: string | null = null;
  if (opts.query) {
    uri = await searchTrack(token, opts.query);
    if (!uri) return { ok: false, status: 404, reason: "No track found" };
  }
  const path = `/me/player/play${opts.deviceId ? `?device_id=${encodeURIComponent(opts.deviceId)}` : ""}`;
  const res = await apiFetch(token, path, {
    method: "PUT",
    body: uri ? JSON.stringify({ uris: [uri] }) : undefined,
  });
  return { ok: res.status < 300, status: res.status };
}

export async function pausePlayback(token: string) {
  const res = await apiFetch(token, "/me/player/pause", { method: "PUT" });
  return res.status < 300;
}

export async function resumePlayback(token: string) {
  const res = await apiFetch(token, "/me/player/play", { method: "PUT" });
  return res.status < 300;
}

export async function nextTrack(token: string) {
  const res = await apiFetch(token, "/me/player/next", { method: "POST" });
  return res.status < 300;
}

export async function setVolume(token: string, percent: number) {
  const res = await apiFetch(
    token,
    `/me/player/volume?volume_percent=${Math.round(Math.max(0, Math.min(100, percent)))}`,
    { method: "PUT" }
  );
  return res.status < 300;
}

export async function transferPlayback(token: string, deviceId: string) {
  const res = await apiFetch(token, "/me/player", {
    method: "PUT",
    body: JSON.stringify({ device_ids: [deviceId], play: false }),
  });
  return res.status < 300;
}