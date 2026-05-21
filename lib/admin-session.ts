import { cookies } from "next/headers";
import {
  ADMIN_SESSION_COOKIE,
  createSessionToken,
  getAdminIdleTimeoutMinutes,
  getAdminSessionTtlSeconds,
  type AdminSessionPayload,
  verifySessionToken
} from "@/lib/auth";
import { getPool } from "@/lib/db";

export class AdminSessionRequiredError extends Error {
  constructor() {
    super("Sessao administrativa invalida ou expirada.");
    this.name = "AdminSessionRequiredError";
  }
}

type StoredAdminSession = {
  id: string;
  user_id: string;
  account_id: string;
  login: string;
  role: string;
  expires_at: string;
  last_seen_at: string;
  revoked_at: string | null;
};

type CreateAdminSessionInput = {
  userId: string;
  accountId: string;
  login: string;
  role: string;
};

async function readStoredAdminSession(sessionId: string) {
  const pool = getPool();

  if (!pool) {
    return null;
  }

  const { rows } = await pool.query<StoredAdminSession>(
    `
      select
        id::text,
        user_id,
        account_id::text,
        login,
        role,
        expires_at::text,
        last_seen_at::text,
        revoked_at::text
      from admin_sessions
      where id = $1
      limit 1
    `,
    [sessionId]
  );

  return rows[0] ?? null;
}

async function touchStoredAdminSession(sessionId: string) {
  const pool = getPool();

  if (!pool) {
    return;
  }

  await pool.query(
    `
      update admin_sessions
      set last_seen_at = now(), updated_at = now()
      where id = $1
    `,
    [sessionId]
  );
}

async function validatePersistedSession(session: AdminSessionPayload) {
  const sessionId = session.session_id;

  if (!sessionId) {
    return null;
  }

  const storedSession = await readStoredAdminSession(sessionId);

  if (!storedSession) {
    return null;
  }

  if (
    storedSession.user_id !== session.user_id ||
    storedSession.account_id !== session.account_id ||
    storedSession.login !== session.login ||
    storedSession.role !== session.role
  ) {
    return null;
  }

  if (storedSession.revoked_at) {
    return null;
  }

  const now = Date.now();
  const expiresAtMs = new Date(storedSession.expires_at).getTime();

  if (!Number.isFinite(expiresAtMs) || expiresAtMs <= now) {
    await revokeAdminSession(sessionId);
    return null;
  }

  const idleTimeoutMs = getAdminIdleTimeoutMinutes() * 60 * 1000;
  const lastSeenAtMs = new Date(storedSession.last_seen_at).getTime();

  if (Number.isFinite(idleTimeoutMs) && idleTimeoutMs > 0 && Number.isFinite(lastSeenAtMs) && lastSeenAtMs + idleTimeoutMs <= now) {
    await revokeAdminSession(sessionId);
    return null;
  }

  if (session.user_id !== "env-admin") {
    const pool = getPool();

    if (!pool) {
      return null;
    }

    const { rows } = await pool.query<{ id: string }>(
      `
        select id::text
        from admin_users
        where id::text = $1
          and account_id = $2
          and lower(login) = lower($3)
          and status = 'active'
          and password_hash <> ''
        limit 1
      `,
      [session.user_id, session.account_id, session.login]
    );

    if (!rows[0]) {
      await revokeAdminSession(sessionId);
      return null;
    }
  }

  await touchStoredAdminSession(sessionId);
  return session;
}

export async function readAdminSession(): Promise<AdminSessionPayload | null> {
  const session = await verifySessionToken(cookies().get(ADMIN_SESSION_COOKIE)?.value ?? null);

  if (!session) {
    return null;
  }

  if (!session.session_id) {
    return getPool() || session.user_id !== "env-admin" ? null : session;
  }

  return validatePersistedSession(session);
}

export async function requireAdminSession(): Promise<AdminSessionPayload> {
  const session = await readAdminSession();

  if (!session) {
    throw new AdminSessionRequiredError();
  }

  return session;
}

export function isAdminSessionRequiredError(error: unknown): error is AdminSessionRequiredError {
  return error instanceof AdminSessionRequiredError;
}

export async function createAdminSession(input: CreateAdminSessionInput) {
  const pool = getPool();

  if (!pool) {
    const token = await createSessionToken(input.login, input.userId, input.role, input.accountId);
    return {
      token,
      sessionId: null
    };
  }

  const sessionTtlSeconds = getAdminSessionTtlSeconds();
  const { rows } = await pool.query<{ id: string }>(
    `
      insert into admin_sessions (user_id, account_id, login, role, expires_at, last_seen_at)
      values ($1, $2, $3, $4, now() + ($5 * interval '1 second'), now())
      returning id::text
    `,
    [input.userId, input.accountId, input.login, input.role, sessionTtlSeconds]
  );

  const sessionId = rows[0]?.id ?? null;
  const token = await createSessionToken(input.login, input.userId, input.role, input.accountId, sessionId ?? undefined);

  return {
    token,
    sessionId
  };
}

export async function revokeAdminSession(sessionId: string) {
  const pool = getPool();

  if (!pool) {
    return;
  }

  await pool.query(
    `
      update admin_sessions
      set revoked_at = coalesce(revoked_at, now()), updated_at = now()
      where id = $1
    `,
    [sessionId]
  );
}

export async function revokeAdminSessionsForUser(userId: string, accountId: string, exceptSessionId?: string) {
  const pool = getPool();

  if (!pool) {
    return;
  }

  if (exceptSessionId) {
    await pool.query(
      `
        update admin_sessions
        set revoked_at = coalesce(revoked_at, now()), updated_at = now()
        where user_id = $1
          and account_id = $2
          and id <> $3
          and revoked_at is null
      `,
      [userId, accountId, exceptSessionId]
    );
    return;
  }

  await pool.query(
    `
      update admin_sessions
      set revoked_at = coalesce(revoked_at, now()), updated_at = now()
      where user_id = $1
        and account_id = $2
        and revoked_at is null
    `,
    [userId, accountId]
  );
}
