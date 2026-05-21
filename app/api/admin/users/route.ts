import { NextResponse } from "next/server";
import { recordAdminAuditEvent } from "@/lib/admin-audit";
import { createAdminInvite, listAdminUsers } from "@/lib/admin-account";
import { isAdminSessionRequiredError, requireAdminSession } from "@/lib/admin-session";
import { getClientIp, getUserAgent } from "@/lib/request-context";
import { consumeRateLimit, isRateLimitExceededError } from "@/lib/rate-limit";
import { ADMIN_USER_INVITE_ACTOR_RATE_LIMIT } from "@/lib/security-policies";
import { parseAdminInvitePayload } from "@/lib/validation";

export async function GET() {
  try {
    const session = await requireAdminSession();
    const data = await listAdminUsers(session.account_id);
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: isAdminSessionRequiredError(error) ? error.message : "Erro ao carregar usuarios." },
      { status: isAdminSessionRequiredError(error) ? 401 : 400 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAdminSession();

    if (session.role === "editor") {
      return NextResponse.json({ error: "Editores nao podem criar convites de acesso." }, { status: 403 });
    }

    await consumeRateLimit(ADMIN_USER_INVITE_ACTOR_RATE_LIMIT, session.user_id);

    const payload = parseAdminInvitePayload(await request.json());
    const data = await createAdminInvite(payload, session.account_id, new URL(request.url).origin);

    await recordAdminAuditEvent({
      action: "admin.user.invited",
      accountId: session.account_id,
      actorUserId: session.user_id,
      actorLogin: session.login,
      actorRole: session.role,
      targetType: "admin_user",
      targetId: data.user.id,
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      metadata: {
        invitedLogin: data.user.login,
        invitedRole: data.user.role,
        invitedStatus: data.user.status
      }
    });

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    if (isRateLimitExceededError(error)) {
      const response = NextResponse.json({ error: error.message }, { status: 429 });
      response.headers.set("Retry-After", String(error.retryAfterSeconds));
      return response;
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao convidar usuario." },
      { status: isAdminSessionRequiredError(error) ? 401 : 400 }
    );
  }
}
