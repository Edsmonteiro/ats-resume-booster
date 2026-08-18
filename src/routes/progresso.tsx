import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, TrendingUp } from "lucide-react";
import { useEffect } from "react";

import { Rodape } from "@/components/rodape";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { carregarProgresso, type Progresso } from "@/lib/progresso.functions";

export const Route = createFileRoute("/progresso")({
  head: () => ({
    meta: [
      { title: "Progresso — evolução do currículo e das candidaturas | Eu Passo" },
      {
        name: "description",
        content:
          "Acompanhe a evolução da sua nota ATS, a compatibilidade média das vagas e o funil de candidaturas até a oferta.",
      },
      { property: "og:title", content: "Progresso — Eu Passo" },
      {
        property: "og:description",
        content: "Nota ATS ao longo do tempo, compatibilidade média e funil de candidaturas.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://eupasso.lovable.app/progresso" }],
  }),
  component: PaginaProgresso,
});

const ROTULO_FUNIL: Record<string, string> = {
  enviada: "Enviadas",
  triagem: "Triagem",
  entrevista: "Entrevista",
  teste: "Teste / case",
  oferta: "Oferta",
  recusado: "Recusadas",
};

function PaginaProgresso() {
  const { user, carregando } = useAuth();
  const navigate = useNavigate();
  const buscar = useServerFn(carregarProgresso);

  useEffect(() => {
    if (!carregando && !user) void navigate({ to: "/auth" });
  }, [carregando, user, navigate]);

  const { data, isLoading } = useQuery({
    queryKey: ["progresso"],
    queryFn: () => buscar(),
    enabled: !!user,
  });

  return (
    <AppShell titulo="Progresso" descricao="Métricas do seu processo de busca">
      <header className="text-deep-foreground" style={{ background: "var(--gradient-deep)" }}>
        <div className="mx-auto max-w-5xl px-5 py-8">
          <h1 className="flex items-center gap-2 font-display text-2xl font-bold sm:text-3xl">
            <TrendingUp className="size-6" />
            Seu progresso
          </h1>
          <p className="mt-2 max-w-2xl text-sm opacity-80">
            O que mudou desde a primeira análise: nota do currículo, qualidade das vagas e resposta
            do mercado.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-4 px-5 py-8">
        {isLoading || !data ? (
          <div className="flex justify-center py-16">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ConteudoProgresso p={data} />
        )}
      </main>

      <Rodape />
    </AppShell>
  );
}

function ConteudoProgresso({ p }: { p: Progresso }) {
  const ganho =
    p.scoreAtual !== null && p.scoreInicial !== null ? p.scoreAtual - p.scoreInicial : null;
  const maxFunil = Math.max(1, ...p.funil.map((f) => f.total));

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metrica
          rotulo="Nota ATS atual"
          valor={p.scoreAtual !== null ? `${p.scoreAtual}` : "—"}
          detalhe={
            ganho !== null
              ? `${ganho >= 0 ? "+" : ""}${ganho} desde a primeira análise`
              : "Rode uma análise"
          }
        />
        <Metrica
          rotulo="Vagas analisadas"
          valor={`${p.vagasAnalisadas}`}
          detalhe={`${p.semana.vagasNovas} nos últimos 7 dias`}
        />
        <Metrica
          rotulo="Compatibilidade média"
          valor={`${p.compatibilidadeMedia}%`}
          detalhe={`melhor ${p.melhorCompatibilidade}% · pior ${p.piorCompatibilidade}%`}
        />
        <Metrica
          rotulo="Taxa de entrevista"
          valor={`${p.taxaEntrevista}%`}
          detalhe={`${p.totalCandidaturas} candidatura(s) no quadro`}
        />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-base">Evolução da nota ATS</CardTitle>
        </CardHeader>
        <CardContent>
          {p.evolucao.length < 2 ? (
            <p className="text-sm text-muted-foreground">
              Faça pelo menos duas análises do currículo para ver a curva de evolução.
            </p>
          ) : (
            <Grafico pontos={p.evolucao} />
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-base">Funil de candidaturas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {p.funil.map((f) => (
              <div key={f.status}>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{ROTULO_FUNIL[f.status]}</span>
                  <span className="font-medium">{f.total}</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-secondary">
                  <div
                    className="h-2 rounded-full bg-primary"
                    style={{ width: `${(f.total / maxFunil) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-base">
              Palavras-chave que mais faltam no seu currículo
            </CardTitle>
          </CardHeader>
          <CardContent>
            {p.palavrasFaltando.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nada a destacar ainda — analise algumas vagas para descobrir os termos recorrentes.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {p.palavrasFaltando.map((t) => (
                  <span
                    key={t.termo}
                    className="rounded-full border border-realce/30 bg-realce/10 px-2.5 py-1 text-xs text-foreground"
                  >
                    {t.termo}
                    <span className="ml-1 text-muted-foreground">{t.vezes}×</span>
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-base">Resumo da semana</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Nos últimos 7 dias: <strong className="text-foreground">{p.semana.vagasNovas}</strong>{" "}
          vaga(s) nova(s) no radar e{" "}
          <strong className="text-foreground">{p.semana.candidaturasNovas}</strong> candidatura(s)
          adicionada(s). Você tem{" "}
          <strong className="text-foreground">{p.semana.entrevistas}</strong> processo(s) em fase de
          entrevista ou adiante.
        </CardContent>
      </Card>
    </>
  );
}

function Metrica({ rotulo, valor, detalhe }: { rotulo: string; valor: string; detalhe: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs tracking-wide text-muted-foreground uppercase">{rotulo}</p>
        <p className="mt-1 font-display text-3xl font-bold">{valor}</p>
        <p className="mt-1 text-xs text-muted-foreground">{detalhe}</p>
      </CardContent>
    </Card>
  );
}

function Grafico({ pontos }: { pontos: { data: string; score: number }[] }) {
  const largura = 600;
  const altura = 160;
  const passo = largura / Math.max(1, pontos.length - 1);
  const coords = pontos.map((p, i) => ({
    x: i * passo,
    y: altura - (Math.max(0, Math.min(100, p.score)) / 100) * altura,
    ...p,
  }));
  const linha = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x},${c.y}`).join(" ");
  const area = `${linha} L${largura},${altura} L0,${altura} Z`;

  return (
    <div>
      <svg
        viewBox={`0 0 ${largura} ${altura}`}
        className="h-40 w-full"
        role="img"
        aria-label="Evolução da nota ATS"
      >
        <path d={area} fill="var(--primary)" opacity="0.12" />
        <path
          d={linha}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {coords.map((c) => (
          <circle key={c.data} cx={c.x} cy={c.y} r="4" fill="var(--primary)" />
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-xs text-muted-foreground">
        <span>
          {new Date(pontos[0]!.data).toLocaleDateString("pt-BR")} · {pontos[0]!.score}
        </span>
        <span>
          {new Date(pontos[pontos.length - 1]!.data).toLocaleDateString("pt-BR")} ·{" "}
          {pontos[pontos.length - 1]!.score}
        </span>
      </div>
    </div>
  );
}
