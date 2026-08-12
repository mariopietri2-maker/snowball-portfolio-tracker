import type { ReactNode } from "react";
import { Card } from "@/components/ui";

export function StatCard({
  label,
  value,
  sub,
  icon,
  trend,
}: {
  label: string;
  value: string;
  sub?: ReactNode;
  icon?: ReactNode;
  trend?: "up" | "down" | "neutral";
}) {
  const valueColor =
    trend === "up"
      ? "text-emerald-500 dark:text-emerald-400"
      : trend === "down"
        ? "text-rose-500 dark:text-rose-400"
        : "";
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {label}
        </p>
        {icon && <span className="text-slate-400 dark:text-slate-500">{icon}</span>}
      </div>
      <p className={`text-2xl font-bold mt-2 tabular-nums ${valueColor}`}>{value}</p>
      {sub && <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{sub}</div>}
    </Card>
  );
}