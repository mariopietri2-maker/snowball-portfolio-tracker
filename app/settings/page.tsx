"use client";

import { usePortfolioStore } from "@/lib/store";
import { useAuth } from "@/components/AuthProvider";
import { Card, Button } from "@/components/ui";
import type { AccentColor } from "@/types";

const ACCENTS: Array<{ id: AccentColor; color: string; label: string }> = [
  { id: "sky", color: "#0ea5e9", label: "Sky" },
  { id: "cyan", color: "#06b6d4", label: "Cyan" },
  { id: "violet", color: "#8b5cf6", label: "Violet" },
  { id: "emerald", color: "#10b981", label: "Emerald" },
  { id: "rose", color: "#f43f5e", label: "Rose" },
  { id: "amber", color: "#f59e0b", label: "Amber" },
];

const AVATAR_COLORS = ["#0ea5e9", "#8b5cf6", "#10b981", "#f59e0b", "#f43f5e", "#06b6d4"];

const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "CAD", "CHF", "AUD", "SEK"];

const REFRESH_OPTIONS = [30, 60, 120, 300];

export default function SettingsPage() {
  const { preferences, setPreferences, clearPortfolio, watchlist, accounts, snapshots } =
    usePortfolioStore();
  const { user, signOut } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Personalize your dashboard. Everything is stored in your browser.
        </p>
      </div>

      <Card className="p-5">
        <h2 className="font-semibold mb-4">Profile</h2>
        <label className="block max-w-md">
          <span className="text-sm text-slate-500 dark:text-slate-400">Display name</span>
          <input
            value={preferences.userName}
            onChange={(e) => setPreferences({ userName: e.target.value })}
            placeholder="Your name"
            className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none"
          />
        </label>
        <p className="mt-4 mb-1 text-sm text-slate-500 dark:text-slate-400">Avatar color</p>
        <div className="flex gap-2">
          {AVATAR_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setPreferences({ avatarColor: c })}
              className={`w-8 h-8 rounded-full transition ${
                preferences.avatarColor === c ? "ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-950 ring-slate-400" : ""
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="font-semibold mb-4">Appearance</h2>
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Theme</p>
            <div className="flex gap-2">
              {(["dark", "light"] as const).map((t) => (
                <Button
                  key={t}
                  variant={preferences.theme === t ? "primary" : "secondary"}
                  onClick={() => setPreferences({ theme: t })}
                >
                  {t === "dark" ? "Dark" : "Light"}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Accent color</p>
            <div className="flex flex-wrap gap-2">
              {ACCENTS.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setPreferences({ accent: a.id })}
                  title={a.label}
                  className={`w-8 h-8 rounded-full transition ${
                    preferences.accent === a.id ? "ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-950 ring-slate-400" : ""
                  }`}
                  style={{ backgroundColor: a.color }}
                />
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="font-semibold mb-4">Market Data</h2>
        <div className="grid sm:grid-cols-3 gap-5">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Base currency</p>
            <select
              value={preferences.currency}
              onChange={(e) => setPreferences({ currency: e.target.value })}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none"
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Quote refresh</p>
            <select
              value={preferences.refreshSeconds}
              onChange={(e) => setPreferences({ refreshSeconds: Number(e.target.value) })}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none"
            >
              {REFRESH_OPTIONS.map((s) => (
                <option key={s} value={s}>Every {s}s</option>
              ))}
            </select>
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Yield assumption %</p>
            <input
              type="number"
              step="0.5"
              min={0}
              max={15}
              value={preferences.defaultYieldPct}
              onChange={(e) => setPreferences({ defaultYieldPct: Number(e.target.value) })}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none"
            />
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          Used for estimated dividend income where no recorded dividend events exist yet.
        </p>
      </Card>

      <Card className="p-5">
        <h2 className="font-semibold mb-3">Account</h2>
        {user ? (
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-sm font-medium">{user.email}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Synced to the cloud — changes upload automatically.
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={() => {
                if (confirm("Sign out of this device?")) void signOut();
              }}
            >
              Sign out
            </Button>
          </div>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Cloud sync not configured. Add Supabase keys to enable accounts.
          </p>
        )}
      </Card>

      <Card className="p-5">
        <h2 className="font-semibold mb-3">Data & Privacy</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          <strong>{accounts.length}</strong> accounts · <strong>{watchlist.length}</strong> watchlist items ·{" "}
          <strong>{snapshots.length}</strong> history snapshots — stored locally in localStorage.
        </p>
        <div className="mt-4">
          <Button
            variant="danger"
            onClick={() => {
              if (confirm("Delete all accounts, holdings, dividends and history? This cannot be undone.")) {
                clearPortfolio();
              }
            }}
          >
            Clear all portfolio data
          </Button>
        </div>
      </Card>
    </div>
  );
}