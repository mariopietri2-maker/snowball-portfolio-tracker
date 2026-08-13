"use client";

import { useState } from "react";
import { usePortfolioStore } from "@/lib/store";
import { BROKER_PRESETS, BROKER_LABELS } from "@/lib/broker-presets";
import { parsePortfolioJSON } from "@/lib/json-import";
import { holdingsFromParsed, type ParsedHolding } from "@/lib/csv-parser";
import { formatCurrency } from "@/lib/finance";
import { uuid } from "@/lib/uuid";
import { Card, Button, Badge, Spinner } from "@/components/ui";
import type { BrokerPreset } from "@/types";

type Mode = "url" | "paste";
type Tone = "ok" | "err";

export function JsonImportCard() {
  const { accounts, preferences, addAccount, setAccountHoldings } =
    usePortfolioStore();

  const [target, setTarget] = useState<string>("new");
  const [newName, setNewName] = useState("API Portfolio");
  const [newPreset, setNewPreset] = useState<BrokerPreset>("generic");
  const [mode, setMode] = useState<Mode>("url");
  const [url, setUrl] = useState("");
  const [jsonText, setJsonText] = useState("");
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<ParsedHolding[] | null>(null);
  const [status, setStatus] = useState<{ tone: Tone; text: string } | null>(null);

  const show = (tone: Tone, text: string) => setStatus({ tone, text });

  const applyPreview = (parsed: ParsedHolding[]) => {
    setPreview(parsed);
    setStatus({ tone: "ok", text: `Found ${parsed.length} position(s). Review, then import.` });
  };

  const fetchFromUrl = async () => {
    const trimmed = url.trim();
    if (!trimmed) {
      show("err", "Enter a URL first.");
      return;
    }
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch(`/api/proxy?url=${encodeURIComponent(trimmed)}`, {
        cache: "no-store",
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        const msg =
          body?.error === "host-blocked"
            ? "That URL points to a local/private address and was blocked for security."
            : body?.error === "not-json"
              ? "The endpoint didn't return JSON."
              : body?.error === "upstream-error"
                ? `The endpoint returned HTTP ${body?.status}.`
                : "Couldn't fetch that URL.";
        show("err", msg);
        return;
      }
      applyPreview(parsePortfolioJSON(JSON.stringify(body)));
    } catch (err) {
      show("err", err instanceof Error ? err.message : "Fetch failed.");
    } finally {
      setBusy(false);
    }
  };

  const parsePaste = () => {
    try {
      applyPreview(parsePortfolioJSON(jsonText));
    } catch (err) {
      show("err", err instanceof Error ? err.message : "Parse failed.");
    }
  };

  const importPositions = () => {
    if (!preview || preview.length === 0) return;
    const store = usePortfolioStore.getState();
    let accountId = target;
    if (target === "new") {
      accountId = addAccount({
        name: newName.trim() || "API Portfolio",
        broker: newPreset,
        currency: preferences.currency,
      });
    }
    const acc = store.accounts.find((a) => a.id === accountId);
    if (!acc) return;

    const existing = new Map(acc.holdings.map((h) => [h.symbol, h]));
    const incoming: ParsedHolding[] = [];
    for (const p of preview) {
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

    const accountName = acc.name || newName;
    show("ok", `Imported ${preview.length} position(s) into “${accountName}”.`);
    setPreview(null);
    setUrl("");
    setJsonText("");
  };

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-semibold">Import via JSON API</h2>
            <Badge tone="accent">generic</Badge>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
            Pull positions from any JSON endpoint (or paste JSON directly).
            Fields are flexible: symbol, shares/qty, costBasis/avg price, name, currency.
          </p>
        </div>
      </div>

      <div className="mt-4 grid sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-xs text-slate-500 dark:text-slate-400">Import into account</span>
          <select
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none"
          >
            <option value="new">+ New account</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} · {BROKER_LABELS[a.broker]}
              </option>
            ))}
          </select>
        </label>
        {target === "new" && (
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs text-slate-500 dark:text-slate-400">Account name</span>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="API Portfolio"
                className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none"
              />
            </label>
            <label className="block">
              <span className="text-xs text-slate-500 dark:text-slate-400">Broker label</span>
              <select
                value={newPreset}
                onChange={(e) => setNewPreset(e.target.value as BrokerPreset)}
                className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none"
              >
                {Object.keys(BROKER_PRESETS).map((id) => (
                  <option key={id} value={id}>
                    {BROKER_LABELS[id as BrokerPreset]}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={() => setMode("url")}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
            mode === "url"
              ? "bg-accent text-white"
              : "border border-slate-300 dark:border-slate-700"
          }`}
        >
          Fetch from URL
        </button>
        <button
          onClick={() => setMode("paste")}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
            mode === "paste"
              ? "bg-accent text-white"
              : "border border-slate-300 dark:border-slate-700"
          }`}
        >
          Paste JSON
        </button>
      </div>

      {mode === "url" ? (
        <div className="mt-3 flex gap-2 items-end">
          <label className="flex-1">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Endpoint URL (CORS not required — fetched server-side)
            </span>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://api.example.com/positions"
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none"
            />
          </label>
          <Button variant="primary" onClick={fetchFromUrl} disabled={busy}>
            {busy ? "Fetching…" : "Fetch & parse"}
          </Button>
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          <label className="block">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              JSON payload — array of positions or an object with a positions/holdings array
            </span>
            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              rows={6}
              placeholder='[{"symbol":"AAPL","shares":10,"costBasis":150.2}]'
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-mono focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none resize-y"
            />
          </label>
          <Button variant="primary" onClick={parsePaste}>
            Parse JSON
          </Button>
        </div>
      )}

      {busy && <Spinner label="Fetching…" />}

      {status && (
        <div
          className={`mt-3 rounded-lg px-4 py-3 text-sm border ${
            status.tone === "ok"
              ? "bg-accent/10 border-accent/30 text-slate-700 dark:text-slate-200"
              : "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400"
          }`}
        >
          {status.text}
        </div>
      )}

      {preview && preview.length > 0 && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm min-w-96">
            <thead className="text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="text-left px-3 py-2 font-medium">Symbol</th>
                <th className="text-left px-3 py-2 font-medium">Name</th>
                <th className="text-right px-3 py-2 font-medium">Shares</th>
                <th className="text-right px-3 py-2 font-medium">Avg Cost</th>
                <th className="text-right px-3 py-2 font-medium">Currency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {preview.map((h) => (
                <tr key={h.symbol}>
                  <td className="px-3 py-2 font-medium">{h.symbol}</td>
                  <td className="px-3 py-2 text-slate-500 dark:text-slate-400">
                    {h.name ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {h.shares.toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {formatCurrency(h.costBasis, h.currency)}
                  </td>
                  <td className="px-3 py-2 text-right">{h.currency}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3 flex justify-end">
            <Button variant="primary" onClick={importPositions}>
              Import {preview.length} position{preview.length === 1 ? "" : "s"}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
