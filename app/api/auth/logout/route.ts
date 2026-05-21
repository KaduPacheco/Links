import { NextResponse } from "next/server";
import { recordAdminAuditEvent } from "@/lib/admin-audit";
import { readAdminSession } from "@/lib/admin-session";
import { ADMIN_SESSION_COOKIE, getAdminCookieOptions } from "@/lib/auth";
import { getClientIp, getUserAgent } from "@/lib/request-context";

export async function POST(request: Request) {
  const session = await readAdminSession();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, "", {
    ...getAdminCookieOptions(),
    maxAge: 0
  });

  if (session) {
    await recordAdminAuditEvent({
      action: "auth.logout",
      accountId: session.account_id,
      actorUserId: session.user_id,
      actorLogin: session.login,
      actorRole: session.role,
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request)
    });
  }

  return response;
}
