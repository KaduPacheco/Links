import { NextResponse } from "next/server";
import { DEFAULT_ACCOUNT_ID, getAccountBySlug } from "@/lib/accounts";
import { getLinksWithAnalytics, registerClick } from "@/lib/links";
import { isWhatsAppLink } from "@/lib/utils";

function renderLeadMessage(template: string | null, linkTitle: string) {
  const fallback = `Olá! Vim pelo link "${linkTitle}" e gostaria de mais informações.`;
  const baseMessage = template?.trim() || fallback;

  return baseMessage
    .replaceAll("{{origem}}", linkTitle)
    .replaceAll("{{titulo}}", linkTitle)
    .replaceAll("{{link_titulo}}", linkTitle);
}

function buildDestination(rawUrl: string, origin: string, linkTitle: string, leadMessage: string | null) {
  const resolvedUrl = rawUrl.startsWith("/") ? new URL(rawUrl, origin) : new URL(rawUrl);

  if (isWhatsAppLink(resolvedUrl.toString())) {
    resolvedUrl.searchParams.set("text", renderLeadMessage(leadMessage, linkTitle));
  }

  return resolvedUrl.toString();
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const linkId = searchParams.get("linkId");
  const accountSlug = searchParams.get("account");

  if (!linkId) {
    return NextResponse.redirect(origin);
  }

  const account = accountSlug ? await getAccountBySlug(accountSlug) : null;
  if (accountSlug && !account) {
    return NextResponse.redirect(origin);
  }

  const accountId = account?.id ?? DEFAULT_ACCOUNT_ID;
  const links = await getLinksWithAnalytics(true, accountId);
  const link = links.find((item) => item.id === linkId && item.is_active);

  if (!link) {
    return NextResponse.redirect(origin);
  }

  await registerClick(link.id, request.headers.get("user-agent"), request.headers.get("referer"), accountId);

  const destination = buildDestination(link.url, origin, link.title, link.lead_message);
  return NextResponse.redirect(destination);
}
