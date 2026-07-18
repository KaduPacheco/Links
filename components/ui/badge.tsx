import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-bold text-teal-800 dark:border-[#2AF598]/20 dark:bg-teal-400/10 dark:text-[#2AF598]",
        className
      )}
      {...props}
    />
  );
}
