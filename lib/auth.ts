const encoder = new TextEncoder();

export const ADMIN_SESSION_COOKIE = "pe_admin_session";
export const ADMIN_LOGIN_PATH = "/admin/login";

const SESSION_TTL_SECONDS = 60 * 60 * 12;

type AdminSessionPayload = {
  sub: "admin";
  login: string;
  exp: number;
};

function getAdminLogin() {
  return process.env.ADMIN_EMAIL?.trim() || process.env.ADMIN_USERNAME?.trim() || null;
}

function getAdminPassword() {
  return process.env.ADMIN_PASSWORD?.trim() || null;
}

function getSessionSecret() {
  return process.env.AUTH_SESSION_SECRET?.trim() || process.env.SESSION_SECRET?.trim() || null;
}

export function isAdminAuthConfigured() {
  return Boolean(getAdminLogin() && getAdminPassword() && getSessionSecret());
}

export function getAdminAuthConfigError() {
  const missing = [
    !getAdminLogin() ? "ADMIN_EMAIL ou ADMIN_USERNAME" : null,
    !getAdminPassword() ? "ADMIN_PASSWORD" : null,
    !getSessionSecret() ? "AUTH_SESSION_SECRET ou SESSION_SECRET" : null
  ].filter(Boolean);

  return missing.length ? `Auth admin incompleta. Defina: ${missing.join(", ")}.` : null;
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

export async function createSessionToken() {
  const login = getAdminLogin();
  const secret = getSessionSecret();

  if (!login || !secret) {
    throw new Error(getAdminAuthConfigError() ?? "Auth admin não configurada.");
  }

  const encodedHeader = encodeJson({ alg: "HS256", typ: "JWT" });
  const encodedPayload = encodeJson({
    sub: "admin",
    login,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS
  } satisfies AdminSessionPayload);
  const unsigned = `${encodedHeader}.${encodedPayload}`;
  const signature = await createSignature(unsigned, secret);

  return `${unsigned}.${signature}`;
}

export async function validateAdminCredentials(login: string, password: string) {
  const expectedLogin = getAdminLogin();
  const expectedPassword = getAdminPassword();

  if (!expectedLogin || !expectedPassword) {
    return false;
  }

  return login === expectedLogin && password === expectedPassword;
}

export function getAdminCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS
  };
}

export function sanitizeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/admin";
  }

  return value;
}
