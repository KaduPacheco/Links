import { unstable_noStore as noStore } from "next/cache";
import type { LinkPayload, LinkWithAnalytics } from "@/types/link";
import { getPool } from "@/lib/db";
import { seedLinks } from "@/lib/seed-links";

export async function getLinksWithAnalytics(includeInactive = true): Promise<LinkWithAnalytics[]> {
  noStore();
  const pool = getPool();

  if (!pool) {
    return seedLinks;
  }

  try {
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
    console.error("PostgreSQL links query failed", error);
    return seedLinks.filter((link) => includeInactive || link.is_active);
  }
}

export async function createLink(payload: LinkPayload) {
  const pool = getPool();

  if (!pool) {
    throw new Error("PostgreSQL nao configurado. Configure DATABASE_URL para salvar dados.");
  }

  const { rows } = await pool.query(
    `
      insert into links (title, url, description, icon, category, is_active, display_order)
      values ($1, $2, $3, $4, $5, $6, $7)
      returning *
    `,
    [
      payload.title,
      payload.url,
      payload.description,
      payload.icon,
      payload.category,
      payload.is_active,
      payload.display_order
    ]
  );

  return rows[0];
}

export async function updateLink(id: string, payload: LinkPayload) {
  const pool = getPool();

  if (!pool) {
    throw new Error("PostgreSQL nao configurado. Configure DATABASE_URL para salvar dados.");
  }

  const { rows } = await pool.query(
    `
      update links
      set
        title = $2,
        url = $3,
        description = $4,
        icon = $5,
        category = $6,
        is_active = $7,
        display_order = $8
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
      payload.is_active,
      payload.display_order
    ]
  );

  if (!rows[0]) {
    throw new Error("Link nao encontrado.");
  }

  return rows[0];
}

export async function deleteLink(id: string) {
  const pool = getPool();

  if (!pool) {
    throw new Error("PostgreSQL nao configurado. Configure DATABASE_URL para salvar dados.");
  }

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
    console.error("PostgreSQL click insert failed", error);
  }
}
