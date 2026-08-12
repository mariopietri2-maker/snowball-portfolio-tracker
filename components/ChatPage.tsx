"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useChatRoom, CHAT_CATEGORIES } from "@/lib/chat";
import type { ChatMessage } from "@/lib/chat";
import { isSupabaseConfigured } from "@/lib/supabase";

const STOCK_ROOMS = [
  { symbol: "NVDA", live: true },
  { symbol: "AAPL", live: false },
  { symbol: "SCHD", live: false },
  { symbol: "JEPI", live: false },
];

const QUICK_REPLIES = [
  "Rate cut timing?",
  "Best dividend ETFs?",
  "New to snowballing — where do I start?",
];

function Avatar({
  name,
  color,
  size = "md",
}: {
  name: string;
  color: string;
  size?: "sm" | "md";
}) {
  return (
    <span
      className={`rounded-full grid place-items-center font-bold text-white shrink-0 ${
        size === "md" ? "w-9 h-9 text-xs" : "w-7 h-7 text-[10px]"
      }`}
      style={{ backgroundColor: color }}
      title={name}
    >
      {name.slice(0, 2).toUpperCase()}
    </span>
  );
}

function TimeTag({ iso }: { iso: string }) {
  return (
    <span className="text-[10px] text-slate-500 dark:text-slate-500 whitespace-nowrap">
      {new Date(iso).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })}
    </span>
  );
}

function ChannelPill({
  active,
  onClick,
  children,
  live,
}: {
  active: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  live?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm transition ${
        active
          ? "bg-accent/12 text-accent font-medium"
          : "text-slate-500 dark:text-slate-400 hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60"
      }`}
    >
      <span className="text-xs text-slate-500 dark:text-slate-500">#</span>
      {children}
      {live && (
        <span className="ml-auto rounded-full bg-rose-500/15 text-rose-500 dark:text-rose-400 text-[9px] px-1.5 py-0.5 border border-rose-500/30 font-semibold">
          LIVE
        </span>
      )}
    </button>
  );
}

export function ChatPage() {
  const [active, setActive] = useState<(typeof CHAT_CATEGORIES)[number]["key"]>("general");
  const { messages, loading, error, tableMissing, sending, send, identity } =
    useChatRoom(active);
  const [draft, setDraft] = useState("");

  const onlineMembers = useMemo(() => {
    const seen = new Set<string>();
    const list: ChatMessage[] = [];
    for (const m of messages) {
      if (!seen.has(m.author_name)) {
        seen.add(m.author_name);
        list.push(m);
      }
    }
    return list.slice(0, 6);
  }, [messages]);

  const activeLabel = CHAT_CATEGORIES.find((c) => c.key === active)?.label;

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 overflow-hidden h-[calc(100vh-150px)] min-h-[540px] flex flex-col">
      {/* Header */}
      <header className="px-4 md:px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3 bg-white dark:bg-slate-950/50">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 grid place-items-center text-slate-950 font-bold text-lg">
          ❄
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-semibold leading-tight">Community Chat</h1>
            {isSupabaseConfigured ? (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-emerald-500 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-2 py-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Online
              </span>
            ) : (
              <span className="inline-flex items-center text-[10px] font-semibold text-slate-500 bg-slate-200 dark:bg-slate-800 rounded-full px-2 py-0.5">
                Not connected
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Public &amp; anonymous · replies as fast as the market moves
          </p>
        </div>
        <Link
          href="/settings"
          className="ml-auto hidden md:block text-xs text-slate-500 dark:text-slate-400 hover:text-accent"
        >
          Chat name in Settings
        </Link>
      </header>

      {/* Tabs */}
      <div className="px-4 md:px-5 pt-3 flex gap-1 flex-wrap border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/30">
        {CHAT_CATEGORIES.map((c) => (
          <button
            key={c.key}
            onClick={() => setActive(c.key)}
            className={`px-3 py-1.5 rounded-t-lg text-sm font-medium transition border-b-2 -mb-px ${
              active === c.key
                ? "text-accent border-accent bg-accent/5"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/40"
            }`}
          >
            #{c.label.toLowerCase()}
          </button>
        ))}
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Channels sidebar */}
        <aside className="hidden lg:flex flex-col w-60 border-r border-slate-200 dark:border-slate-800 min-h-0">
          <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold px-2.5 mb-1.5">
              Community
            </p>
            {CHAT_CATEGORIES.map((c) => (
              <ChannelPill
                key={c.key}
                active={active === c.key}
                onClick={() => setActive(c.key)}
              >
                {c.label}
              </ChannelPill>
            ))}
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold px-2.5 mt-4 mb-1.5">
              Live stock rooms
            </p>
            {STOCK_ROOMS.map((s) => (
              <ChannelPill key={s.symbol} active={false} live={s.live}>
                {s.symbol.toLowerCase()}
              </ChannelPill>
            ))}
            <p className="text-[10px] px-2.5 pt-3 text-slate-400 dark:text-slate-500 leading-relaxed">
              Stock rooms open automatically when you view a ticker.
            </p>
          </nav>
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 text-sm">
            <Avatar name={identity.name} color={identity.color} size="sm" />
            <span className="truncate text-slate-600 dark:text-slate-300">
              {identity.name}
            </span>
            <span className="ml-auto text-[10px] text-slate-400">you</span>
          </div>
        </aside>

        {/* Messages */}
        <section className="flex-1 flex flex-col min-h-0 min-w-0">
          <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-5">
            {!isSupabaseConfigured ? (
              <div className="py-16 text-center">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Chat runs on your Supabase cloud account.
                </p>
                <Link
                  href="/settings"
                  className="inline-block mt-2 text-sm text-accent hover:underline"
                >
                  Add your keys in Settings →
                </Link>
              </div>
            ) : tableMissing ? (
              <div className="py-16 text-center">
                <p className="text-sm text-amber-500 dark:text-amber-400">
                  Chat store isn&apos;t set up yet.
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Run <code>supabase/schema.sql</code> in the Supabase SQL Editor.
                </p>
              </div>
            ) : loading ? (
              <p className="text-sm text-slate-500 text-center py-16">Loading…</p>
            ) : messages.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-16">
                No messages yet — start the conversation.
              </p>
            ) : (
              messages.map((m, i) => {
                const mine = m.author_name === identity.name;
                return (
                  <div
                    key={m.id ?? `${m.author_name}-${i}`}
                    className={`flex gap-3 ${mine ? "justify-end" : ""}`}
                  >
                    {!mine && <Avatar name={m.author_name} color={m.author_color} />}
                    <div
                      className={`min-w-0 max-w-[80%] md:max-w-[70%] ${
                        mine ? "text-right" : ""
                      }`}
                    >
                      {!mine && (
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                          {m.author_name}
                          <span className="font-normal text-xs text-slate-500 dark:text-slate-500 ml-2">
                            <TimeTag iso={m.created_at} />
                          </span>
                        </p>
                      )}
                      <div
                        className={`mt-1 inline-block rounded-2xl px-4 py-2.5 text-sm leading-relaxed text-left ${
                          mine
                            ? "bg-accent/15 dark:bg-accent/15 border border-accent/30 rounded-tr-sm"
                            : "bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded-tl-sm"
                        }`}
                      >
                        {m.message}
                        {mine && (
                          <span className="ml-1 text-[10px] text-accent dark:text-accent align-middle">
                            ✓✓
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            {error && !tableMissing && (
              <p className="text-xs text-rose-500 text-center pt-2">{error}</p>
            )}
          </div>

          {/* Quick replies */}
          {messages.length > 0 && (
            <div className="px-4 flex gap-2 flex-wrap">
              {QUICK_REPLIES.map((q) => (
                <button
                  key={q}
                  onClick={() => setDraft(q)}
                  className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full px-3 py-1.5 hover:border-accent hover:text-accent transition"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Composer */}
          <div className="p-3 md:p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/50">
            <div className="flex items-end gap-2 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus-within:border-accent px-3 py-2">
              <textarea
                rows={1}
                value={draft}
                disabled={!isSupabaseConfigured || tableMissing}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    const t = draft;
                    setDraft("");
                    void send(t);
                  }
                }}
                placeholder={`Message #${activeLabel?.toLowerCase()}`}
                className="flex-1 bg-transparent outline-none text-sm placeholder:text-slate-400 resize-none py-1 min-w-0 max-h-32"
              />
              <button
                onClick={() => {
                  const t = draft;
                  setDraft("");
                  void send(t);
                }}
                disabled={sending || !isSupabaseConfigured || tableMissing}
                className="w-9 h-9 rounded-xl bg-accent text-white grid place-items-center hover:brightness-110 disabled:opacity-50 shrink-0"
                title="Send"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3.4 20.4l17.4-7.4c.8-.3.8-1.4 0-1.8L3.4 3.6c-.6-.3-1.3.2-1.3.9L2 10l12 2L2 14l.1 5.5c0 .7.7 1.2 1.3.9z" />
                </svg>
              </button>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 px-1">
              Public room · 10s between messages · be kind. Your name is random —
            </p>
          </div>
        </section>

        {/* Members */}
        <aside className="hidden xl:flex flex-col w-52 border-l border-slate-200 dark:border-slate-800 min-h-0">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Active now
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5 text-sm">
            {onlineMembers.map((m) => (
              <div key={m.author_name} className="flex items-center gap-2.5">
                <span className="relative">
                  <Avatar name={m.author_name} color={m.author_color} size="sm" />
                  <span className="absolute -bottom-px -right-px w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white dark:border-slate-950" />
                </span>
                <span className="text-slate-600 dark:text-slate-300 truncate">
                  {m.author_name}
                </span>
              </div>
            ))}
          </div>
          <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800">
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2">
              Channel
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              <span className="text-accent">#{activeLabel?.toLowerCase()}</span>
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Switch rooms from the tabs or sidebar.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}