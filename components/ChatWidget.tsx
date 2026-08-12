"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { Card } from "@/components/ui";
import { timeAgo } from "@/lib/finance";

export const CHAT_CATEGORIES = [
  { key: "general", label: "General" },
  { key: "bullish", label: "Bullish" },
  { key: "bearish", label: "Bearish" },
  { key: "dividends", label: "Dividends" },
  { key: "qa", label: "Q&A" },
] as const;

type CategoryKey = (typeof CHAT_CATEGORIES)[number]["key"];

interface ChatMessage {
  id: number | string;
  category: string;
  author_name: string;
  author_color: string;
  message: string;
  created_at: string;
}

const NAMES = [
  "SnowflakeOwl",
  "BullishBoris",
  "BearWise",
  "YieldYoda",
  "CandlestickKate",
  "MarginMax",
  "CouponCarla",
  "TrendTravis",
  "VolVera",
  "DivDan",
  "GraphGirl",
  "PoundPepper",
];

const COLORS = [
  "#38bdf8",
  "#a78bfa",
  "#f472b6",
  "#34d399",
  "#fbbf24",
  "#fb7185",
  "#2dd4bf",
  "#c084fc",
  "#f97316",
  "#4ade80",
];

function getIdentity(): { name: string; color: string } {
  if (typeof window === "undefined")
    return { name: NAMES[0]!, color: COLORS[0]! };
  const stored = window.localStorage.getItem("snowball-chat-identity");
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as { name: string; color: string };
      if (parsed.name && parsed.color) return parsed;
    } catch {
      /* ignore */
    }
  }
  const name = NAMES[Math.floor(Math.random() * NAMES.length)]!;
  const color = COLORS[Math.floor(Math.random() * COLORS.length)]!;
  const identity = { name, color };
  window.localStorage.setItem("snowball-chat-identity", JSON.stringify(identity));
  return identity;
}

function Sparkle({ name, color }: { name: string; color: string }) {
  return (
    <span
      className="w-8 h-8 rounded-full grid place-items-center text-[11px] font-bold text-white shrink-0"
      style={{ backgroundColor: color }}
    >
      {name.slice(0, 2).toUpperCase()}
    </span>
  );
}

function TimeTag({ iso }: { iso: string }) {
  return (
    <span className="text-[10px] text-slate-500 dark:text-slate-500 whitespace-nowrap">
      {timeAgo(iso ? new Date(iso).getTime() : undefined)}
    </span>
  );
}

export function ChatWidget() {
  const [category, setCategory] = useState<CategoryKey>("general");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [online] = useState(128);
  const [draft, setDraft] = useState("");
  const [lastSentAt, setLastSentAt] = useState(0);
  const [sending, setSending] = useState(false);
  const [tableMissing, setTableMissing] = useState(false);
  const identity = useRef(getIdentity()).current;
  const boxRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async (cat: CategoryKey) => {
    if (!supabase) return;
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("category", cat)
      .order("created_at", { ascending: false })
      .limit(40);
    if (err) {
      if (/relation "chat_messages" does not exist|does not exist/i.test(err.message)) {
        setTableMissing(true);
      } else {
        setError(err.message);
      }
      setLoading(false);
      return;
    }
    setTableMissing(false);
    setMessages((data ?? []).reverse() as ChatMessage[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    setMessages([]);
    void load(category);
    if (!supabase) return;
    const sb = supabase;
    const channel = sb
      .channel(`chat-${category}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `category=eq.${category}`,
        },
        (payload) => {
          const row = payload.new as ChatMessage;
          if (!row || !row.id) return;
          setMessages((prev) => {
            if (prev.some((m) => m.id === row.id)) return prev;
            return [...prev, row];
          });
        }
      )
      .subscribe();
    return () => {
      void sb.removeChannel(channel);
    };
  }, [category, load]);

  useEffect(() => {
    boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight });
  }, [messages.length]);

  async function send() {
    const text = draft.trim();
    if (!text || !supabase || sending) return;
    const now = Date.now();
    if (now - lastSentAt < 10000) return;
    setLastSentAt(now);
    setSending(true);
    const { error: err } = await supabase.from("chat_messages").insert({
      category,
      author_name: identity.name,
      author_color: identity.color,
      message: text.slice(0, 500),
    });
    setSending(false);
    setDraft("");
    if (err) {
      if (/does not exist/i.test(err.message)) setTableMissing(true);
      else setError(err.message ?? "Could not send message");
    }
  }

  if (!isSupabaseConfigured) {
    return (
      <Card className="p-5">
        <h3 className="font-semibold mb-1">Community Chat</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          Chat is part of Snowball&apos;s cloud setup. Add your Supabase keys to
          unlock realtime community chat.
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
          Public &amp; anonymous — your message is visible to everyone.
        </p>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col p-0 overflow-hidden" >
      <div className="p-4 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">Community Chat</h3>
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-[10px] text-slate-500 dark:text-slate-500 font-semibold uppercase tracking-wider">
              {online} online
            </span>
          </div>
          <span
            className="w-6 h-6 rounded-full"
            style={{ backgroundColor: identity.color }}
            title={identity.name}
          />
        </div>
        <div className="flex gap-1 flex-wrap mt-3" role="tablist">
          {CHAT_CATEGORIES.map((c) => (
            <button
              key={c.key}
              role="tab"
              aria-selected={category === c.key}
              onClick={() => setCategory(c.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                category === c.key
                  ? "bg-accent/15 text-accent"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-accent"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-[220px] max-h-[360px] p-4 space-y-3" ref={boxRef}>
        {tableMissing ? (
          <div className="text-sm text-amber-600 dark:text-amber-400 py-6 text-center leading-relaxed">
            Chat store isn&apos;t set up yet.
            <br />
            <span className="text-xs">
              Run <code>supabase/schema.sql</code> in the Supabase SQL Editor.
            </span>
          </div>
        ) : loading ? (
          <div className="text-sm text-slate-500 dark:text-slate-400 py-6 text-center">
            Loading…
          </div>
        ) : messages.length === 0 ? (
          <div className="text-sm text-slate-500 dark:text-slate-400 py-6 text-center">
            No messages yet — start the conversation.
          </div>
        ) : (
          messages.map((m, i) => {
            const mine = m.author_name === identity.name;
            return (
              <div
                key={m.id ?? `${m.author_name}-${i}`}
                className={`flex gap-2.5 ${mine ? "justify-end" : ""}`}
              >
                {!mine && (
                  <Sparkle name={m.author_name} color={m.author_color ?? identity.color} />
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-[13px] leading-snug ${
                    mine
                      ? "bg-accent/15 border border-accent/30 rounded-tr-sm"
                      : "bg-slate-100 dark:bg-slate-800 rounded-tl-sm"
                  }`}
                >
                  {!mine && (
                    <p className="text-[11px] font-semibold" style={{ color: m.author_color }}>
                      {m.author_name}
                    </p>
                  )}
                  <p className="text-slate-800 dark:text-slate-200 mt-0.5 break-words">
                    {m.message}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-500 mt-1">
                    <TimeTag iso={m.created_at} />
                  </p>
                </div>
              </div>
            );
          })
        )}
        {error && (
          <p className="text-xs text-rose-500 dark:text-rose-400 text-center pt-2">
            Chat error: {error}
          </p>
        )}
      </div>

      <div className="p-3 border-t border-slate-200 dark:border-slate-800">
        <div className="flex gap-2">
          <input
            value={draft}
            disabled={tableMissing}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void send();
            }}
            placeholder={`Message #${CHAT_CATEGORIES.find((c) => c.key === category)?.label}`}
            className="flex-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm placeholder:text-slate-400 outline-none focus:border-accent disabled:opacity-50 min-w-0"
          />
          <button
            onClick={() => void send()}
            disabled={sending}
            className="px-4 py-2 rounded-xl bg-accent text-white text-sm font-medium hover:brightness-110 disabled:opacity-50 shrink-0"
          >
            Send
          </button>
        </div>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 px-1">
          Anonymous {identity.name} · 10s between messages · public room — be kind.
        </p>
      </div>
    </Card>
  );
}