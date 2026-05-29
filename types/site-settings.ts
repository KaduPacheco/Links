export type SiteSettings = {
  company_name: string;
  brand_label: string;
  company_logo_url: string | null;
  hero_badge: string;
  hero_description: string;
  links_heading: string;
  links_description: string;
};

export const defaultSiteSettings: SiteSettings = {
  company_name: "Ponto Eletr\u00f4nico",
  brand_label: "Links oficiais",
  company_logo_url: null,
  hero_badge: "Controle de jornada simples, seguro e inteligente",
  hero_description: "Sistema inteligente para controle de jornada, ponto online e gest\u00e3o de equipes.",
  links_heading: "Links oficiais",
  links_description: "Escolha o canal ideal para conhecer o sistema, falar com o time ou acessar materiais."
};
