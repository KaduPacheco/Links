import type { LinkWithAnalytics } from "@/types/link";

const now = new Date().toISOString();

export const seedLinks: LinkWithAnalytics[] = [
  {
    id: "seed-1",
    title: "Conheça o Ponto Eletrônico",
    url: "https://pontoeletronicobr.vercel.app/",
    description: "Veja como simplificar controle de jornada e gestao de equipes.",
    icon: "MonitorCheck",
    category: "Comercial",
    is_active: true,
    display_order: 1,
    created_at: now,
    updated_at: now,
    click_count: 0,
    last_clicked_at: null
  },
  {
    id: "seed-2",
    title: "Solicitar Demonstração",
    url: "https://wa.me/5500000000000",
    description: "Converse com nosso time e receba uma apresentacao guiada.",
    icon: "CalendarClock",
    category: "Comercial",
    is_active: true,
    display_order: 2,
    created_at: now,
    updated_at: now,
    click_count: 0,
    last_clicked_at: null
  },
  {
    id: "seed-3",
    title: "Falar com Atendimento",
    url: "https://wa.me/5500000000000",
    description: "Tire duvidas rapidamente pelo WhatsApp.",
    icon: "MessagesSquare",
    category: "Suporte",
    is_active: true,
    display_order: 3,
    created_at: now,
    updated_at: now,
    click_count: 0,
    last_clicked_at: null
  },
  {
    id: "seed-4",
    title: "Instagram Oficial",
    url: "https://www.instagram.com/pontoeletronicobr/",
    description: "Acompanhe novidades, dicas e conteudos da marca.",
    icon: "Instagram",
    category: "Redes sociais",
    is_active: true,
    display_order: 4,
    created_at: now,
    updated_at: now,
    click_count: 0,
    last_clicked_at: null
  },
  {
    id: "seed-5",
    title: "Blog",
    url: "/blog",
    description: "Artigos sobre jornada, compliance e produtividade.",
    icon: "Newspaper",
    category: "Conteúdo",
    is_active: true,
    display_order: 5,
    created_at: now,
    updated_at: now,
    click_count: 0,
    last_clicked_at: null
  },
  {
    id: "seed-6",
    title: "Materiais Ricos",
    url: "/materiais",
    description: "Guias, checklists e conteudos praticos para RH.",
    icon: "FileText",
    category: "Materiais",
    is_active: true,
    display_order: 6,
    created_at: now,
    updated_at: now,
    click_count: 0,
    last_clicked_at: null
  }
];
