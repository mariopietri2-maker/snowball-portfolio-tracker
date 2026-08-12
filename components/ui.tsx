import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60 ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 p-5 pb-0">
      <div>
        <h3 className="font-semibold">{title}</h3>
        {subtitle && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
      {right}
    </div>
  );
}

export function Badge({
  children,
  tone = "slate",
}: {
  children: ReactNode;
  tone?: "slate" | "accent" | "up" | "down" | "warn";
}) {
  const tones: Record<string, string> = {
    slate:
      "bg-slate-200/70 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    accent: "text-accent bg-accent/10 border border-accent/30",
    up: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    down: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    warn: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function Button({
  children,
  onClick,
  variant = "secondary",
  className = "",
  type = "button",
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  const variants: Record<string, string> = {
    primary:
      "bg-accent text-white hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed",
    secondary:
      "border border-slate-300 dark:border-slate-700 hover:border-accent/60 hover:text-accent text-slate-700 dark:text-slate-200",
    ghost: "text-slate-600 dark:text-slate-300 hover:text-accent hover:bg-slate-100 dark:hover:bg-slate-800/60",
    danger: "text-rose-500 dark:text-rose-400 hover:bg-rose-500/10",
  };
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Spinner({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-slate-500 py-6 justify-center">
      <span className="w-4 h-4 rounded-full border-2 border-slate-300 dark:border-slate-600 border-t-accent animate-spin" />
      {label}
    </div>
  );
}

export function ChangeText({
  value,
  className = "",
}: {
  value: number;
  className?: string;
}) {
  const up = value >= 0;
  return (
    <span
      className={`${up ? "text-emerald-500 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400"} ${className}`}
    >
      {up ? "+" : ""}
      {value.toFixed(2)}%
    </span>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="py-12 text-center">
      <p className="text-slate-500 dark:text-slate-400">{title}</p>
      {hint && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{hint}</p>}
    </div>
  );
}