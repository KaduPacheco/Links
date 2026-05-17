"use client";

import { Moon, SunMedium } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        "inline-flex items-center gap-3 rounded-full border border-white/60 bg-white/80 px-3 py-2 text-sm font-semibold text-slate-700 shadow-lg shadow-slate-900/10 backdrop-blur transition hover:-translate-y-0.5 hover:bg-white dark:border-white/10 dark:bg-slate-900/80 dark:text-slate-100 dark:shadow-black/30 dark:hover:bg-slate-900",
        className
      )}
      aria-label={isDark ? "Ativar tema claro" : "Ativar tema escuro"}
      aria-pressed={isDark}
      title={isDark ? "Ativar tema claro" : "Ativar tema escuro"}
    >
      <span className="relative flex h-8 w-14 items-center rounded-full bg-slate-200 p-1 dark:bg-slate-700">
        <span
          className={cn(
            "absolute h-6 w-6 rounded-full bg-white shadow transition-transform dark:bg-slate-950",
            isDark ? "translate-x-6" : "translate-x-0"
          )}
        />
        <SunMedium className="relative z-10 h-3.5 w-3.5 text-amber-500" />
        <Moon className="relative z-10 ml-auto h-3.5 w-3.5 text-slate-500 dark:text-sky-300" />
      </span>
      <span>{isDark ? "Modo escuro" : "Modo claro"}</span>
    </button>
  );
}
