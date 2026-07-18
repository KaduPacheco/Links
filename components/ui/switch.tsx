"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type SwitchProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
};

export function Switch({ checked, onCheckedChange, label }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative h-7 w-12 rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500",
        checked ? "bg-teal-500 dark:bg-[#2AF598]" : "bg-slate-300 dark:bg-slate-700"
      )}
    >
      <span
        className={cn(
          "absolute top-1 h-5 w-5 rounded-full bg-white shadow transition dark:bg-slate-100",
          checked ? "left-6" : "left-1"
        )}
      />
    </button>
  );
}
