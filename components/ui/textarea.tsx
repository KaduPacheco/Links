import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex min-h-24 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500",
      className
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export { Textarea };
