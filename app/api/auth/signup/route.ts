import { NextResponse } from "next/server";
import { recordAdminAuditEvent } from "@/lib/admin-audit";
import { createAccountWithOwner } from "@/lib/admin-account";
import { ADMIN_SESSION_COOKIE, createSessionToken, getAdminCookieOptions } from "@/lib/auth";
import { getClientIp, getUserAgent } from "@/lib/request-context";
import { consumeRateLimit, isRateLimitExceededError } from "@/lib/rate-limit";
import { ACCOUNT_SIGNUP_IP_RATE_LIMIT } from "@/lib/security-policies";
import { parseAccountSignupPayload } from "@/lib/validation";

export async function POST(request: Request) {
  const clientIp = getClientIp(request) ?? "unknown";
  const userAgent = getUserAgent(request);

  try {
    await consumeRateLimit(ACCOUNT_SIGNUP_IP_RATE_LIMIT, clientIp);
  } catch (error) {
    const response = NextResponse.json(
      { error: error instanceof Error ? error.message : "Muitas tentativas de cadastro." },
      { status: 429 }
    );

    if (isRateLimitExceededError(error)) {
      response.headers.set("Retry-After", String(error.retryAfterSeconds));
    }

    return response;
  }

  try {
    const payload = parseAccountSignupPayload(await request.json());
    const { account, user } = await createAccountWithOwner(payload);
    const token = await createSessionToken(user.login, user.id, user.role, user.account_id);
    const response = NextResponse.json({
      ok: true,
      account,
      user,
      next: "/admin"
    });

    response.cookies.set(ADMIN_SESSION_COOKIE, token, getAdminCookieOptions());

    await recordAdminAuditEvent({
      action: "auth.signup.succeeded",
      accountId: account.id,
      actorUserId: user.id,
      actorLogin: user.login,
      actorRole: user.role,
      targetType: "account",
      targetId: account.id,
      ipAddress: clientIp,
      userAgent,
      metadata: {
        accountSlug: account.slug
      }
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao criar a conta." },
      { status: 400 }
    );
  }
}
