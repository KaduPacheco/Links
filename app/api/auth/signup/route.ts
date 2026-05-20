import { NextResponse } from "next/server";
import { createAccountWithOwner } from "@/lib/admin-account";
import { ADMIN_SESSION_COOKIE, createSessionToken, getAdminCookieOptions } from "@/lib/auth";
import { parseAccountSignupPayload } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const payload = parseAccountSignupPayload(await request.json());
    const { account, user } = await createAccountWithOwner(payload);
    const token = await createSessionToken(user.login, user.id, user.role, user.account_id);
    const response = NextResponse.json({
      ok: true,
      account,
      user,
      next: "/admin"
    });

    response.cookies.set(ADMIN_SESSION_COOKIE, token, getAdminCookieOptions());

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao criar a conta." },
      { status: 400 }
    );
  }
}
