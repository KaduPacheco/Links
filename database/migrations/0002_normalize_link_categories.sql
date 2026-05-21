update links
set category = case
  when lower(trim(category)) in ('comercial') then 'comercial'
  when lower(trim(category)) in ('conteudo', 'conteúdo', 'conteãºdo') then 'conteudo'
  when lower(trim(category)) in ('suporte') then 'suporte'
  when lower(trim(category)) in ('materiais') then 'materiais'
  when lower(trim(category)) in ('redes sociais', 'redes-sociais') then 'redes-sociais'
  else 'comercial'
end;

alter table links
drop constraint if exists links_category_check;

alter table links
add constraint links_category_check
check (category in ('comercial', 'conteudo', 'suporte', 'materiais', 'redes-sociais'));
