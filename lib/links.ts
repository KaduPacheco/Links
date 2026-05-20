import { unstable_noStore as noStore } from "next/cache";
import type { LinkPayload, LinkWithAnalytics } from "@/types/link";
import { DEFAULT_ACCOUNT_ID, ensureAccountsSchema } from "@/lib/accounts";
import { getDatabaseConfigMessage, getDatabaseSource, getPool } from "@/lib/db";
import { seedLinks } from "@/lib/seed-links";

async function ensureLinksSchema() {
  const pool = await ensureAccountsSchema();

  if (!pool) {
    return;
  }

  await pool.query(`
    create table if not exists links (
      id uuid primary key default gen_random_uuid(),
      account_id uuid not null default '${DEFAULT_ACCOUNT_ID}' references accounts(id) on delete cascade,
      title text not null,
      url text not null,
      description text,
      icon text,
      category text not null default 'Comercial',
      lead_message text,
      is_active boolean not null default true,
      display_order integer not null default 0,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
  `);

  await pool.query(`
    create table if not exists link_clicks (
      id uuid primary key default gen_random_uuid(),
      account_id uuid not null default '${DEFAULT_ACCOUNT_ID}' references accounts(id) on delete cascade,
      link_id uuid not null references links(id) on delete cascade,
      clicked_at timestamptz not null default now(),
      user_agent text,
      referrer text
    );
  `);

  await pool.query(`
    alter table links
    add column if not exists account_id uuid not null default '${DEFAULT_ACCOUNT_ID}' references accounts(id) on delete cascade,
    add column if not exists lead_message text;
  `);

  await pool.query(`
    alter table link_clicks
    add column if not exists account_id uuid not null default '${DEFAULT_ACCOUNT_ID}' references accounts(id) on delete cascade;
  `);

  await pool.query(`
    update link_clicks
    set account_id = links.account_id
    from links
    where link_clicks.link_id = links.id;
  `);

  await pool.query(`
    drop view if exists links_with_analytics;
  `);

  await pool.query(`
    create view links_with_analytics as
    select
      links.id,
      links.account_id,
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
    left join link_clicks on link_clicks.link_id = links.id and link_clicks.account_id = links.account_id
    group by links.id;
  `);
}

export async function getLinksWithAnalytics(includeInactive = true, accountId = DEFAULT_ACCOUNT_ID): Promise<LinkWithAnalytics[]> {
  noStore();
  const pool = getPool();

  if (!pool) {
    return accountId === DEFAULT_ACCOUNT_ID ? seedLinks : [];
  }

  try {
    await ensureLinksSchema();

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

    return rows;
  } catch (error) {
    console.error(`PostgreSQL links query failed using ${getDatabaseSource() ?? "unknown source"}`, error);
    return accountId === DEFAULT_ACCOUNT_ID ? seedLinks.filter((link) => includeInactive || link.is_active) : [];
  }
}

export async function createLink(payload: LinkPayload, accountId = DEFAULT_ACCOUNT_ID) {
  const pool = getPool();

  if (!pool) {
    throw new Error(getDatabaseConfigMessage());
  }

  await ensureLinksSchema();

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

  return rows[0];
}

export async function createDemoLinksForAccount(accountId: string) {
  const pool = getPool();

  if (!pool) {
    throw new Error(getDatabaseConfigMessage());
  }

  await ensureLinksSchema();

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

    created.push(rows[0]);
  }

  return created;
}

export async function updateLink(id: string, payload: LinkPayload, accountId = DEFAULT_ACCOUNT_ID) {
  const pool = getPool();

  if (!pool) {
    throw new Error(getDatabaseConfigMessage());
  }

  await ensureLinksSchema();

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

  return rows[0];
}

export async function deleteLink(id: string, accountId = DEFAULT_ACCOUNT_ID) {
  const pool = getPool();

  if (!pool) {
    throw new Error(getDatabaseConfigMessage());
  }

  await ensureLinksSchema();
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
    console.error(`PostgreSQL click insert failed using ${getDatabaseSource() ?? "unknown source"}`, error);
  }
}
