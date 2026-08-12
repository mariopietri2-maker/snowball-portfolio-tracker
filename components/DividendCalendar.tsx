"use client";

import { useMemo, useState } from "react";
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  addMonths,
  isBefore,
  startOfToday,
} from "date-fns";
import type { DividendEvent } from "@/types";
import { formatCurrency } from "@/lib/finance";

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

export function DividendCalendar({
  dividends,
  currency,
}: {
  dividends: DividendEvent[];
  currency: string;
}) {
  const today = useMemo(() => startOfToday(), []);
  const [month, setMonth] = useState<Date>(() => startOfMonth(today));

  const cells = useMemo(
    () => eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) }),
    [month]
  );

  const byDate = useMemo(() => {
    const map = new Map<string, DividendEvent[]>();
    for (const d of dividends) {
      const key = d.payDate.slice(0, 10);
      const arr = map.get(key) ?? [];
      arr.push(d);
      map.set(key, arr);
    }
    return map;
  }, [dividends]);

  const leadingEmpty = (cells[0].getDay() + 6) % 7;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setMonth(addMonths(month, -1))}
          className="px-3 py-1 rounded-md border border-slate-300 dark:border-slate-700 text-sm hover:border-accent/60 transition"
        >
          ←
        </button>
        <p className="font-semibold">{format(month, "MMMM yyyy")}</p>
        <button
          onClick={() => setMonth(addMonths(month, 1))}
          className="px-3 py-1 rounded-md border border-slate-300 dark:border-slate-700 text-sm hover:border-accent/60 transition"
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-slate-500 dark:text-slate-400 mb-1">
        {WEEKDAYS.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: leadingEmpty }).map((_, i) => (
          <div key={`e${i}`} />
        ))}
        {cells.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const events = byDate.get(key) ?? [];
          const outOfMonth = !isSameMonth(day, month);
          const past = isBefore(day, today) && !isSameDay(day, today);
          const total = events.reduce((s, e) => s + e.amountPerShare, 0);
          return (
            <div
              key={key}
              title={events.map((e) => `${e.symbol} ${e.amountPerShare}`).join("\n")}
              className={`min-h-14 rounded-lg border p-1.5 text-xs transition ${
                outOfMonth
                  ? "opacity-30"
                  : past
                    ? "border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500"
                    : "border-slate-200 dark:border-slate-800 hover:border-accent/50"
              } ${isSameDay(day, today) ? "ring-1 ring-accent" : ""}`}
            >
              <p className="font-medium">{format(day, "d")}</p>
              {events.length > 0 && !outOfMonth && (
                <div className="mt-1">
                  <p className="text-accent font-semibold leading-tight">
                    {events.length > 1
                      ? `${events.length} payouts`
                      : events[0].symbol}
                  </p>
                  <p className="text-[10px] tabular-nums text-emerald-500 dark:text-emerald-400">
                    {formatCurrency(total, currency)}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}