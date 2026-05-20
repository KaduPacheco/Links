import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { DEFAULT_ACCOUNT_ID } from "@/lib/accounts";
import { updateAdminPassword } from "@/lib/admin-account";
import { ADMIN_SESSION_COOKIE, verifySessionToken } from "@/lib/auth";
import { parsePasswordUpdatePayload } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const session = await verifySessionToken(cookies().get(ADMIN_SESSION_COOKIE)?.value ?? null);
    const payload = parsePasswordUpdatePayload(await request.json());
    const account = await updateAdminPassword(
      payload.currentPassword,
      payload.nextPassword,
      session?.user_id,
      session?.account_id ?? DEFAULT_ACCOUNT_ID
    );
    return NextResponse.json({ ok: true, account });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao atualizar senha." },
      { status: 400 }
    );
  }
}
