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
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://eupasso.lovable.app/ia" }],
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
      "Modelos podem interpretar mal trechos ambíguos ou muito abreviados.",
      "A cobertura de vagas depende do que os portais publicam abertamente.",
      "Vagas encerradas podem aparecer até a próxima revalidação.",
    ],
  },
  {
    icone: ShieldCheck,
    titulo: "O que nunca fazemos",
    itens: [
      "Inventar experiências, formações ou resultados que não estão no seu material.",
      "Candidatar você automaticamente a qualquer vaga.",
      "Enviar seus dados a recrutadores ou anunciantes.",
    ],
  },
  {
    icone: Eye,
    titulo: "Sua parte",
    itens: [
      "Leia o documento gerado antes de enviar — sempre.",
      "Confira números, datas e nomes de empresas.",
      "Ajuste o tom para o seu jeito de escrever: recrutador percebe texto genérico.",
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
            Transparência total: o que a máquina faz, onde ela erra e o que continua sendo sua
            decisão.
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
