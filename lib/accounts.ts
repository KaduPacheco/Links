import { getPool } from "@/lib/db";
import { logger } from "@/lib/logger";
import { defaultSiteSettings } from "@/types/site-settings";
import { defaultAccountSlug, type Account } from "@/types/account";

export const DEFAULT_ACCOUNT_ID = "00000000-0000-0000-0000-000000000001";

type AccountRow = Account;

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 60);
}

export function createAccountSlug(name: string) {
  return slugify(name) || defaultAccountSlug;
}

export async function getDefaultAccount() {
  const fallback = {
    id: DEFAULT_ACCOUNT_ID,
    name: defaultSiteSettings.company_name,
    slug: defaultAccountSlug,
    created_at: "",
    updated_at: ""
  } satisfies Account;

  const pool = getPool();

  if (!pool) {
    return fallback;
  }

  try {
    const { rows } = await pool.query<AccountRow>(
      `
        select id::text, name, slug, created_at::text, updated_at::text
        from accounts
        where id = $1
        limit 1
      `,
      [DEFAULT_ACCOUNT_ID]
    );

    return rows[0] ?? fallback;
  } catch (error) {
    logger.error("PostgreSQL default account query failed", error);
    return fallback;
  }
}

export async function getAccountBySlug(slug: string) {
  const pool = getPool();

  if (!pool) {
    return null;
  }

  try {
    const { rows } = await pool.query<AccountRow>(
      `
        select id::text, name, slug, created_at::text, updated_at::text
        from accounts
        where slug = $1
        limit 1
      `,
      [slug]
    );

    return rows[0] ?? null;
  } catch (error) {
    logger.error("PostgreSQL account by slug query failed", error, { slug });
    return null;
  }
}

export async function getAccountById(id: string) {
  const pool = getPool();

  if (!pool) {
    return null;
  }

  try {
    const { rows } = await pool.query<AccountRow>(
      `
        select id::text, name, slug, created_at::text, updated_at::text
        from accounts
        where id = $1
        limit 1
      `,
      [id]
    );

    return rows[0] ?? null;
  } catch (error) {
    logger.error("PostgreSQL account by id query failed", error, { id });
    return null;
  }
}
