import { NextResponse } from "next/server";
import { recordAdminAuditEvent } from "@/lib/admin-audit";
import { isAdminSessionRequiredError, requireAdminSession } from "@/lib/admin-session";
import { deleteLink, updateLink } from "@/lib/links";
import { getClientIp, getUserAgent } from "@/lib/request-context";
import { parseLinkPayload } from "@/lib/validation";

type RouteContext = {
  params: {
    id: string;
  };
};

export async function PUT(request: Request, { params }: RouteContext) {
  try {
    const session = await requireAdminSession();
    const payload = parseLinkPayload(await request.json());
    const data = await updateLink(params.id, payload, session.account_id);

    await recordAdminAuditEvent({
      action: "admin.link.updated",
      accountId: session.account_id,
      actorUserId: session.user_id,
      actorLogin: session.login,
      actorRole: session.role,
      targetType: "link",
      targetId: data.id,
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      metadata: {
        title: data.title,
        url: data.url,
        category: data.category,
        isActive: data.is_active,
        displayOrder: data.display_order
      }
    });

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao atualizar link." },
      { status: isAdminSessionRequiredError(error) ? 401 : 400 }
    );
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  try {
    const session = await requireAdminSession();
    await deleteLink(params.id, session.account_id);

    await recordAdminAuditEvent({
      action: "admin.link.deleted",
      accountId: session.account_id,
      actorUserId: session.user_id,
      actorLogin: session.login,
      actorRole: session.role,
      targetType: "link",
      targetId: params.id,
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request)
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao excluir link." },
      { status: isAdminSessionRequiredError(error) ? 401 : 400 }
    );
  }
}
