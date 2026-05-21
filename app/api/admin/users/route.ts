import { NextResponse } from "next/server";
import { createAdminInvite, listAdminUsers } from "@/lib/admin-account";
import { isAdminSessionRequiredError, requireAdminSession } from "@/lib/admin-session";
import { parseAdminInvitePayload } from "@/lib/validation";

export async function GET() {
  try {
    const session = await requireAdminSession();
    const data = await listAdminUsers(session.account_id);
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: isAdminSessionRequiredError(error) ? error.message : "Erro ao carregar usuarios." },
      { status: isAdminSessionRequiredError(error) ? 401 : 400 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAdminSession();

    if (session.role === "editor") {
      return NextResponse.json({ error: "Editores nao podem criar convites de acesso." }, { status: 403 });
    }

    const payload = parseAdminInvitePayload(await request.json());
    const data = await createAdminInvite(payload, session.account_id, new URL(request.url).origin);
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao convidar usuario." },
      { status: isAdminSessionRequiredError(error) ? 401 : 400 }
    );
  }
}
