import { unstable_noStore as noStore } from "next/cache";
import type { LinkPayload, LinkWithAnalytics } from "@/types/link";
import { getDatabaseConfigMessage, getDatabaseSource, getPool } from "@/lib/db";
import { seedLinks } from "@/lib/seed-links";

async function ensureLinksSchema() {
  const pool = getPool();

  if (!pool) {
    return;
  }

  await pool.query(`
    alter table links
    add column if not exists lead_message text;
  `);

  await pool.query(`
    create or replace view links_with_analytics as
    select
      links.id,
      links.title,
      links.url,
      links.description,
      links.icon,
      links.category,
      links.is_active,
      links.display_order,
      links.created_at,
      links.updated_at,
      count(link_clicks.id)::integer as click_count,
      max(link_clicks.clicked_at) as last_clicked_at,
      links.lead_message
    from links
    left join link_clicks on link_clicks.link_id = links.id
    group by links.id;
  `);
}

export async function getLinksWithAnalytics(includeInactive = true): Promise<LinkWithAnalytics[]> {
  noStore();
  const pool = getPool();

  if (!pool) {
    return seedLinks;
  }

  try {
    await ensureLinksSchema();

    const { rows } = await pool.query<LinkWithAnalytics>(
      `
        select *
        from links_with_analytics
        where ($1::boolean = true or is_active = true)
        order by display_order asc, created_at asc
      `,
      [includeInactive]
    );

    return rows;
  } catch (error) {
    console.error(`PostgreSQL links query failed using ${getDatabaseSource() ?? "unknown source"}`, error);
    return seedLinks.filter((link) => includeInactive || link.is_active);
  }
}

export async function createLink(payload: LinkPayload) {
  const pool = getPool();

  if (!pool) {
    throw new Error(getDatabaseConfigMessage());
  }

  await ensureLinksSchema();

  const { rows } = await pool.query(
    `
      insert into links (title, url, description, icon, category, lead_message, is_active, display_order)
      values ($1, $2, $3, $4, $5, $6, $7, $8)
      returning *
    `,
    [
      payload.title,
      payload.url,
      payload.description,
      payload.icon,
      payload.category,
      payload.lead_message,
      payload.is_active,
      payload.display_order
    ]
  );

  return rows[0];
}

export async function updateLink(id: string, payload: LinkPayload) {
  const pool = getPool();

  if (!pool) {
    throw new Error(getDatabaseConfigMessage());
  }

  await ensureLinksSchema();

  const { rows } = await pool.query(
    `
      update links
      set
        title = $2,
        url = $3,
        description = $4,
        icon = $5,
        category = $6,
        lead_message = $7,
        is_active = $8,
        display_order = $9
      where id = $1
      returning *
    `,
    [
      id,
      payload.title,
      payload.url,
      payload.description,
      payload.icon,
      payload.category,
      payload.lead_message,
      payload.is_active,
      payload.display_order
    ]
  );

  if (!rows[0]) {
    throw new Error("Link não encontrado.");
  }

  return rows[0];
}

export async function deleteLink(id: string) {
  const pool = getPool();

  if (!pool) {
    throw new Error(getDatabaseConfigMessage());
  }

  await ensureLinksSchema();
  await pool.query("delete from links where id = $1", [id]);
}

export async function registerClick(linkId: string, userAgent: string | null, referrer: string | null) {
  const pool = getPool();

  if (!pool || linkId.startsWith("seed-")) {
    return;
  }

  try {
    await pool.query(
      "insert into link_clicks (link_id, user_agent, referrer) values ($1, $2, $3)",
      [linkId, userAgent, referrer]
    );
  } catch (error) {
    console.error(`PostgreSQL click insert failed using ${getDatabaseSource() ?? "unknown source"}`, error);
  }
}
