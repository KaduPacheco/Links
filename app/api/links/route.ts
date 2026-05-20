import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createLink, getLinksWithAnalytics } from "@/lib/links";
import { DEFAULT_ACCOUNT_ID } from "@/lib/accounts";
import { ADMIN_SESSION_COOKIE, verifySessionToken } from "@/lib/auth";
import { parseLinkPayload } from "@/lib/validation";

async function getSessionAccountId() {
  const session = await verifySessionToken(cookies().get(ADMIN_SESSION_COOKIE)?.value ?? null);
  return session?.account_id ?? DEFAULT_ACCOUNT_ID;
}

export async function GET() {
  const links = await getLinksWithAnalytics(true, await getSessionAccountId());
  return NextResponse.json({ data: links });
}

export async function POST(request: Request) {
  try {
    const payload = parseLinkPayload(await request.json());
    const data = await createLink(payload, await getSessionAccountId());
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao criar link." },
      { status: 400 }
    );
  }
}
