import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { getDatabaseConfigMessage, getPool } from "@/lib/db";
import type { AdminInviteResult, AdminRole, AdminUser } from "@/types/admin-user";

type StoredAdminUser = {
  id: string | number;
  name: string | null;
  login: string;
  password_hash: string;
  role: AdminRole | null;
  status: "pending" | "active" | "inactive" | null;
  created_at: string;
  updated_at: string;
  invited_at: string | null;
  accepted_at: string | null;
};

export type AdminAccountInfo = {
  login: string | null;
  credentialSource: "database" | "environment" | null;
};

type ResolvedCredentials = {
  id: string;
  name: string;
  login: string;
  role: AdminRole;
  passwordHash: string | null;
  plainPassword: string | null;
  source: "database" | "environment";
};

let schemaReadyPromise: Promise<ReturnType<typeof getPool>> | null = null;

function getEnvAdminLogin() {
  return process.env.ADMIN_EMAIL?.trim() || process.env.ADMIN_USERNAME?.trim() || null;
}

function getEnvAdminPassword() {
  return process.env.ADMIN_PASSWORD?.trim() || null;
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

function hashInviteToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function verifyHashedPassword(password: string, storedHash: string) {
  const [algorithm, salt, hash] = storedHash.split("$");

  if (algorithm !== "scrypt" || !salt || !hash) {
    return false;
  }

  const computed = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");

  return computed.length === expected.length && timingSafeEqual(computed, expected);
}

function mapAdminUser(row: StoredAdminUser): AdminUser {
  return {
    id: String(row.id),
    name: row.name ?? row.login,
    login: row.login,
    role: row.role ?? "owner",
    status: row.status ?? "active",
    created_at: row.created_at,
    updated_at: row.updated_at,
    invited_at: row.invited_at,
    accepted_at: row.accepted_at
  };
}

function buildInviteUrl(token: string, requestOrigin?: string) {
  const baseUrl =
    requestOrigin?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.VERCEL_URL?.trim() ||
    "http://localhost:3000";
  const normalizedBase = baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`;
  return `${normalizedBase.replace(/\/$/, "")}/admin/convite/${token}`;
}

async function ensureAdminUsersSchema() {
  const pool = getPool();

  if (!pool) {
    return null;
  }

  if (schemaReadyPromise) {
    return schemaReadyPromise;
  }

  schemaReadyPromise = (async () => {
    await pool.query(`
      create table if not exists admin_users (
        id integer primary key default 1,
        login text not null,
        password_hash text not null,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      );
    `);

    await pool.query(`
      alter table admin_users
      drop constraint if exists admin_users_id_check;
    `);

    await pool.query(`
      alter table admin_users
      add column if not exists name text,
      add column if not exists role text not null default 'owner',
      add column if not exists status text not null default 'active',
      add column if not exists invite_token_hash text,
      add column if not exists invited_at timestamptz,
      add column if not exists accepted_at timestamptz,
      add column if not exists created_at timestamptz not null default now();
    `);

    await pool.query(`
      create unique index if not exists admin_users_login_unique_idx on admin_users (lower(login));
    `);

    await pool.query(`
      create unique index if not exists admin_users_invite_token_unique_idx
      on admin_users (invite_token_hash)
      where invite_token_hash is not null;
    `);

    return pool;
  })().catch((error) => {
    schemaReadyPromise = null;
    throw error;
  });

  return schemaReadyPromise;
}

async function readActiveStoredAdminUser(login?: string) {
  const pool = await ensureAdminUsersSchema();

  if (!pool) {
    return null;
  }

  const { rows } = await pool.query<StoredAdminUser>(
    `
      select
        id::text,
        name,
        login,
        password_hash,
        role,
        status,
        created_at::text,
        updated_at::text,
        invited_at::text,
        accepted_at::text
      from admin_users
      where status = 'active'
        and password_hash <> ''
        and ($1::text is null or lower(login) = lower($1))
      order by id::text asc
      limit 1
    `,
    [login ?? null]
  );

  return rows[0] ?? null;
}

async function resolveAdminCredentials(login?: string): Promise<ResolvedCredentials | null> {
  const storedUser = await readActiveStoredAdminUser(login);

  if (storedUser) {
    return {
      id: String(storedUser.id),
      name: storedUser.name ?? storedUser.login,
      login: storedUser.login,
      role: storedUser.role ?? "owner",
      passwordHash: storedUser.password_hash,
      plainPassword: null,
      source: "database"
    };
  }

  const envLogin = getEnvAdminLogin();
  const envPassword = getEnvAdminPassword();

  if (!envLogin || !envPassword || (login && login !== envLogin)) {
    return null;
  }

  return {
    id: "env-admin",
    name: envLogin,
    login: envLogin,
    role: "owner",
    passwordHash: null,
    plainPassword: envPassword,
    source: "environment"
  };
}

export async function isAdminAuthConfigured() {
  return (
    Boolean(await resolveAdminCredentials()) &&
    Boolean(process.env.AUTH_SESSION_SECRET?.trim() || process.env.SESSION_SECRET?.trim())
  );
}

export async function getAdminAuthConfigError() {
  const credentials = await resolveAdminCredentials();
  const missing = [
    !credentials ? "credenciais administrativas (banco ou variaveis ADMIN_EMAIL/ADMIN_USERNAME e ADMIN_PASSWORD)" : null,
    !(process.env.AUTH_SESSION_SECRET?.trim() || process.env.SESSION_SECRET?.trim())
      ? "AUTH_SESSION_SECRET ou SESSION_SECRET"
      : null
  ].filter(Boolean);

  return missing.length ? `Auth admin incompleta. Defina: ${missing.join(", ")}.` : null;
}

export async function getAdminAccountInfo(): Promise<AdminAccountInfo> {
  const credentials = await resolveAdminCredentials();

  return {
    login: credentials?.login ?? null,
    credentialSource: credentials?.source ?? null
  };
}

export async function validateAdminCredentials(login: string, password: string) {
  const credentials = await resolveAdminCredentials(login);

  if (!credentials || login !== credentials.login) {
    return { valid: false, login: null as string | null, userId: null as string | null, role: null as AdminRole | null };
  }

  const valid =
    credentials.source === "database"
      ? verifyHashedPassword(password, credentials.passwordHash ?? "")
      : password === credentials.plainPassword;

  return {
    valid,
    login: valid ? credentials.login : null,
    userId: valid ? credentials.id : null,
    role: valid ? credentials.role : null
  };
}

export async function updateAdminPassword(currentPassword: string, nextPassword: string) {
  const credentials = await resolveAdminCredentials();

  if (!credentials) {
    throw new Error("Auth admin nao configurada.");
  }

  const currentPasswordMatches =
    credentials.source === "database"
      ? verifyHashedPassword(currentPassword, credentials.passwordHash ?? "")
      : currentPassword === credentials.plainPassword;

  if (!currentPasswordMatches) {
    throw new Error("A senha atual nao confere.");
  }

  const pool = await ensureAdminUsersSchema();

  if (!pool) {
    throw new Error(getDatabaseConfigMessage());
  }

  const passwordHash = hashPassword(nextPassword);

  if (credentials.source === "database") {
    await pool.query(
      `
        update admin_users
        set password_hash = $2, updated_at = now()
        where id::text = $1
      `,
      [credentials.id, passwordHash]
    );
  } else {
    await pool.query(
      `
        insert into admin_users (id, name, login, password_hash, role, status, accepted_at, updated_at)
        values (1, $1, $2, $3, 'owner', 'active', now(), now())
        on conflict (id)
        do update
        set
          name = excluded.name,
          login = excluded.login,
          password_hash = excluded.password_hash,
          role = excluded.role,
          status = excluded.status,
          accepted_at = now(),
          updated_at = now()
      `,
      [credentials.name, credentials.login, passwordHash]
    );
  }

  return {
    login: credentials.login,
    credentialSource: "database" as const
  };
}

export async function listAdminUsers(): Promise<AdminUser[]> {
  const pool = await ensureAdminUsersSchema();

  if (!pool) {
    return [];
  }

  const { rows } = await pool.query<StoredAdminUser>(
    `
      select
        id::text,
        name,
        login,
        password_hash,
        role,
        status,
        created_at::text,
        updated_at::text,
        invited_at::text,
        accepted_at::text
      from admin_users
      order by created_at asc, id::text asc
    `
  );

  return rows.map(mapAdminUser);
}

export async function createAdminInvite(
  input: { name: string; login: string; role: AdminRole },
  requestOrigin?: string
): Promise<AdminInviteResult> {
  const pool = await ensureAdminUsersSchema();

  if (!pool) {
    throw new Error(getDatabaseConfigMessage());
  }

  const token = randomBytes(32).toString("base64url");
  const inviteTokenHash = hashInviteToken(token);

  const existing = await pool.query<{ id: string; status: string }>(
    `
      select id::text, status
      from admin_users
      where lower(login) = lower($1)
      limit 1
    `,
    [input.login]
  );

  if (existing.rows[0]?.status === "active") {
    throw new Error("Ja existe um usuario ativo com este e-mail.");
  }

  const { rows } = await pool.query<StoredAdminUser>(
    existing.rows[0]
      ? `
          update admin_users
          set
            name = $2,
            role = $3,
            status = 'pending',
            password_hash = '',
            invite_token_hash = $4,
            invited_at = now(),
            accepted_at = null,
            updated_at = now()
          where id::text = $1
          returning
            id::text,
            name,
            login,
            password_hash,
            role,
            status,
            created_at::text,
            updated_at::text,
            invited_at::text,
            accepted_at::text
        `
      : `
          insert into admin_users (
            id,
            name,
            login,
            password_hash,
            role,
            status,
            invite_token_hash,
            invited_at,
            updated_at
          )
          values (
            (select coalesce(max(id), 0) + 1 from admin_users),
            $2,
            $1,
            '',
            $3,
            'pending',
            $4,
            now(),
            now()
          )
          returning
            id::text,
            name,
            login,
            password_hash,
            role,
            status,
            created_at::text,
            updated_at::text,
            invited_at::text,
            accepted_at::text
        `,
    existing.rows[0] ? [existing.rows[0].id, input.name, input.role, inviteTokenHash] : [input.login, input.name, input.role, inviteTokenHash]
  );

  return {
    user: mapAdminUser(rows[0]),
    inviteUrl: buildInviteUrl(token, requestOrigin)
  };
}

export async function acceptAdminInvite(token: string, password: string) {
  const pool = await ensureAdminUsersSchema();

  if (!pool) {
    throw new Error(getDatabaseConfigMessage());
  }

  const inviteTokenHash = hashInviteToken(token);
  const passwordHash = hashPassword(password);

  const { rows } = await pool.query<StoredAdminUser>(
    `
      update admin_users
      set
        password_hash = $2,
        status = 'active',
        invite_token_hash = null,
        accepted_at = now(),
        updated_at = now()
      where invite_token_hash = $1
        and status = 'pending'
      returning
        id::text,
        name,
        login,
        password_hash,
        role,
        status,
        created_at::text,
        updated_at::text,
        invited_at::text,
        accepted_at::text
    `,
    [inviteTokenHash, passwordHash]
  );

  if (!rows[0]) {
    throw new Error("Convite invalido ou ja utilizado.");
  }

  return mapAdminUser(rows[0]);
}

export async function updateAdminUserStatus(id: string, status: "active" | "inactive") {
  const pool = await ensureAdminUsersSchema();

  if (!pool) {
    throw new Error(getDatabaseConfigMessage());
  }

  const { rows } = await pool.query<StoredAdminUser>(
    `
      update admin_users
      set status = $2, updated_at = now()
      where id::text = $1
      returning
        id::text,
        name,
        login,
        password_hash,
        role,
        status,
        created_at::text,
        updated_at::text,
        invited_at::text,
        accepted_at::text
    `,
    [id, status]
  );

  if (!rows[0]) {
    throw new Error("Usuario nao encontrado.");
  }

  return mapAdminUser(rows[0]);
}
