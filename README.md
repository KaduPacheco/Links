# Ponto Eletronico Links

Ferramenta full-stack de gestao de links para a marca **Ponto Eletronico**, inspirada em bio pages profissionais como Linktree, Shorby e Beacons.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Componentes locais no estilo shadcn/ui
- PostgreSQL para banco de dados
- lucide-react para icones

## Rotas

- `/`: pagina publica com links ativos agrupados por categoria.
- `/admin`: painel para criar, editar, excluir, ativar/desativar e reordenar links.
- `/admin/analytics`: ranking, total de cliques e ultimo clique por link.
- `/api/links`: lista e cria links.
- `/api/links/[id]`: atualiza e exclui links.
- `/api/click?linkId=ID`: registra o clique e redireciona o visitante.
- `/api/health`: health check da aplicacao e conectividade com o banco.

## Como rodar localmente

1. Instale as dependencias:

```bash
npm install
```

2. Copie as variaveis de ambiente:

```bash
cp .env.example .env.local
```

3. Configure o PostgreSQL em `.env.local`.

O app aceita qualquer uma destas variaveis:

- `DATABASE_URL`
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`
- `SUPABASE_DB_URL`

Exemplo:

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ponto_eletronico_links
AUTH_SESSION_SECRET=troque-por-um-segredo-longo-e-unico
```

4. Crie o banco e aplique as migracoes:

```bash
createdb ponto_eletronico_links
npm run db:migrate
```

5. Inicie o servidor:

```bash
npm run dev
```

Abra `http://localhost:3000`.

## Mensagem automatica para leads

Cada link pode ter uma `Mensagem automatica` configurada no painel admin.

- Em links do WhatsApp, o sistema injeta essa mensagem no parametro `text`.
- Se a mensagem estiver vazia, o sistema gera uma mensagem padrao com a origem do clique.
- Voce pode usar `{{origem}}` para incluir automaticamente o titulo do botao clicado.

Exemplo:

```txt
Ola! Vim pelo link "{{origem}}" e quero falar com voces.
```

## Operacao

- As migracoes versionadas ficam em `database/migrations`.
- A aplicacao nao altera mais o schema em runtime; em producao, execute `npm run db:migrate` durante o deploy.
- O workflow de CI cria um Postgres efemero, aplica migracoes, roda `lint`, `typecheck` e `build`.
- Se nenhuma variavel de conexao estiver definida, a aplicacao entra em modo demonstracao e exibe os links seed.
