"use client";

import { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrency } from "@/lib/finance";
import type { PortfolioSnapshot } from "@/types";
import { EmptyState } from "@/components/ui";

export function PortfolioHistoryChart({
  snapshots,
  currency,
}: {
  snapshots: PortfolioSnapshot[];
  currency: string;
}) {
  const data = useMemo(
    () =>
      snapshots
        .map((s) => ({
          time: new Date(s.date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          value: Math.round(s.totalValue),
        }))
        .filter((d) => !Number.isNaN(d.value)),
    [snapshots]
  );

  if (data.length < 2) {
    return (
      <EmptyState
        title="Not enough history yet"
        hint="Snapshots are recorded each time you load the dashboard with live prices."
      />
    );
  }

  const first = data[0].value;
  const last = data[data.length - 1].value;
  const up = last >= first;
  const stroke = up ? "#10b981" : "#f43f5e";
  const fill = up ? "#10b981" : "#f43f5e";

  return (
    <div>
      <div className="mb-1">
        <span className="text-xl font-bold tabular-nums">{formatCurrency(last, currency)}</span>
        <span className={`ml-2 text-sm ${up ? "text-emerald-500" : "text-rose-500"}`}>
          {up ? "+" : ""}
          {(((last - first) / first) * 100).toFixed(1)}%
        </span>
      </div>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="gradHistory" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={fill} stopOpacity={0.25} />
                <stop offset="95%" stopColor={fill} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--grid)" />
            <XAxis
              dataKey="time"
              tick={{ fill: "var(--axis)", fontSize: 11 }}
              stroke="var(--grid)"
              interval="preserveStartEnd"
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "var(--axis)", fontSize: 11 }}
              stroke="var(--grid)"
              tickLine={false}
              axisLine={false}
              width={46}
              domain={["auto", "auto"]}
              tickFormatter={(v: number) => formatCurrency(v, currency)}
            />
            <Tooltip
              formatter={(value: number) => [formatCurrency(value, currency), "Value"]}
              contentStyle={{
                backgroundColor: "var(--tooltip-bg)",
                border: "1px solid var(--tooltip-border)",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={stroke}
              strokeWidth={2}
              fill="url(#gradHistory)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}