import { NextResponse } from "next/server";
import { getLinksWithAnalytics, registerClick } from "@/lib/links";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const linkId = searchParams.get("linkId");

  if (!linkId) {
    return NextResponse.redirect(origin);
  }

  const links = await getLinksWithAnalytics(true);
  const link = links.find((item) => item.id === linkId && item.is_active);

  if (!link) {
    return NextResponse.redirect(origin);
  }

  await registerClick(
    link.id,
    request.headers.get("user-agent"),
    request.headers.get("referer")
  );

  const destination = link.url.startsWith("/") ? `${origin}${link.url}` : link.url;
  return NextResponse.redirect(destination);
}
