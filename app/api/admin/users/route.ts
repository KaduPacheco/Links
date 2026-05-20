import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminInvite, listAdminUsers } from "@/lib/admin-account";
import { ADMIN_SESSION_COOKIE, verifySessionToken } from "@/lib/auth";
import { parseAdminInvitePayload } from "@/lib/validation";

export async function GET() {
  const data = await listAdminUsers();
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  try {
    const session = await verifySessionToken(cookies().get(ADMIN_SESSION_COOKIE)?.value ?? null);

    if (session?.role === "editor") {
      return NextResponse.json({ error: "Editores nao podem criar convites de acesso." }, { status: 403 });
    }

    const payload = parseAdminInvitePayload(await request.json());
    const data = await createAdminInvite(payload, new URL(request.url).origin);
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao convidar usuario." },
      { status: 400 }
    );
  }
}
