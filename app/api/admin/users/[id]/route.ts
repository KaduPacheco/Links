import { NextResponse } from "next/server";
import { updateAdminUserStatus } from "@/lib/admin-account";
import { isAdminSessionRequiredError, requireAdminSession } from "@/lib/admin-session";
import { parseAdminUserStatusPayload } from "@/lib/validation";

type RouteContext = {
  params: {
    id: string;
  };
};

export async function PUT(request: Request, { params }: RouteContext) {
  try {
    const session = await requireAdminSession();
    const payload = parseAdminUserStatusPayload(await request.json());
    const data = await updateAdminUserStatus(params.id, payload.status, session.account_id);
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao atualizar usuario." },
      { status: isAdminSessionRequiredError(error) ? 401 : 400 }
    );
  }
}
