import { getPool } from "@/lib/db";
import { logger } from "@/lib/logger";
import type { AdminAuditEvent, AdminAuditPage } from "@/types/admin-audit";

type AuditEventInput = {
  accountId?: string | null;
  actorUserId?: string | null;
  actorLogin?: string | null;
  actorRole?: string | null;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
};

type AdminAuditRow = Omit<AdminAuditEvent, "metadata"> & {
  metadata: Record<string, unknown> | null;
};

export async function recordAdminAuditEvent(event: AuditEventInput) {
  const pool = getPool();

  if (!pool) {
    return;
  }

  try {
    await pool.query(
      `
        insert into admin_audit_logs (
          account_id,
          actor_user_id,
          actor_login,
          actor_role,
          action,
          target_type,
          target_id,
          metadata,
          ip_address,
          user_agent
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10)
      `,
      [
        event.accountId ?? null,
        event.actorUserId ?? null,
        event.actorLogin ?? null,
        event.actorRole ?? null,
        event.action,
        event.targetType ?? null,
        event.targetId ?? null,
        JSON.stringify(event.metadata ?? {}),
        event.ipAddress ?? null,
        event.userAgent ?? null
      ]
    );
  } catch (error) {
    logger.error("Failed to persist admin audit event", error, {
      action: event.action,
      targetType: event.targetType ?? null,
      targetId: event.targetId ?? null
    });
  }
}

export async function listAdminAuditEvents(accountId: string, limit = 25, before?: string | null): Promise<AdminAuditPage> {
  const pool = getPool();

  if (!pool) {
    return {
      data: [],
      nextCursor: null
    };
  }

  const normalizedLimit = Math.min(Math.max(limit, 1), 100);

  try {
    const { rows } = await pool.query<AdminAuditRow>(
      `
        select
          id::text,
          account_id::text,
          actor_user_id,
          actor_login,
          actor_role,
          action,
          target_type,
          target_id,
          metadata,
          ip_address,
          user_agent,
          created_at::text
        from admin_audit_logs
        where account_id = $1
          and ($2::timestamptz is null or created_at < $2::timestamptz)
        order by created_at desc, id desc
        limit $3
      `,
      [accountId, before ?? null, normalizedLimit + 1]
    );

    const hasMore = rows.length > normalizedLimit;
    const data = rows.slice(0, normalizedLimit).map((row) => ({
      ...row,
      metadata: row.metadata ?? {}
    }));

    return {
      data,
      nextCursor: hasMore ? data.at(-1)?.created_at ?? null : null
    };
  } catch (error) {
    logger.error("Failed to load admin audit events", error, {
      accountId,
      limit: normalizedLimit,
      before: before ?? null
    });

    return {
      data: [],
      nextCursor: null
    };
  }
}
