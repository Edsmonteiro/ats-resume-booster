# Eu Passo — roteiro profissional em 4 etapas

Foco mantido no candidato individual. Cada etapa é entregue e usável sozinha.

## Etapa 1 — Confiança e conformidade (base de produto pago)

O que uma ferramenta paga séria precisa ter antes de crescer:

- Páginas públicas de Termos de uso e Política de privacidade (LGPD), com base legal, retenção e uso de IA.
- Aviso claro de tratamento de dados no upload de currículo e PDF do LinkedIn/Gupy.
- Central de dados na conta: exportar tudo (JSON) e excluir conta e dados definitivamente.
- Página "Como funciona a IA": o que é gerado por IA, limites, e recomendação de revisão humana.
- Rodapé consistente com links legais, contato e status da assinatura.

## Etapa 2 — Kanban de candidaturas

Acompanhar cada vaga do envio até a resposta:

- Colunas: Interessado, Candidatura enviada, Triagem, Entrevista, Teste/Case, Oferta, Recusado.
- Cartão puxa a vaga do radar ou do rastreio manual, com nota de compatibilidade, empresa, link e data.
- Arrastar entre colunas, anotações por vaga e data do próximo passo.
- Lembrete de follow-up: sinaliza cartões parados há X dias e cria notificação no app.
- Filtros por status, fonte e compatibilidade.

## Etapa 3 — Painel de progresso e métricas

Mostra o valor contínuo do plano pago:

- Evolução da nota ATS ao longo do tempo (gráfico), com marcos das versões do currículo.
- Vagas analisadas, compatibilidade média, melhor e pior faixa.
- Funil de candidaturas: enviadas → triagem → entrevista → oferta, com taxa de conversão.
- Palavras-chave que mais aparecem nas vagas e ainda faltam no currículo.
- Resumo semanal do progresso na tela inicial.

## Etapa 4 — Preparação para entrevista

Fecha o ciclo depois do currículo otimizado:

- A partir de uma vaga (radar, rastreio ou Kanban), a IA gera o roteiro de entrevista provável: perguntas técnicas, comportamentais e sobre lacunas do match.
- Respostas sugeridas em formato STAR, baseadas na experiência real do currículo — nada inventado.
- Modo treino: usuário escreve/cola a resposta e recebe nota e ajustes ponto a ponto.
- Perguntas para o candidato fazer ao recrutador e preparo de pretensão salarial.
- Exportar o roteiro em PDF, com nome do candidato e da vaga.
- Recurso do plano Pro, com o mesmo gate de assinatura já usado no radar/LinkedIn/Gupy.

## Detalhes técnicos

- **Banco (Lovable Cloud)**: nova tabela `candidaturas` (user_id, vaga_id opcional, título, empresa, link, fonte, status, notas, próximo passo, datas) e `preparos_entrevista` (user_id, vaga de origem, roteiro jsonb, respostas jsonb). RLS por `auth.uid()` com GRANTs explícitos na mesma migração. Métricas derivam de `vagas_usuario`, `dados_usuario.historico` e `candidaturas` — sem tabela extra.
- **Rotas**: `src/routes/candidaturas.tsx`, `src/routes/progresso.tsx`, `src/routes/entrevista.$id.tsx`, `src/routes/termos.tsx`, `src/routes/privacidade.tsx`, `src/routes/ia.tsx`. Cada uma com `head()` próprio (title, description, og).
- **IA**: novos `src/lib/entrevista.schemas.ts` / `.server.ts` / `.functions.ts` seguindo o padrão de `linkedin`/`gupy`, com `generateObject` e o mesmo gate `has_active_subscription`.
- **Exportar/excluir conta**: server functions autenticadas que agregam e apagam as tabelas do usuário; exclusão pede confirmação digitada.
- **Estilo**: só tokens do design system e componentes existentes (ScoreRing, badges, tabs), nada de cor fixa.

## Ordem sugerida

1. Confiança e conformidade (rápido, remove risco).
2. Kanban de candidaturas.
3. Painel de progresso (usa os dados do Kanban).
4. Preparação para entrevista.

Posso começar pela Etapa 1 assim que você aprovar — ou trocar a ordem se preferir ver o Kanban primeiro.
