import { NextResponse } from "next/server";
import { recordAdminAuditEvent } from "@/lib/admin-audit";
import { isAdminSessionRequiredError, requireAdminSession } from "@/lib/admin-session";
import { createLink, getLinksWithAnalytics } from "@/lib/links";
import { getClientIp, getUserAgent } from "@/lib/request-context";
import { parseLinkPayload } from "@/lib/validation";

export async function GET() {
  try {
    const session = await requireAdminSession();
    const links = await getLinksWithAnalytics(true, session.account_id);
    return NextResponse.json({ data: links });
  } catch (error) {
    return NextResponse.json(
      { error: isAdminSessionRequiredError(error) ? error.message : "Erro ao carregar links." },
      { status: isAdminSessionRequiredError(error) ? 401 : 400 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAdminSession();
    const payload = parseLinkPayload(await request.json());
    const data = await createLink(payload, session.account_id);

    await recordAdminAuditEvent({
      action: "admin.link.created",
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
        isActive: data.is_active
      }
    });

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao criar link." },
      { status: isAdminSessionRequiredError(error) ? 401 : 400 }
    );
  }
}
