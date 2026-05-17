export const categories = [
  "Comercial",
  "Conteúdo",
  "Suporte",
  "Materiais",
  "Redes sociais"
] as const;

export type LinkCategory = (typeof categories)[number];

export type LinkItem = {
  id: string;
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
