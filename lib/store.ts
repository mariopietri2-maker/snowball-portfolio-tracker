"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  Holding,
  DividendEvent,
  BrokerAccount,
  BrokerPreset,
  UserPreferences,
  PortfolioSnapshot,
} from "@/types";
import { uuid } from "@/lib/uuid";

export const DEFAULT_PREFERENCES: UserPreferences = {
  userName: "",
  avatarColor: "#0ea5e9",
  currency: "USD",
  theme: "dark",
  accent: "sky",
  refreshSeconds: 60,
  defaultYieldPct: 2,
};

const DEFAULT_ACCOUNT_META = { broker: "generic" as BrokerPreset, currency: "USD" };

interface PortfolioState {
  accounts: BrokerAccount[];
  dividends: DividendEvent[];
  watchlist: string[];
  preferences: UserPreferences;
  snapshots: PortfolioSnapshot[];

  addAccount: (data: { name: string; broker: BrokerPreset; currency: string }) => string;
  updateAccount: (id: string, updates: Partial<BrokerAccount>) => void;
  removeAccount: (id: string) => void;
  setAccountHoldings: (accountId: string, holdings: Holding[]) => void;
  addManualHolding: (holding: Omit<Holding, "id" | "addedAt">, accountId?: string) => void;
  removeHoldingBySymbol: (symbol: string) => void;
  removeHoldingFromAccount: (accountId: string, holdingId: string) => void;

  addDividend: (div: Omit<DividendEvent, "id">) => void;
  removeDividend: (id: string) => void;
  setDividends: (divs: DividendEvent[]) => void;

  toggleWatchlist: (symbol: string) => void;
  setPreferences: (prefs: Partial<UserPreferences>) => void;
  pushSnapshot: (totalValue: number) => void;
  clearPortfolio: () => void;
}

function createAccount(
  data: { name: string; broker: BrokerPreset; currency: string },
  holdings: Holding[] = []
): BrokerAccount {
  return {
    ...data,
    holdings,
    id: uuid(),
    createdAt: new Date().toISOString(),
  };
}

export const usePortfolioStore = create<PortfolioState>()(
  persist(
    (set) => ({
      accounts: [],
      dividends: [],
      watchlist: [],
      preferences: DEFAULT_PREFERENCES,
      snapshots: [],

      addAccount: (data) => {
        const account = createAccount(data);
        set((state) => ({ accounts: [...state.accounts, account] }));
        return account.id;
      },

      updateAccount: (id, updates) =>
        set((state) => ({
          accounts: state.accounts.map((a) =>
            a.id === id ? { ...a, ...updates } : a
          ),
        })),

      removeAccount: (id) =>
        set((state) => ({
          accounts: state.accounts.filter((a) => a.id !== id),
        })),

      setAccountHoldings: (accountId, holdings) =>
        set((state) => ({
          accounts: state.accounts.map((a) =>
            a.id === accountId ? { ...a, holdings } : a
          ),
        })),

      addManualHolding: (holding, accountId) =>
        set((state) => {
          const targetId = accountId ?? state.accounts[0]?.id;
          const accounts = [...state.accounts];
          if (!targetId) {
            const acc = createAccount({ name: "Personal Account", ...DEFAULT_ACCOUNT_META });
            acc.holdings = [
              { ...holding, id: uuid(), addedAt: new Date().toISOString() },
            ];
            accounts.push(acc);
          } else {
            const acc = accounts.find((a) => a.id === targetId);
            if (acc) {
              acc.holdings = [
                ...acc.holdings,
                { ...holding, id: uuid(), addedAt: new Date().toISOString() },
              ];
            }
          }
          return { accounts };
        }),

      removeHoldingBySymbol: (symbol) =>
        set((state) => ({
          accounts: state.accounts.map((a) => ({
            ...a,
            holdings: a.holdings.filter((h) => h.symbol !== symbol),
          })),
        })),

      removeHoldingFromAccount: (accountId, holdingId) =>
        set((state) => ({
          accounts: state.accounts.map((a) =>
            a.id === accountId
              ? { ...a, holdings: a.holdings.filter((h) => h.id !== holdingId) }
              : a
          ),
        })),

      addDividend: (div) =>
        set((state) => ({
          dividends: [
            ...state.dividends,
            { ...div, id: uuid() },
          ],
        })),

      removeDividend: (id) =>
        set((state) => ({
          dividends: state.dividends.filter((d) => d.id !== id),
        })),

      setDividends: (dividends) => set({ dividends }),

      toggleWatchlist: (symbol) =>
        set((state) => ({
          watchlist: state.watchlist.includes(symbol)
            ? state.watchlist.filter((s) => s !== symbol)
            : [...state.watchlist, symbol],
        })),

      setPreferences: (prefs) =>
        set((state) => ({
          preferences: { ...state.preferences, ...prefs },
        })),

      pushSnapshot: (totalValue) =>
        set((state) => {
          const now = new Date().toISOString();
          const recent = state.snapshots.some(
            (s) => Math.abs(new Date(s.date).getTime() - Date.now()) < 15 * 60 * 1000
          );
          if (recent) return state;
          const snapshots = [...state.snapshots, { date: now, totalValue }].slice(-120);
          return { snapshots };
        }),

      clearPortfolio: () =>
        set({ accounts: [], dividends: [], snapshots: [] }),
    }),
    {
      name: "snowball-portfolio-storage",
      version: 2,
      migrate: (persistedState, version) => {
        if (version < 2) {
          const old = (persistedState ?? {}) as {
            holdings?: Holding[];
            dividends?: DividendEvent[];
          };
          const legacy = old.holdings ?? [];
          const accounts = legacy.length
            ? [
                createAccount(
                  { name: "Personal Account", ...DEFAULT_ACCOUNT_META },
                  legacy
                ),
              ]
            : [];
          return {
            accounts,
            dividends: old.dividends ?? [],
            watchlist: [],
            preferences: DEFAULT_PREFERENCES,
            snapshots: [],
          };
        }
        return persistedState as PortfolioState;
      },
    }
  )
);