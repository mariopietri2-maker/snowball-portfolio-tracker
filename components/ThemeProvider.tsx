"use client";

import { useEffect } from "react";
import { usePortfolioStore } from "@/lib/store";

export function ThemeProvider() {
  const { theme, accent } = usePortfolioStore((s) => s.preferences);

  useEffect(() => {
    const html = document.documentElement;
    html.classList.toggle("dark", theme === "dark");
    html.setAttribute("data-accent", accent);
    html.style.colorScheme = theme;
  }, [theme, accent]);

  return null;
}