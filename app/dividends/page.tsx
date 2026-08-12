"use client";

import { usePortfolioStore } from "@/lib/store";
import { formatCurrency } from "@/lib/finance";

export default function DividendsPage() {
  const { holdings, dividends, addDividend } = usePortfolioStore();

  const handleAddDividend = () => {
    const symbol = prompt("Ticker symbol:");
    if (!symbol) return;
    const amountStr = prompt("Amount per share:");
    const amount = parseFloat(amountStr || "0");
    if (isNaN(amount) || amount <= 0) return;

    const payDate = prompt("Pay date (YYYY-MM-DD):") || new Date().toISOString().slice(0, 10);
    const exDate = prompt("Ex-div date (YYYY-MM-DD):") || payDate;

    addDividend({
      symbol: symbol.toUpperCase(),
      amountPerShare: amount,
      exDate,
      payDate,
      status: "upcoming",
      currency: "USD",
    });
  };

  // Rough estimate of annual dividend income based on holdings (placeholder)
  const estimatedAnnual = holdings.reduce((sum, h) => {
    // Assume 2% yield if we don't have real data yet
    return sum + h.shares * h.costBasis * 0.02;
  }, 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dividends</h1>
          <p className="text-slate-400 mt-1">
            Track upcoming and historical dividend payments.
          </p>
        </div>
        <button
          onClick={handleAddDividend}
          className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium transition"
        >
          + Add Dividend
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
          <p className="text-sm text-slate-400">Estimated Annual Income*</p>
          <p className="text-2xl font-semibold mt-1 text-emerald-400">
            {formatCurrency(estimatedAnnual)}
          </p>
          <p className="text-xs text-slate-500 mt-1">Based on ~2% yield assumption</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
          <p className="text-sm text-slate-400">Tracked Events</p>
          <p className="text-2xl font-semibold mt-1">{dividends.length}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
          <p className="text-sm text-slate-400">Holdings with Dividends</p>
          <p className="text-2xl font-semibold mt-1">
            {new Set(dividends.map((d) => d.symbol)).size}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-900 text-slate-400">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Symbol</th>
              <th className="text-right px-4 py-3 font-medium">Amount / Share</th>
              <th className="text-left px-4 py-3 font-medium">Ex-Date</th>
              <th className="text-left px-4 py-3 font-medium">Pay Date</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {dividends.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                  No dividend events yet. Add one manually or connect a data source later.
                </td>
              </tr>
            ) : (
              dividends
                .slice()
                .sort((a, b) => a.payDate.localeCompare(b.payDate))
                .map((d) => (
                  <tr key={d.id} className="hover:bg-slate-900/50">
                    <td className="px-4 py-3 font-medium">{d.symbol}</td>
                    <td className="px-4 py-3 text-right">
                      {formatCurrency(d.amountPerShare)}
                    </td>
                    <td className="px-4 py-3">{d.exDate}</td>
                    <td className="px-4 py-3">{d.payDate}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                          d.status === "upcoming"
                            ? "bg-sky-900/50 text-sky-300"
                            : d.status === "paid"
                            ? "bg-emerald-900/50 text-emerald-300"
                            : "bg-slate-800 text-slate-300"
                        }`}
                      >
                        {d.status}
                      </span>
                    </td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-500">
        * Real dividend data can later be pulled from Yahoo Finance, Dividend.com, or
        similar APIs. Manual entry is available for now.
      </p>
    </div>
  );
}
