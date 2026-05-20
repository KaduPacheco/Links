import { categories, type LinkPayload } from "@/types/link";
import { isWhatsAppLink } from "@/lib/utils";
import { type SiteSettings } from "@/types/site-settings";
import { adminRoles, type AdminRole } from "@/types/admin-user";

const internalPathPattern = /^\/[A-Za-z0-9\-_/]*$/;

export function isValidLinkUrl(url: string) {
  if (internalPathPattern.test(url)) {
    return true;
  }

  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

export function parseLinkPayload(input: unknown): LinkPayload {
  if (!input || typeof input !== "object") {
    throw new Error("Payload inválido.");
  }

  const payload = input as Partial<LinkPayload>;
  const title = String(payload.title ?? "").trim();
  const url = String(payload.url ?? "").trim();
  const category = String(payload.category ?? "").trim();
  const displayOrder = Number(payload.display_order ?? 0);
  const leadMessage = payload.lead_message ? String(payload.lead_message).trim() : null;

  if (title.length < 2) {
    throw new Error("Informe um título com pelo menos 2 caracteres.");
  }

  if (!isValidLinkUrl(url)) {
    throw new Error("Informe uma URL http(s) válida ou um caminho interno iniciado por /.");
  }

  if (!categories.includes(category as LinkPayload["category"])) {
    throw new Error("Categoria inválida.");
  }

  if (!Number.isFinite(displayOrder) || displayOrder < 0) {
    throw new Error("A ordem deve ser um número maior ou igual a zero.");
  }

  return {
    title,
    url,
    description: payload.description ? String(payload.description).trim() : null,
    icon: payload.icon ? String(payload.icon).trim() : "ExternalLink",
    category: category as LinkPayload["category"],
    lead_message: isWhatsAppLink(url) ? leadMessage : null,
    is_active: Boolean(payload.is_active),
    display_order: displayOrder
  };
}

export function parseSiteSettingsPayload(input: unknown): SiteSettings {
  if (!input || typeof input !== "object") {
    throw new Error("Payload invalido.");
  }

  const payload = input as Partial<SiteSettings>;
  const companyName = String(payload.company_name ?? "").trim();
  const brandLabel = String(payload.brand_label ?? "").trim();
  const heroBadge = String(payload.hero_badge ?? "").trim();
  const heroDescription = String(payload.hero_description ?? "").trim();
  const linksHeading = String(payload.links_heading ?? "").trim();
  const linksDescription = String(payload.links_description ?? "").trim();
  const companyLogoUrl = payload.company_logo_url ? String(payload.company_logo_url).trim() : null;

  if (companyName.length < 2) {
    throw new Error("Informe o nome da empresa com pelo menos 2 caracteres.");
  }

  if (brandLabel.length < 2) {
    throw new Error("Informe o rotulo da marca com pelo menos 2 caracteres.");
  }

  if (heroBadge.length < 4) {
    throw new Error("Informe a frase de destaque com pelo menos 4 caracteres.");
  }

  if (heroDescription.length < 8) {
    throw new Error("Informe a descricao principal com pelo menos 8 caracteres.");
  }

  if (linksHeading.length < 2) {
    throw new Error("Informe o titulo da secao de links.");
  }

  if (linksDescription.length < 8) {
    throw new Error("Informe a descricao da secao de links com pelo menos 8 caracteres.");
  }

  if (companyLogoUrl && !isValidLinkUrl(companyLogoUrl)) {
    throw new Error("Informe uma URL http(s) valida ou um caminho interno iniciado por / para a logo.");
  }

  return {
    company_name: companyName,
    brand_label: brandLabel,
    company_logo_url: companyLogoUrl,
    hero_badge: heroBadge,
    hero_description: heroDescription,
    links_heading: linksHeading,
    links_description: linksDescription
  };
}

export function parsePasswordUpdatePayload(input: unknown) {
  if (!input || typeof input !== "object") {
    throw new Error("Payload invalido.");
  }

  const payload = input as Record<string, unknown>;
  const currentPassword = String(payload.currentPassword ?? "");
  const nextPassword = String(payload.nextPassword ?? "");
  const confirmPassword = String(payload.confirmPassword ?? "");

  if (currentPassword.length < 1) {
    throw new Error("Informe a senha atual.");
  }

  if (nextPassword.length < 8) {
    throw new Error("A nova senha deve ter pelo menos 8 caracteres.");
  }

  if (nextPassword !== confirmPassword) {
    throw new Error("A confirmacao da nova senha nao confere.");
  }

  return {
    currentPassword,
    nextPassword
  };
}

export function parseAdminInvitePayload(input: unknown) {
  if (!input || typeof input !== "object") {
    throw new Error("Payload invalido.");
  }

  const payload = input as Record<string, unknown>;
  const name = String(payload.name ?? "").trim();
  const login = String(payload.login ?? "").trim().toLowerCase();
  const role = String(payload.role ?? "editor").trim();

  if (name.length < 2) {
    throw new Error("Informe o nome com pelo menos 2 caracteres.");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(login)) {
    throw new Error("Informe um e-mail valido para o convite.");
  }

  if (!adminRoles.includes(role as AdminRole)) {
    throw new Error("Perfil de usuario invalido.");
  }

  return {
    name,
    login,
    role: role as AdminRole
  };
}

export function parseAccountSignupPayload(input: unknown) {
  if (!input || typeof input !== "object") {
    throw new Error("Payload invalido.");
  }

  const payload = input as Record<string, unknown>;
  const companyName = String(payload.companyName ?? "").trim();
  const ownerName = String(payload.ownerName ?? "").trim();
  const login = String(payload.login ?? "").trim().toLowerCase();
  const password = String(payload.password ?? "");
  const confirmPassword = String(payload.confirmPassword ?? "");

  if (companyName.length < 2) {
    throw new Error("Informe o nome da empresa com pelo menos 2 caracteres.");
  }

  if (ownerName.length < 2) {
    throw new Error("Informe seu nome com pelo menos 2 caracteres.");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(login)) {
    throw new Error("Informe um e-mail valido.");
  }

  if (password.length < 8) {
    throw new Error("A senha deve ter pelo menos 8 caracteres.");
  }

  if (password !== confirmPassword) {
    throw new Error("A confirmacao da senha nao confere.");
  }

  return {
    companyName,
    ownerName,
    login,
    password
  };
}

export function parseInviteAcceptancePayload(input: unknown) {
  if (!input || typeof input !== "object") {
    throw new Error("Payload invalido.");
  }

  const payload = input as Record<string, unknown>;
  const token = String(payload.token ?? "").trim();
  const password = String(payload.password ?? "");
  const confirmPassword = String(payload.confirmPassword ?? "");

  if (token.length < 20) {
    throw new Error("Convite invalido.");
  }

  if (password.length < 8) {
    throw new Error("A senha deve ter pelo menos 8 caracteres.");
  }

  if (password !== confirmPassword) {
    throw new Error("A confirmacao da senha nao confere.");
  }

  return {
    token,
    password
  };
}

export function parseAdminUserStatusPayload(input: unknown) {
  if (!input || typeof input !== "object") {
    throw new Error("Payload invalido.");
  }

  const payload = input as Record<string, unknown>;
  const status = String(payload.status ?? "").trim();

  if (!["active", "inactive"].includes(status)) {
    throw new Error("Status de usuario invalido.");
  }

  return {
    status: status as "active" | "inactive"
  };
}
