import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowRight, Radar, TrendingUp } from "lucide-react";

import { GravidadeBadge } from "@/components/gravidade-badge";
import { ScoreRing } from "@/components/score-ring";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { carregarAnalisePublica, type AnalisePublica } from "@/lib/compartilhar.functions";

const statusEstilo: Record<string, string> = {
  ok: "text-primary",
  melhorar: "text-realce",
  ausente: "text-destructive",
};

export const Route = createFileRoute("/a/$id")({
  loader: async ({ params }) => {
    const analise = await carregarAnalisePublica({ data: { id: params.id } });
    if (!analise) throw notFound();
    return analise;
  },
  head: ({ params, loaderData }) => {
    const titulo = loaderData
      ? `Nota ATS ${loaderData.score}/100 — análise de currículo compartilhada`
      : "Análise de currículo compartilhada";
    const descricao =
      loaderData?.resumo?.slice(0, 155) || "Veja uma análise ATS compartilhada no Eu passo.";
    const url = `https://eupasso.lovable.app/a/${params.id}`;
    return {
      meta: [
        { title: `${titulo} | Eu passo` },
        { name: "description", content: descricao },
        { property: "og:title", content: titulo },
        { property: "og:description", content: descricao },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  component: AnaliseCompartilhada,
});

function AnaliseCompartilhada() {
  const a = Route.useLoaderData() as AnalisePublica;
  const ganho = a.scoreAntes != null ? a.score - a.scoreAntes : null;

  return (
    <div className="min-h-screen bg-background">
      <header className="text-deep-foreground" style={{ background: "var(--gradient-deep)" }}>
        <div className="mx-auto max-w-4xl px-5 py-8 sm:py-12">
          <Link
            to="/"
            className="flex items-center gap-2 text-xs tracking-[0.22em] uppercase opacity-70"
          >
            <Radar className="size-4" />
            Eu Passo
          </Link>
          <h1 className="mt-4 font-display text-2xl leading-tight font-bold sm:text-3xl">
            Análise ATS compartilhada{a.cargoDesejado ? ` — ${a.cargoDesejado}` : ""}
          </h1>
          <p className="mt-2 text-sm opacity-80">
            Currículo anonimizado: o texto original e os dados de contato não são compartilhados.
            Gerado em {new Date(a.criadaEm).toLocaleDateString("pt-BR")}.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-5 py-8">
        <Card className="shadow-[var(--shadow-panel)]">
          <CardContent className="flex flex-col items-center gap-6 pt-6 sm:flex-row sm:items-start">
            {a.scoreAntes != null ? (
              <div className="flex items-center gap-4">
                <ScoreRing valor={a.scoreAntes} legenda="Antes" />
                <ArrowRight className="size-5 text-muted-foreground" />
                <ScoreRing valor={a.score} legenda="Depois" />
              </div>
            ) : (
              <ScoreRing valor={a.score} legenda="Nota ATS" />
            )}
            <div className="flex-1 space-y-3">
              {ganho != null && ganho > 0 ? (
                <p className="flex items-center gap-1.5 text-sm font-medium text-primary">
                  <TrendingUp className="size-4" />+{ganho} pontos entre a primeira e a última
                  análise
                </p>
              ) : null}
              <p className="text-sm leading-relaxed">{a.resumo}</p>
              {a.pontosFortes.length > 0 && (
                <ul className="space-y-1">
                  {a.pontosFortes.map((p) => (
                    <li key={p} className="flex gap-2 text-sm text-muted-foreground">
                      <span className="text-primary">✓</span>
                      {p}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>

        {a.problemasAts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-base">
                O que trava o robô de triagem
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {a.problemasAts.map((p) => (
                <div key={p.titulo} className="rounded-md border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium">{p.titulo}</p>
                    <GravidadeBadge nivel={p.gravidade} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{p.explicacao}</p>
                  <p className="mt-1 text-xs">
                    <strong>Como corrigir:</strong> {p.comoCorrigir}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {a.palavrasChaveFaltando.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-base">Palavras-chave ausentes</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-1.5">
                {a.palavrasChaveFaltando.map((k) => (
                  <span key={k} className="rounded bg-secondary px-2 py-1 text-xs">
                    {k}
                  </span>
                ))}
              </CardContent>
            </Card>
          )}

          {a.secoes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-base">Seções destacadas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {a.secoes.map((s) => (
                  <div key={s.nome} className="rounded-md border p-2.5">
                    <p className="text-sm font-medium">
                      {s.nome}{" "}
                      <span className={`text-xs ${statusEstilo[s.status]}`}>· {s.status}</span>
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{s.nota}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {a.reescritas.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-base">Reescritas sugeridas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {a.reescritas.map((r) => (
                <div key={r.sugerida} className="rounded-md border p-3 text-xs">
                  <p className="text-muted-foreground line-through">{r.original}</p>
                  <p className="mt-1.5 text-foreground">{r.sugerida}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <div className="rounded-lg border bg-secondary/30 p-6 text-center">
          <p className="font-display text-lg font-semibold">
            Quer a mesma análise do seu currículo?
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link to="/">Analisar meu currículo</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/guia-ats">Guia ATS com exemplos</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
