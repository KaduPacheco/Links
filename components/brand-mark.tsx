import { Clock3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { defaultSiteSettings, type SiteSettings } from "@/types/site-settings";

type BrandMarkProps = {
  compact?: boolean;
  className?: string;
  settings?: SiteSettings;
};

export function BrandMark({ compact = false, className, settings = defaultSiteSettings }: BrandMarkProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-glow">
        {settings.company_logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={settings.company_logo_url} alt={settings.company_name} className="h-full w-full object-cover" />
        ) : (
          <Clock3 className="h-6 w-6" aria-hidden="true" />
        )}
      </div>
      {!compact && (
        <div>
          <p className="text-lg font-black tracking-tight text-slate-950 dark:text-slate-50">{settings.company_name}</p>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600 dark:text-sky-300">
            {settings.brand_label}
          </p>
        </div>
      )}
    </div>
  );
}
