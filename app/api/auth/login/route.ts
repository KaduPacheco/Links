import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  createSessionToken,
  getAdminAuthConfigError,
  getAdminCookieOptions,
  isAdminAuthConfigured,
  sanitizeNextPath,
  validateAdminCredentials
} from "@/lib/auth";

type LoginRequest = {
  login?: string;
  password?: string;
  next?: string | null;
};

export async function POST(request: Request) {
  if (!isAdminAuthConfigured()) {
    return NextResponse.json({ error: getAdminAuthConfigError() ?? "Auth admin não configurada." }, { status: 503 });
  }

  const body = (await request.json()) as LoginRequest;
  const login = String(body.login ?? "").trim();
  const password = String(body.password ?? "");

  if (!(await validateAdminCredentials(login, password))) {
    return NextResponse.json({ error: "Credenciais inválidas." }, { status: 401 });
  }

  const token = await createSessionToken();
  const next = sanitizeNextPath(body.next ?? null);
  const response = NextResponse.json({ ok: true, next });
  response.cookies.set(ADMIN_SESSION_COOKIE, token, getAdminCookieOptions());
  return response;
}
