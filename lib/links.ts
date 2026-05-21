import { unstable_noStore as noStore } from "next/cache";
import { normalizeLinkCategory, type LinkPayload, type LinkWithAnalytics } from "@/types/link";
import { DEFAULT_ACCOUNT_ID } from "@/lib/accounts";
import { getDatabaseSource, getPool, requirePool } from "@/lib/db";
import { logger } from "@/lib/logger";
import { seedLinks } from "@/lib/seed-links";

function normalizeLinkRow<T extends { category: string }>(row: T): T {
  return {
    ...row,
    category: normalizeLinkCategory(row.category)
  };
}

export async function getLinksWithAnalytics(includeInactive = true, accountId = DEFAULT_ACCOUNT_ID): Promise<LinkWithAnalytics[]> {
  noStore();
  const pool = getPool();

  if (!pool) {
    return accountId === DEFAULT_ACCOUNT_ID ? seedLinks : [];
  }

  try {
    const { rows } = await pool.query<LinkWithAnalytics>(
      `
        select *
        from links_with_analytics
        where account_id = $2
          and ($1::boolean = true or is_active = true)
        order by display_order asc, created_at asc
      `,
      [includeInactive, accountId]
    );

    return rows.map(normalizeLinkRow);
  } catch (error) {
    logger.error("PostgreSQL links query failed", error, {
      accountId,
      includeInactive,
      source: getDatabaseSource() ?? "unknown source"
    });
    return accountId === DEFAULT_ACCOUNT_ID ? seedLinks.filter((link) => includeInactive || link.is_active) : [];
  }
}

export async function createLink(payload: LinkPayload, accountId = DEFAULT_ACCOUNT_ID) {
  const pool = requirePool();

  const { rows } = await pool.query(
    `
      insert into links (account_id, title, url, description, icon, category, lead_message, is_active, display_order)
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      returning *
    `,
    [
      accountId,
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

  return normalizeLinkRow(rows[0]);
}

export async function createDemoLinksForAccount(accountId: string) {
  const pool = requirePool();

  const existing = await pool.query<{ count: string }>("select count(*)::text from links where account_id = $1", [accountId]);

  if (Number(existing.rows[0]?.count ?? 0) > 0) {
    return [];
  }

  const created = [];

  for (const item of seedLinks) {
    const { rows } = await pool.query(
      `
        insert into links (account_id, title, url, description, icon, category, lead_message, is_active, display_order)
        values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        returning *
      `,
      [
        accountId,
        item.title,
        item.url,
        item.description,
        item.icon,
        item.category,
        item.lead_message,
        item.is_active,
        item.display_order
      ]
    );

      created.push(normalizeLinkRow(rows[0]));
  }

  return created;
}

export async function updateLink(id: string, payload: LinkPayload, accountId = DEFAULT_ACCOUNT_ID) {
  const pool = requirePool();

  const { rows } = await pool.query(
    `
      update links
      set
        title = $3,
        url = $4,
        description = $5,
        icon = $6,
        category = $7,
        lead_message = $8,
        is_active = $9,
        display_order = $10
      where id = $1
        and account_id = $2
      returning *
    `,
    [
      id,
      accountId,
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

  return normalizeLinkRow(rows[0]);
}

export async function deleteLink(id: string, accountId = DEFAULT_ACCOUNT_ID) {
  const pool = requirePool();
  await pool.query("delete from links where id = $1 and account_id = $2", [id, accountId]);
}

export async function registerClick(linkId: string, userAgent: string | null, referrer: string | null, accountId = DEFAULT_ACCOUNT_ID) {
  const pool = getPool();

  if (!pool || linkId.startsWith("seed-")) {
    return;
  }

  try {
    await pool.query(
      "insert into link_clicks (account_id, link_id, user_agent, referrer) values ($1, $2, $3, $4)",
      [accountId, linkId, userAgent, referrer]
    );
  } catch (error) {
    logger.error("PostgreSQL click insert failed", error, {
      accountId,
      linkId,
      source: getDatabaseSource() ?? "unknown source"
    });
  }
}
