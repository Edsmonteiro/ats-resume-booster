import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { Rodape } from "@/components/rodape";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/termos")({
  head: () => ({
    meta: [
      { title: "Termos de uso — Eu Passo" },
      {
        name: "description",
        content:
          "Condições de uso do Eu Passo: assinatura, uso da IA, responsabilidades do usuário e cancelamento.",
      },
      { property: "og:title", content: "Termos de uso — Eu Passo" },
      {
        property: "og:description",
        content: "Condições de uso, assinatura, uso da IA e cancelamento do Eu Passo.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://eupasso.lovable.app/termos" }],
  }),
  component: Termos,
});

function Termos() {
  return (
    <div className="min-h-screen bg-background">
      <header className="text-deep-foreground" style={{ background: "var(--gradient-deep)" }}>
        <div className="mx-auto max-w-3xl px-5 py-10">
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
          <h1 className="mt-4 font-display text-3xl font-bold">Termos de uso</h1>
          <p className="mt-2 text-sm opacity-80">Última atualização: agosto de 2026.</p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-8 px-5 py-10 text-sm leading-relaxed text-muted-foreground">
        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold text-foreground">
            1. O que é o Eu Passo
          </h2>
          <p>
            O Eu Passo é uma ferramenta de apoio à busca de emprego. Ele analisa currículos e perfis
            profissionais para sistemas de triagem automatizada (ATS), calcula compatibilidade com
            vagas, gera versões otimizadas de currículo e cartas, e reúne vagas publicadas
            publicamente em portais de emprego.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold text-foreground">2. Uso da conta</h2>
          <p>
            Você é responsável pelas informações que insere e por manter suas credenciais seguras. É
            proibido enviar dados de terceiros sem autorização, conteúdo ilegal ou tentar burlar os
            limites técnicos da plataforma.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold text-foreground">
            3. Conteúdo gerado por IA
          </h2>
          <p>
            Notas, recomendações, currículos e cartas são gerados por modelos de inteligência
            artificial e podem conter imprecisões. Nenhum resultado é garantia de aprovação,
            entrevista ou contratação. Revise todo material antes de enviá-lo a um recrutador. Veja
            os detalhes em{" "}
            <Link to="/ia" className="text-primary underline">
              como usamos IA
            </Link>
            .
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold text-foreground">
            4. Vagas e candidaturas
          </h2>
          <p>
            As vagas exibidas vêm de fontes públicas e podem estar desatualizadas ou encerradas. O
            Eu Passo nunca se candidata por você: a candidatura acontece sempre no site original da
            vaga, sob sua decisão.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold text-foreground">
            5. Assinatura e cancelamento
          </h2>
          <p>
            Os recursos Pro (radar de vagas com IA, analisador de LinkedIn, analisador de conta Gupy
            e preparação para entrevista) exigem assinatura ativa. A cobrança é recorrente conforme
            o plano escolhido e pode ser cancelada a qualquer momento, mantendo o acesso até o fim
            do período já pago. Consulte os valores em{" "}
            <Link to="/planos" className="text-primary underline">
              planos
            </Link>
            .
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold text-foreground">
            6. Limitação de responsabilidade
          </h2>
          <p>
            O serviço é fornecido no estado em que se encontra. Não nos responsabilizamos por
            decisões de recrutamento, perda de oportunidades ou indisponibilidade temporária de
            fontes externas de vagas.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold text-foreground">7. Encerramento</h2>
          <p>
            Você pode excluir sua conta e todos os seus dados a qualquer momento, pela central de
            dados dentro do seu perfil. A exclusão é definitiva.
          </p>
        </section>
      </main>

      <Rodape />
    </div>
  );
}
