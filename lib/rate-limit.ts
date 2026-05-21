import { getPool } from "@/lib/db";

export type RateLimitPolicy = {
  action: string;
  maxAttempts: number;
  windowSeconds: number;
  blockSeconds: number;
};

export class RateLimitExceededError extends Error {
  retryAfterSeconds: number;

  constructor(message: string, retryAfterSeconds: number) {
    super(message);
    this.name = "RateLimitExceededError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

type StoredRateLimit = {
  attempts: number;
  window_started_at: string;
  blocked_until: string | null;
};

function normalizeSubject(subject: string) {
  return subject.trim().toLowerCase().slice(0, 200);
}

export function isRateLimitExceededError(error: unknown): error is RateLimitExceededError {
  return error instanceof RateLimitExceededError;
}

export async function consumeRateLimit(policy: RateLimitPolicy, subject: string) {
  const pool = getPool();

  if (!pool) {
    return;
  }

  const normalizedSubject = normalizeSubject(subject);
  const now = new Date();

  await pool.query("begin");

  try {
    const { rows } = await pool.query<StoredRateLimit>(
      `
        select attempts, window_started_at::text, blocked_until::text
        from auth_rate_limits
        where action = $1 and subject = $2
        for update
      `,
      [policy.action, normalizedSubject]
    );

    const existing = rows[0];

    if (!existing) {
      await pool.query(
        `
          insert into auth_rate_limits (action, subject, attempts, window_started_at, blocked_until, updated_at)
          values ($1, $2, 1, now(), null, now())
        `,
        [policy.action, normalizedSubject]
      );

      await pool.query("commit");
      return;
    }

    const blockedUntil = existing.blocked_until ? new Date(existing.blocked_until) : null;

    if (blockedUntil && blockedUntil > now) {
      await pool.query("commit");
      throw new RateLimitExceededError(
        "Muitas tentativas. Aguarde antes de tentar novamente.",
        Math.max(1, Math.ceil((blockedUntil.getTime() - now.getTime()) / 1000))
      );
    }

    const windowStartedAt = new Date(existing.window_started_at);
    const windowExpiresAt = windowStartedAt.getTime() + policy.windowSeconds * 1000;
    const windowExpired = windowExpiresAt <= now.getTime();
    const nextAttempts = windowExpired ? 1 : existing.attempts + 1;

    if (!windowExpired && nextAttempts > policy.maxAttempts) {
      await pool.query(
        `
          update auth_rate_limits
          set
            attempts = $3,
            blocked_until = now() + ($4 * interval '1 second'),
            updated_at = now()
          where action = $1 and subject = $2
        `,
        [policy.action, normalizedSubject, nextAttempts, policy.blockSeconds]
      );

      await pool.query("commit");
      throw new RateLimitExceededError(
        "Muitas tentativas. Aguarde antes de tentar novamente.",
        policy.blockSeconds
      );
    }

    await pool.query(
      `
        update auth_rate_limits
        set
          attempts = $3,
          window_started_at = case when $4 then now() else window_started_at end,
          blocked_until = null,
          updated_at = now()
        where action = $1 and subject = $2
      `,
      [policy.action, normalizedSubject, nextAttempts, windowExpired]
    );

    await pool.query("commit");
  } catch (error) {
    await pool.query("rollback");
    throw error;
  }
}

export async function resetRateLimit(action: string, subject: string) {
  const pool = getPool();

  if (!pool) {
    return;
  }

  await pool.query("delete from auth_rate_limits where action = $1 and subject = $2", [action, normalizeSubject(subject)]);
}
