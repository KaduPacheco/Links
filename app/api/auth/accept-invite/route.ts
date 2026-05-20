import { NextResponse } from "next/server";
import { acceptAdminInvite } from "@/lib/admin-account";
import { parseInviteAcceptancePayload } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const payload = parseInviteAcceptancePayload(await request.json());
    const user = await acceptAdminInvite(payload.token, payload.password);
    return NextResponse.json({ ok: true, user });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao aceitar convite." },
      { status: 400 }
    );
  }
}
