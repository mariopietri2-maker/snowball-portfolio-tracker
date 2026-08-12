"use client";

import { useMemo, useState } from "react";
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart,
} from "recharts";
import { usePortfolioStore } from "@/lib/store";
import { mergeAccountHoldings, calculatePortfolioMetrics, projectSnowball, formatCurrency } from "@/lib/finance";

export default function SnowballPage() {
  const accounts = usePortfolioStore((s) => s.accounts);
  const holdings = mergeAccountHoldings(accounts);
  const metrics = calculatePortfolioMetrics(holdings);

  const [startingValue, setStartingValue] = useState(
    Math.max(metrics.totalValue, 10000)
  );
  const [annualContribution, setAnnualContribution] = useState(6000);
  const [expectedReturn, setExpectedReturn] = useState(8); // %
  const [dividendYield, setDividendYield] = useState(2.5); // %
  const [years, setYears] = useState(20);
  const [reinvest, setReinvest] = useState(true);

  const projections = useMemo(
    () =>
      projectSnowball({
        startingValue,
        annualContribution,
        expectedReturn: expectedReturn / 100,
        dividendYield: dividendYield / 100,
        years,
        reinvestDividends: reinvest,
      }),
    [startingValue, annualContribution, expectedReturn, dividendYield, years, reinvest]
  );

  const final = projections[projections.length - 1];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <span>❄️</span> Snowball Visualizer
        </h1>
        <p className="text-slate-400 mt-1">
          See how dividend reinvestment and compounding can grow your portfolio over
          time.
        </p>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 rounded-xl border border-slate-800 bg-slate-900/50 p-6">
        <Slider
          label="Starting Value"
          value={startingValue}
          min={1000}
          max={500000}
          step={1000}
          onChange={setStartingValue}
          format={(v) => formatCurrency(v)}
        />
        <Slider
          label="Annual Contribution"
          value={annualContribution}
          min={0}
          max={50000}
          step={500}
          onChange={setAnnualContribution}
          format={(v) => formatCurrency(v)}
        />
        <Slider
          label="Expected Annual Return"
          value={expectedReturn}
          min={0}
          max={15}
          step={0.5}
          onChange={setExpectedReturn}
          format={(v) => `${v}%`}
        />
        <Slider
          label="Dividend Yield"
          value={dividendYield}
          min={0}
          max={8}
          step={0.1}
          onChange={setDividendYield}
          format={(v) => `${v}%`}
        />
        <Slider
          label="Years"
          value={years}
          min={5}
          max={40}
          step={1}
          onChange={setYears}
          format={(v) => `${v} years`}
        />
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="reinvest"
            checked={reinvest}
            onChange={(e) => setReinvest(e.target.checked)}
            className="w-4 h-4 rounded border-slate-600 text-sky-500 focus:ring-sky-500"
          />
          <label htmlFor="reinvest" className="text-sm font-medium">
            Reinvest Dividends
          </label>
        </div>
      </div>

      {/* Results summary */}
      {final && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
            <p className="text-sm text-slate-400">Final Portfolio Value</p>
            <p className="text-2xl font-bold text-sky-400 mt-1">
              {formatCurrency(final.portfolioValue)}
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
            <p className="text-sm text-slate-400">Total Dividends Received</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">
              {formatCurrency(final.cumulativeDividends)}
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
            <p className="text-sm text-slate-400">Growth Multiple</p>
            <p className="text-2xl font-bold mt-1">
              {(final.portfolioValue / startingValue).toFixed(1)}x
            </p>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4 h-96">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={projections}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="year"
              stroke="#64748b"
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              label={{ value: "Year", position: "insideBottom", offset: -5, fill: "#64748b" }}
            />
            <YAxis
              stroke="#64748b"
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0f172a",
                border: "1px solid #1e293b",
                borderRadius: "8px",
              }}
              formatter={(value: number) => [formatCurrency(value), ""]}
              labelFormatter={(label) => `Year ${label}`}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="portfolioValue"
              name="Portfolio Value"
              stroke="#0ea5e9"
              fillOpacity={1}
              fill="url(#colorValue)"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="cumulativeDividends"
              name="Cumulative Dividends"
              stroke="#34d399"
              strokeWidth={2}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <p className="text-xs text-slate-500">
        This is a simplified model for illustration. Actual returns vary and past
        performance is not indicative of future results. Adjust the assumptions to
        match your own expectations.
      </p>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format: (v: number) => string;
}) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-2">
        <span className="text-slate-300">{label}</span>
        <span className="font-medium text-sky-400">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
      />
    </div>
  );
}
