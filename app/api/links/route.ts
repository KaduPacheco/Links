import { NextResponse } from "next/server";
import { createLink, getLinksWithAnalytics } from "@/lib/links";
import { isAdminSessionRequiredError, requireAdminSession } from "@/lib/admin-session";
import { parseLinkPayload } from "@/lib/validation";

export async function GET() {
  try {
    const session = await requireAdminSession();
    const links = await getLinksWithAnalytics(true, session.account_id);
    return NextResponse.json({ data: links });
  } catch (error) {
    return NextResponse.json(
      { error: isAdminSessionRequiredError(error) ? error.message : "Erro ao carregar links." },
      { status: isAdminSessionRequiredError(error) ? 401 : 400 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAdminSession();
    const payload = parseLinkPayload(await request.json());
    const data = await createLink(payload, session.account_id);
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao criar link." },
      { status: isAdminSessionRequiredError(error) ? 401 : 400 }
    );
  }
}
