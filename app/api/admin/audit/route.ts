import { NextResponse } from "next/server";
import { listAdminAuditEvents } from "@/lib/admin-audit";
import { isAdminSessionRequiredError, requireAdminSession } from "@/lib/admin-session";

export async function GET(request: Request) {
  try {
    const session = await requireAdminSession();

    if (session.role === "editor") {
      return NextResponse.json({ error: "Editores nao podem visualizar a auditoria." }, { status: 403 });
    }

    const url = new URL(request.url);
    const limit = Number(url.searchParams.get("limit") ?? 25);
    const before = url.searchParams.get("before");
    const page = await listAdminAuditEvents(session.account_id, limit, before);

    return NextResponse.json(page);
  } catch (error) {
    return NextResponse.json(
      { error: isAdminSessionRequiredError(error) ? error.message : "Erro ao carregar auditoria." },
      { status: isAdminSessionRequiredError(error) ? 401 : 400 }
    );
  }
}
