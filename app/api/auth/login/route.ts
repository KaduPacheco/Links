import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, createSessionToken, getAdminCookieOptions, sanitizeNextPath } from "@/lib/auth";
import { getAdminAuthConfigError, isAdminAuthConfigured, validateAdminCredentials } from "@/lib/admin-account";

type LoginRequest = {
  login?: string;
  password?: string;
  next?: string | null;
};

export async function POST(request: Request) {
  if (!(await isAdminAuthConfigured())) {
    return NextResponse.json({ error: (await getAdminAuthConfigError()) ?? "Auth admin nao configurada." }, { status: 503 });
  }

  const body = (await request.json()) as LoginRequest;
  const login = String(body.login ?? "").trim();
  const password = String(body.password ?? "");
  const credentials = await validateAdminCredentials(login, password);

  if (!credentials.valid || !credentials.login) {
    return NextResponse.json({ error: "Credenciais invalidas." }, { status: 401 });
  }

  const token = await createSessionToken(
    credentials.login,
    credentials.userId ?? "admin",
    credentials.role ?? "owner",
    credentials.accountId ?? undefined
  );
  const next = sanitizeNextPath(body.next ?? null);
  const response = NextResponse.json({ ok: true, next });
  response.cookies.set(ADMIN_SESSION_COOKIE, token, getAdminCookieOptions());
  return response;
}
