import { NextResponse } from "next/server";
import { deleteLink, updateLink } from "@/lib/links";
import { isAdminSessionRequiredError, requireAdminSession } from "@/lib/admin-session";
import { parseLinkPayload } from "@/lib/validation";

type RouteContext = {
  params: {
    id: string;
  };
};

export async function PUT(request: Request, { params }: RouteContext) {
  try {
    const session = await requireAdminSession();
    const payload = parseLinkPayload(await request.json());
    const data = await updateLink(params.id, payload, session.account_id);
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao atualizar link." },
      { status: isAdminSessionRequiredError(error) ? 401 : 400 }
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const session = await requireAdminSession();
    await deleteLink(params.id, session.account_id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao excluir link." },
      { status: isAdminSessionRequiredError(error) ? 401 : 400 }
    );
  }
}
