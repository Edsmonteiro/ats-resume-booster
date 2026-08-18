import { AppShell } from "@/components/app-shell";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TITULO = "Currículo ATS: guia completo com exemplos prontos (2026)";
const DESCRICAO =
  "Como montar um currículo aprovado por sistemas ATS: formatação, palavras-chave, seções obrigatórias, erros que travam a triagem e amostras de currículo antes e depois.";
const URL = "https://eupasso.lovable.app/guia-ats";

const FAQ = [
  {
    p: "O que é um sistema ATS?",
    r: "ATS (Applicant Tracking System) é o software que empresas usam para receber, ler e ranquear currículos. Ele converte o arquivo em texto, extrai seções como experiência e formação e compara o conteúdo com a descrição da vaga antes de qualquer pessoa ver o documento.",
  },
  {
    p: "Qual o melhor formato de arquivo para currículo ATS?",
    r: "PDF gerado a partir de um editor de texto (não digitalizado) ou DOCX. Evite currículos exportados como imagem, pois o ATS não consegue extrair o texto.",
  },
  {
    p: "Currículo em duas colunas passa no ATS?",
    r: "Frequentemente não. Muitos parsers leem o documento da esquerda para a direita e embaralham o conteúdo das colunas. Uma coluna única é a opção segura.",
  },
  {
    p: "Quantas palavras-chave devo incluir?",
    r: "Use os termos exatos que aparecem na descrição da vaga, distribuídos naturalmente em resumo, experiência e competências. Repetir a mesma palavra dezenas de vezes não aumenta a nota e prejudica a leitura humana.",
  },
  {
    p: "Currículo pode ter foto?",
    r: "No Brasil não é obrigatório e, em ATS, a foto costuma ser ignorada ou atrapalhar a extração do cabeçalho. Prefira deixar de fora.",
  },
];

const CHECKLIST = [
  ["Uma coluna, sem tabelas, caixas de texto ou imagens", true],
  ["Fontes comuns (Arial, Calibri, Helvetica) entre 10 e 12pt", true],
  ["Títulos de seção padrão: Resumo, Experiência, Formação, Competências", true],
  ["Datas no formato MM/AAAA em todas as experiências", true],
  ["Bullets com verbo de ação + resultado numérico", true],
  [
    "Palavras-chave da vaga escritas por extenso e por sigla (ex.: BI e Business Intelligence)",
    true,
  ],
  ["Cabeçalho com contato dentro do corpo do documento, não no header do Word", true],
  ["Gráficos de barra para nível de idioma ou habilidade", false],
  ["Ícones no lugar de texto para telefone e e-mail", false],
  ["Currículo digitalizado ou exportado como imagem", false],
  ["Seção OBJETIVO genérica no topo", false],
] as const;

const ANTES = `OBJETIVO
Trabalhar com dados em uma empresa inovadora.

EXPERIÊNCIA
Analista de Dados Jr. — Varejo Alfa (2022 - atual)
- Responsável por dashboards no Power BI
- Ajudou na criação de relatórios mensais
- Fez consultas em SQL`;

const DEPOIS = `RESUMO PROFISSIONAL
Analista de Dados com 3 anos de experiência em Power BI, SQL e automação
de relatórios para áreas comerciais no varejo.

EXPERIÊNCIA PROFISSIONAL
Analista de Dados Jr. — Varejo Alfa | 03/2022 - atual
- Construí 12 dashboards em Power BI (DAX) usados semanalmente pela diretoria,
  reduzindo em 6h/semana a consolidação manual
- Automatizei a rotina de extração diária em SQL sobre base de 4M+ registros
- Padronizei 20 KPIs comerciais junto a marketing e logística

COMPETÊNCIAS TÉCNICAS
Power BI (DAX), SQL, ETL, modelagem de dados, Excel avançado, Python (básico)`;

export const Route = createFileRoute("/guia-ats")({
  head: () => ({
    meta: [
      { title: TITULO },
      { name: "description", content: DESCRICAO },
      { property: "og:title", content: TITULO },
      { property: "og:description", content: DESCRICAO },
      { property: "og:type", content: "article" },
      { property: "og:url", content: URL },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Article",
              headline: TITULO,
              description: DESCRICAO,
              inLanguage: "pt-BR",
              mainEntityOfPage: URL,
            },
            {
              "@type": "FAQPage",
              mainEntity: FAQ.map((f) => ({
                "@type": "Question",
                name: f.p,
                acceptedAnswer: { "@type": "Answer", text: f.r },
              })),
            },
          ],
        }),
      },
    ],
  }),
  component: Guia,
});

function Guia() {
  return (
    <AppShell titulo="Guia ATS" descricao="Como passar pelos robôs de triagem">
      <header className="text-deep-foreground" style={{ background: "var(--gradient-deep)" }}>
        <div className="mx-auto max-w-3xl px-5 py-10 sm:py-14">
          <h1 className="font-display text-3xl leading-tight font-bold sm:text-4xl">
            Currículo ATS: guia completo com exemplos prontos
          </h1>
          <p className="mt-3 text-sm opacity-80 sm:text-base">
            Tudo o que faz um currículo ser lido (ou descartado) pelos robôs de triagem —
            formatação, palavras-chave, seções e amostras de antes e depois que você pode copiar.
          </p>
          <Button asChild className="mt-6" variant="secondary">
            <Link to="/demo">
              Ver a análise em uma demonstração
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-12 px-5 py-10 sm:py-14">
        <section>
          <h2 className="font-display text-2xl font-semibold">Como o ATS lê o seu currículo</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Antes de chegar a um recrutador, o arquivo passa por três etapas:{" "}
            <strong>extração</strong> (o texto é retirado do PDF ou DOCX), <strong>parsing</strong>{" "}
            (o sistema tenta identificar cabeçalho, experiência, formação e competências) e{" "}
            <strong>ranqueamento</strong> (o conteúdo é comparado com a descrição da vaga). Qualquer
            elemento visual que atrapalhe a etapa 1 ou 2 — colunas, tabelas, ícones, texto dentro de
            imagem — faz o currículo chegar incompleto na etapa 3, mesmo que você tenha a
            experiência certa.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-semibold">Checklist ATS</h2>
          <div className="mt-4 grid gap-2">
            {CHECKLIST.map(([item, bom]) => (
              <div
                key={item}
                className="flex items-start gap-2 rounded-md border bg-card p-3 text-sm"
              >
                {bom ? (
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                ) : (
                  <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
                )}
                <span className={bom ? "" : "text-muted-foreground"}>{item}</span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-display text-2xl font-semibold">Amostra: antes e depois</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            O mesmo profissional, dois currículos. O da direita ganha em palavras-chave, verbos de
            ação e resultados numéricos — os três sinais que mais pesam na triagem.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Card className="border-destructive/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-destructive">Antes — trava no ATS</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="overflow-x-auto font-mono text-[11px] leading-relaxed whitespace-pre-wrap">
                  {ANTES}
                </pre>
              </CardContent>
            </Card>
            <Card className="border-primary/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-primary">Depois — pronto para triagem</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="overflow-x-auto font-mono text-[11px] leading-relaxed whitespace-pre-wrap">
                  {DEPOIS}
                </pre>
              </CardContent>
            </Card>
          </div>
        </section>

        <section>
          <h2 className="font-display text-2xl font-semibold">
            Estrutura recomendada, seção por seção
          </h2>
          <ol className="mt-4 space-y-3 text-sm leading-relaxed">
            <li>
              <strong>1. Cabeçalho</strong> — nome, cidade/estado, telefone, e-mail e LinkedIn em
              texto simples, dentro do corpo do documento.
            </li>
            <li>
              <strong>2. Resumo profissional</strong> — 3 linhas com cargo-alvo, tempo de
              experiência e principais ferramentas. Substitui o antigo "Objetivo".
            </li>
            <li>
              <strong>3. Experiência</strong> — cargo, empresa, MM/AAAA e 3 a 5 bullets no formato
              verbo de ação + o que fez + resultado numérico.
            </li>
            <li>
              <strong>4. Competências técnicas</strong> — só o que é técnico e verificável, com os
              termos exatos da vaga.
            </li>
            <li>
              <strong>5. Formação e certificações</strong> — curso, instituição e período;
              certificações relevantes com o nome oficial.
            </li>
            <li>
              <strong>6. Projetos</strong> (opcional, essencial para quem está começando) — o que
              construiu, com qual stack e qual resultado.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="font-display text-2xl font-semibold">Palavras-chave: como escolher</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Junte de 3 a 5 anúncios da vaga que você quer e marque os termos que se repetem. Inclua
            sigla e forma por extenso na primeira menção (ex.: "Business Intelligence (BI)"), use o
            vocabulário do setor no lugar do vocabulário interno da sua empresa e coloque as
            palavras mais importantes no resumo e nos primeiros bullets — é onde o ranqueamento dá
            mais peso.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-semibold">Perguntas frequentes</h2>
          <div className="mt-4 space-y-4">
            {FAQ.map((f) => (
              <div key={f.p}>
                <h3 className="text-sm font-semibold">{f.p}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{f.r}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border bg-secondary/30 p-6 text-center">
          <p className="font-display text-lg font-semibold">
            Descubra em 1 minuto o que trava o seu currículo
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Nota ATS, travas de triagem, palavras-chave ausentes e reescritas prontas.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link to="/">Analisar meu currículo</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/demo">Ver demonstração</Link>
            </Button>
          </div>
        </section>
      </main>
    </AppShell>
  );
}
