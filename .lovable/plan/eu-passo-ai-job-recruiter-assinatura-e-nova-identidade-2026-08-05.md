# Eu Passo — AI Job Recruiter, assinatura e nova identidade

Três frentes: rebranding completo, radar de vagas automático com IA, e assinatura paga recorrente.

## 1. Rebranding: CV Radar → Eu Passo

- Trocar o nome em todas as telas (home, guia, demo, auth, página de análise compartilhada) e na extensão (manifest, popup, options).
- Nova paleta roxo + laranja aplicada nos tokens do design system (`src/styles.css`), sem cores fixas em componentes:
  - fundo claro lavanda, primária roxo, acento laranja para CTAs e destaques de score.
  - modo escuro coerente com roxo profundo.
- Atualizar títulos, descrições e og:tags de cada rota para "Eu Passo".

## 2. AI Job Recruiter (radar de vagas)

Funciona assim, do ponto de vista do usuário:

1. Ele salva o currículo e define preferências: cargos desejados, senioridade, cidade/estado, remoto/híbrido/presencial, faixa salarial mínima, palavras a evitar.
2. A plataforma busca vagas sozinha, diariamente, em fontes públicas brasileiras.
3. Cada vaga encontrada passa pela mesma engine de compatibilidade que já existe, gerando nota, lacunas e o que ajustar.
4. O usuário vê um feed "Vagas para você", ordenado por compatibilidade, com filtros e ações: salvar, descartar, abrir a vaga original, gerar carta de apresentação.
5. Ele nunca é inscrito automaticamente — o link leva à vaga original.

Fontes da busca (decisão já tomada): endpoints públicos de busca da Gupy e feeds públicos/RSS de portais brasileiros. A arquitetura usa "conectores" — cada fonte é um módulo isolado — para que agregadores pagos ou o Firecrawl possam ser plugados depois sem reescrever nada. LinkedIn não tem busca automatizada: continua coberto pela extensão que você já tem.

Transparência necessária na interface: mostrar a fonte e a data de cada vaga, e um aviso de que a cobertura depende da disponibilidade pública de cada portal.

## 3. Assinatura paga

- Planos: mensal R$ 10, trimestral, semestral e anual com desconto progressivo (sugestão: 10%, 15% e 25% — confirme os valores finais).
- Pagamento integrado da Lovable (sem precisar da sua própria conta de gateway). Vou rodar a checagem de provedor recomendado e criar os quatro planos.
- Página de planos com comparação, checkout e retorno de status.
- Gestão da assinatura: ver plano ativo, data de renovação, cancelar.

### O que fica grátis e o que fica pago

| Grátis | Pago (Eu Passo Pro) |
|---|---|
| Análise ATS do currículo | Radar automático de vagas |
| Currículo revisado e exportação | Alertas por e-mail de vagas novas |
| Guia ATS, demo pública, link compartilhável | Cartas de apresentação ilimitadas |
| Rastrear vagas manualmente | Histórico completo de evolução |

O radar só roda para usuário logado **e** com assinatura ativa — validado no servidor, não só na interface.

## 4. Mais valor (o que eu recomendo incluir)

- **Alerta por e-mail**: resumo diário/semanal das melhores vagas. É o que faz a pessoa continuar pagando.
- **Currículo sob medida por vaga**: gerar uma versão do currículo ajustada para a vaga específica do feed (você já tem a engine de revisão).
- **Motivo do match**: explicar em uma linha por que a vaga apareceu — aumenta muito a confiança.
- **Painel de progresso**: quantas vagas analisadas, compatibilidade média, evolução da nota ao longo do tempo.

## Detalhes técnicos

- **Banco (Lovable Cloud)**: novas tabelas `preferencias_busca`, `vagas_encontradas`, `vagas_usuario` (status salva/descartada/vista) e `assinaturas` (plano, status, período, ID externo do gateway). RLS por `auth.uid()` em todas, com GRANTs explícitos.
- **Rotas protegidas**: o radar vai para `src/routes/_authenticated/radar.tsx`; página pública de planos em `src/routes/planos.tsx`.
- **Busca**: conectores em `src/lib/fontes/*.server.ts` com uma interface comum (`buscar(prefs) => VagaBruta[]`), normalização e deduplicação por hash de URL/título+empresa.
- **Agendamento**: rota `src/routes/api/public/cron-radar.ts` protegida por segredo, disparada por cron; processa usuários com assinatura ativa em lotes e grava as vagas.
- **Matching**: reaproveita `analisarVaga` de `src/lib/ats.server.ts`; pré-filtro barato por palavras-chave antes de chamar a IA, para controlar custo.
- **Gate de assinatura**: server function `verificarAssinatura` usada por todas as funções do radar; webhook do gateway em `src/routes/api/public/` com verificação de assinatura atualizando a tabela `assinaturas`.
- **Tema**: apenas tokens em `src/styles.css` (`--primary`, `--accent`, `--deep`, gradientes e sombras); componentes não mudam de cor manualmente.

## Ordem de execução

1. Rebranding + nova paleta (visível imediatamente).
2. Tabelas, preferências de busca e tela do radar com um conector (Gupy).
3. Planos, checkout e gate de assinatura.
4. Cron diário, demais conectores e alertas por e-mail.

## Confirmação necessária

Os valores dos planos trimestral/semestral/anual — posso seguir com R$ 27 (3m), R$ 51 (6m) e R$ 90 (12m) se você não indicar outros.
