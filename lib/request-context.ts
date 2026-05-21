import { createHash } from "node:crypto";

export function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || null;
  }

  return request.headers.get("x-real-ip")?.trim() || null;
}

export function getUserAgent(request: Request) {
  return request.headers.get("user-agent")?.trim() || null;
}

export function hashRateLimitValue(value: string) {
  return createHash("sha256").update(value).digest("hex");
}
