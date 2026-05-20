import { NextResponse } from "next/server";
import { updateAdminUserStatus } from "@/lib/admin-account";
import { parseAdminUserStatusPayload } from "@/lib/validation";

type RouteContext = {
  params: {
    id: string;
  };
};

export async function PUT(request: Request, { params }: RouteContext) {
  try {
    const payload = parseAdminUserStatusPayload(await request.json());
    const data = await updateAdminUserStatus(params.id, payload.status);
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao atualizar usuario." },
      { status: 400 }
    );
  }
}
