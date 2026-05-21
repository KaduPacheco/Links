import { NextResponse } from "next/server";
import { recordAdminAuditEvent } from "@/lib/admin-audit";
import { acceptAdminInvite } from "@/lib/admin-account";
import { getClientIp, getUserAgent, hashRateLimitValue } from "@/lib/request-context";
import { consumeRateLimit, isRateLimitExceededError } from "@/lib/rate-limit";
import { INVITE_ACCEPT_IP_RATE_LIMIT } from "@/lib/security-policies";
import { parseInviteAcceptancePayload } from "@/lib/validation";

export async function POST(request: Request) {
  const clientIp = getClientIp(request) ?? "unknown";
  const userAgent = getUserAgent(request);

  try {
    await consumeRateLimit(INVITE_ACCEPT_IP_RATE_LIMIT, clientIp);
    const payload = parseInviteAcceptancePayload(await request.json());
    const user = await acceptAdminInvite(payload.token, payload.password);

    await recordAdminAuditEvent({
      action: "auth.invite.accepted",
      accountId: user.account_id,
      actorUserId: user.id,
      actorLogin: user.login,
      actorRole: user.role,
      targetType: "admin_user",
      targetId: user.id,
      ipAddress: clientIp,
      userAgent,
      metadata: {
        inviteTokenHash: hashRateLimitValue(payload.token)
      }
    });

    return NextResponse.json({ ok: true, user });
  } catch (error) {
    if (isRateLimitExceededError(error)) {
      const response = NextResponse.json({ error: error.message }, { status: 429 });
      response.headers.set("Retry-After", String(error.retryAfterSeconds));
      return response;
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao aceitar convite." },
      { status: 400 }
    );
  }
}
