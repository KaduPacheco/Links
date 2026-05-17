import { Clock3 } from "lucide-react";
import { cn } from "@/lib/utils";

type BrandMarkProps = {
  compact?: boolean;
  className?: string;
};

export function BrandMark({ compact = false, className }: BrandMarkProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-glow">
        <Clock3 className="h-6 w-6" aria-hidden="true" />
      </div>
      {!compact && (
        <div>
          <p className="text-lg font-black tracking-tight text-slate-950 dark:text-slate-50">Ponto Eletrônico</p>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600 dark:text-sky-300">links oficiais</p>
        </div>
      )}
    </div>
  );
}
