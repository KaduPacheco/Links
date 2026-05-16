import { NextResponse } from "next/server";
import { createLink, getLinksWithAnalytics } from "@/lib/links";
import { parseLinkPayload } from "@/lib/validation";

export async function GET() {
  const links = await getLinksWithAnalytics(true);
  return NextResponse.json({ data: links });
}

export async function POST(request: Request) {
  try {
    const payload = parseLinkPayload(await request.json());
    const data = await createLink(payload);
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao criar link." },
      { status: 400 }
    );
  }
}
