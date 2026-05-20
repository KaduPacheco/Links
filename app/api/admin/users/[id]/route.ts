import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { updateAdminUserStatus } from "@/lib/admin-account";
import { DEFAULT_ACCOUNT_ID } from "@/lib/accounts";
import { ADMIN_SESSION_COOKIE, verifySessionToken } from "@/lib/auth";
import { parseAdminUserStatusPayload } from "@/lib/validation";

type RouteContext = {
  params: {
    id: string;
  };
};

export async function PUT(request: Request, { params }: RouteContext) {
  try {
    const session = await verifySessionToken(cookies().get(ADMIN_SESSION_COOKIE)?.value ?? null);
    const payload = parseAdminUserStatusPayload(await request.json());
    const data = await updateAdminUserStatus(params.id, payload.status, session?.account_id ?? DEFAULT_ACCOUNT_ID);
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao atualizar usuario." },
      { status: 400 }
    );
  }
}
