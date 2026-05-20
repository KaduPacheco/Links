import { unstable_noStore as noStore } from "next/cache";
import { DEFAULT_ACCOUNT_ID, ensureAccountsSchema } from "@/lib/accounts";
import { getDatabaseConfigMessage, getDatabaseSource, getPool } from "@/lib/db";
import { defaultSiteSettings, type SiteSettings } from "@/types/site-settings";

type SiteSettingsRow = SiteSettings & {
  id: number;
  account_id: string;
};

async function ensureSiteSettingsSchema() {
  const pool = await ensureAccountsSchema();

  if (!pool) {
    return null;
  }

  await pool.query(`
    create table if not exists site_settings (
      id integer primary key default 1 check (id = 1),
      account_id uuid not null default '${DEFAULT_ACCOUNT_ID}' references accounts(id) on delete cascade,
      company_name text not null default 'Ponto Eletronico',
      brand_label text not null default 'Links oficiais',
      company_logo_url text,
      hero_badge text not null default 'Controle de jornada simples, seguro e inteligente',
      hero_description text not null default 'Sistema inteligente para controle de jornada, ponto online e gestao de equipes.',
      links_heading text not null default 'Links oficiais',
      links_description text not null default 'Escolha o canal ideal para conhecer o sistema, falar com o time ou acessar materiais.',
      updated_at timestamptz not null default now()
    );
  `);

  await pool.query(`
    alter table site_settings
    drop constraint if exists site_settings_id_check;
  `);

  await pool.query(`
    alter table site_settings
    add column if not exists account_id uuid not null default '${DEFAULT_ACCOUNT_ID}' references accounts(id) on delete cascade;
  `);

  await pool.query(`
    create unique index if not exists site_settings_account_unique_idx on site_settings (account_id);
  `);

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
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      on conflict (id) do nothing
    `,
    [
      1,
      DEFAULT_ACCOUNT_ID,
      defaultSiteSettings.company_name,
      defaultSiteSettings.brand_label,
      defaultSiteSettings.company_logo_url,
      defaultSiteSettings.hero_badge,
      defaultSiteSettings.hero_description,
      defaultSiteSettings.links_heading,
      defaultSiteSettings.links_description
    ]
  );

  return pool;
}

export async function getSiteSettings(): Promise<SiteSettings> {
  return getSiteSettingsForAccount(DEFAULT_ACCOUNT_ID);
}

export async function getSiteSettingsForAccount(accountId = DEFAULT_ACCOUNT_ID): Promise<SiteSettings> {
  noStore();
  const pool = getPool();

  if (!pool) {
    return defaultSiteSettings;
  }

  try {
    await ensureSiteSettingsSchema();

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
      return defaultSiteSettings;
    }

    const { id: _id, account_id: _accountId, ...settings } = rows[0];
    return settings;
  } catch (error) {
    console.error(`PostgreSQL site settings query failed using ${getDatabaseSource() ?? "unknown source"}`, error);
    return defaultSiteSettings;
  }
}

export async function updateSiteSettings(payload: SiteSettings, accountId = DEFAULT_ACCOUNT_ID) {
  const pool = await ensureSiteSettingsSchema();

  if (!pool) {
    throw new Error(getDatabaseConfigMessage());
  }

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
  return settings;
}
