import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, type AdminSessionPayload, verifySessionToken } from "@/lib/auth";

export class AdminSessionRequiredError extends Error {
  constructor() {
    super("Sessao administrativa invalida ou expirada.");
    this.name = "AdminSessionRequiredError";
  }
}

export async function readAdminSession(): Promise<AdminSessionPayload | null> {
  return verifySessionToken(cookies().get(ADMIN_SESSION_COOKIE)?.value ?? null);
}

export async function requireAdminSession(): Promise<AdminSessionPayload> {
  const session = await readAdminSession();

  if (!session) {
    throw new AdminSessionRequiredError();
  }

  return session;
}

export function isAdminSessionRequiredError(error: unknown): error is AdminSessionRequiredError {
  return error instanceof AdminSessionRequiredError;
}
