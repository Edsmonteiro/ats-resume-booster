import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowRight, Minus, Plus, Radar, Sparkles, Target } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Vaga } from "@/components/vagas-panel";
import type { AtsAnalysis } from "@/lib/ats.functions";
import { useAuth } from "@/lib/auth";
import { listarCandidaturas } from "@/lib/candidaturas.functions";
import { listarVagasRadar } from "@/lib/radar.functions";
import { useLocalState } from "@/lib/use-local-state";

const DIA = 86_400_000;
const PARADA_APOS_DIAS = 7;

function Indicador({
  rotulo,
  valor,
  detalhe,
}: {
  rotulo: string;
  valor: string;
  detalhe?: string;
}) {
  return (
    <div className="cartao min-w-0 px-3.5 py-3">
      <p className="truncate text-[0.68rem] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
        {rotulo}
      </p>
      <p className="numeros mt-1 font-display text-2xl leading-none font-bold">{valor}</p>
      {detalhe ? <p className="mt-1 truncate text-xs text-muted-foreground">{detalhe}</p> : null}
    </div>
  );
}

export function PainelHoje({ analise, vagas }: { analise: AtsAnalysis | null; vagas: Vaga[] }) {
  const { user } = useAuth();
  const buscarCandidaturas = useServerFn(listarCandidaturas);
  const buscarRadar = useServerFn(listarVagasRadar);

  const [meta, setMeta] = useLocalState<number>("eupasso:meta-semanal", 5);

  const candidaturas = useQuery({
    queryKey: ["candidaturas", user?.id],
    queryFn: () => buscarCandidaturas(),
    enabled: Boolean(user),
  });

  const radar = useQuery({
    queryKey: ["radar-hoje", user?.id],
    queryFn: () => buscarRadar({ data: { ordenacao: "recentes" } }),
    enabled: Boolean(user),
  });

  const lista = candidaturas.data ?? [];
  const agora = Date.now();

  const enviadasNaSemana = lista.filter(
    (c) => c.enviada_em && agora - new Date(c.enviada_em).getTime() < 7 * DIA,
  ).length;

  const paradas = lista.filter(
    (c) =>
      !["recusado", "oferta", "interessado"].includes(c.status) &&
      agora - new Date(c.updated_at).getTime() > PARADA_APOS_DIAS * DIA,
  );

  const ativas = lista.filter((c) => !["recusado", "oferta"].includes(c.status)).length;

  const novasNoRadar = (radar.data ?? []).filter(
    (v) => v.status === "nova" && agora - new Date(v.criadaEm).getTime() < 3 * DIA,
  ).length;

  const comMatch = vagas.filter((v) => v.resultado);
  const matchMedio = comMatch.length
    ? Math.round(
        comMatch.reduce((t, v) => t + (v.resultado?.compatibilidade ?? 0), 0) / comMatch.length,
      )
    : null;

  const fortesSemCarta = vagas.filter(
    (v) => (v.resultado?.compatibilidade ?? 0) >= 80 && !v.carta,
  ).length;

  const progresso = Math.min(100, meta > 0 ? Math.round((enviadasNaSemana / meta) * 100) : 0);

  const proximoPasso = !analise
    ? { texto: "Analise seu currículo para saber o que trava você na triagem.", para: null }
    : paradas.length > 0
      ? {
          texto: `${paradas.length} candidatura${paradas.length > 1 ? "s" : ""} sem movimento há mais de ${PARADA_APOS_DIAS} dias — faça o follow-up.`,
          para: "/candidaturas" as const,
        }
      : novasNoRadar > 0
        ? {
            texto: `${novasNoRadar} vaga${novasNoRadar > 1 ? "s novas" : " nova"} no radar esperando sua avaliação.`,
            para: "/radar" as const,
          }
        : fortesSemCarta > 0
          ? {
              texto: `${fortesSemCarta} vaga${fortesSemCarta > 1 ? "s" : ""} com match acima de 80% ainda sem carta gerada.`,
              para: null,
            }
          : enviadasNaSemana < meta
            ? {
                texto: `Faltam ${meta - enviadasNaSemana} candidatura${meta - enviadasNaSemana > 1 ? "s" : ""} para bater a meta da semana.`,
                para: "/radar" as const,
              }
            : { texto: "Meta da semana batida. Aproveite para revisar seu LinkedIn.", para: null };

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Indicador
          rotulo="Score ATS"
          valor={analise ? String(Math.round(analise.score)) : "—"}
          detalhe={analise ? "do seu currículo" : "sem análise ainda"}
        />
        <Indicador
          rotulo="Match médio"
          valor={matchMedio !== null ? `${matchMedio}%` : "—"}
          detalhe={`${comMatch.length} vaga${comMatch.length === 1 ? "" : "s"} avaliada${comMatch.length === 1 ? "" : "s"}`}
        />
        <Indicador
          rotulo="Candidaturas"
          valor={user ? String(ativas) : "—"}
          detalhe={user ? "em andamento" : "entre na conta"}
        />
        <Indicador
          rotulo="Radar"
          valor={user ? String(novasNoRadar) : "—"}
          detalhe="novas em 3 dias"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card className="shadow-[var(--shadow-panel)]">
          <CardContent className="space-y-4 py-5">
            <div className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/12 text-primary">
                <Sparkles className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="text-[0.7rem] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                  Seu próximo passo
                </p>
                <p className="mt-1 text-sm leading-relaxed font-medium">{proximoPasso.texto}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {proximoPasso.para ? (
                <Button asChild size="sm" className="max-sm:w-full">
                  <Link to={proximoPasso.para}>
                    Ir agora <ArrowRight className="size-4" />
                  </Link>
                </Button>
              ) : null}
              <Button asChild size="sm" variant="outline" className="max-sm:w-full">
                <Link to="/radar">
                  <Radar className="size-4" /> Radar de vagas
                </Link>
              </Button>
            </div>

            {paradas.length > 0 ? (
              <div className="rounded-lg border border-border bg-secondary/40 p-3">
                <p className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                  <AlertTriangle className="size-3.5" /> Paradas há mais de {PARADA_APOS_DIAS} dias
                </p>
                <ul className="mt-2 space-y-1">
                  {paradas.slice(0, 3).map((c) => (
                    <li key={c.id} className="truncate text-sm">
                      {c.titulo}
                      {c.empresa ? ` · ${c.empresa}` : ""}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="shadow-[var(--shadow-panel)]">
          <CardContent className="space-y-4 py-5">
            <div className="flex items-center gap-2">
              <Target className="size-4 text-primary" />
              <p className="text-[0.7rem] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                Meta da semana
              </p>
            </div>

            <div>
              <p className="numeros font-display text-2xl font-bold">
                {enviadasNaSemana}
                <span className="text-base font-medium text-muted-foreground"> / {meta}</span>
              </p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-500"
                  style={{ width: `${progresso}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Candidaturas enviadas nos últimos 7 dias.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="outline"
                aria-label="Diminuir meta"
                onClick={() => setMeta(Math.max(1, meta - 1))}
              >
                <Minus className="size-4" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                aria-label="Aumentar meta"
                onClick={() => setMeta(Math.min(30, meta + 1))}
              >
                <Plus className="size-4" />
              </Button>
              <span className="text-xs text-muted-foreground">Ajuste sua meta semanal</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
