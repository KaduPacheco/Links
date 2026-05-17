import type { LinkWithAnalytics } from "@/types/link";

const now = new Date().toISOString();

export const seedLinks: LinkWithAnalytics[] = [
  {
    id: "seed-1",
    title: "Conheça o Ponto Eletrônico",
    url: "https://pontoeletronicobr.vercel.app/",
    description: "Veja como simplificar controle de jornada e gestão de equipes.",
    icon: "MonitorCheck",
    category: "Comercial",
    lead_message: null,
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
    description: "Converse com nosso time e receba uma apresentação guiada.",
    icon: "CalendarClock",
    category: "Comercial",
    lead_message: "Olá! Vim pelo link \"{{origem}}\" e gostaria de solicitar uma demonstração.",
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
    description: "Tire dúvidas rapidamente pelo WhatsApp.",
    icon: "MessagesSquare",
    category: "Suporte",
    lead_message: "Olá! Vim pelo link \"{{origem}}\" e preciso de atendimento.",
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
    description: "Acompanhe novidades, dicas e conteúdos da marca.",
    icon: "Instagram",
    category: "Redes sociais",
    lead_message: null,
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
    lead_message: null,
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
    description: "Guias, checklists e conteúdos práticos para RH.",
    icon: "FileText",
    category: "Materiais",
    lead_message: null,
    is_active: true,
    display_order: 6,
    created_at: now,
    updated_at: now,
    click_count: 0,
    last_clicked_at: null
  }
];
