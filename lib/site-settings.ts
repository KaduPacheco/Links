import { unstable_noStore as noStore } from "next/cache";
import { DEFAULT_ACCOUNT_ID } from "@/lib/accounts";
import { getDatabaseSource, getPool, requirePool } from "@/lib/db";
import { logger } from "@/lib/logger";
import { normalizeLegacyCopy } from "@/lib/text-normalization";
import { defaultSiteSettings, type SiteSettings } from "@/types/site-settings";

type SiteSettingsRow = SiteSettings & {
  id: number;
  account_id: string;
};

function normalizeSiteSettings(settings: SiteSettings): SiteSettings {
  return {
    company_name: normalizeLegacyCopy(settings.company_name) ?? defaultSiteSettings.company_name,
    brand_label: normalizeLegacyCopy(settings.brand_label) ?? defaultSiteSettings.brand_label,
    company_logo_url: settings.company_logo_url,
    hero_badge: normalizeLegacyCopy(settings.hero_badge) ?? defaultSiteSettings.hero_badge,
    hero_description: normalizeLegacyCopy(settings.hero_description) ?? defaultSiteSettings.hero_description,
    links_heading: normalizeLegacyCopy(settings.links_heading) ?? defaultSiteSettings.links_heading,
    links_description: normalizeLegacyCopy(settings.links_description) ?? defaultSiteSettings.links_description
  };
}

export async function getSiteSettings(): Promise<SiteSettings> {
  return getSiteSettingsForAccount(DEFAULT_ACCOUNT_ID);
}

export async function getSiteSettingsForAccount(accountId = DEFAULT_ACCOUNT_ID): Promise<SiteSettings> {
  noStore();
  const pool = getPool();

  if (!pool) {
    return normalizeSiteSettings(defaultSiteSettings);
  }

  try {
    const { rows } = await pool.query<SiteSettingsRow>(
      `
        select
          id,
          account_id,
          company_name,
          brand_label,
          company_logo_url,
          hero_badge,
          hero_description,
          links_heading,
          links_description
        from site_settings
        where account_id = $1
        limit 1
      `,
      [accountId]
    );

    if (!rows[0]) {
      return normalizeSiteSettings(defaultSiteSettings);
    }

    const { id: _id, account_id: _accountId, ...settings } = rows[0];
    return normalizeSiteSettings(settings);
  } catch (error) {
    logger.error("PostgreSQL site settings query failed", error, {
      accountId,
      source: getDatabaseSource() ?? "unknown source"
    });
    return normalizeSiteSettings(defaultSiteSettings);
  }
}

export async function updateSiteSettings(payload: SiteSettings, accountId = DEFAULT_ACCOUNT_ID) {
  const pool = requirePool();

  await pool.query(
    `
      insert into site_settings (
        id,
        account_id,
        company_name,
        brand_label,
        company_logo_url,
        hero_badge,
        hero_description,
        links_heading,
        links_description
      )
      values (
        (select coalesce(max(id), 0) + 1 from site_settings),
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8
      )
      on conflict (account_id) do nothing
    `,
    [
      accountId,
      defaultSiteSettings.company_name,
      defaultSiteSettings.brand_label,
      defaultSiteSettings.company_logo_url,
      defaultSiteSettings.hero_badge,
      defaultSiteSettings.hero_description,
      defaultSiteSettings.links_heading,
      defaultSiteSettings.links_description
    ]
  );

  const { rows } = await pool.query<SiteSettingsRow>(
    `
      update site_settings
      set
        company_name = $2,
        brand_label = $3,
        company_logo_url = $4,
        hero_badge = $5,
        hero_description = $6,
        links_heading = $7,
        links_description = $8,
        updated_at = now()
      where account_id = $1
      returning
        id,
        account_id,
        company_name,
        brand_label,
        company_logo_url,
        hero_badge,
        hero_description,
        links_heading,
        links_description
    `,
    [
      accountId,
      payload.company_name,
      payload.brand_label,
      payload.company_logo_url,
      payload.hero_badge,
      payload.hero_description,
      payload.links_heading,
      payload.links_description
    ]
  );

  const { id: _id, account_id: _accountId, ...settings } = rows[0];
  return normalizeSiteSettings(settings);
}
