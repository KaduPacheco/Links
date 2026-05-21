import { NextResponse } from "next/server";
import { recordAdminAuditEvent } from "@/lib/admin-audit";
import { isAdminSessionRequiredError, requireAdminSession } from "@/lib/admin-session";
import { getClientIp, getUserAgent } from "@/lib/request-context";
import { consumeRateLimit, isRateLimitExceededError, resetRateLimit } from "@/lib/rate-limit";
import { ADMIN_PASSWORD_IP_RATE_LIMIT, ADMIN_PASSWORD_USER_RATE_LIMIT } from "@/lib/security-policies";
import { parsePasswordUpdatePayload } from "@/lib/validation";
import { updateAdminPassword } from "@/lib/admin-account";

export async function POST(request: Request) {
  try {
    const session = await requireAdminSession();
    const clientIp = getClientIp(request) ?? "unknown";
    const userAgent = getUserAgent(request);

    await consumeRateLimit(ADMIN_PASSWORD_IP_RATE_LIMIT, clientIp);
    await consumeRateLimit(ADMIN_PASSWORD_USER_RATE_LIMIT, session.user_id);

    const payload = parsePasswordUpdatePayload(await request.json());
    const account = await updateAdminPassword(payload.currentPassword, payload.nextPassword, session.user_id, session.account_id);

    await resetRateLimit(ADMIN_PASSWORD_IP_RATE_LIMIT.action, clientIp);
    await resetRateLimit(ADMIN_PASSWORD_USER_RATE_LIMIT.action, session.user_id);

    await recordAdminAuditEvent({
      action: "admin.password.updated",
      accountId: session.account_id,
      actorUserId: session.user_id,
      actorLogin: session.login,
      actorRole: session.role,
      targetType: "admin_user",
      targetId: session.user_id,
      ipAddress: clientIp,
      userAgent
    });

    return NextResponse.json({ ok: true, account });
  } catch (error) {
    if (isRateLimitExceededError(error)) {
      const response = NextResponse.json({ error: error.message }, { status: 429 });
      response.headers.set("Retry-After", String(error.retryAfterSeconds));
      return response;
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao atualizar senha." },
      { status: isAdminSessionRequiredError(error) ? 401 : 400 }
    );
  }
}
