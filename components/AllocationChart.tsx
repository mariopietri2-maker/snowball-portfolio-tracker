"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { allocationByHolding, colorForSymbol, formatCurrency } from "@/lib/finance";

export function AllocationChart({
  detailed,
  currency,
}: {
  detailed: ReturnType<typeof allocationByHolding>["data"];
  currency: string;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={detailed}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={2}
          strokeWidth={0}
        >
          {detailed.map((d) => (
            <Cell key={d.name} fill={colorForSymbol(d.name)} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value, _name, item) => {
            const payload = item?.payload as { pct?: number; name?: string } | undefined;
            const v = typeof value === "number" ? value : 0;
            return [
              `${formatCurrency(v, currency)} · ${(payload?.pct ?? 0).toFixed(1)}%`,
              payload?.name ?? "",
            ];
          }}
          contentStyle={{
            backgroundColor: "var(--tooltip-bg)",
            border: "1px solid var(--tooltip-border)",
            borderRadius: 8,
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function AllocationLegend({
  detailed,
  currency,
}: {
  detailed: Array<{ name: string; value: number; pct: number }>;
  currency: string;
}) {
  return (
    <ul className="space-y-1.5">
      {detailed.map((d) => (
        <li key={d.name} className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 min-w-0">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: colorForSymbol(d.name) }}
            />
            <span className="truncate">{d.name}</span>
          </span>
          <span className="tabular-nums text-slate-600 dark:text-slate-300 shrink-0">
            {d.pct.toFixed(1)}% · {formatCurrency(d.value, currency)}
          </span>
        </li>
      ))}
    </ul>
  );
}