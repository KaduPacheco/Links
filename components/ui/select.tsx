import * as React from "react";
import { cn } from "@/lib/utils";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({ className, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "flex h-11 w-full rounded-xl border bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:ring-2 focus:ring-teal-500 dark:bg-slate-950 dark:text-slate-100",
      className
    )}
    {...props}
  />
));
Select.displayName = "Select";

export { Select };
