import type { RateLimitPolicy } from "@/lib/rate-limit";

export const ADMIN_LOGIN_IP_RATE_LIMIT: RateLimitPolicy = {
  action: "auth.login.ip",
  maxAttempts: 10,
  windowSeconds: 15 * 60,
  blockSeconds: 15 * 60
};

export const ADMIN_LOGIN_LOGIN_RATE_LIMIT: RateLimitPolicy = {
  action: "auth.login.login",
  maxAttempts: 5,
  windowSeconds: 15 * 60,
  blockSeconds: 30 * 60
};

export const ACCOUNT_SIGNUP_IP_RATE_LIMIT: RateLimitPolicy = {
  action: "auth.signup.ip",
  maxAttempts: 5,
  windowSeconds: 60 * 60,
  blockSeconds: 30 * 60
};

export const INVITE_ACCEPT_IP_RATE_LIMIT: RateLimitPolicy = {
  action: "auth.invite-accept.ip",
  maxAttempts: 10,
  windowSeconds: 15 * 60,
  blockSeconds: 15 * 60
};

export const ADMIN_PASSWORD_IP_RATE_LIMIT: RateLimitPolicy = {
  action: "admin.password.ip",
  maxAttempts: 10,
  windowSeconds: 15 * 60,
  blockSeconds: 15 * 60
};

export const ADMIN_PASSWORD_USER_RATE_LIMIT: RateLimitPolicy = {
  action: "admin.password.user",
  maxAttempts: 5,
  windowSeconds: 15 * 60,
  blockSeconds: 15 * 60
};

export const ADMIN_USER_INVITE_ACTOR_RATE_LIMIT: RateLimitPolicy = {
  action: "admin.user-invite.actor",
  maxAttempts: 20,
  windowSeconds: 5 * 60,
  blockSeconds: 5 * 60
};

export const ACCOUNT_OWNER_INVITE_ACTOR_RATE_LIMIT: RateLimitPolicy = {
  action: "admin.account-invite.actor",
  maxAttempts: 10,
  windowSeconds: 10 * 60,
  blockSeconds: 10 * 60
};

export const ACCOUNT_OWNER_INVITE_ACCEPT_IP_RATE_LIMIT: RateLimitPolicy = {
  action: "auth.account-invite-accept.ip",
  maxAttempts: 10,
  windowSeconds: 15 * 60,
  blockSeconds: 15 * 60
};

export const ADMIN_USER_STATUS_ACTOR_RATE_LIMIT: RateLimitPolicy = {
  action: "admin.user-status.actor",
  maxAttempts: 20,
  windowSeconds: 5 * 60,
  blockSeconds: 5 * 60
};
