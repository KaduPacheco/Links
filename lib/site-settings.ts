import { unstable_noStore as noStore } from "next/cache";
import { getDatabaseConfigMessage, getDatabaseSource, getPool } from "@/lib/db";
import { defaultSiteSettings, type SiteSettings } from "@/types/site-settings";

type SiteSettingsRow = SiteSettings & {
  id: number;
};

async function ensureSiteSettingsSchema() {
  const pool = getPool();

  if (!pool) {
    return null;
  }

  await pool.query(`
    create table if not exists site_settings (
      id integer primary key default 1 check (id = 1),
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

  await pool.query(
    `
      insert into site_settings (
        id,
        company_name,
        brand_label,
        company_logo_url,
        hero_badge,
        hero_description,
        links_heading,
        links_description
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8)
      on conflict (id) do nothing
    `,
    [
      1,
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
          company_name,
          brand_label,
          company_logo_url,
          hero_badge,
          hero_description,
          links_heading,
          links_description
        from site_settings
        where id = 1
      `
    );

    if (!rows[0]) {
      return defaultSiteSettings;
    }

    const { id: _id, ...settings } = rows[0];
    return settings;
  } catch (error) {
    console.error(`PostgreSQL site settings query failed using ${getDatabaseSource() ?? "unknown source"}`, error);
    return defaultSiteSettings;
  }
}

export async function updateSiteSettings(payload: SiteSettings) {
  const pool = await ensureSiteSettingsSchema();

  if (!pool) {
    throw new Error(getDatabaseConfigMessage());
  }

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
      where id = $1
      returning
        id,
        company_name,
        brand_label,
        company_logo_url,
        hero_badge,
        hero_description,
        links_heading,
        links_description
    `,
    [
      1,
      payload.company_name,
      payload.brand_label,
      payload.company_logo_url,
      payload.hero_badge,
      payload.hero_description,
      payload.links_heading,
      payload.links_description
    ]
  );

  const { id: _id, ...settings } = rows[0];
  return settings;
}
