import { describe, it, expect, beforeEach } from "vitest";
import { usePortfolioStore } from "@/lib/store";

beforeEach(() => {
  usePortfolioStore.setState({
    accounts: [],
    dividends: [],
    watchlist: [],
    preferences: usePortfolioStore.getState().preferences,
    snapshots: [],
    alerts: [],
  });
});

describe("portfolio store", () => {
  it("adds an account", () => {
    const id = usePortfolioStore
      .getState()
      .addAccount({ name: "IRA", broker: "generic", currency: "USD" });
    const acc = usePortfolioStore.getState().accounts.find((a) => a.id === id);
    expect(acc?.name).toBe("IRA");
  });

  it("creates a default account when adding the first holding", () => {
    usePortfolioStore.getState().addManualHolding({ symbol: "AAPL", shares: 5, costBasis: 100 });
    const { accounts } = usePortfolioStore.getState();
    expect(accounts).toHaveLength(1);
    expect(accounts[0].holdings[0].symbol).toBe("AAPL");
  });

  it("removes a holding by symbol across accounts", () => {
    usePortfolioStore.getState().addManualHolding({ symbol: "AAPL", shares: 5, costBasis: 100 });
    usePortfolioStore.getState().addManualHolding({ symbol: "MSFT", shares: 2, costBasis: 200 });
    usePortfolioStore.getState().removeHoldingBySymbol("AAPL");
    const symbols = usePortfolioStore
      .getState()
      .accounts.flatMap((a) => a.holdings.map((h) => h.symbol));
    expect(symbols).toEqual(["MSFT"]);
  });

  it("toggles watchlist entries", () => {
    const { toggleWatchlist } = usePortfolioStore.getState();
    toggleWatchlist("TSLA");
    expect(usePortfolioStore.getState().watchlist).toContain("TSLA");
    toggleWatchlist("TSLA");
    expect(usePortfolioStore.getState().watchlist).not.toContain("TSLA");
  });

  it("dedupes snapshots within 15 minutes", () => {
    const { pushSnapshot } = usePortfolioStore.getState();
    pushSnapshot(1000);
    pushSnapshot(1000);
    expect(usePortfolioStore.getState().snapshots).toHaveLength(1);
  });

  it("adds and removes price alerts", () => {
    const { addAlert, removeAlert } = usePortfolioStore.getState();
    addAlert({ symbol: "AAPL", direction: "above", targetPrice: 200 });
    const alert = usePortfolioStore.getState().alerts[0];
    expect(alert).toBeDefined();
    expect(alert.targetPrice).toBe(200);
    removeAlert(alert.id);
    expect(usePortfolioStore.getState().alerts).toHaveLength(0);
  });

  it("merges preferences", () => {
    usePortfolioStore.getState().setPreferences({ userName: "Alice", theme: "light" });
    const p = usePortfolioStore.getState().preferences;
    expect(p.userName).toBe("Alice");
    expect(p.theme).toBe("light");
  });

  it("clears portfolio data but keeps preferences", () => {
    usePortfolioStore.getState().addManualHolding({ symbol: "AAPL", shares: 5, costBasis: 100 });
    usePortfolioStore.getState().addDividend({
      symbol: "AAPL",
      amountPerShare: 1,
      exDate: "2026-01-01",
      payDate: "2026-01-15",
      status: "paid",
    });
    usePortfolioStore.getState().clearPortfolio();
    const s = usePortfolioStore.getState();
    expect(s.accounts).toHaveLength(0);
    expect(s.dividends).toHaveLength(0);
    expect(s.snapshots).toHaveLength(0);
  });
});
