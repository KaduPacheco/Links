import { NextResponse } from "next/server";
import { getAdminAccountInfo } from "@/lib/admin-account";
import { getSiteSettings, updateSiteSettings } from "@/lib/site-settings";
import { parseSiteSettingsPayload } from "@/lib/validation";

export async function GET() {
  const [data, account] = await Promise.all([getSiteSettings(), getAdminAccountInfo()]);
  return NextResponse.json({ data, account });
}

export async function PUT(request: Request) {
  try {
    const payload = parseSiteSettingsPayload(await request.json());
    const data = await updateSiteSettings(payload);
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao salvar configuracoes." },
      { status: 400 }
    );
  }
}
