# Três planos: Grátis, Essencial e Pro

Hoje existe um único plano pago (R$ 10/mês) que libera basicamente o radar automático, e todo o resto está aberto. Isso subvaloriza o produto: só o radar substitui horas de garimpo manual, e as ferramentas de IA (LinkedIn, Gupy, Quest, entrevista, roadmap) custam processamento a cada uso, sem freio.

A proposta cria três níveis, com limites mensais no grátis para controlar custo de IA e criar motivo real de upgrade.

## Como ficam os planos

**Grátis — R$ 0**
- Análise ATS do currículo: 3 por mês
- Comparação manual de vaga: 3 por mês
- Carta de apresentação: 1 por mês
- Currículo revisado (download): 1 por mês
- Guia ATS, demo, kanban de candidaturas: liberados
- Sem radar automático, sem LinkedIn, sem Gupy, sem Quest

**Essencial — R$ 10/mês (R$ 27 trimestral · R$ 51 semestral · R$ 90 anual)**
- Tudo do grátis, sem limite nas ferramentas de currículo
- Radar automático: até 2 buscas por semana, 1 conjunto de preferências
- Análise de perfil do LinkedIn: 2 por mês
- Currículo otimizado por vaga: 10 por mês
- Extensão do navegador conectada à conta

**Pro — R$ 19/mês (R$ 51 trimestral · R$ 97 semestral · R$ 170 anual)**
- Tudo do Essencial, sem limites de uso
- Radar diário, com múltiplos perfis de busca e alertas
- Análise Gupy
- Preparação de entrevista (STAR) e Banco de conquistas
- Quest (trilhas gamificadas)
- Roadmap de conhecimentos + busca de cursos gratuitos
- Histórico e métricas de evolução completos

## Sobre o preço

R$ 10 pelo pacote inteiro está abaixo do valor entregue e não sustenta o custo de IA no uso pesado. Mantendo R$ 10 como porta de entrada e R$ 19 para o pacote completo, o usuário que só quer achar vagas continua pagando pouco, e quem usa tudo paga o que a ferramenta custa. A âncora do anual (R$ 170 = ~R$ 14/mês) segue sendo o melhor negócio visível.

## Detalhes técnicos

- `src/lib/stripe.ts`: `PLANOS` passa a ter `tier: "essencial" | "pro"` e os 8 price ids (4 períodos x 2 níveis); novo mapa `LIMITES` por tier/grátis com as quotas acima.
- Novo `src/lib/plano.ts` (client-safe): deriva o tier a partir de `assinatura.price_id` e expõe `podeUsar(recurso)` e limites restantes.
- `src/lib/use-assinatura.ts` passa a retornar `tier` (`"gratis" | "essencial" | "pro"`) além de `ativa`.
- Nova tabela `uso_mensal` (user_id, recurso, competencia AAAA-MM, quantidade) com RLS por `auth.uid()` e GRANTs; incremento feito dentro das server functions de IA depois de checar o limite, retornando erro amigável quando estourar.
- Checagens de tier no servidor, não só na UI: `radar.functions.ts`, `linkedin.functions.ts`, `gupy.functions.ts`, `game.functions.ts`, `entrevista.functions.ts`, `roadmap.functions.ts`, `cursos.functions.ts` e `ats.functions.ts` validam contra a assinatura via `has_active_subscription` + price_id.
- `src/components/planos-panel.tsx`: passa a mostrar 3 colunas comparativas (Grátis / Essencial / Pro) com seletor de periodicidade, mantendo o modo simulado atual de ativação.
- Painéis pagos (`game-panel`, `gupy-panel`, `linkedin-panel`, `radar`) exibem card de upgrade indicando qual plano libera o recurso; ferramentas grátis mostram contador "2 de 3 análises usadas neste mês".
- Nenhuma cobrança real muda: `MODO_PAGAMENTO` continua `"simulado"`.

## Fora do escopo

- Não ligo provedor de pagamento real nem migro de Stripe.
- Não removo nenhuma ferramenta existente.
