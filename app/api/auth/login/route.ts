import { NextResponse } from "next/server";
import { recordAdminAuditEvent } from "@/lib/admin-audit";
import { ADMIN_SESSION_COOKIE, getAdminCookieOptions, sanitizeNextPath } from "@/lib/auth";
import { getAdminAuthConfigError, isAdminAuthConfigured, validateAdminCredentials } from "@/lib/admin-account";
import { createAdminSession } from "@/lib/admin-session";
import { getClientIp, getUserAgent } from "@/lib/request-context";
import { consumeRateLimit, isRateLimitExceededError, resetRateLimit } from "@/lib/rate-limit";
import { ADMIN_LOGIN_IP_RATE_LIMIT, ADMIN_LOGIN_LOGIN_RATE_LIMIT } from "@/lib/security-policies";

type LoginRequest = {
  login?: string;
  password?: string;
  next?: string | null;
};

function buildRateLimitResponse(error: Error) {
  const response = NextResponse.json({ error: error.message }, { status: 429 });

  if (isRateLimitExceededError(error)) {
    response.headers.set("Retry-After", String(error.retryAfterSeconds));
  }

  return response;
}

export async function POST(request: Request) {
  if (!(await isAdminAuthConfigured())) {
    return NextResponse.json({ error: (await getAdminAuthConfigError()) ?? "Auth admin nao configurada." }, { status: 503 });
  }

  const body = (await request.json()) as LoginRequest;
  const login = String(body.login ?? "").trim();
  const password = String(body.password ?? "");
  const clientIp = getClientIp(request) ?? "unknown";
  const userAgent = getUserAgent(request);

  try {
    await consumeRateLimit(ADMIN_LOGIN_IP_RATE_LIMIT, clientIp);

    if (login) {
      await consumeRateLimit(ADMIN_LOGIN_LOGIN_RATE_LIMIT, login);
    }
  } catch (error) {
    await recordAdminAuditEvent({
      action: "auth.login.rate_limited",
      actorLogin: login || null,
      ipAddress: clientIp,
      userAgent,
      metadata: {
        next: sanitizeNextPath(body.next ?? null)
      }
    });

    return buildRateLimitResponse(error instanceof Error ? error : new Error("Muitas tentativas."));
  }

  const credentials = await validateAdminCredentials(login, password);

  if (!credentials.valid || !credentials.login) {
    await recordAdminAuditEvent({
      action: "auth.login.failed",
      actorLogin: login || null,
      ipAddress: clientIp,
      userAgent
    });

    return NextResponse.json({ error: "Credenciais invalidas." }, { status: 401 });
  }

  await resetRateLimit(ADMIN_LOGIN_IP_RATE_LIMIT.action, clientIp);
  await resetRateLimit(ADMIN_LOGIN_LOGIN_RATE_LIMIT.action, credentials.login);

  const { token } = await createAdminSession({
    login: credentials.login,
    userId: credentials.userId ?? "admin",
    role: credentials.role ?? "owner",
    accountId: credentials.accountId ?? "00000000-0000-0000-0000-000000000001"
  });
  const next = sanitizeNextPath(body.next ?? null);
  const response = NextResponse.json({ ok: true, next });
  response.cookies.set(ADMIN_SESSION_COOKIE, token, getAdminCookieOptions());

  await recordAdminAuditEvent({
    action: "auth.login.succeeded",
    accountId: credentials.accountId ?? null,
    actorUserId: credentials.userId ?? null,
    actorLogin: credentials.login,
    actorRole: credentials.role ?? null,
    ipAddress: clientIp,
    userAgent,
    metadata: {
      next
    }
  });

  return response;
}
