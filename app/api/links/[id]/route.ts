import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { deleteLink, updateLink } from "@/lib/links";
import { DEFAULT_ACCOUNT_ID } from "@/lib/accounts";
import { ADMIN_SESSION_COOKIE, verifySessionToken } from "@/lib/auth";
import { parseLinkPayload } from "@/lib/validation";

type RouteContext = {
  params: {
    id: string;
  };
};

async function getSessionAccountId() {
  const session = await verifySessionToken(cookies().get(ADMIN_SESSION_COOKIE)?.value ?? null);
  return session?.account_id ?? DEFAULT_ACCOUNT_ID;
}

export async function PUT(request: Request, { params }: RouteContext) {
  try {
    const payload = parseLinkPayload(await request.json());
    const data = await updateLink(params.id, payload, await getSessionAccountId());
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao atualizar link." },
      { status: 400 }
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    await deleteLink(params.id, await getSessionAccountId());
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao excluir link." },
      { status: 400 }
    );
  }
}
