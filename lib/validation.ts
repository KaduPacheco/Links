import { categories, type LinkPayload } from "@/types/link";
import { isWhatsAppLink } from "@/lib/utils";

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
