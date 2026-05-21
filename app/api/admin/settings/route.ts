import { NextResponse } from "next/server";
import { getAdminAccountInfo } from "@/lib/admin-account";
import { isAdminSessionRequiredError, requireAdminSession } from "@/lib/admin-session";
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
      { error: isAdminSessionRequiredError(error) ? error.message : "Erro ao carregar configuracoes." },
      { status: isAdminSessionRequiredError(error) ? 401 : 400 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await requireAdminSession();
    const payload = parseSiteSettingsPayload(await request.json());
    const data = await updateSiteSettings(payload, session.account_id);
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao salvar configuracoes." },
      { status: isAdminSessionRequiredError(error) ? 401 : 400 }
    );
  }
}
