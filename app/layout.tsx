import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Snowball Portfolio Tracker",
  description:
    "Track your stock portfolio, import holdings, monitor dividends, and visualize the snowball effect of compounding.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100">
        <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl">
              <span className="text-2xl">❄️</span>
              <span className="bg-gradient-to-r from-sky-400 to-cyan-300 bg-clip-text text-transparent">
                Snowball
              </span>
            </Link>
            <nav className="flex gap-6 text-sm font-medium">
              <Link
                href="/"
                className="text-slate-300 hover:text-sky-400 transition"
              >
                Dashboard
              </Link>
              <Link
                href="/portfolio"
                className="text-slate-300 hover:text-sky-400 transition"
              >
                Portfolio
              </Link>
              <Link
                href="/dividends"
                className="text-slate-300 hover:text-sky-400 transition"
              >
                Dividends
              </Link>
              <Link
                href="/snowball"
                className="text-slate-300 hover:text-sky-400 transition"
              >
                Snowball
              </Link>
            </nav>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
