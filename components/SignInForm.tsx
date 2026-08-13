"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui";

export function SignInForm({ onSuccess }: { onSuccess?: () => void }) {
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
        onSuccess?.();
      } else {
        await signUp(email, password);
        setNotice("Account created! Check your email to confirm, then sign in.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
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
      <Button type="submit" variant="primary" className="w-full" disabled={busy}>
        {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
      </Button>
    </form>
  );
}
