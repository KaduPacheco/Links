import { NextResponse } from "next/server";
import { recordAdminAuditEvent } from "@/lib/admin-audit";
import { countActiveOwners, getAdminUserById, updateAdminUserStatus } from "@/lib/admin-account";
import { isAdminSessionRequiredError, requireAdminSession, revokeAdminSessionsForUser } from "@/lib/admin-session";
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

    if (session.role === "editor") {
      return NextResponse.json({ error: "Editores não podem alterar o status de usuários." }, { status: 403 });
    }

    await consumeRateLimit(ADMIN_USER_STATUS_ACTOR_RATE_LIMIT, session.user_id);

    const payload = parseAdminUserStatusPayload(await request.json());
    const targetUser = await getAdminUserById(params.id, session.account_id);

    if (!targetUser) {
      return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    }

    if (payload.status === "inactive" && targetUser.id === session.user_id) {
      return NextResponse.json({ error: "Não é permitido inativar a própria sessão por esta rota." }, { status: 400 });
    }

    if (targetUser.role === "owner" && session.role !== "owner") {
      return NextResponse.json({ error: "Apenas o dono pode alterar o status de outro dono." }, { status: 403 });
    }

    if (targetUser.role === "owner" && payload.status === "inactive") {
      const activeOwners = await countActiveOwners(session.account_id);

      if (targetUser.status === "active" && activeOwners <= 1) {
        return NextResponse.json({ error: "A conta precisa manter pelo menos um dono ativo." }, { status: 400 });
      }
    }

    const data = await updateAdminUserStatus(params.id, payload.status, session.account_id);
    await revokeAdminSessionsForUser(data.id, session.account_id);

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
      { error: error instanceof Error ? error.message : "Erro ao atualizar usuário." },
      { status: isAdminSessionRequiredError(error) ? 401 : 400 }
    );
  }
}
