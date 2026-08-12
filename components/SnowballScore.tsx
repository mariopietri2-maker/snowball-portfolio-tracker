"use client";

import { useMemo } from "react";
import { formatCurrency, formatCompact } from "@/lib/finance";
import type { PortfolioSnapshot } from "@/types";

interface SnowballScoreProps {
  totalGainPercent: number;
  totalValue: number;
  annualIncome: number;
  snapshots: PortfolioSnapshot[];
  currency: string;
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

export function SnowballScore({
  totalGainPercent,
  totalValue,
  annualIncome,
  snapshots,
  currency,
}: SnowballScoreProps) {
  const score = useMemo(() => {
    // Growth: -50% → 0, +100% → max 380
    const growth = clamp(((totalGainPercent + 50) / 150) * 380, 0, 380);
    // Yield: 0% → 0, 4%+ → max 280
    const yieldPct = totalValue > 0 ? (annualIncome / totalValue) * 100 : 0;
    const yieldScore = clamp((yieldPct / 4) * 280, 0, 280);
    // Consistency: coverage of tracked days with snapshots → max 300
    let consistency = 0;
    if (snapshots.length > 0) {
      const first = new Date(snapshots[0]!.date).getTime();
      const last = new Date(snapshots[snapshots.length - 1]!.date).getTime();
      const days = Math.max(1, (last - first) / (1000 * 60 * 60 * 24));
      const coverage = snapshots.length / days;
      consistency = clamp(coverage * 300, 0, 300);
    }
    return Math.round(growth + yieldScore + consistency);
  }, [totalGainPercent, totalValue, annualIncome, snapshots]);

  const pct = score / 1000;

  const firstTs = snapshots.length > 0 ? new Date(snapshots[0]!.date).getTime() : 0;
  const lastTs =
    snapshots.length > 0
      ? new Date(snapshots[snapshots.length - 1]!.date).getTime()
      : 0;
  const trackedDays = Math.max(1, (lastTs - firstTs) / (1000 * 60 * 60 * 24));
  const consistencyValue = snapshots.length > 0 ? clamp((snapshots.length / trackedDays) * 300, 0, 300) : 0;

  const breakdown = [
    {
      label: "Growth momentum",
      value: clamp(((totalGainPercent + 50) / 150) * 380, 0, 380),
      detail: `${totalGainPercent.toFixed(1)}% gain`,
    },
    {
      label: "Dividend income",
      value: totalValue > 0 ? clamp((annualIncome / totalValue / 4) * 280, 0, 280) : 0,
      detail: `${formatCompact(annualIncome)}/yr`,
    },
    {
      label: "Consistency",
      value: Math.round(consistencyValue),
      detail: `${snapshots.length} tracked days`,
    },
  ];

  return (
    <div>
      <div className="flex items-center gap-4">
        <div
          className="relative w-16 h-16 rounded-full grid place-items-center shrink-0"
          style={{
            background: `conic-gradient(var(--tw-primary, #0ea5e9) ${pct * 360}deg, rgba(148,163,184,0.25) ${pct * 360}deg)`,
          }}
        >
          <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-900 grid place-items-center text-lg font-bold tabular-nums">
            {score}
          </div>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold">Snowball Score</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Score of {score} / 1000 ·{" "}
            {score >= 700
              ? "top-tier snowball"
              : score >= 400
              ? "rolling nicely"
              : "building momentum"}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Portfolio · {formatCurrency(totalValue, currency)}
          </p>
        </div>
      </div>
      <div className="mt-4 space-y-3">
        {breakdown.map((b) => (
          <div key={b.label}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-500 dark:text-slate-400">{b.label}</span>
              <span className="tabular-nums">{b.detail}</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-accent"
                style={{ width: `${(b.value / 380) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}