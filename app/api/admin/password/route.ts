import { NextResponse } from "next/server";
import { updateAdminPassword } from "@/lib/admin-account";
import { parsePasswordUpdatePayload } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const payload = parsePasswordUpdatePayload(await request.json());
    const account = await updateAdminPassword(payload.currentPassword, payload.nextPassword);
    return NextResponse.json({ ok: true, account });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao atualizar senha." },
      { status: 400 }
    );
  }
}
