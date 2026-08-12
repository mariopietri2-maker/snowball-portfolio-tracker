"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { downloadAll, uploadAll } from "@/lib/supabase-cloud";
import { usePortfolioStore } from "@/lib/store";

interface AuthContextValue {
  user: { id: string; email?: string } | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

let uploadChain: Promise<void> = Promise.resolve();

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const restore = usePortfolioStore((s) => s.restore);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const download = useCallback(
    async (uid: string) => {
      try {
        const data = await downloadAll(uid);
        restore(data);
      } catch (err) {
        console.error("[cloud] download failed", err);
      }
    },
    [restore]
  );

  // Sync store → cloud (debounced, serialized)
  useEffect(() => {
    if (!user || !isSupabaseConfigured) return;
    const unsub = usePortfolioStore.subscribe((state) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        uploadChain = uploadChain
          .then(() => uploadAll(user.id, state))
          .catch((err) => console.error("[cloud] upload failed", err));
      }, 2500);
    });
    return () => {
      unsub();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [user]);

  // Session bootstrap + hydrate on auth change
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    supabase!.auth.getSession().then(({ data }) => {
      const s = data.session;
      if (s?.user) {
        setUser({ id: s.user.id, email: s.user.email });
        download(s.user.id);
      }
      setLoading(false);
    });

    const { data: sub } = supabase!.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        setUser({ id: session.user.id, email: session.user.email });
        download(session.user.id);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [download]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase!.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw new Error(error.message);
  };

  const signUp = async (email: string, password: string) => {
    const { error, data } = await supabase!.auth.signUp({ email, password });
    if (error) throw new Error(error.message);
    if (data.session) {
      setUser({ id: data.session.user.id, email: data.session.user.email });
      download(data.session.user.id);
    }
  };

  const signOut = async () => {
    await supabase!.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {isSupabaseConfigured && !loading && !user ? (
        <SignInScreen />
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

function SignInScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    if (!email.includes("@") || password.length < 6) {
      setError("Enter a valid email and at least 6-character password.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signin") {
        await signIn(email, password);
      } else {
        await signUp(email, password);
        // If email confirmation is on, session stays null → show notice
        setNotice("Account created! Check your email to confirm, then sign in.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <p className="text-4xl mb-2">❄️</p>
          <h1 className="text-2xl font-bold">Snowball Portfolio Tracker</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Your portfolio, synced to the cloud.
          </p>
        </div>
        <form
          onSubmit={submit}
          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 space-y-4"
        >
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                mode === "signin"
                  ? "bg-accent text-white"
                  : "border border-slate-300 dark:border-slate-700"
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                mode === "signup"
                  ? "bg-accent text-white"
                  : "border border-slate-300 dark:border-slate-700"
              }`}
            >
              Create account
            </button>
          </div>
          <label className="block">
            <span className="text-xs text-slate-500 dark:text-slate-400">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none"
              placeholder="you@example.com"
            />
          </label>
          <label className="block">
            <span className="text-xs text-slate-500 dark:text-slate-400">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none"
              placeholder="••••••••"
            />
          </label>
          {error && <p className="text-sm text-rose-500">{error}</p>}
          {notice && <p className="text-sm text-emerald-500">{notice}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full py-2.5 rounded-lg bg-accent text-white text-sm font-medium hover:brightness-110 transition disabled:opacity-50"
          >
            {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}