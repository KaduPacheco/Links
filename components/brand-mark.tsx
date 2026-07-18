import { cn } from "@/lib/utils";
import { defaultSiteSettings, type SiteSettings } from "@/types/site-settings";

type BrandMarkProps = {
  compact?: boolean;
  hero?: boolean;
  className?: string;
  settings?: SiteSettings;
};

export const BRAND_SYMBOL = "/assets/jornada/simbolo-jornada.png";
export const BRAND_LOGO_LIGHT = "/assets/jornada/logo-jornada-light.png";
export const BRAND_LOGO_DARK = "/assets/jornada/logo-jornada-dark.png";

export function BrandMark({ compact = false, hero = false, className, settings = defaultSiteSettings }: BrandMarkProps) {
  const logoSize = hero ? "w-[240px]" : "h-14 w-auto";

  return (
    <div className={cn("flex items-center", className)}>
      {compact ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={BRAND_SYMBOL} alt={`Símbolo ${settings.company_name}`} className="h-12 w-12 object-contain" />
      ) : (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={BRAND_LOGO_LIGHT} alt={`Logo ${settings.company_name}`} className={cn("block h-auto dark:hidden", logoSize)} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={BRAND_LOGO_DARK} alt={`Logo ${settings.company_name}`} className={cn("hidden h-auto dark:block", logoSize)} />
        </>
      )}
    </div>
  );
}
