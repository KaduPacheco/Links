import { NextResponse } from "next/server";
import { recordAdminAuditEvent } from "@/lib/admin-audit";
import { getAdminAccountInfo } from "@/lib/admin-account";
import { isAdminSessionRequiredError, requireAdminSession } from "@/lib/admin-session";
import { getClientIp, getUserAgent } from "@/lib/request-context";
import { getSiteSettingsForAccount, updateSiteSettings } from "@/lib/site-settings";
import { parseSiteSettingsPayload } from "@/lib/validation";

export async function GET() {
  try {
    const session = await requireAdminSession();
    const [data, account] = await Promise.all([
      getSiteSettingsForAccount(session.account_id),
      getAdminAccountInfo(session.user_id, session.account_id)
    ]);
    return NextResponse.json({ data, account });
  } catch (error) {
    return NextResponse.json(
      { error: isAdminSessionRequiredError(error) ? error.message : "Erro ao carregar configurações." },
      { status: isAdminSessionRequiredError(error) ? 401 : 400 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await requireAdminSession();
    const payload = parseSiteSettingsPayload(await request.json());
    const data = await updateSiteSettings(payload, session.account_id);

    await recordAdminAuditEvent({
      action: "admin.settings.updated",
      accountId: session.account_id,
      actorUserId: session.user_id,
      actorLogin: session.login,
      actorRole: session.role,
      targetType: "site_settings",
      targetId: session.account_id,
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      metadata: {
        companyName: data.company_name,
        brandLabel: data.brand_label
      }
    });

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao salvar configurações." },
      { status: isAdminSessionRequiredError(error) ? 401 : 400 }
    );
  }
}
