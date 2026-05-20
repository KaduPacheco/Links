import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { DEFAULT_ACCOUNT_ID } from "@/lib/accounts";
import { getAdminAccountInfo } from "@/lib/admin-account";
import { ADMIN_SESSION_COOKIE, verifySessionToken } from "@/lib/auth";
import { getSiteSettingsForAccount, updateSiteSettings } from "@/lib/site-settings";
import { parseSiteSettingsPayload } from "@/lib/validation";

async function getSessionAccountId() {
  const session = await verifySessionToken(cookies().get(ADMIN_SESSION_COOKIE)?.value ?? null);
  return session?.account_id ?? DEFAULT_ACCOUNT_ID;
}

export async function GET() {
  const session = await verifySessionToken(cookies().get(ADMIN_SESSION_COOKIE)?.value ?? null);
  const accountId = session?.account_id ?? DEFAULT_ACCOUNT_ID;
  const [data, account] = await Promise.all([
    getSiteSettingsForAccount(accountId),
    getAdminAccountInfo(session?.user_id, accountId)
  ]);
  return NextResponse.json({ data, account });
}

export async function PUT(request: Request) {
  try {
    const payload = parseSiteSettingsPayload(await request.json());
    const data = await updateSiteSettings(payload, await getSessionAccountId());
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao salvar configuracoes." },
      { status: 400 }
    );
  }
}
