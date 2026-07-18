create extension if not exists "pgcrypto";

create table if not exists accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into accounts (id, name, slug)
values ('00000000-0000-0000-0000-000000000001', 'Jornada', 'default')
on conflict (id) do nothing;

create table if not exists links (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null default '00000000-0000-0000-0000-000000000001' references accounts(id) on delete cascade,
  title text not null,
  url text not null,
  description text,
  icon text default 'ExternalLink',
  category text not null check (category in ('comercial', 'conteudo', 'suporte', 'materiais', 'redes-sociais')),
  lead_message text,
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists site_settings (
  id integer primary key default 1,
  account_id uuid not null default '00000000-0000-0000-0000-000000000001' references accounts(id) on delete cascade,
  company_name text not null default 'Jornada',
  brand_label text not null default 'Mais controle. Menos retrabalho.',
  company_logo_url text,
  hero_badge text not null default 'Mais controle. Menos retrabalho.',
  hero_description text not null default 'Controle de ponto simples, seguro e rastreável para sua empresa.',
  links_heading text not null default 'Canais oficiais',
  links_description text not null default 'Conheça as soluções, conteúdos e canais oficiais da Jornada.',
  updated_at timestamptz not null default now()
);

create table if not exists admin_users (
  id integer primary key default 1,
  account_id uuid not null default '00000000-0000-0000-0000-000000000001' references accounts(id) on delete cascade,
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
  account_id uuid not null default '00000000-0000-0000-0000-000000000001' references accounts(id) on delete cascade,
  link_id uuid not null references links(id) on delete cascade,
  clicked_at timestamptz not null default now(),
  user_agent text,
  referrer text
);

create index if not exists links_active_order_idx on links (is_active, display_order);
create index if not exists link_clicks_link_clicked_idx on link_clicks (link_id, clicked_at desc);
create index if not exists links_account_active_order_idx on links (account_id, is_active, display_order);
create unique index if not exists site_settings_account_unique_idx on site_settings (account_id);
create unique index if not exists admin_users_account_login_unique_idx on admin_users (account_id, lower(login));
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
  links.account_id,
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
left join link_clicks on link_clicks.link_id = links.id and link_clicks.account_id = links.account_id
group by links.id;

insert into links (account_id, title, url, description, icon, category, lead_message, is_active, display_order)
values
  ('00000000-0000-0000-0000-000000000001', 'Conheça a Jornada', 'https://pontoeletronicobr.vercel.app/', 'Veja como simplificar o controle de ponto e a gestão da sua equipe.', 'MonitorCheck', 'comercial', null, true, 1),
  ('00000000-0000-0000-0000-000000000001', 'Solicitar Demonstracao', 'https://wa.me/5500000000000', 'Converse com nosso time e receba uma apresentacao guiada.', 'CalendarClock', 'comercial', 'Ola! Vim pelo link "{{origem}}" e gostaria de solicitar uma demonstracao.', true, 2),
  ('00000000-0000-0000-0000-000000000001', 'Falar com Atendimento', 'https://wa.me/5500000000000', 'Tire duvidas rapidamente pelo WhatsApp.', 'MessagesSquare', 'suporte', 'Ola! Vim pelo link "{{origem}}" e preciso de atendimento.', true, 3),
  ('00000000-0000-0000-0000-000000000001', 'Instagram Oficial', 'https://www.instagram.com/pontoeletronicobr/', 'Acompanhe novidades, dicas e conteudos da marca.', 'Instagram', 'redes-sociais', null, true, 4),
  ('00000000-0000-0000-0000-000000000001', 'Blog', '/blog', 'Artigos sobre jornada, compliance e produtividade.', 'Newspaper', 'conteudo', null, true, 5),
  ('00000000-0000-0000-0000-000000000001', 'Materiais Ricos', '/materiais', 'Guias, checklists e conteudos praticos para RH.', 'FileText', 'materiais', null, true, 6)
on conflict do nothing;

insert into site_settings (id, account_id, company_name, brand_label, company_logo_url, hero_badge, hero_description, links_heading, links_description)
values
  (1, '00000000-0000-0000-0000-000000000001', 'Jornada', 'Mais controle. Menos retrabalho.', null, 'Mais controle. Menos retrabalho.', 'Controle de ponto simples, seguro e rastreável para sua empresa.', 'Canais oficiais', 'Conheça as soluções, conteúdos e canais oficiais da Jornada.')
on conflict (id) do nothing;
