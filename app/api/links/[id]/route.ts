import { NextResponse } from "next/server";
import { deleteLink, updateLink } from "@/lib/links";
import { parseLinkPayload } from "@/lib/validation";

type RouteContext = {
  params: {
    id: string;
  };
};

export async function PUT(request: Request, { params }: RouteContext) {
  try {
    const payload = parseLinkPayload(await request.json());
    const data = await updateLink(params.id, payload);
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
    await deleteLink(params.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao excluir link." },
      { status: 400 }
    );
  }
}
