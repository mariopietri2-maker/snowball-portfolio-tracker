"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, Spinner } from "@/components/ui";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { ChatMessage } from "@/lib/chat";
import { timeAgo } from "@/lib/finance";

function Avatar({ name, color }: { name: string; color: string }) {
  return (
    <span
      className="w-7 h-7 rounded-full grid place-items-center text-[10px] font-bold text-white shrink-0"
      style={{ backgroundColor: color }}
      title={name}
    >
      {name.slice(0, 2).toUpperCase()}
    </span>
  );
}

export function CommunityPreview() {
  const [recent, setRecent] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(4);
      if (active) {
        if (!error) setRecent((data ?? []) as ChatMessage[]);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">Community</h3>
          {isSupabaseConfigured && (
            <span className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-500 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              live
            </span>
          )}
        </div>
        <Link
          href="/chat"
          className="text-sm text-accent hover:underline flex items-center gap-1"
        >
          Open chat →
        </Link>
      </div>

      {!isSupabaseConfigured ? (
        <div className="mt-3 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          <p>
            Chat is part of Snowball&apos;s cloud setup — add your Supabase keys
            to unlock the community.
          </p>
          <Link
            href="/settings"
            className="inline-block mt-2 text-sm text-accent hover:underline"
          >
            Set up in Settings →
          </Link>
        </div>
      ) : loading ? (
        <Spinner label="Loading chat…" />
      ) : recent.length === 0 ? (
        <Link
          href="/chat"
          className="block mt-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 px-3 py-4 text-center text-sm text-slate-500 dark:text-slate-400 hover:border-accent hover:text-accent transition"
        >
          No messages yet — be the first to speak
        </Link>
      ) : (
        <div className="mt-3 space-y-2.5">
          {recent.map((m) => (
            <div key={m.id} className="flex gap-2.5">
              <Avatar name={m.author_name} color={m.author_color} />
              <div className="min-w-0">
                <p className="text-xs text-slate-600 dark:text-slate-300 truncate">
                  <span
                    className="font-semibold"
                    style={{ color: m.author_color }}
                  >
                    {m.author_name}
                  </span>{" "}
                  <span className="text-slate-400 dark:text-slate-500">
                    in #{m.category}
                  </span>{" "}
                  <span className="text-slate-400 dark:text-slate-500">
                    · {timeAgo(new Date(m.created_at).getTime())}
                  </span>
                </p>
                <p className="text-sm text-slate-700 dark:text-slate-200 truncate">
                  {m.message}
                </p>
              </div>
            </div>
          ))}
          <Link
            href="/chat"
            className="block mt-1 rounded-xl bg-accent/10 text-accent text-center text-sm py-2 font-medium hover:bg-accent/20 transition"
          >
            Join the conversation
          </Link>
        </div>
      )}
    </Card>
  );
}