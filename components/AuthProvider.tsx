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
  isConfigured: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  isConfigured: isSupabaseConfigured,
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
    <AuthContext.Provider
      value={{ user, loading, isConfigured: isSupabaseConfigured, signIn, signUp, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}