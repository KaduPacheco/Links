import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isWhatsAppLink(value: string) {
  try {
    const url = value.startsWith("/") ? null : new URL(value);
    if (!url) {
      return false;
    }

    return ["wa.me", "api.whatsapp.com", "www.whatsapp.com", "whatsapp.com"].includes(url.hostname);
  } catch {
    return false;
  }
}

export function formatDateTime(value: string | null) {
  if (!value) {
    return "Sem cliques";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}
