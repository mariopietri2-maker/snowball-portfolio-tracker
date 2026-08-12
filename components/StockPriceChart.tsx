"use client";

import { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fetchChart } from "@/lib/prices";
import { formatCurrency } from "@/lib/finance";
import type { ChartRange } from "@/types";
import { ChangeText, Spinner } from "@/components/ui";

const RANGES: ChartRange[] = ["1d", "5d", "1mo", "6mo", "1y", "5y"];

export function StockPriceChart({ symbol, currency }: { symbol: string; currency: string }) {
  const [range, setRange] = useState<ChartRange>("1y");
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchChart>> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setData(null);
    fetchChart(symbol, range)
      .then((d) => active && setData(d))
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [symbol, range]);

  const chartData = useMemo(
    () =>
      data?.points.map((p) => ({
        t: new Date(p.timestamp * 1000).toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          hour: undefined,
        }),
        v: p.value,
      })) ?? [],
    [data]
  );

  const up = (data?.changePercent ?? 0) >= 0;
  const stroke = up ? "#10b981" : "#f43f5e";

  return (
    <div>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          {data && (
            <>
              <span className="text-2xl font-bold tabular-nums">
                {formatCurrency(data.price, data.currency ?? currency)}
              </span>
              <span className="ml-2">
                <ChangeText value={data.changePercent} />
              </span>
            </>
          )}
        </div>
        <div className="flex gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                range === r
                  ? "bg-accent text-white"
                  : "text-slate-500 dark:text-slate-400 hover:text-accent"
              }`}
            >
              {r.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="h-72 mt-3">
        {loading || !data ? (
          <Spinner label="Loading chart…" />
        ) : chartData.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-400">No data for this range</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id={`grad-${symbol}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={stroke} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={stroke} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--grid)" />
              <XAxis
                dataKey="t"
                tick={{ fill: "var(--axis)", fontSize: 11 }}
                stroke="var(--grid)"
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={["auto", "auto"]}
                tick={{ fill: "var(--axis)", fontSize: 11 }}
                stroke="var(--grid)"
                tickLine={false}
                axisLine={false}
                width={56}
                tickFormatter={(v: number) => formatCurrency(v, data.currency ?? currency)}
              />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value, data.currency ?? currency), symbol]}
                contentStyle={{
                  backgroundColor: "var(--tooltip-bg)",
                  border: "1px solid var(--tooltip-border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey="v"
                stroke={stroke}
                strokeWidth={2}
                fill={`url(#grad-${symbol})`}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}