import { NextResponse } from "next/server";
import { recordAdminAuditEvent } from "@/lib/admin-audit";
import { createAccountOwnerInvite } from "@/lib/admin-account";
import { isAdminSessionRequiredError, requireAdminSession } from "@/lib/admin-session";
import { getClientIp, getUserAgent } from "@/lib/request-context";
import { consumeRateLimit, isRateLimitExceededError } from "@/lib/rate-limit";
import { ACCOUNT_OWNER_INVITE_ACTOR_RATE_LIMIT } from "@/lib/security-policies";
import { parseAccountOwnerInvitePayload } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const session = await requireAdminSession();

    if (session.role !== "owner") {
      return NextResponse.json({ error: "Somente o dono pode convidar uma nova empresa." }, { status: 403 });
    }

    await consumeRateLimit(ACCOUNT_OWNER_INVITE_ACTOR_RATE_LIMIT, session.user_id);

    const payload = parseAccountOwnerInvitePayload(await request.json());
    const data = await createAccountOwnerInvite(payload, session.account_id, session.user_id, new URL(request.url).origin);

    await recordAdminAuditEvent({
      action: "admin.account.invited",
      accountId: session.account_id,
      actorUserId: session.user_id,
      actorLogin: session.login,
      actorRole: session.role,
      targetType: "account_owner_invite",
      targetId: data.invite.id,
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      metadata: {
        companyName: data.invite.company_name,
        ownerName: data.invite.owner_name,
        invitedLogin: data.invite.login
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
      { error: error instanceof Error ? error.message : "Erro ao criar convite de empresa." },
      { status: isAdminSessionRequiredError(error) ? 401 : 400 }
    );
  }
}
