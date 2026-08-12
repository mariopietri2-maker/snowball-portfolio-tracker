import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export const CHAT_CATEGORIES = [
  { key: "general", label: "General" },
  { key: "bullish", label: "Bullish" },
  { key: "bearish", label: "Bearish" },
  { key: "dividends", label: "Dividends" },
  { key: "qa", label: "Q&A" },
] as const;

export type ChatCategoryKey = (typeof CHAT_CATEGORIES)[number]["key"];

export interface ChatMessage {
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

export function getChatIdentity(): { name: string; color: string } {
  if (typeof window === "undefined") return { name: NAMES[0]!, color: COLORS[0]! };
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
  window.localStorage.setItem(
    "snowball-chat-identity",
    JSON.stringify(identity)
  );
  return identity;
}

export function useChatRoom(category: ChatCategoryKey) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tableMissing, setTableMissing] = useState(false);
  const [lastSentAt, setLastSentAt] = useState(0);
  const [sending, setSending] = useState(false);
  const identity = getChatIdentity();

  const load = useCallback(async (cat: ChatCategoryKey) => {
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
      if (/does not exist/i.test(err.message)) setTableMissing(true);
      else setError(err.message);
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

  async function send(text: string) {
    const t = text.trim().slice(0, 500);
    if (!t || !supabase || sending) return false;
    const now = Date.now();
    if (now - lastSentAt < 10000) return false;
    setLastSentAt(now);
    setSending(true);
    const { error: err } = await supabase.from("chat_messages").insert({
      category,
      author_name: identity.name,
      author_color: identity.color,
      message: t,
    });
    setSending(false);
    if (err) {
      if (/does not exist/i.test(err.message)) setTableMissing(true);
      else setError(err.message ?? "Could not send message");
      return false;
    }
    return true;
  }

  return { messages, loading, error, tableMissing, sending, identity, send };
}