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

create table if not exists site_settings (
  id integer primary key default 1 check (id = 1),
  company_name text not null default 'Ponto Eletronico',
  brand_label text not null default 'Links oficiais',
  company_logo_url text,
  hero_badge text not null default 'Controle de jornada simples, seguro e inteligente',
  hero_description text not null default 'Sistema inteligente para controle de jornada, ponto online e gestao de equipes.',
  links_heading text not null default 'Links oficiais',
  links_description text not null default 'Escolha o canal ideal para conhecer o sistema, falar com o time ou acessar materiais.',
  updated_at timestamptz not null default now()
);

create table if not exists admin_users (
  id integer primary key default 1,
  name text,
  login text not null,
  password_hash text not null,
  role text not null default 'owner',
  status text not null default 'active',
  invite_token_hash text,
  invited_at timestamptz,
  accepted_at timestamptz,
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
create unique index if not exists admin_users_login_unique_idx on admin_users (lower(login));
create unique index if not exists admin_users_invite_token_unique_idx on admin_users (invite_token_hash) where invite_token_hash is not null;

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
  links.is_active,
  links.display_order,
  links.created_at,
  links.updated_at,
  count(link_clicks.id)::integer as click_count,
  max(link_clicks.clicked_at) as last_clicked_at,
  links.lead_message
from links
left join link_clicks on link_clicks.link_id = links.id
group by links.id;

insert into links (title, url, description, icon, category, lead_message, is_active, display_order)
values
  ('Conheca o Ponto Eletronico', 'https://pontoeletronicobr.vercel.app/', 'Veja como simplificar controle de jornada e gestao de equipes.', 'MonitorCheck', 'Comercial', null, true, 1),
  ('Solicitar Demonstracao', 'https://wa.me/5500000000000', 'Converse com nosso time e receba uma apresentacao guiada.', 'CalendarClock', 'Comercial', 'Ola! Vim pelo link "{{origem}}" e gostaria de solicitar uma demonstracao.', true, 2),
  ('Falar com Atendimento', 'https://wa.me/5500000000000', 'Tire duvidas rapidamente pelo WhatsApp.', 'MessagesSquare', 'Suporte', 'Ola! Vim pelo link "{{origem}}" e preciso de atendimento.', true, 3),
  ('Instagram Oficial', 'https://www.instagram.com/pontoeletronicobr/', 'Acompanhe novidades, dicas e conteudos da marca.', 'Instagram', 'Redes sociais', null, true, 4),
  ('Blog', '/blog', 'Artigos sobre jornada, compliance e produtividade.', 'Newspaper', 'Conteúdo', null, true, 5),
  ('Materiais Ricos', '/materiais', 'Guias, checklists e conteudos praticos para RH.', 'FileText', 'Materiais', null, true, 6)
on conflict do nothing;

insert into site_settings (id, company_name, brand_label, company_logo_url, hero_badge, hero_description, links_heading, links_description)
values
  (1, 'Ponto Eletronico', 'Links oficiais', null, 'Controle de jornada simples, seguro e inteligente', 'Sistema inteligente para controle de jornada, ponto online e gestao de equipes.', 'Links oficiais', 'Escolha o canal ideal para conhecer o sistema, falar com o time ou acessar materiais.')
on conflict (id) do nothing;
