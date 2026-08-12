"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Holding, DividendEvent } from "@/types";

interface PortfolioState {
  holdings: Holding[];
  dividends: DividendEvent[];
  addHolding: (holding: Omit<Holding, "id" | "addedAt">) => void;
  updateHolding: (id: string, updates: Partial<Holding>) => void;
  removeHolding: (id: string) => void;
  setHoldings: (holdings: Holding[]) => void;
  addDividend: (div: Omit<DividendEvent, "id">) => void;
  setDividends: (divs: DividendEvent[]) => void;
  clearPortfolio: () => void;
}

export const usePortfolioStore = create<PortfolioState>()(
  persist(
    (set) => ({
      holdings: [],
      dividends: [],

      addHolding: (holding) =>
        set((state) => ({
          holdings: [
            ...state.holdings,
            {
              ...holding,
              id: crypto.randomUUID(),
              addedAt: new Date().toISOString(),
            },
          ],
        })),

      updateHolding: (id, updates) =>
        set((state) => ({
          holdings: state.holdings.map((h) =>
            h.id === id ? { ...h, ...updates } : h
          ),
        })),

      removeHolding: (id) =>
        set((state) => ({
          holdings: state.holdings.filter((h) => h.id !== id),
        })),

      setHoldings: (holdings) => set({ holdings }),

      addDividend: (div) =>
        set((state) => ({
          dividends: [
            ...state.dividends,
            { ...div, id: crypto.randomUUID() },
          ],
        })),

      setDividends: (dividends) => set({ dividends }),

      clearPortfolio: () => set({ holdings: [], dividends: [] }),
    }),
    {
      name: "snowball-portfolio-storage",
    }
  )
);
