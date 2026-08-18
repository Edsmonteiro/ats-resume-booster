# Modo simulado de assinatura (sem provedor de pagamento)

Você não precisa trocar de provedor agora. O bloqueio é a verificação de identidade da Stripe, que só afeta **cobrança real**. Para testar e demonstrar o produto, o melhor caminho é um **modo simulado**: a assinatura funciona de ponta a ponta dentro do Eu Passo, sem cartão, sem conta em provedor e sem cobrar ninguém.

Quando você quiser cobrar de verdade, ligamos o provedor (Stripe já pronto, ou Paddle) sem refazer o resto — o radar, a checagem de acesso e a tela de planos continuam iguais.

## Como vai funcionar

- Na página `/planos`, o usuário logado escolhe um plano e clica em "Ativar teste gratuito (modo simulado)".
- O sistema cria uma assinatura simulada no banco, com prazo real conforme o plano (1, 3, 6 ou 12 meses).
- O radar destrava imediatamente, exatamente como destravaria com pagamento real.
- Aparece um aviso claro: "Assinatura em modo simulado — nenhuma cobrança foi feita".
- O usuário pode cancelar a simulação a qualquer momento pelo mesmo painel.
- O checkout da Stripe fica desativado por uma chave de configuração; nada é apagado.

## O que muda na tela

- Banner atual de "modo de teste da Stripe" é substituído por um aviso de modo simulado.
- Botão "Assinar" vira "Ativar plano (simulado)"; some o formulário de cartão.
- Card de assinatura ativa mostra o plano, a data de expiração e um botão "Cancelar simulação" no lugar de "Gerenciar assinatura".

## Detalhes técnicos

- Nova flag `MODO_PAGAMENTO` em `src/lib/stripe.ts` (`"simulado" | "stripe"`), começando em `"simulado"`.
- Novo arquivo `src/lib/assinatura-simulada.functions.ts` com duas server functions protegidas por `requireSupabaseAuth`:
  - `ativarAssinaturaSimulada({ priceId })` — valida o `priceId` contra a lista de `PLANOS`, calcula `current_period_end` pelo plano e faz upsert em `public.subscriptions` com `stripe_subscription_id = "sim_<userId>_<priceId>"`, `stripe_customer_id = "sim_<userId>"` e `environment = "sandbox"`.
  - `cancelarAssinaturaSimulada()` — marca `status = "canceled"` e `current_period_end = now()` na linha simulada do usuário.
- A escrita usa `supabaseAdmin` carregado dentro do handler (a tabela só permite escrita por service role), sempre depois de confirmar o usuário autenticado; o `user_id` vem do contexto, nunca do input.
- `src/routes/planos.tsx` passa a renderizar o fluxo simulado quando `MODO_PAGAMENTO === "simulado"`, mantendo o `CheckoutEmbutido` para o modo Stripe.
- `src/lib/use-assinatura.ts`, a RPC `has_active_subscription` e a checagem em `src/lib/radar.functions.ts` continuam sem alteração — o modo simulado grava no mesmo formato.
- Nenhuma migration nova: a tabela `subscriptions` já comporta esses registros.

## Fora do escopo

- Não migro para o Paddle agora nem removo o código da Stripe.
- Não cobro nada nem toco em contas de provedor.
