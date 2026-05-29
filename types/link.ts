export const categoryLabels = {
  comercial: "Comercial",
  conteudo: "Conteúdo",
  suporte: "Suporte",
  materiais: "Materiais",
  "redes-sociais": "Redes sociais"
} as const;

export type LinkCategory = keyof typeof categoryLabels;

export const categories = Object.keys(categoryLabels) as LinkCategory[];

const legacyCategoryMap: Record<string, LinkCategory> = {
  comercial: "comercial",
  conteudo: "conteudo",
  "conteúdo": "conteudo",
  "conteãºdo": "conteudo",
  suporte: "suporte",
  materiais: "materiais",
  "redes sociais": "redes-sociais",
  "redes-sociais": "redes-sociais"
};

export function normalizeLinkCategory(value: string | null | undefined): LinkCategory {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();

  return legacyCategoryMap[normalized] ?? "comercial";
}

export function getCategoryLabel(category: string) {
  return categoryLabels[normalizeLinkCategory(category)];
}

export type LinkItem = {
  id: string;
  account_id?: string;
  title: string;
  url: string;
  description: string | null;
  icon: string | null;
  category: LinkCategory;
  lead_message: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type LinkWithAnalytics = LinkItem & {
  click_count: number;
  last_clicked_at: string | null;
};

export type LinkPayload = {
  title: string;
  url: string;
  description?: string | null;
  icon?: string | null;
  category: LinkCategory;
  lead_message?: string | null;
  is_active: boolean;
  display_order: number;
};
