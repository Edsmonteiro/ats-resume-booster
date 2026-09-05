import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowLeft, Bot, Eye, ShieldCheck } from "lucide-react";

import { Rodape } from "@/components/rodape";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/ia")({
  head: () => ({
    meta: [
      { title: "Como o Eu Passo usa inteligência artificial" },
      {
        name: "description",
        content:
          "O que é gerado por IA no Eu Passo, quais são os limites conhecidos e por que revisar cada documento antes de enviar ao recrutador.",
      },
      { property: "og:title", content: "Como o Eu Passo usa inteligência artificial" },
      {
        property: "og:description",
        content:
          "Transparência sobre o que a IA gera, seus limites e o que continua sob sua decisão.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://eu-passo.netlify.app/ia" }],
  }),
  component: PaginaIa,
});

const blocos = [
  {
    icone: Bot,
    titulo: "O que a IA gera",
    itens: [
      "Nota ATS do currículo e lista de problemas de formatação e conteúdo.",
      "Compatibilidade entre o currículo e cada vaga, com lacunas e palavras-chave faltantes.",
      "Currículo revisado, currículo sob medida por vaga e carta de apresentação.",
      "Análise do perfil do LinkedIn e da conta Gupy.",
      "Roteiro de preparação para entrevista e feedback das respostas de treino.",
    ],
  },
  {
    icone: AlertTriangle,
    titulo: "Limites conhecidos",
    itens: [
      "A nota é uma estimativa: cada empresa configura o próprio ATS de um jeito.",
      "Modelos podem interpretar mal trechos ambíguos, omitir informações ou gerar afirmações incorretas.",
      "A cobertura de vagas depende do que as fontes externas disponibilizam.",
      "Vagas encerradas podem aparecer até a próxima revalidação.",
    ],
  },
  {
    icone: ShieldCheck,
    titulo: "Como reduzimos riscos",
    itens: [
      "Os prompts orientam a IA a não inventar experiências, formações, empresas, datas ou resultados.",
      "As funções usam apenas o conteúdo necessário à tarefa solicitada pelo usuário.",
      "O Eu Passo não envia candidaturas sem uma ação explícita do usuário.",
      "Resultados de IA devem ser revisados antes de uso em uma candidatura real.",
    ],
  },
  {
    icone: Eye,
    titulo: "Sua parte",
    itens: [
      "Leia o documento gerado antes de enviar — sempre.",
      "Confira números, datas, nomes de empresas e qualquer afirmação sobre sua experiência.",
      "Remova dados pessoais ou sensíveis que não sejam necessários para a análise.",
      "Ajuste o tom para o seu jeito de escrever e para a vaga em questão.",
    ],
  },
];

function PaginaIa() {
  return (
    <div className="min-h-screen bg-background">
      <header className="text-deep-foreground" style={{ background: "var(--gradient-deep)" }}>
        <div className="mx-auto max-w-4xl px-5 py-10">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-deep-foreground hover:bg-white/10"
          >
            <Link to="/">
              <ArrowLeft className="size-4" />
              Voltar
            </Link>
          </Button>
          <h1 className="mt-4 font-display text-3xl font-bold">
            Como usamos inteligência artificial
          </h1>
          <p className="mt-2 max-w-2xl text-sm opacity-80">
            O que a IA faz, quais são os limites conhecidos e o que continua sob sua decisão.
          </p>
        </div>
      </header>

      <main className="mx-auto grid max-w-4xl gap-4 px-5 py-10 sm:grid-cols-2">
        {blocos.map((b) => (
          <Card key={b.titulo}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 font-display text-base">
                <b.icone className="size-4 text-primary" />
                {b.titulo}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
                {b.itens.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </main>

      <Rodape />
    </div>
  );
}
