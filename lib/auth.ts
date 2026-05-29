const encoder = new TextEncoder();

export const ADMIN_SESSION_COOKIE = "pe_admin_session";
export const ADMIN_LOGIN_PATH = "/admin/login";

const DEFAULT_SESSION_TTL_SECONDS = 60 * 60 * 12;
const DEFAULT_IDLE_TIMEOUT_MINUTES = 30;

export type AdminSessionPayload = {
  sub: "admin";
  user_id: string;
  account_id: string;
  login: string;
  role: string;
  session_id?: string;
  iat: number;
  exp: number;
};

function getSessionSecret() {
  return process.env.AUTH_SESSION_SECRET?.trim() || process.env.SESSION_SECRET?.trim() || null;
}

export function getAdminSessionTtlSeconds() {
  const rawValue = process.env.AUTH_SESSION_TTL_HOURS?.trim();

  if (!rawValue) {
    return DEFAULT_SESSION_TTL_SECONDS;
  }

  const ttlHours = Number(rawValue);

  if (!Number.isFinite(ttlHours) || ttlHours <= 0) {
    return DEFAULT_SESSION_TTL_SECONDS;
  }

  return Math.floor(ttlHours * 60 * 60);
}

export function getAdminIdleTimeoutMinutes() {
  const rawValue = process.env.AUTH_IDLE_TIMEOUT_MINUTES?.trim();

  if (!rawValue) {
    return DEFAULT_IDLE_TIMEOUT_MINUTES;
  }

  const idleTimeoutMinutes = Number(rawValue);

  if (!Number.isFinite(idleTimeoutMinutes) || idleTimeoutMinutes <= 0) {
    return DEFAULT_IDLE_TIMEOUT_MINUTES;
  }

  return idleTimeoutMinutes;
}

function toBase64Url(value: string) {
  return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (normalized.length % 4 || 4)) % 4);
  return atob(normalized + padding);
}

function encodeJson(value: Record<string, unknown>) {
  return toBase64Url(JSON.stringify(value));
}

function decodePayload<T>(value: string) {
  return JSON.parse(fromBase64Url(value)) as T;
}

async function importSigningKey(secret: string) {
  return crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify"
  ]);
}

async function createSignature(value: string, secret: string) {
  const key = await importSigningKey(secret);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  const raw = Array.from(new Uint8Array(signature), (byte) => String.fromCharCode(byte)).join("");
  return toBase64Url(raw);
}

export async function verifySessionToken(token: string | null) {
  const secret = getSessionSecret();

  if (!token || !secret) {
    return null;
  }

  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }

  try {
    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const unsigned = `${encodedHeader}.${encodedPayload}`;
    const expectedSignature = await createSignature(unsigned, secret);

    if (encodedSignature !== expectedSignature) {
      return null;
    }

    const payload = decodePayload<AdminSessionPayload>(encodedPayload);
    if (payload.sub !== "admin" || payload.exp <= Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export async function createSessionToken(
  login: string,
  userId = "admin",
  role = "owner",
  accountId = "00000000-0000-0000-0000-000000000001",
  sessionId?: string
) {
  const secret = getSessionSecret();
  const sessionTtlSeconds = getAdminSessionTtlSeconds();

  if (!login || !secret) {
    throw new Error("Autenticação administrativa não configurada.");
  }

  const issuedAt = Math.floor(Date.now() / 1000);
  const encodedHeader = encodeJson({ alg: "HS256", typ: "JWT" });
  const encodedPayload = encodeJson({
    sub: "admin",
    user_id: userId,
    account_id: accountId,
    login,
    role,
    session_id: sessionId,
    iat: issuedAt,
    exp: issuedAt + sessionTtlSeconds
  } satisfies AdminSessionPayload);
  const unsigned = `${encodedHeader}.${encodedPayload}`;
  const signature = await createSignature(unsigned, secret);

  return `${unsigned}.${signature}`;
}

export function getAdminCookieOptions() {
  const maxAge = getAdminSessionTtlSeconds();

  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge
  };
}

export function sanitizeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/admin";
  }

  return value;
}
