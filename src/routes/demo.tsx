import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Radar } from "lucide-react";

import { CurriculoPanel } from "@/components/curriculo-panel";
import { Button } from "@/components/ui/button";
import { ANALISE_EXEMPLO } from "@/lib/analise-exemplo";
import type { AtsAnalysis } from "@/lib/ats.schemas";
import { CURRICULO_EXEMPLO } from "@/lib/curriculo-exemplo";
import type { EntradaHistorico } from "@/components/historico-analises";

const TITULO = "Demonstração: análise ATS de um currículo real";
const DESCRICAO =
  "Veja como a análise ATS funciona usando um currículo de exemplo já preenchido — nota, travas de triagem, palavras-chave ausentes e reescritas, sem enviar seus dados.";

export const Route = createFileRoute("/demo")({
  head: () => ({
    meta: [
      { title: `${TITULO} | Eu passo` },
      { name: "description", content: DESCRICAO },
      { property: "og:title", content: TITULO },
      { property: "og:description", content: DESCRICAO },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://eupasso.lovable.app/demo" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://eupasso.lovable.app/demo" }],
  }),
  component: Demo,
});

function Demo() {
  const [texto, setTexto] = useState(CURRICULO_EXEMPLO);
  const [analise, setAnalise] = useState<AtsAnalysis | null>(ANALISE_EXEMPLO);
  const [historico, setHistorico] = useState<EntradaHistorico[]>([
    {
      id: "demo-1",
      criadaEm: new Date().toISOString(),
      score: ANALISE_EXEMPLO.score,
      resumo: ANALISE_EXEMPLO.resumo,
      problemas: ANALISE_EXEMPLO.problemasAts.length,
    },
  ]);

  return (
    <div className="min-h-screen bg-background">
      <header className="text-deep-foreground" style={{ background: "var(--gradient-deep)" }}>
        <div className="mx-auto max-w-6xl px-5 py-8 sm:py-12">
          <div className="flex items-center justify-between gap-4">
            <Link
              to="/"
              className="flex items-center gap-2 text-xs tracking-[0.22em] uppercase opacity-70"
            >
              <Radar className="size-4" />
              Eu Passo
            </Link>
            <Button asChild variant="secondary" size="sm">
              <Link to="/">
                <ArrowLeft className="size-4" />
                Usar com meu currículo
              </Link>
            </Button>
          </div>
          <h1 className="mt-4 max-w-2xl font-display text-3xl leading-tight font-bold sm:text-4xl">
            Demonstração pública: teste sem enviar seus dados
          </h1>
          <p className="mt-3 max-w-2xl text-sm opacity-80 sm:text-base">
            Esta página já vem com um currículo fictício e a análise pronta. Explore as abas, os
            destaques no texto e as reescritas — e, se quiser, clique em{" "}
            <strong>Analisar para ATS</strong> para rodar a análise de verdade neste exemplo. Nada
            aqui é salvo na sua conta.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8 sm:py-10">
        <CurriculoPanel
          texto={texto}
          setTexto={setTexto}
          analise={analise}
          setAnalise={setAnalise}
          historico={historico}
          setHistorico={setHistorico}
        />
        <div className="mt-10 rounded-lg border bg-secondary/30 p-5 text-center">
          <p className="font-display text-lg font-semibold">Pronto para o seu currículo?</p>
          <p className="mt-1 text-sm text-muted-foreground">
            A análise real leva menos de um minuto e aponta exatamente o que corrigir antes de se
            candidatar.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link to="/">Analisar meu currículo</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/guia-ats">Ler o guia ATS</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
