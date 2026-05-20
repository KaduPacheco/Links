import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_LOGIN_PATH, ADMIN_SESSION_COOKIE, sanitizeNextPath, verifySessionToken } from "@/lib/auth";

function buildLoginUrl(request: NextRequest) {
  const loginUrl = new URL(ADMIN_LOGIN_PATH, request.url);
  loginUrl.searchParams.set("next", sanitizeNextPath(request.nextUrl.pathname + request.nextUrl.search));
  return loginUrl;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await verifySessionToken(request.cookies.get(ADMIN_SESSION_COOKIE)?.value ?? null);
  const isAdminRoute = pathname.startsWith("/admin");
  const isLoginRoute = pathname === ADMIN_LOGIN_PATH;
  const isProtectedApi = pathname.startsWith("/api/links") || pathname.startsWith("/api/admin");

  if (isAdminRoute && isLoginRoute && session) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  if (isAdminRoute && !isLoginRoute && !session) {
    return NextResponse.redirect(buildLoginUrl(request));
  }

  if (isProtectedApi && !session) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/links/:path*", "/api/admin/:path*"]
};
