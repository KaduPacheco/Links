import { NextResponse } from "next/server";
import { updateAdminPassword } from "@/lib/admin-account";
import { isAdminSessionRequiredError, requireAdminSession } from "@/lib/admin-session";
import { parsePasswordUpdatePayload } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const session = await requireAdminSession();
    const payload = parsePasswordUpdatePayload(await request.json());
    const account = await updateAdminPassword(
      payload.currentPassword,
      payload.nextPassword,
      session.user_id,
      session.account_id
    );
    return NextResponse.json({ ok: true, account });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao atualizar senha." },
      { status: isAdminSessionRequiredError(error) ? 401 : 400 }
    );
  }
}
