"use client";

import { useState, useRef } from "react";
import { usePortfolioStore } from "@/lib/store";
import { parsePortfolioCSV, holdingsFromParsed } from "@/lib/csv-parser";
import { calculatePortfolioMetrics, formatCurrency, formatPercent } from "@/lib/finance";

export default function PortfolioPage() {
  const { holdings, addHolding, setHoldings, removeHolding, clearPortfolio } =
    usePortfolioStore();
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const metrics = calculatePortfolioMetrics(holdings);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = parsePortfolioCSV(text);
        if (parsed.length === 0) {
          setImportStatus("No valid holdings found in CSV.");
          return;
        }
        const newHoldings = holdingsFromParsed(parsed);
        // Merge or replace? For simplicity, replace for now
        setHoldings(
          newHoldings.map((h) => ({
            ...h,
            id: crypto.randomUUID(),
            addedAt: new Date().toISOString(),
          }))
        );
        setImportStatus(`Successfully imported ${parsed.length} holdings.`);
      } catch (err) {
        setImportStatus("Failed to parse CSV. Check the format.");
        console.error(err);
      }
    };
    reader.readAsText(file);
    // reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAddManual = () => {
    const symbol = prompt("Ticker symbol (e.g. AAPL):");
    if (!symbol) return;
    const sharesStr = prompt("Number of shares:");
    const costStr = prompt("Average cost per share:");
    const shares = parseFloat(sharesStr || "0");
    const costBasis = parseFloat(costStr || "0");
    if (shares > 0) {
      addHolding({
        symbol: symbol.toUpperCase(),
        shares,
        costBasis: isNaN(costBasis) ? 0 : costBasis,
        currency: "USD",
      });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Portfolio</h1>
          <p className="text-slate-400 mt-1">
            Import from CSV or manage holdings manually.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleAddManual}
            className="px-4 py-2 rounded-lg border border-slate-700 hover:border-sky-600 text-sm font-medium transition"
          >
            + Add Manually
          </button>
          <label className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium cursor-pointer transition">
            Import CSV
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>
        </div>
      </div>

      {importStatus && (
        <div className="rounded-lg bg-sky-900/30 border border-sky-800 px-4 py-3 text-sm text-sky-200">
          {importStatus}
        </div>
      )}

      {/* Summary */}
      {holdings.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-lg bg-slate-900 border border-slate-800 p-4">
            <p className="text-xs text-slate-400">Total Value</p>
            <p className="text-xl font-semibold">{formatCurrency(metrics.totalValue)}</p>
          </div>
          <div className="rounded-lg bg-slate-900 border border-slate-800 p-4">
            <p className="text-xs text-slate-400">Total Cost</p>
            <p className="text-xl font-semibold">{formatCurrency(metrics.totalCost)}</p>
          </div>
          <div className="rounded-lg bg-slate-900 border border-slate-800 p-4">
            <p className="text-xs text-slate-400">Gain / Loss</p>
            <p
              className={`text-xl font-semibold ${
                metrics.totalGain >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {formatCurrency(metrics.totalGain)}
            </p>
          </div>
          <div className="rounded-lg bg-slate-900 border border-slate-800 p-4">
            <p className="text-xs text-slate-400">Return</p>
            <p
              className={`text-xl font-semibold ${
                metrics.totalGainPercent >= 0
                  ? "text-emerald-400"
                  : "text-rose-400"
              }`}
            >
              {formatPercent(metrics.totalGainPercent)}
            </p>
          </div>
        </div>
      )}

      {/* Holdings table */}
      <div className="rounded-xl border border-slate-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-900 text-slate-400">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Symbol</th>
              <th className="text-right px-4 py-3 font-medium">Shares</th>
              <th className="text-right px-4 py-3 font-medium">Avg Cost</th>
              <th className="text-right px-4 py-3 font-medium">Market Value*</th>
              <th className="text-right px-4 py-3 font-medium">Gain*</th>
              <th className="text-right px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {metrics.holdings.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                  No holdings yet. Import a CSV or add manually.
                </td>
              </tr>
            ) : (
              metrics.holdings.map((h) => (
                <tr key={h.id} className="hover:bg-slate-900/50">
                  <td className="px-4 py-3 font-medium">{h.symbol}</td>
                  <td className="px-4 py-3 text-right">{h.shares.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">
                    {formatCurrency(h.costBasis)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {formatCurrency(h.marketValue)}
                  </td>
                  <td
                    className={`px-4 py-3 text-right ${
                      h.gain >= 0 ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {formatCurrency(h.gain)} ({formatPercent(h.gainPercent)})
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => removeHolding(h.id)}
                      className="text-slate-500 hover:text-rose-400 text-xs"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-500">
        * Market values currently use cost basis as placeholder. Live prices can be
        added later via Yahoo Finance / Finnhub API.
      </p>

      {holdings.length > 0 && (
        <button
          onClick={() => {
            if (confirm("Clear entire portfolio?")) clearPortfolio();
          }}
          className="text-sm text-rose-400 hover:text-rose-300"
        >
          Clear portfolio
        </button>
      )}
    </div>
  );
}
