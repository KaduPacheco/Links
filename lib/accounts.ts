import { getPool } from "@/lib/db";
import { defaultSiteSettings } from "@/types/site-settings";
import { defaultAccountSlug, type Account } from "@/types/account";

export const DEFAULT_ACCOUNT_ID = "00000000-0000-0000-0000-000000000001";

type AccountRow = Account;

let accountsSchemaReadyPromise: Promise<ReturnType<typeof getPool>> | null = null;

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

export async function ensureAccountsSchema() {
  const pool = getPool();

  if (!pool) {
    return null;
  }

  if (accountsSchemaReadyPromise) {
    return accountsSchemaReadyPromise;
  }

  accountsSchemaReadyPromise = (async () => {
    await pool.query(`
      create table if not exists accounts (
        id uuid primary key default gen_random_uuid(),
        name text not null,
        slug text not null unique,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      );
    `);

    await pool.query(
      `
        insert into accounts (id, name, slug)
        values ($1, $2, $3)
        on conflict (id) do nothing
      `,
      [DEFAULT_ACCOUNT_ID, defaultSiteSettings.company_name, defaultAccountSlug]
    );

    await pool.query(
      `
        update accounts
        set slug = $2
        where id = $1 and (slug is null or slug = '')
      `,
      [DEFAULT_ACCOUNT_ID, defaultAccountSlug]
    );

    return pool;
  })().catch((error) => {
    accountsSchemaReadyPromise = null;
    throw error;
  });

  return accountsSchemaReadyPromise;
}

export async function getDefaultAccount() {
  const fallback = {
    id: DEFAULT_ACCOUNT_ID,
    name: defaultSiteSettings.company_name,
    slug: defaultAccountSlug,
    created_at: "",
    updated_at: ""
  } satisfies Account;

  let pool: Awaited<ReturnType<typeof ensureAccountsSchema>>;

  try {
    pool = await ensureAccountsSchema();
  } catch (error) {
    console.error("PostgreSQL default account query failed", error);
    return fallback;
  }

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
    console.error("PostgreSQL default account query failed", error);
    return fallback;
  }
}

export async function getAccountBySlug(slug: string) {
  let pool: Awaited<ReturnType<typeof ensureAccountsSchema>>;

  try {
    pool = await ensureAccountsSchema();
  } catch (error) {
    console.error("PostgreSQL account by slug query failed", error);
    return null;
  }

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
    console.error("PostgreSQL account by slug query failed", error);
    return null;
  }
}

export async function getAccountById(id: string) {
  let pool: Awaited<ReturnType<typeof ensureAccountsSchema>>;

  try {
    pool = await ensureAccountsSchema();
  } catch (error) {
    console.error("PostgreSQL account by id query failed", error);
    return null;
  }

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
    console.error("PostgreSQL account by id query failed", error);
    return null;
  }
}
