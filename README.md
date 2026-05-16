# Ponto Eletrônico Links

Ferramenta full-stack de gestão de links para a marca **Ponto Eletrônico**, inspirada em bio pages profissionais como Linktree, Shorby e Beacons.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Componentes locais no estilo shadcn/ui
- PostgreSQL para banco de dados
- lucide-react para ícones

## Rotas

- `/`: página pública com links ativos agrupados por categoria.
- `/admin`: painel para criar, editar, excluir, ativar/desativar e reordenar links.
- `/admin/analytics`: ranking, total de cliques e último clique por link.
- `/api/links`: lista e cria links.
- `/api/links/[id]`: atualiza e exclui links.
- `/api/click?linkId=ID`: registra o clique e redireciona o visitante.

## Como rodar localmente

1. Instale as dependências:

```bash
npm install
```

2. Copie as variáveis de ambiente:

```bash
cp .env.example .env.local
```

3. Configure o PostgreSQL em `.env.local`:

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ponto_eletronico_links
```

4. Crie o banco e rode o schema:

```bash
createdb ponto_eletronico_links
psql "postgresql://postgres:postgres@localhost:5432/ponto_eletronico_links" -f database/schema.sql
```

5. Inicie o servidor:

```bash
npm run dev
```

Abra `http://localhost:3000`.

## Observações de segurança

O painel está estruturado para receber autenticação futuramente. Todas as operações com PostgreSQL rodam apenas no servidor por meio de `DATABASE_URL`, nunca no frontend. URLs são validadas antes de salvar, aceitando apenas `http`, `https` ou caminhos internos iniciados por `/`.

Enquanto `DATABASE_URL` não estiver configurada, a aplicação exibe links iniciais em modo demonstração. Para persistir CRUD e analytics, configure as variáveis de ambiente e execute o schema SQL.
