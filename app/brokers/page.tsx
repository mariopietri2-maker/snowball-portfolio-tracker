"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { usePortfolioStore } from "@/lib/store";
import { BROKER_PRESETS, BROKER_LABELS, type BrokerPresetMapping } from "@/lib/broker-presets";
import { parsePortfolioCSV, holdingsFromParsed, type ParsedHolding } from "@/lib/csv-parser";
import { formatCurrency } from "@/lib/finance";
import { uuid } from "@/lib/uuid";
import { Card, Button, Badge, EmptyState } from "@/components/ui";
import type { BrokerPreset } from "@/types";

const PRESET_IDS = Object.keys(BROKER_PRESETS) as BrokerPreset[];

export default function BrokersPage() {
  const { accounts, preferences, addAccount, setAccountHoldings, removeAccount, removeHoldingFromAccount } =
    usePortfolioStore();

  const [name, setName] = useState("");
  const [preset, setPreset] = useState<BrokerPreset>("generic");
  const [status, setStatus] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<"ok" | "err">("ok");
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const createAccount = () => {
    const trimmed = name.trim() || "Broker Account";
    addAccount({ name: trimmed, broker: preset, currency: preferences.currency });
    setName("");
    setStatus(`Linked “${trimmed}” — now import a CSV export from that broker.`);
    setStatusTone("ok");
  };

  const importCsv = (accountId: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const acc = accounts.find((a) => a.id === accountId);
      if (!acc) return;
      const mapping: BrokerPresetMapping = BROKER_PRESETS[acc.broker];
      const parsed = parsePortfolioCSV(text, mapping);
      if (parsed.length === 0) {
        setStatus(`No valid holdings found. Is this a ${BROKER_LABELS[acc.broker]} export?`);
        setStatusTone("err");
        return;
      }
      // merge with existing account holdings by symbol
      const existing = new Map(acc.holdings.map((h) => [h.symbol, h]));
      const incoming: ParsedHolding[] = [];
      for (const p of parsed) {
        const present = existing.get(p.symbol);
        if (present) {
          const totalShares = present.shares + p.shares;
          existing.set(p.symbol, {
            ...present,
            shares: totalShares,
            costBasis:
              totalShares > 0
                ? (present.shares * present.costBasis + p.shares * p.costBasis) / totalShares
                : present.costBasis,
          });
        } else {
          incoming.push(p);
        }
      }
      const merged = [
        ...Array.from(existing.values()),
        ...holdingsFromParsed(incoming).map((h) => ({
          ...h,
          id: uuid(),
          addedAt: new Date().toISOString(),
        })),
      ];
      setAccountHoldings(accountId, merged);
      setStatus(
        `Imported ${parsed.length} positions into “${acc.name}” (${BROKER_LABELS[acc.broker]} layout).`
      );
      setStatusTone("ok");
    };
    reader.onerror = () => {
      setStatus("Failed to read the file. Please try again.");
      setStatusTone("err");
    };
    reader.readAsText(file);
  };

  const accountValue = (accountId: string) => {
    const acc = accounts.find((a) => a.id === accountId);
    if (!acc) return 0;
    return acc.holdings.reduce((s, h) => s + h.shares * h.costBasis, 0);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Broker Accounts</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Link your brokerage accounts and import positions from CSV exports. Data stays
          in your browser.
        </p>
      </div>

      {status && (
        <div
          className={`rounded-lg px-4 py-3 text-sm border ${
            statusTone === "ok"
              ? "bg-accent/10 border-accent/30 text-slate-700 dark:text-slate-200"
              : "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400"
          }`}
        >
          {status}
        </div>
      )}

      <Card className="p-5">
        <h2 className="font-semibold mb-3">+ Link a Broker Account</h2>
        <div className="flex flex-wrap gap-3 items-end">
          <label className="flex-1 min-w-40">
            <span className="text-xs text-slate-500 dark:text-slate-400">Account name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Roth IRA"
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none"
            />
          </label>
          <label className="min-w-44">
            <span className="text-xs text-slate-500 dark:text-slate-400">Broker</span>
            <select
              value={preset}
              onChange={(e) => setPreset(e.target.value as BrokerPreset)}
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none"
            >
              {PRESET_IDS.map((id) => (
                <option key={id} value={id}>
                  {BROKER_LABELS[id]}
                </option>
              ))}
            </select>
          </label>
          <Button onClick={createAccount} variant="primary">
            Link Account
          </Button>
        </div>
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          CSV column layouts are auto-detected per broker (Schwab, Interactive Brokers,
          Robinhood, tastytrade, generic).
        </p>
      </Card>

      <div className="space-y-4">
        {accounts.length === 0 ? (
          <Card>
            <EmptyState
              title="No accounts linked yet"
              hint="Create an account above, then import your broker's CSV export to pull positions in."
            />
          </Card>
        ) : (
          accounts.map((acc) => (
            <Card key={acc.id} className="p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{acc.name}</h3>
                    <Badge tone="accent">{BROKER_LABELS[acc.broker]}</Badge>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {acc.holdings.length} positions ·{" "}
                    {formatCurrency(accountValue(acc.id), acc.currency)} cost
                  </p>
                </div>
                <div className="flex gap-2">
                  <label className="cursor-pointer">
                    <span className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:brightness-110 transition inline-block">
                      Import CSV
                    </span>
                    <input
                      ref={(el) => {
                        fileRefs.current[acc.id] = el;
                      }}
                      type="file"
                      accept=".csv,text/csv"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) importCsv(acc.id, f);
                        const ref = fileRefs.current[acc.id];
                        if (ref) ref.value = "";
                      }}
                    />
                  </label>
                  <Button
                    variant="danger"
                    onClick={() => {
                      if (confirm(`Remove account “${acc.name}” and its holdings?`)) {
                        removeAccount(acc.id);
                      }
                    }}
                  >
                    Remove
                  </Button>
                </div>
              </div>

              {acc.holdings.length > 0 && (
                <div className="overflow-x-auto mt-4">
                  <table className="w-full text-sm min-w-96">
                    <thead className="text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="text-left px-3 py-2 font-medium">Symbol</th>
                        <th className="text-right px-3 py-2 font-medium">Shares</th>
                        <th className="text-right px-3 py-2 font-medium">Avg Cost</th>
                        <th className="text-right px-3 py-2 font-medium">Value</th>
                        <th className="text-right px-3 py-2 font-medium" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {acc.holdings.map((h) => (
                        <tr key={h.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="px-3 py-2">
                            <Link href={`/stocks/${h.symbol}`} className="font-medium hover:text-accent">
                              {h.symbol}
                            </Link>
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums">{h.shares.toLocaleString()}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(h.costBasis, acc.currency)}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(h.shares * h.costBasis, acc.currency)}</td>
                          <td className="px-3 py-2 text-right">
                            <button
                              onClick={() => removeHoldingFromAccount(acc.id, h.id)}
                              className="text-xs text-slate-400 hover:text-rose-500 transition"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {acc.holdings.length === 0 && (
                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                  No positions yet — import a CSV export from {BROKER_LABELS[acc.broker]}.
                </p>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}