"use client";

import { usePortfolioStore } from "@/lib/store";
import { calculatePortfolioMetrics, formatCurrency, formatPercent } from "@/lib/finance";
import Link from "next/link";

export default function DashboardPage() {
  const holdings = usePortfolioStore((s) => s.holdings);
  const metrics = calculatePortfolioMetrics(holdings);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-slate-400 mt-1">
          Your portfolio at a glance. Import holdings to get started.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          title="Total Value"
          value={formatCurrency(metrics.totalValue)}
          subtitle={`${holdings.length} holdings`}
        />
        <Card
          title="Total Cost"
          value={formatCurrency(metrics.totalCost)}
          subtitle="Cost basis"
        />
        <Card
          title="Unrealized Gain"
          value={formatCurrency(metrics.totalGain)}
          subtitle={formatPercent(metrics.totalGainPercent)}
          positive={metrics.totalGain >= 0}
        />
        <Card
          title="Positions"
          value={String(holdings.length)}
          subtitle="Tracked stocks"
        />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ActionCard
          href="/portfolio"
          title="Manage Portfolio"
          description="Import CSV or add holdings manually"
          icon="📥"
        />
        <ActionCard
          href="/dividends"
          title="Dividend Tracker"
          description="See upcoming and historical dividends"
          icon="💰"
        />
        <ActionCard
          href="/snowball"
          title="Snowball Visualizer"
          description="Watch the power of compounding"
          icon="❄️"
        />
      </div>

      {holdings.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-700 p-12 text-center">
          <p className="text-slate-400 text-lg mb-4">
            No holdings yet. Import a portfolio or add your first stock.
          </p>
          <Link
            href="/portfolio"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium transition"
          >
            Go to Portfolio →
          </Link>
        </div>
      )}
    </div>
  );
}

function Card({
  title,
  value,
  subtitle,
  positive,
}: {
  title: string;
  value: string;
  subtitle: string;
  positive?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
      <p className="text-sm text-slate-400">{title}</p>
      <p
        className={`text-2xl font-semibold mt-1 ${
          positive === undefined
            ? "text-white"
            : positive
            ? "text-emerald-400"
            : "text-rose-400"
        }`}
      >
        {value}
      </p>
      <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
    </div>
  );
}

function ActionCard({
  href,
  title,
  description,
  icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 hover:border-sky-700 hover:bg-slate-900 transition group"
    >
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="font-semibold group-hover:text-sky-400 transition">
        {title}
      </h3>
      <p className="text-sm text-slate-400 mt-1">{description}</p>
    </Link>
  );
}
