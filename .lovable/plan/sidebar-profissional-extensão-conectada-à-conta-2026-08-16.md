# Sidebar profissional + extensão conectada à conta

Duas frentes: uma navegação lateral fixa e retrátil no app, e uma extensão que faz login na sua conta e lê as vagas com muito mais precisão.

## 1. Navegação lateral (sidebar)

- Sidebar fixa à esquerda, recolhida por padrão (só ícones, ~64px) e que **expande ao passar o mouse** (~240px, com rótulos), sem empurrar o conteúdo bruscamente.
- No celular: botão de menu no topo abre a sidebar como painel deslizante sobre o conteúdo.
- Itens: Início (Currículo / Vagas / LinkedIn / Gupy), Radar de vagas, Candidaturas, Progresso, Guia ATS, Planos.
- Rodapé da sidebar: tema, notificações e conta (hoje espalhados no header da home) — o header vira uma barra fina com o título da página.
- Indicador de rota ativa, atalho de teclado para fixar/soltar a sidebar, e a preferência "fixada/recolhida" fica salva.
- Aplicada em todas as páginas internas via layout compartilhado; páginas públicas (demo, links compartilhados, termos, privacidade, IA) continuam sem sidebar.

## 2. Extensão: login na conta

- Fim do "colar o currículo": na extensão você clica em **Entrar**, ela abre uma página do app onde você aprova a conexão, e recebe um código de acesso próprio da extensão.
- Com a conexão ativa, a extensão usa o currículo, o perfil e as preferências que já estão na sua conta.
- Tela da extensão passa a mostrar: conta conectada, currículo em uso e botão de desconectar. Também dá para revogar o acesso pelo app.
- Novos botões no resultado: **Salvar no rastreio de vagas** e **Salvar como candidatura** (entra direto no quadro Kanban), além da carta de apresentação já existente.
- Enquanto não estiver conectado, continua funcionando no modo atual (currículo colado), para não quebrar quem já usa.

## 3. Extensão: leitura de vagas melhor

- Extrair também **salário, local, modelo (remoto/híbrido/presencial), tipo de contrato (CLT/PJ/Cooperado), nível e data de publicação**, além de cargo, empresa e requisitos.
- Ler dados estruturados da página (JobPosting em JSON-LD) quando existirem — funciona na maioria dos sites de vaga sem precisar de seletores manuais.
- Cascata de leitura: dados estruturados → seletores conhecidos do site → seletores personalizados → leitura do texto visível como último recurso.
- Ampliar os sites suportados: LinkedIn, Gupy, Indeed, Catho, Vagas.com, InfoJobs, Glassdoor, Workday, Greenhouse, Lever, SolidesQ.
- Aviso claro quando a vaga parecer **encerrada** e quando a leitura vier incompleta, com botão de "tentar novamente" após expandir a descrição.

## 4. Outras melhorias profissionais sugeridas

- **Badge de compatibilidade direto na listagem** do LinkedIn/Gupy: a extensão marca cada vaga da lista com a nota, sem precisar abrir uma a uma. (Maior ganho percebido, mas é o item mais pesado — posso deixar para uma etapa seguinte.)
- **Menu do botão direito**: selecionar a descrição da vaga em qualquer site e enviar para o Eu Passo.
- **Histórico na extensão**: últimas vagas analisadas, com link para abrir no app.

## Detalhes técnicos

- Layout: novo `src/components/app-shell.tsx` com sidebar (hover-expand via CSS `group-hover` + estado fixado em `localStorage`) e `Sheet` no mobile; rotas internas passam a envolver o conteúdo nele.
- Pareamento: tabela `extensao_tokens` (id, user_id, token hash, nome do dispositivo, último uso, revogado) com RLS por `auth.uid()` e GRANTs; rota `/extensao/conectar` autenticada que gera o token; extensão guarda o token em `chrome.storage.local`.
- API: `src/routes/api/public/vaga-match.ts` passa a aceitar `Authorization: Bearer <token da extensão>`, valida o token pelo service role, carrega o currículo do usuário e dispensa o campo `curriculo`; mantém o modo anônimo atual. Novos endpoints públicos autenticados por esse mesmo token para salvar vaga/candidatura.
- Extração: novo `extension/extrator.js` com parser de JSON-LD `JobPosting` + mapa de seletores por domínio ampliado; `popup.js` consome o resultado normalizado.
- Manifest sobe para incluir o menu de contexto (`contextMenus`) apenas se implementarmos o item 4.
