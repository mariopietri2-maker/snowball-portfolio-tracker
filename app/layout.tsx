import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/components/AuthProvider";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: {
    default: "Snowball Portfolio Tracker",
    template: "%s · Snowball Portfolio Tracker",
  },
  description:
    "Track your stock portfolio, monitor dividends, follow the market, and visualize the snowball effect of compounding.",
  applicationName: "Snowball Portfolio Tracker",
  icons: {
    icon: "/icon.svg",
  },
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#020617" },
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-16 md:pb-4">
        <ThemeProvider />
        <AuthProvider>
          <SiteHeader />
          <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}