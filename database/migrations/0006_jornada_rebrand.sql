update accounts
set name = 'Jornada', updated_at = now()
where id = '00000000-0000-0000-0000-000000000001';

update site_settings
set
  company_name = 'Jornada',
  brand_label = 'Mais controle. Menos retrabalho.',
  company_logo_url = null,
  hero_badge = 'Mais controle. Menos retrabalho.',
  hero_description = 'Controle de ponto simples, seguro e rastreável para sua empresa.',
  links_heading = 'Canais oficiais',
  links_description = 'Conheça as soluções, conteúdos e canais oficiais da Jornada.',
  updated_at = now()
where account_id = '00000000-0000-0000-0000-000000000001';

update links
set
  title = 'Conheça a Jornada',
  description = 'Veja como simplificar o controle de ponto e a gestão da sua equipe.',
  updated_at = now()
where account_id = '00000000-0000-0000-0000-000000000001'
  and title in ('Conheca o Ponto Eletronico', 'Conheça o Ponto Eletrônico');
