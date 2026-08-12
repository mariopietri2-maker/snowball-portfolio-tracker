import { supabase } from "@/lib/supabase";
import type {
  BrokerAccount,
  DividendEvent,
  PortfolioSnapshot,
  UserPreferences,
} from "@/types";

interface RowAccount {
  id: string;
  name: string;
  broker: string;
  currency: string;
}

interface RowHolding {
  id: string;
  account_id: string;
  symbol: string;
  name: string | null;
  shares: number;
  cost_basis: number;
  currency: string;
}

interface RowProfile {
  username: string;
  avatar_color: string;
  currency: string;
  theme: string;
  accent: string;
  refresh_seconds: number;
  default_yield_pct: number;
}

interface RowDividend {
  id: string;
  symbol: string;
  amount_per_share: number;
  ex_date: string | null;
  pay_date: string | null;
  currency: string;
  status: string;
}

interface RowWatchlist {
  symbol: string;
}

interface RowSnapshot {
  date: string;
  total_value: number;
}

function mapPreferences(row: RowProfile): Partial<UserPreferences> {
  const p: Partial<UserPreferences> = {
    userName: row.username,
    avatarColor: row.avatar_color,
    currency: row.currency,
    defaultYieldPct: Number(row.default_yield_pct),
  };
  if (row.theme === "dark" || row.theme === "light") p.theme = row.theme;
  const accents = ["sky", "cyan", "violet", "emerald", "rose", "amber"];
  if (accents.includes(row.accent)) p.accent = row.accent as UserPreferences["accent"];
  if (row.refresh_seconds) p.refreshSeconds = row.refresh_seconds;
  return p;
}

export async function downloadAll(uid: string) {
  const s = supabase;
  if (!s) throw new Error("Supabase not configured");

  const [profile, accounts, dividends, watchlist, snapshots] = await Promise.all([
    s.from("profiles").select("*").eq("id", uid).maybeSingle(),
    s.from("accounts").select("id, name, broker, currency").eq("user_id", uid),
    s.from("dividends").select("*").eq("user_id", uid),
    s.from("watchlist").select("symbol").eq("user_id", uid),
    s.from("snapshots").select("date, total_value").eq("user_id", uid).order("date"),
  ]);

  if (profile.error) throw profile.error;
  if (accounts.error) throw accounts.error;
  if (dividends.error) throw dividends.error;
  if (watchlist.error) throw watchlist.error;
  if (snapshots.error) throw snapshots.error;

  const accountRows = (accounts.data ?? []) as RowAccount[];

  const holdingsByAccount = await Promise.all(
    accountRows.map(async (a) => {
      const { data, error } = await s
        .from("holdings")
        .select("*")
        .eq("account_id", a.id);
      if (error) throw error;
      return { accountId: a.id, holdings: (data ?? []) as RowHolding[] };
    })
  );

  const broker: BrokerAccount[] = accountRows.map((a) => {
    const group = holdingsByAccount.find((g) => g.accountId === a.id);
    return {
      id: a.id,
      name: a.name,
      broker: (a.broker as BrokerAccount["broker"]) ?? "generic",
      currency: a.currency,
      createdAt: "",
      holdings: (group?.holdings ?? []).map((h) => ({
        id: h.id,
        symbol: h.symbol,
        name: h.name ?? undefined,
        shares: Number(h.shares),
        costBasis: Number(h.cost_basis),
        currency: h.currency,
        addedAt: "",
      })),
    };
  });

  const divRows = (dividends.data ?? []) as RowDividend[];
  const dividendEvents: DividendEvent[] = divRows.map((d) => ({
    id: d.id,
    symbol: d.symbol,
    amountPerShare: Number(d.amount_per_share),
    exDate: d.ex_date ?? "",
    payDate: d.pay_date ?? "",
    currency: d.currency,
    status: (d.status as DividendEvent["status"]) ?? "upcoming",
  }));

  const snapRows = (snapshots.data ?? []) as RowSnapshot[];
  const snapshotsList: PortfolioSnapshot[] = snapRows.map((s2) => ({
    date: s2.date,
    totalValue: Number(s2.total_value),
  }));

  return {
    preferences: profile.data ? mapPreferences(profile.data as RowProfile) : undefined,
    accounts: broker,
    dividends: dividendEvents,
    watchlist: ((watchlist.data ?? []) as RowWatchlist[]).map((w) => w.symbol),
    snapshots: snapshotsList,
  };
}

export async function uploadAll(
  uid: string,
  state: {
    accounts: BrokerAccount[];
    dividends: DividendEvent[];
    watchlist: string[];
    preferences: UserPreferences;
    snapshots: PortfolioSnapshot[];
  }
) {
  const s = supabase;
  if (!s) throw new Error("Supabase not configured");

  await s.from("profiles").upsert({
    id: uid,
    username: state.preferences.userName,
    avatar_color: state.preferences.avatarColor,
    currency: state.preferences.currency,
    theme: state.preferences.theme,
    accent: state.preferences.accent,
    refresh_seconds: state.preferences.refreshSeconds,
    default_yield_pct: state.preferences.defaultYieldPct,
  });

  // Accounts: delete ones that no longer exist locally, then upsert the rest
  const { data: dbAccounts } = await s
    .from("accounts")
    .select("id")
    .eq("user_id", uid);
  const localIds = new Set(state.accounts.map((a) => a.id));
  const staleIds = (dbAccounts ?? [])
    .map((a: { id: string }) => a.id)
    .filter((id: string) => !localIds.has(id));
  if (staleIds.length) {
    await s.from("accounts").delete().in("id", staleIds);
  }
  for (const acc of state.accounts) {
    await s.from("accounts").upsert({
      id: acc.id,
      user_id: uid,
      name: acc.name,
      broker: acc.broker,
      currency: acc.currency,
    });
    // Replace holdings for this account (simple + correct)
    await s.from("holdings").delete().eq("account_id", acc.id);
    if (acc.holdings.length) {
      await s.from("holdings").insert(
        acc.holdings.map((h) => ({
          id: h.id,
          account_id: acc.id,
          symbol: h.symbol,
          name: h.name ?? null,
          shares: h.shares,
          cost_basis: h.costBasis,
          currency: h.currency ?? acc.currency,
        }))
      );
    }
  }

  // Dividends
  await s.from("dividends").delete().eq("user_id", uid);
  if (state.dividends.length) {
    await s.from("dividends").insert(
      state.dividends.map((d) => ({
        id: d.id,
        user_id: uid,
        symbol: d.symbol,
        amount_per_share: d.amountPerShare,
        ex_date: d.exDate || null,
        pay_date: d.payDate || null,
        currency: d.currency ?? "USD",
        status: d.status,
      }))
    );
  }

  // Watchlist
  await s.from("watchlist").delete().eq("user_id", uid);
  if (state.watchlist.length) {
    await s.from("watchlist").insert(
      state.watchlist.map((symbol) => ({ user_id: uid, symbol }))
    );
  }

  // Snapshots (capped at 120)
  await s.from("snapshots").delete().eq("user_id", uid);
  const last = state.snapshots.slice(-120);
  if (last.length) {
    await s.from("snapshots").insert(
      last.map((sn) => ({
        user_id: uid,
        date: new Date(sn.date).toISOString(),
        total_value: sn.totalValue,
      }))
    );
  }
}