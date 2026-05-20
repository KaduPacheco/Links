import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { getDatabaseConfigMessage, getPool } from "@/lib/db";

type StoredAdminUser = {
  id: number;
  login: string;
  password_hash: string;
};

export type AdminAccountInfo = {
  login: string | null;
  credentialSource: "database" | "environment" | null;
};

type ResolvedCredentials = {
  login: string;
  passwordHash: string | null;
  plainPassword: string | null;
  source: "database" | "environment";
};

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

function verifyHashedPassword(password: string, storedHash: string) {
  const [algorithm, salt, hash] = storedHash.split("$");

  if (algorithm !== "scrypt" || !salt || !hash) {
    return false;
  }

  const computed = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");

  return computed.length === expected.length && timingSafeEqual(computed, expected);
}

async function ensureAdminUsersSchema() {
  const pool = getPool();

  if (!pool) {
    return null;
  }

  await pool.query(`
    create table if not exists admin_users (
      id integer primary key default 1 check (id = 1),
      login text not null,
      password_hash text not null,
      updated_at timestamptz not null default now()
    );
  `);

  return pool;
}

async function readStoredAdminUser() {
  const pool = await ensureAdminUsersSchema();

  if (!pool) {
    return null;
  }

  const { rows } = await pool.query<StoredAdminUser>(
    `
      select id, login, password_hash
      from admin_users
      where id = 1
    `
  );

  return rows[0] ?? null;
}

async function resolveAdminCredentials(): Promise<ResolvedCredentials | null> {
  const storedUser = await readStoredAdminUser();

  if (storedUser) {
    return {
      login: storedUser.login,
      passwordHash: storedUser.password_hash,
      plainPassword: null,
      source: "database"
    };
  }

  const envLogin = getEnvAdminLogin();
  const envPassword = getEnvAdminPassword();

  if (!envLogin || !envPassword) {
    return null;
  }

  return {
    login: envLogin,
    passwordHash: null,
    plainPassword: envPassword,
    source: "environment"
  };
}

export async function isAdminAuthConfigured() {
  return Boolean(await resolveAdminCredentials()) && Boolean(process.env.AUTH_SESSION_SECRET?.trim() || process.env.SESSION_SECRET?.trim());
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
  const credentials = await resolveAdminCredentials();

  if (!credentials || login !== credentials.login) {
    return { valid: false, login: null as string | null };
  }

  const valid =
    credentials.source === "database"
      ? verifyHashedPassword(password, credentials.passwordHash ?? "")
      : password === credentials.plainPassword;

  return {
    valid,
    login: valid ? credentials.login : null
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

  await pool.query(
    `
      insert into admin_users (id, login, password_hash, updated_at)
      values ($1, $2, $3, now())
      on conflict (id)
      do update
      set
        login = excluded.login,
        password_hash = excluded.password_hash,
        updated_at = now()
    `,
    [1, credentials.login, passwordHash]
  );

  return {
    login: credentials.login,
    credentialSource: "database" as const
  };
}
