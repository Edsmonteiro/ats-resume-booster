# Código-fonte do Eu Passo

Exportação completa do código, em partes.

| Arquivo | Conteúdo |
| --- | --- |
| `00-config.md` | package.json, vite, tsconfig, config do backend |
| `01-backend.md` | server functions (`*.functions.ts`), helpers (`*.server.ts`), schemas Zod, rotas de API, router/start/server |
| `02-banco.md` | todas as migrations SQL (tabelas, RLS, grants, funções) |
| `03a-frontend-rotas.md` | todas as rotas de `src/routes` |
| `03b-frontend-componentes.md` | componentes da aplicação (`src/components/*.tsx`) |
| `03c-frontend-ui-hooks.md` | UI kit (`src/components/ui`), hooks, libs de cliente, `styles.css` |
| `04-integracoes.md` | clientes Supabase, AI Gateway, Stripe, Firecrawl, extensão Chrome |

## Variáveis de ambiente

Cliente (`import.meta.env`):

```
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
VITE_SUPABASE_PROJECT_ID
```

Servidor (`process.env`):

```
SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
LOVABLE_API_KEY          # AI Gateway
FIRECRAWL_API_KEY        # scraping de vagas e cursos
STRIPE_LIVE_API_KEY      # assinaturas
```

## Ordem de reconstrução sugerida

1. `02-banco.md` — aplicar as migrations na ordem cronológica.
2. `00-config.md` + `04-integracoes.md` — subir a base do projeto e as integrações.
3. `01-backend.md` — server functions e rotas de API.
4. `03a` → `03b` → `03c` — interface.
