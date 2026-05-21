import { NextResponse } from "next/server";
import { recordAdminAuditEvent } from "@/lib/admin-audit";
import { acceptAccountOwnerInvite } from "@/lib/admin-account";
import { ADMIN_SESSION_COOKIE, createSessionToken, getAdminCookieOptions } from "@/lib/auth";
import { getClientIp, getUserAgent, hashRateLimitValue } from "@/lib/request-context";
import { consumeRateLimit, isRateLimitExceededError } from "@/lib/rate-limit";
import { ACCOUNT_OWNER_INVITE_ACCEPT_IP_RATE_LIMIT } from "@/lib/security-policies";
import { parseInviteAcceptancePayload } from "@/lib/validation";

export async function POST(request: Request) {
  const clientIp = getClientIp(request) ?? "unknown";
  const userAgent = getUserAgent(request);

  try {
    await consumeRateLimit(ACCOUNT_OWNER_INVITE_ACCEPT_IP_RATE_LIMIT, clientIp);
    const payload = parseInviteAcceptancePayload(await request.json());
    const result = await acceptAccountOwnerInvite(payload.token, payload.password);
    const token = await createSessionToken(result.user.login, result.user.id, result.user.role, result.user.account_id);

    const response = NextResponse.json({
      ok: true,
      account: result.account,
      user: result.user,
      next: "/admin"
    });

    response.cookies.set(ADMIN_SESSION_COOKIE, token, getAdminCookieOptions());

    await recordAdminAuditEvent({
      action: "auth.account_invite.accepted",
      accountId: result.account.id,
      actorUserId: result.user.id,
      actorLogin: result.user.login,
      actorRole: result.user.role,
      targetType: "account",
      targetId: result.account.id,
      ipAddress: clientIp,
      userAgent,
      metadata: {
        inviteId: result.invite.id,
        inviteTokenHash: hashRateLimitValue(payload.token),
        accountSlug: result.account.slug
      }
    });

    return response;
  } catch (error) {
    if (isRateLimitExceededError(error)) {
      const response = NextResponse.json({ error: error.message }, { status: 429 });
      response.headers.set("Retry-After", String(error.retryAfterSeconds));
      return response;
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao aceitar convite de empresa." },
      { status: 400 }
    );
  }
}
