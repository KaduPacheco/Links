create extension if not exists "pgcrypto";

create table if not exists links (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  url text not null,
  description text,
  icon text default 'ExternalLink',
  category text not null check (category in ('Comercial', 'Conteúdo', 'Suporte', 'Materiais', 'Redes sociais')),
  lead_message text,
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists link_clicks (
  id uuid primary key default gen_random_uuid(),
  link_id uuid not null references links(id) on delete cascade,
  clicked_at timestamptz not null default now(),
  user_agent text,
  referrer text
);

create index if not exists links_active_order_idx on links (is_active, display_order);
create index if not exists link_clicks_link_clicked_idx on link_clicks (link_id, clicked_at desc);

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_links_updated_at on links;
create trigger set_links_updated_at
before update on links
for each row
execute function set_updated_at();

create or replace view links_with_analytics as
select
  links.id,
  links.title,
  links.url,
  links.description,
  links.icon,
  links.category,
  links.lead_message,
  links.is_active,
  links.display_order,
  links.created_at,
  links.updated_at,
  count(link_clicks.id)::integer as click_count,
  max(link_clicks.clicked_at) as last_clicked_at
from links
left join link_clicks on link_clicks.link_id = links.id
group by links.id;

insert into links (title, url, description, icon, category, lead_message, is_active, display_order)
values
  ('Conheça o Ponto Eletrônico', 'https://pontoeletronicobr.vercel.app/', 'Veja como simplificar controle de jornada e gestão de equipes.', 'MonitorCheck', 'Comercial', null, true, 1),
  ('Solicitar Demonstração', 'https://wa.me/5500000000000', 'Converse com nosso time e receba uma apresentação guiada.', 'CalendarClock', 'Comercial', 'Olá! Vim pelo link "{{origem}}" e gostaria de solicitar uma demonstração.', true, 2),
  ('Falar com Atendimento', 'https://wa.me/5500000000000', 'Tire dúvidas rapidamente pelo WhatsApp.', 'MessagesSquare', 'Suporte', 'Olá! Vim pelo link "{{origem}}" e preciso de atendimento.', true, 3),
  ('Instagram Oficial', 'https://www.instagram.com/pontoeletronicobr/', 'Acompanhe novidades, dicas e conteúdos da marca.', 'Instagram', 'Redes sociais', null, true, 4),
  ('Blog', '/blog', 'Artigos sobre jornada, compliance e produtividade.', 'Newspaper', 'Conteúdo', null, true, 5),
  ('Materiais Ricos', '/materiais', 'Guias, checklists e conteúdos práticos para RH.', 'FileText', 'Materiais', null, true, 6)
on conflict do nothing;
