import { usePortfolioStore } from "@/lib/store";
import { mergeAccountHoldings } from "@/lib/finance";
import type { Holding, DividendEvent } from "@/types";

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function toCSV(headers: string[], rows: Array<Array<string | number>>) {
  const all = [headers, ...rows];
  return all
    .map((row) =>
      row
        .map((cell) => {
          const s = String(cell ?? "");
          return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(",")
    )
    .join("\n");
}

export function exportBackup() {
  const state = usePortfolioStore.getState();
  const payload = {
    exportedAt: new Date().toISOString(),
    app: "snowball-tracker",
    data: {
      accounts: state.accounts,
      dividends: state.dividends,
      watchlist: state.watchlist,
      snapshots: state.snapshots,
      alerts: state.alerts,
      preferences: state.preferences,
    },
  };
  download(
    `snowball-backup-${new Date().toISOString().slice(0, 10)}.json`,
    JSON.stringify(payload, null, 2),
    "application/json"
  );
}

export function exportHoldingsCSV() {
  const { accounts, preferences } = usePortfolioStore.getState();
  const holdings = mergeAccountHoldings(accounts);
  const rows = holdings.map((h: Holding) => [
    h.symbol,
    h.name ?? "",
    h.shares,
    h.costBasis,
    h.shares * h.costBasis,
    h.currency ?? preferences.currency,
  ]);
  download(
    `holdings-${new Date().toISOString().slice(0, 10)}.csv`,
    toCSV(["Symbol", "Company", "Shares", "Avg Cost", "Cost Basis", "Currency"], rows),
    "text/csv"
  );
}

export function exportDividendsCSV() {
  const { dividends } = usePortfolioStore.getState();
  const rows = dividends.map((d: DividendEvent) => [
    d.symbol,
    d.amountPerShare,
    d.payDate.slice(0, 10),
    d.exDate.slice(0, 10),
    d.status,
    d.currency ?? "",
    d.id,
  ]);
  download(
    `dividends-${new Date().toISOString().slice(0, 10)}.csv`,
    toCSV(["Symbol", "Amount/Share", "Pay Date", "Ex Date", "Status", "Currency", "Id"], rows),
    "text/csv"
  );
}