"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui";
import { spotifyConfigured } from "@/lib/spotify";

interface SpotifyTrack {
  name: string;
  artists: string;
  img: string | null;
}

interface PlayerHandle {
  connect: () => Promise<boolean>;
  togglePlay: () => Promise<boolean>;
  nextTrack: () => Promise<boolean>;
  setVolume: (v: number) => Promise<void>;
  addListener: (evt: string, cb: (state?: unknown) => void) => void;
}

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady?: () => void;
    Spotify?: {
      Player: new (opts: {
        name: string;
        getOAuthToken: (cb: (token: string) => void) => void;
        volume?: number;
      }) => PlayerHandle;
    };
  }
}

function ms(t: number): string {
  const s = Math.max(0, Math.floor(t / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function SpotifyPlayer() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [track, setTrack] = useState<SpotifyTrack | null>(null);
  const [paused, setPaused] = useState(true);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [search, setSearch] = useState("");
  const [volume, setVolume] = useState(70);
  const [note, setNote] = useState<string | null>(null);
  const playerRef = useRef<PlayerHandle | null>(null);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const m = q.get("spotify");
    if (m === "error") setNote("Spotify login failed — try again.");
    if (m === "denied") setNote("Spotify login cancelled.");
    if (m) {
      q.delete("spotify");
      const target = q.toString() ? `?${q.toString()}` : window.location.pathname;
      window.history.replaceState({}, "", target);
    }
  }, []);

  const api = useCallback(
    async (
      action: string,
      extra: Record<string, string | number | undefined> = {}
    ) => {
      return fetch("/api/spotify/playback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
    },
    []
  );

  useEffect(() => {
    if (!spotifyConfigured) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/spotify/playback");
        const data = (await res.json()) as { loggedIn?: boolean };
        if (cancelled) return;
        setLoggedIn(Boolean(data.loggedIn));
      } catch {
        if (!cancelled) setLoggedIn(false);
      }
    })().then(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  const initPlayer = useCallback(async () => {
    if (!window.Spotify) {
      await new Promise<void>((resolve) => {
        window.onSpotifyWebPlaybackSDKReady = () => resolve();
        const script = document.createElement("script");
        script.src = "https://sdk.scdn.co/spotify-player.js";
        document.body.appendChild(script);
      });
    }
    const tokenRes = await fetch("/api/spotify/token");
    const tokenData = (await tokenRes.json()) as { access_token?: string };
    if (!tokenData.access_token) return;

    const player = new window.Spotify!.Player({
      name: "Snowball Mini Player",
      volume: volume / 100,
      getOAuthToken: (cb) =>
        fetch("/api/spotify/token")
          .then((r) => r.json())
          .then((d) => cb((d as { access_token?: string }).access_token ?? "")),
    });
    playerRef.current = player;

    player.addListener("ready", (state) => {
      const dev = state as { device_id?: string };
      if (dev.device_id) {
        void api("transfer", { deviceId: dev.device_id });
      }
    });
    player.addListener("player_state_changed", (state) => {
      if (!state || typeof state !== "object") {
        setTrack(null);
        setPaused(true);
        return;
      }
      const s = state as {
        paused: boolean;
        position: number;
        duration: number;
        track_window?: {
          current_track?: {
            name?: string;
            artists?: Array<{ name?: string }>;
            album?: { images?: Array<{ url?: string } | null> };
          };
        };
      };
      const cur = s.track_window?.current_track;
      if (!cur?.name) {
        setTrack(null);
        setPaused(true);
        return;
      }
      setTrack({
        name: cur.name,
        artists: (cur.artists ?? []).map((a) => a.name ?? "").join(", "),
        img: cur.album?.images?.[0]?.url ?? null,
      });
      setPaused(s.paused);
      setPosition(s.position);
      setDuration(s.duration);
    });
    await player.connect();
  }, [api, volume]);

  useEffect(() => {
    if (spotifyConfigured && loggedIn) void initPlayer();
  }, [loggedIn, initPlayer]);

  useEffect(() => {
    if (!track || paused) return;
    const t = setInterval(() => setPosition((p) => p + 1000), 1000);
    return () => clearInterval(t);
  }, [track, paused]);

  async function logout() {
    await fetch("/api/spotify/logout", { method: "POST" });
    window.location.reload();
  }

  async function playQuery() {
    const q = search.trim();
    if (!q || !playerRef.current) return;
    setSearch("");
    const res = await api("play", { query: q });
    if (!res.ok && res.status === 404) setNote("No track found on Spotify.");
  }

  if (!spotifyConfigured) {
    return (
      <Card className="p-5">
        <h3 className="font-semibold mb-1">Spotify</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          Add <code className="text-xs">NEXT_PUBLIC_SPOTIFY_CLIENT_ID</code> to
          enable listening on your dashboard.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#1DB954">
          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0zm5.5 17.3c-.2.3-.7.4-1 .2-2.8-1.7-6.3-2.1-10.4-1.2-.4.1-.8-.2-.9-.6-.1-.4.2-.8.6-.9 4.5-1 8.4-.5 11.5 1.4.4.2.5.7.2 1.1zm1.5-3.3c-.3.4-.8.5-1.2.2-3.2-2-8.1-2.5-11.9-1.4-.5.1-1-.2-1.1-.7 0-.5.2-1 .7-1.1 4.3-1.3 9.8-.7 13.4 1.6.4.3.5.9.1 1.4zm.1-3.4C15.2 8.5 8.8 8.3 5.1 9.4c-.6.2-1.2-.2-1.3-.8-.2-.6.2-1.2.8-1.3 4.1-1.2 11.1-1 15.6 1.7.5.3.7 1 .4 1.5-.3.4-1 .6-1.5.4z" />
        </svg>
        <div>
          <h3 className="font-semibold leading-none">Spotify</h3>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Your account, right here while you trade
          </p>
        </div>
        {note && (
          <span className="ml-auto text-[10px] text-amber-500 dark:text-amber-400">
            {note}
          </span>
        )}
      </div>

      {loggedIn === null ? (
        <div className="text-sm text-slate-500 dark:text-slate-400 py-6 text-center">
          Checking…
        </div>
      ) : !loggedIn ? (
        <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-600 p-4 text-center">
          <p className="text-sm font-medium">Listen along while you trade</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Login with your personal spotify account. Music plays in this small
            window and follows you anywhere on the app.
          </p>
          <a
            href="/api/spotify/login"
            className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#1DB954] text-black font-semibold text-sm px-5 py-2 hover:brightness-110"
          >
            Login with Spotify
          </a>
        </div>
      ) : (
        <div>
          {track ? (
            <div className="rounded-xl bg-slate-100 dark:bg-slate-800/60 p-3 flex items-center gap-3">
              {track.img ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={track.img}
                  alt=""
                  className="w-12 h-12 rounded-lg object-cover shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-fuchsia-500 to-sky-500 grid place-items-center text-white text-[10px] font-bold shrink-0">
                  <span className="text-xl leading-none">♪</span>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{track.name}</p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                  {track.artists}
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl bg-slate-100 dark:bg-slate-800/60 p-3 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Nothing playing yet — search a song below and hit Play.
              </p>
            </div>
          )}

          <div className="mt-3">
            <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#1DB954] transition-all"
                style={{
                  width: duration
                    ? `${Math.min(100, (position / duration) * 100)}%`
                    : "0%",
                }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>{ms(position)}</span>
              <span>{ms(duration)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={() => void playerRef.current?.togglePlay()}
              className="w-9 h-9 rounded-full bg-black dark:bg-white text-white dark:text-black grid place-items-center hover:scale-105 transition-transform"
              title="play/pause"
            >
              {paused ? (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 5h4v14H6zm8 0h4v14h-4z" />
                </svg>
              )}
            </button>
            <button
              onClick={() => void playerRef.current?.nextTrack()}
              className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 grid place-items-center hover:brightness-95"
              title="next"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 6l6 6-6 6zM13 6l6 6-6 6z" />
              </svg>
            </button>
            <svg
              className="w-3.5 h-3.5 text-slate-500 ml-1"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M3 9v6h4l5 5V4L7 9H3z" />
            </svg>
            <input
              type="range"
              min={0}
              max={100}
              value={volume}
              onChange={(e) => {
                const v = Number(e.target.value);
                setVolume(v);
                void playerRef.current?.setVolume(v / 100);
              }}
              className="flex-1 accent-[#1DB954] h-1"
            />
            <svg
              className="w-3.5 h-3.5 text-slate-500"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3a4.5 4.5 0 0 0-3-4.2v8.4a4.5 4.5 0 0 0 3-4.2z" />
            </svg>
          </div>

          <div className="flex gap-2 mt-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void playQuery();
              }}
              placeholder="Play any song…"
              className="flex-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm placeholder:text-slate-400 outline-none focus:border-accent min-w-0"
            />
            <button
              onClick={() => void playQuery()}
              className="px-3 py-2 rounded-xl bg-[#1DB954] text-black text-sm font-semibold hover:brightness-110 shrink-0"
            >
              Play
            </button>
          </div>

          <button
            onClick={() => void logout()}
            className="w-full mt-3 text-[10px] text-slate-500 hover:text-slate-300 text-center"
          >
            Disconnect Spotify
          </button>
        </div>
      )}
    </Card>
  );
}