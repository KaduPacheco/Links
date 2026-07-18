import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex min-h-24 w-full rounded-xl border bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500",
      className
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export { Textarea };
