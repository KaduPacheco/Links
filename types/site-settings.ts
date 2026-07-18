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
  company_name: "Jornada",
  brand_label: "Mais controle. Menos retrabalho.",
  company_logo_url: null,
  hero_badge: "Mais controle. Menos retrabalho.",
  hero_description: "Controle de ponto simples, seguro e rastreável para sua empresa.",
  links_heading: "Canais oficiais",
  links_description: "Conheça as soluções, conteúdos e canais oficiais da Jornada."
};
