"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePortfolioStore } from "@/lib/store";

const NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/brokers", label: "Brokers" },
  { href: "/stocks", label: "Markets" },
  { href: "/watchlist", label: "Watchlist" },
  { href: "/dividends", label: "Dividends" },
  { href: "/snowball", label: "Snowball" },
  { href: "/chat", label: "Chat" },
];

const MOBILE_NAV = ["/", "/portfolio", "/stocks", "/watchlist", "/chat", "/settings"];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export function SiteHeader() {
  const pathname = usePathname();
  const { userName, avatarColor, theme } = usePortfolioStore((s) => s.preferences);
  const setPreferences = usePortfolioStore((s) => s.setPreferences);

  const initial = (userName.trim()[0] ?? "U").toUpperCase();

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg shrink-0">
            <span className="text-xl">❄️</span>
            <span className="bg-gradient-to-r from-sky-400 to-cyan-300 bg-clip-text text-transparent">
              Snowball
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  isActive(pathname, n.href)
                    ? "text-accent bg-accent/10"
                    : "text-slate-600 dark:text-slate-300 hover:text-accent hover:bg-slate-100 dark:hover:bg-slate-800/60"
                }`}
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setPreferences({ theme: theme === "dark" ? "light" : "dark" })}
              title="Toggle theme"
              className="w-8 h-8 rounded-lg border border-slate-300 dark:border-slate-700 flex items-center justify-center text-sm hover:border-accent/60 transition"
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
            <Link
              href="/settings"
              title={userName || "Settings"}
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
              style={{ backgroundColor: avatarColor }}
            >
              {initial}
            </Link>
          </div>
        </div>
      </header>

      <nav className="fixed bottom-0 inset-x-0 z-40 md:hidden border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur">
        <div className="flex items-center justify-around h-14">
          {MOBILE_NAV.map((href) => {
            const label = NAV.find((n) => n.href === href)?.label ?? "Settings";
            const icons: Record<string, string> = {
              "/": "▦",
              "/portfolio": "📈",
              "/stocks": "🔍",
              "/watchlist": "★",
              "/chat": "💬",
              "/settings": "⚙",
            };
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center gap-0.5 text-[11px] ${
                  isActive(pathname, href)
                    ? "text-accent font-medium"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                <span className="text-base leading-none">{icons[href]}</span>
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}