"use client";

import { useEffect, useState } from "react";
import { fetchNews } from "@/lib/prices";
import { timeAgo } from "@/lib/finance";
import type { NewsItem } from "@/types";
import { EmptyState, Spinner } from "@/components/ui";

export function NewsFeed({
  queries,
  limit = 6,
}: {
  queries: string[];
  limit?: number;
}) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const queryKey = [...new Set(queries.filter(Boolean))].slice(0, 4).join("|");

  useEffect(() => {
    let active = true;
    setLoading(true);
    const qs = queryKey.split("|").filter(Boolean);
    if (qs.length === 0) {
      setLoading(false);
      return;
    }
    Promise.all(
      qs.map((q) => fetchNews(q, 6).catch(() => [] as NewsItem[]))
    )
      .then((groups) => {
        const seen = new Set<string>();
        const merged: NewsItem[] = [];
        for (const group of groups) {
          for (const item of group) {
            if (!seen.has(item.link)) {
              seen.add(item.link);
              merged.push(item);
            }
          }
        }
        merged.sort((a, b) => (b.providerPublishTime ?? 0) - (a.providerPublishTime ?? 0));
        if (active) setNews(merged.slice(0, limit));
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [queryKey, limit]);

  if (loading) return <Spinner label="Fetching news…" />;
  if (news.length === 0)
    return (
      <EmptyState
        title="No news available"
        hint="Add holdings and watchlist items to see related headlines."
      />
    );

  return (
    <ul className="divide-y divide-slate-200 dark:divide-slate-800">
      {news.map((n) => (
        <li key={n.link} className="py-3 first:pt-1">
          <a
            href={n.link}
            target="_blank"
            rel="noopener noreferrer"
            className="group block"
          >
            <div className="flex gap-3">
              {n.thumbnail && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={n.thumbnail}
                  alt=""
                  loading="lazy"
                  className="w-16 h-11 rounded-md object-cover shrink-0 bg-slate-200 dark:bg-slate-800"
                />
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium leading-snug line-clamp-2 group-hover:text-accent transition">
                  {n.title}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {n.publisher}
                  {n.providerPublishTime
                    ? ` · ${timeAgo(n.providerPublishTime)}`
                    : ""}
                </p>
              </div>
            </div>
          </a>
        </li>
      ))}
    </ul>
  );
}