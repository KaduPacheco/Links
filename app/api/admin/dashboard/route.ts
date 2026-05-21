import { NextResponse } from "next/server";
import { isAdminSessionRequiredError, requireAdminSession } from "@/lib/admin-session";
import { getTenantDashboard } from "@/lib/tenant-dashboard";

export async function GET() {
  try {
    const session = await requireAdminSession();
    const data = await getTenantDashboard(session.account_id);
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: isAdminSessionRequiredError(error) ? error.message : "Erro ao carregar dashboard." },
      { status: isAdminSessionRequiredError(error) ? 401 : 400 }
    );
  }
}
