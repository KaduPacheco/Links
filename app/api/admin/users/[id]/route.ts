import { NextResponse } from "next/server";
import { recordAdminAuditEvent } from "@/lib/admin-audit";
import { updateAdminUserStatus } from "@/lib/admin-account";
import { isAdminSessionRequiredError, requireAdminSession } from "@/lib/admin-session";
import { getClientIp, getUserAgent } from "@/lib/request-context";
import { consumeRateLimit, isRateLimitExceededError } from "@/lib/rate-limit";
import { ADMIN_USER_STATUS_ACTOR_RATE_LIMIT } from "@/lib/security-policies";
import { parseAdminUserStatusPayload } from "@/lib/validation";

type RouteContext = {
  params: {
    id: string;
  };
};

export async function PUT(request: Request, { params }: RouteContext) {
  try {
    const session = await requireAdminSession();
    await consumeRateLimit(ADMIN_USER_STATUS_ACTOR_RATE_LIMIT, session.user_id);

    const payload = parseAdminUserStatusPayload(await request.json());
    const data = await updateAdminUserStatus(params.id, payload.status, session.account_id);

    await recordAdminAuditEvent({
      action: "admin.user.status_updated",
      accountId: session.account_id,
      actorUserId: session.user_id,
      actorLogin: session.login,
      actorRole: session.role,
      targetType: "admin_user",
      targetId: data.id,
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      metadata: {
        nextStatus: data.status,
        targetLogin: data.login
      }
    });

    return NextResponse.json({ data });
  } catch (error) {
    if (isRateLimitExceededError(error)) {
      const response = NextResponse.json({ error: error.message }, { status: 429 });
      response.headers.set("Retry-After", String(error.retryAfterSeconds));
      return response;
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao atualizar usuario." },
      { status: isAdminSessionRequiredError(error) ? 401 : 400 }
    );
  }
}
