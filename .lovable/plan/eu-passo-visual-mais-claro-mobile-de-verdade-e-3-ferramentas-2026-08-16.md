# Eu Passo — visual mais claro, mobile de verdade e 3 ferramentas novas

Três frentes: (1) reorganizar a tela para reduzir ruído, (2) tratar celular como formato próprio (não só "encolher" o desktop), (3) adicionar Painel Hoje, Comparador de vagas e Banco de conquistas.

## 1. Visual — menos ruído, mais hierarquia

Hoje o painel inicial empilha um bloco colorido grande, quatro abas largas e painéis muito densos, tudo com a mesma "voz" visual.

- **Cabeçalho enxuto**: o bloco em degradê vira uma faixa curta com o essencial (estado de sincronização + ação principal). O restante do espaço vai para o conteúdo.
- **Cartões com respiro**: padronizar densidade (títulos, espaçamentos, cantos e sombras) entre currículo, vagas, LinkedIn e Gupy, para as telas parecerem a mesma família.
- **Números que orientam**: score do currículo, match médio e candidaturas ativas ficam em uma faixa de indicadores no topo do Painel Hoje, em vez de espalhados dentro dos painéis.
- **Estados vazios úteis**: cada painel sem dado mostra uma ação clara ("Colar currículo", "Ver exemplo") em vez de um card cinza alto.
- **Abas que cabem**: no desktop continuam com rótulo; no celular viram uma tira rolável com ícone + rótulo curto e o contador em bolinha.

## 2. Mobile — layout próprio, não miniatura do desktop

- **Barra inferior fixa** com 4 destinos: Início, Radar, Candidaturas e Perfil/Mais. Some ao rolar para baixo e volta ao rolar para cima; respeita a área segura do iPhone.
- **Menu lateral** passa a ser secundário no celular (acessível pelo "Mais"), sem duplicar o que já está na barra inferior.
- **Detecção real do formato**: um hook único decide entre layout compacto e amplo (largura + tipo de ponteiro), evitando o "pisca" de layout errado no primeiro carregamento.
- **Alvos de toque** mínimos de 44px, botões de ação principais em largura total, diálogos grandes (carta, currículo otimizado, recomendações) abrindo como folha deslizante de baixo para cima no celular.
- **Kanban de candidaturas**: no celular vira lista por estágio com seletor de coluna, em vez de arrastar cartões em rolagem horizontal.
- **Tabelas e listas densas** (radar, histórico) viram cartões empilhados abaixo de 640px.

## 3. Ferramentas novas

### Painel "Hoje" com metas
Novo topo da tela inicial, respondendo "o que eu faço agora":
- Vagas novas do radar desde o último acesso.
- Candidaturas paradas há mais de 7 dias.
- Meta semanal de candidaturas com barra de progresso (meta configurável).
- Próximo passo sugerido (ex.: "3 vagas com match acima de 80% sem currículo gerado").

### Comparador de vagas
- Selecionar até 3 vagas (do rastreio ou do radar) e comparar lado a lado: match, requisitos atendidos, lacunas, salário, contrato e modelo.
- No celular, comparação em cartões empilhados com as diferenças destacadas.
- Botão para gerar currículo/carta direto da vaga vencedora.

### Banco de conquistas (STAR)
- Biblioteca pessoal de conquistas com Situação, Tarefa, Ação e Resultado.
- Extração assistida: a partir do currículo já cadastrado, a IA sugere conquistas candidatas para o usuário confirmar e editar.
- Reuso: inserir uma conquista no currículo otimizado, na carta e no simulador de entrevista.

## Detalhes técnicos

- `src/hooks/use-mobile.tsx` vira a fonte única de formato (`useFormato`), com hidratação segura; `AppShell` passa a renderizar barra inferior no compacto e sidebar no amplo.
- Novo `src/components/painel-hoje.tsx` alimentado por dados já existentes (vagas, candidaturas, radar) mais uma preferência de meta semanal em `dados_usuario`.
- Novo `src/components/comparador-vagas.tsx`, sem chamada extra de IA: usa os matches já calculados.
- Conquistas: tabela `conquistas` no banco (RLS por usuário, GRANT para `authenticated` e `service_role`), schemas em `src/lib/conquistas.schemas.ts`, extração via `createServerFn` em `src/lib/conquistas.functions.ts` reaproveitando o provedor de IA atual.
- Diálogos grandes ganham variação "folha" via componente existente `Sheet` quando o formato é compacto.
- Sem mudança nas regras de carta, radar ou assinatura.

## Fora do escopo agora

Nova identidade de marca/cores, app nativo e mudanças nos preços.
