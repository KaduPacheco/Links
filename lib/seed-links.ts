import type { LinkWithAnalytics } from "@/types/link";

const now = new Date().toISOString();

export const seedLinks: LinkWithAnalytics[] = [
  {
    id: "seed-1",
    title: "Site institucional",
    url: "https://www.exemplo.com.br/",
    description: "Apresente sua empresa, servi\u00e7os e principais diferenciais.",
    icon: "ExternalLink",
    category: "comercial",
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
    title: "Solicitar or\u00e7amento",
    url: "https://wa.me/5500000000000",
    description: "Canal r\u00e1pido para novos contatos comerciais.",
    icon: "CalendarClock",
    category: "comercial",
    lead_message: 'Ol\u00e1! Vim pelo link "{{origem}}" e gostaria de solicitar um or\u00e7amento.',
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
    description: "Direcione clientes para o suporte da empresa.",
    icon: "MessagesSquare",
    category: "suporte",
    lead_message: 'Ol\u00e1! Vim pelo link "{{origem}}" e preciso de atendimento.',
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
    url: "https://www.instagram.com/",
    description: "Compartilhe novidades, bastidores e conte\u00fados da marca.",
    icon: "Instagram",
    category: "redes-sociais",
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
    description: "Publique artigos, not\u00edcias e materiais educativos.",
    icon: "Newspaper",
    category: "materiais",
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
    description: "Disponibilize guias, checklists e arquivos para download.",
    icon: "FileText",
    category: "materiais",
    lead_message: null,
    is_active: true,
    display_order: 6,
    created_at: now,
    updated_at: now,
    click_count: 0,
    last_clicked_at: null
  }
];
