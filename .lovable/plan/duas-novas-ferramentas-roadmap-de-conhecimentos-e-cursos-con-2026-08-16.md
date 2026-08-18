# Duas novas ferramentas: Roadmap de conhecimentos e Cursos concluídos

Sim, as duas fazem sentido e se encaixam no que já existe: o currículo já está salvo na conta e a análise ATS já aponta lacunas. As novas ferramentas transformam essas lacunas em um plano de estudo e devolvem o resultado do estudo para dentro do currículo.

## 1. Roadmap de conhecimentos

Nova aba no painel inicial, ao lado de Conquistas.

- A partir do currículo salvo (e do cargo desejado do perfil), a IA monta uma trilha em 3 níveis: **Base agora**, **Próximos 3 meses**, **Diferencial**.
- Cada item traz: habilidade, por que importa para o cargo, como comprovar no currículo e um esforço estimado (horas/semanas).
- Cada item vira um cartão com estado: *a fazer*, *estudando*, *concluído*, com barra de progresso geral da trilha.
- As lacunas já detectadas no radar de vagas e na análise ATS entram como prioridade alta na trilha.
- Botão "Refazer trilha" para recalcular quando o currículo mudar.

## 2. Cursos concluídos → currículo atualizado

Formulário curto e um resultado direto no currículo.

- Campos: nome do curso, instituição, carga horária, data de conclusão, link do certificado (opcional) e o que aprendeu na prática (opcional).
- Ao salvar, a IA insere o curso na seção correta do currículo (CERTIFICAÇÕES/FORMAÇÃO) e, quando fizer sentido, reforça COMPETÊNCIAS e RESUMO com os termos do curso — sem inventar experiência.
- Mostra prévia lado a lado (antes/depois) com as mudanças listadas; o usuário aceita ou descarta.
- Ao aceitar, o currículo salvo na conta é atualizado e fica disponível para exportar em PDF/DOCX com o padrão de nome já usado.
- Se o curso concluído corresponder a um item da trilha, ele é marcado como concluído automaticamente.

## Detalhes técnicos

- Banco: tabelas `roadmap_itens` e `cursos` (RLS por usuário, GRANT para `authenticated` e `service_role`, trigger `set_updated_at`).
- IA: `src/lib/roadmap.schemas.ts` / `roadmap.server.ts` / `roadmap.functions.ts` e `src/lib/cursos.*`, seguindo o mesmo padrão de `conquistas.*` (`createServerFn` + `requireSupabaseAuth` + `generateObject` com o provedor atual).
- A atualização do currículo reaproveita `SYSTEM_REVISAO` de `ats.server.ts`, com instrução extra de inserir o curso informado.
- UI: `src/components/roadmap-panel.tsx` e `src/components/cursos-panel.tsx`, novas abas em `src/routes/index.tsx`, no mesmo estilo de cartões e no layout compacto do celular.
- Sem mudanças em radar, carta, cobrança ou identidade visual.

## Fora do escopo

Catálogo de cursos externos, integração com plataformas de ensino e validação automática de certificados.
