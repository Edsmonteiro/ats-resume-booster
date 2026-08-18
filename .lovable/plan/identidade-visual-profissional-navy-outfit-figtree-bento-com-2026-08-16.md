# Identidade visual profissional: Navy, Outfit/Figtree, bento compacto

Ajuste de aparência apenas (cores, ícones, tipografia, espaçamento). Nenhuma regra de negócio, radar, carta ou assinatura muda.

## 1. Cores

Nova paleta base "Confiança Navy", aplicada por tokens semânticos no CSS global — nada de cor solta nos componentes.

- Superfícies claras: fundo levemente azulado (#e8edf3 diluído), cartões brancos, bordas discretas.
- Ação principal: azul navy profundo (#1e3a5f) com hover em #3b6fa0.
- Modo escuro: fundo #0f1b3d, cartões um degrau acima, texto em #e8edf3.
- Semânticas fixas para status: sucesso verde-petróleo, atenção âmbar, erro vermelho contido — usadas em match de vaga, score ATS e estágios do kanban.
- As 4 paletas do menu de temas continuam existindo; "Navy" entra como padrão e as outras são reafinadas para a mesma estrutura de contraste.
- Gráficos (progresso, funil) passam a usar os 5 tokens de chart derivados do navy, não cores aleatórias.

## 2. Tipografia

- Títulos: Outfit. Texto: Figtree. Carregadas via `<link>` no root.
- Escala fechada: título de página, título de cartão, corpo, apoio e rótulo — sem tamanhos avulsos.
- Números de destaque (score, match, metas) com variante tabular para não "dançar" ao atualizar.

## 3. Ícones

- Padronizar tudo em Lucide, tamanho único por contexto (16px em linha, 20px em navegação, 24px só em estado vazio).
- Traço e cor uniformes: ícone herda a cor do texto, exceto em badges de status.
- Um ícone fixo por conceito no app inteiro (vaga, currículo, carta, entrevista, radar, conquista), evitando o mesmo conceito com desenhos diferentes em telas distintas.

## 4. Formatação e layout (bento, compacto)

- Home vira grade bento: bloco grande do Painel Hoje, blocos médios de currículo e radar, blocos pequenos de indicadores; no celular vira coluna única na mesma ordem de prioridade.
- Densidade compacta: espaçamentos e alturas reduzidos um passo, cantos e sombras padronizados em dois níveis (cartão e sobreposição).
- Cabeçalhos de cartão em linha única com truncagem, seguindo o padrão grid + `min-w-0` para não quebrar em telas estreitas.
- Badges, chips e botões com altura e raio únicos em todo o app.
- Tabelas densas (radar, histórico) mantêm o comportamento de virar cartões no celular.

## Detalhes técnicos

- Tokens em `src/styles.css`: `:root`, `.dark` e cada `[data-tema=...]` recebem os novos valores oklch; novos tokens `--sucesso`, `--atencao` e `--info` registrados em `@theme inline`.
- `--font-display: Outfit`, `--font-sans: Figtree`; `<link>` das fontes em `src/routes/__root.tsx`.
- Utilitários de densidade e nível de cartão via `@utility` (ex.: `cartao`, `cartao-forte`), aplicados nos painéis existentes.
- Revisão de componentes para trocar qualquer classe de cor fixa por token: `score-ring`, `gravidade-badge`, `painel-hoje`, `comparador-vagas`, `conquistas-panel`, `app-shell`, painéis de currículo/vagas/LinkedIn/Gupy e rotas radar/progresso/candidaturas.
- `src/lib/tema.tsx`: "navy" como paleta padrão e amostras atualizadas no menu de temas.
- Verificação em duas larguras (360px e 1280px), claro e escuro.

## Fora do escopo

Novas funcionalidades, mudanças de texto de marketing, preços e lógica de IA.
