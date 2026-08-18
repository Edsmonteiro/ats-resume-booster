# Exportação do código do Eu Passo em partes

Objetivo: entregar o código-fonte completo, sem explicações longas, em blocos organizados (Back-end, Front-end, Integrações), para servir de base na reconstrução do app como aplicação web.

## Formato da entrega

Criar arquivos markdown em `docs/codigo/`, cada um contendo os arquivos-fonte na íntegra, em blocos de código com o caminho do arquivo como cabeçalho. Nada de prosa — só caminho + código.

```text
docs/codigo/
  00-config.md       config raiz, package.json, vite, tailwind, tsconfig
  01-backend.md      server functions, *.server.ts, schemas, rotas de API
  02-banco.md        todas as migrations SQL (schema, RLS, grants, funções)
  03-frontend.md     rotas, componentes, hooks, estilos
  04-integracoes.md  Supabase, AI Gateway, Stripe, Firecrawl, extensão Chrome
```

## Parte 1 — Back-end (`01-backend.md`, `02-banco.md`)

- Todos os `src/lib/*.functions.ts` (ATS, radar, candidaturas, entrevista, roadmap, cursos, conquistas, game, linkedin, gupy, extensão, pagamentos, conta, dados, progresso, compartilhar).
- Todos os `src/lib/*.server.ts` e `*.schemas.ts`.
- `src/routes/api/**`, `src/server.ts`, `src/start.ts`, `src/router.tsx`.
- `supabase/migrations/*.sql` na ordem cronológica, com schema, RLS, grants e funções.

## Parte 2 — Front-end (`03-frontend.md`)

- Todos os arquivos de `src/routes` (exceto `routeTree.gen.ts`, que é gerado).
- Todos os componentes de `src/components` (incluindo os de `ui/` usados).
- `src/hooks`, `src/lib` client-side (auth, tema, hooks de dados, exportação de currículo, utilitários) e `src/styles.css`.

## Parte 3 — Integrações (`04-integracoes.md`)

- `src/integrations/**` (clientes Supabase, middleware de auth).
- Camada de IA (`ai-gateway.server.ts`) e Firecrawl.
- Stripe (`stripe.ts`, `stripe.server.ts`, webhook).
- Extensão Chrome inteira (`extensao/`: manifest, popup, options, content scripts).
- Lista das variáveis de ambiente e secrets necessários (apenas nomes, sem valores).

## Detalhes técnicos

Nenhum código da aplicação será alterado; a mudança é só a criação dos arquivos em `docs/codigo/`. Como o projeto tem centenas de arquivos, a entrega será feita em mensagens sucessivas, uma parte por vez, para não estourar o tamanho de resposta.
