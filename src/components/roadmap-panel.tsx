import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BookOpen, ExternalLink, Loader2, Map, Plus, RefreshCw, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import type { AtsAnalysis } from "@/lib/ats.functions";
import { useAuth } from "@/lib/auth";
import { carregarPerfil } from "@/lib/dados.functions";
import {
  atualizarItemRoadmap,
  buscarCursosDaHabilidade,
  carregarRitmo,
  excluirItemRoadmap,
  gerarTrilha,
  listarRoadmap,
  listarSessoes,
  registrarHoras,
  salvarRitmo,
  type CursoGratuito,
  type ItemRoadmap,
} from "@/lib/roadmap.functions";
import { NIVEIS, ROTULO_NIVEL } from "@/lib/roadmap.schemas";
import { cn } from "@/lib/utils";

type VagaLacunas = Record<string, unknown>;

function lacunasDe(analise: AtsAnalysis | null, vagas: unknown[]): string[] {
  const termos = new Set<string>();
  for (const p of analise?.palavrasChaveFaltando ?? []) termos.add(p);
  for (const v of vagas as VagaLacunas[]) {
    const lista = Array.isArray(v?.["lacunas"]) ? (v["lacunas"] as { requisito?: string }[]) : [];
    for (const l of lista) if (l?.requisito) termos.add(l.requisito);
  }
  return [...termos].slice(0, 40);
}

const COR_PRIORIDADE: Record<string, string> = {
  alta: "bg-destructive/12 text-destructive",
  media: "bg-primary/12 text-primary",
  baixa: "bg-muted text-muted-foreground",
};

const DIA_CURTO = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" });

/** Trilha de conhecimentos com ritmo de estudo e gráfico de evolução. */
export function RoadmapPanel({
  curriculo,
  analise,
  vagas,
}: {
  curriculo: string;
  analise: AtsAnalysis | null;
  vagas: unknown[];
}) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const buscar = useServerFn(listarRoadmap);
  const gerar = useServerFn(gerarTrilha);
  const atualizar = useServerFn(atualizarItemRoadmap);
  const excluir = useServerFn(excluirItemRoadmap);
  const perfil = useServerFn(carregarPerfil);
  const lerRitmo = useServerFn(carregarRitmo);
  const gravarRitmo = useServerFn(salvarRitmo);
  const lerSessoes = useServerFn(listarSessoes);
  const gravarHoras = useServerFn(registrarHoras);

  const [horasDia, setHorasDia] = useState(1);
  const [diasSemana, setDiasSemana] = useState(5);

  const lista = useQuery({
    queryKey: ["roadmap", user?.id],
    queryFn: () => buscar(),
    enabled: Boolean(user),
  });

  const ritmo = useQuery({
    queryKey: ["roadmap-ritmo", user?.id],
    queryFn: () => lerRitmo(),
    enabled: Boolean(user),
  });

  const sessoes = useQuery({
    queryKey: ["roadmap-sessoes", user?.id],
    queryFn: () => lerSessoes(),
    enabled: Boolean(user),
  });

  useEffect(() => {
    if (ritmo.data) {
      setHorasDia(Number(ritmo.data.horas_dia));
      setDiasSemana(Number(ritmo.data.dias_semana));
    }
  }, [ritmo.data]);

  const mRitmo = useMutation({
    mutationFn: () => gravarRitmo({ data: { horas_dia: horasDia, dias_semana: diasSemana } }),
    onSuccess: () => {
      toast.success("Ritmo de estudo salvo");
      qc.invalidateQueries({ queryKey: ["roadmap-ritmo", user?.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const mGerar = useMutation({
    mutationFn: async () => {
      const p = await perfil().catch(() => ({ cargoDesejado: "" }));
      return gerar({
        data: {
          curriculo,
          cargo: p.cargoDesejado ?? "",
          lacunas: lacunasDe(analise, vagas),
          horasDia,
          diasSemana,
        },
      });
    },
    onSuccess: (itens) => {
      toast.success(`Trilha com ${itens.length} conhecimentos pronta`);
      qc.invalidateQueries({ queryKey: ["roadmap", user?.id] });
      qc.invalidateQueries({ queryKey: ["roadmap-sessoes", user?.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const mHoras = useMutation({
    mutationFn: (v: { id: string; horas: number }) => gravarHoras({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["roadmap", user?.id] });
      qc.invalidateQueries({ queryKey: ["roadmap-sessoes", user?.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const mConcluir = useMutation({
    mutationFn: (v: { id: string; concluido: boolean }) =>
      atualizar({ data: { id: v.id, status: v.concluido ? "concluido" : "estudando" } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["roadmap", user?.id] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const mExcluir = useMutation({
    mutationFn: (id: string) => excluir({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["roadmap", user?.id] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const itens = useMemo(() => lista.data ?? [], [lista.data]);
  const horasSemana = Math.round(horasDia * diasSemana * 10) / 10;
  const totalHoras = itens.reduce((s, i) => s + Number(i.horas_estimadas || 0), 0);
  const horasFeitas = itens.reduce((s, i) => s + Number(i.horas_feitas || 0), 0);
  const semanas = horasSemana > 0 ? Math.ceil(Math.max(totalHoras - horasFeitas, 0) / horasSemana) : 0;
  const progresso = totalHoras > 0 ? Math.round((horasFeitas / totalHoras) * 100) : 0;

  const dadosGrafico = useMemo(() => {
    const registros = sessoes.data ?? [];
    if (!registros.length) return [];
    let acumulado = 0;
    return registros.map((s, indice) => {
      acumulado += Number(s.horas);
      const data = new Date(`${s.dia}T12:00:00`);
      return {
        dia: DIA_CURTO.format(data),
        estudado: Math.round(acumulado * 10) / 10,
        meta: Math.round(((horasSemana / 7) * (indice + 1)) * 10) / 10,
      };
    });
  }, [sessoes.data, horasSemana]);

  if (!user) {
    return (
      <Card className="shadow-[var(--shadow-panel)]">
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <Map className="size-8 text-muted-foreground" />
          <p className="max-w-sm text-sm text-muted-foreground">
            Entre na sua conta para montar sua trilha de conhecimentos e acompanhar a evolução.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="shadow-[var(--shadow-panel)]">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-base">Quanto tempo você tem para estudar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Horas por dia</span>
                <span className="numeros font-semibold">{horasDia.toFixed(2).replace(/\.?0+$/, "")} h</span>
              </div>
              <Slider
                value={[horasDia]}
                min={0.5}
                max={8}
                step={0.5}
                onValueChange={([v]) => setHorasDia(v ?? 1)}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Dias por semana</span>
                <span className="numeros font-semibold">{diasSemana}</span>
              </div>
              <Slider
                value={[diasSemana]}
                min={1}
                max={7}
                step={1}
                onValueChange={([v]) => setDiasSemana(v ?? 5)}
              />
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            <span className="numeros font-semibold text-foreground">{horasSemana} h</span> por semana
            {totalHoras > 0 ? (
              <>
                {" "}
                — trilha atual de{" "}
                <span className="numeros font-semibold text-foreground">{totalHoras} h</span>, restam
                cerca de{" "}
                <span className="numeros font-semibold text-foreground">{semanas} semana(s)</span>.
              </>
            ) : null}
          </p>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => mRitmo.mutate()} className="max-sm:w-full">
              Salvar ritmo
            </Button>
            <Button
              size="sm"
              onClick={() => mGerar.mutate()}
              disabled={curriculo.trim().length < 50 || mGerar.isPending}
              className="max-sm:w-full"
            >
              {mGerar.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RefreshCw className="size-4" />
              )}
              {itens.length ? "Refazer trilha nesse ritmo" : "Montar trilha"}
            </Button>
          </div>
          {curriculo.trim().length < 50 ? (
            <p className="text-xs text-muted-foreground">
              Cole seu currículo na página inicial para montar a trilha.
            </p>
          ) : null}
        </CardContent>
      </Card>

      {itens.length ? (
        <Card className="shadow-[var(--shadow-panel)]">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-base">Evolução dos estudos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                <span className="numeros font-semibold text-foreground">{horasFeitas}</span> de{" "}
                <span className="numeros">{totalHoras}</span> h concluídas
              </span>
              <span className="numeros font-semibold">{progresso}%</span>
            </div>
            <Progress value={progresso} />

            {dadosGrafico.length ? (
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dadosGrafico} margin={{ left: -20, right: 8, top: 8 }}>
                    <defs>
                      <linearGradient id="grad-estudo" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="dia" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <ChartTooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                      formatter={(valor: number, nome: string) => [
                        `${valor} h`,
                        nome === "estudado" ? "Estudado" : "Meta do ritmo",
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="estudado"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      fill="url(#grad-estudo)"
                    />
                    <Line
                      type="monotone"
                      dataKey="meta"
                      stroke="hsl(var(--muted-foreground))"
                      strokeDasharray="4 4"
                      strokeWidth={1.5}
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Registre horas nos itens abaixo para o gráfico começar a desenhar sua evolução.
              </p>
            )}
          </CardContent>
        </Card>
      ) : null}

      {lista.isLoading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Carregando trilha…</p>
      ) : itens.length === 0 ? (
        <Card className="shadow-[var(--shadow-panel)]">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Map className="size-8 text-muted-foreground" />
            <p className="max-w-sm text-sm text-muted-foreground">
              Ainda sem trilha. A IA lê seu currículo, o cargo desejado e as lacunas das vagas e
              distribui os estudos dentro do tempo que você tem.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-5">
          {NIVEIS.map((nivel) => {
            const doNivel = itens.filter((i) => i.nivel === nivel);
            if (!doNivel.length) return null;
            return (
              <section key={nivel} className="space-y-3">
                <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {ROTULO_NIVEL[nivel]}
                </h3>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {doNivel.map((item) => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      onHoras={(horas) => mHoras.mutate({ id: item.id, horas })}
                      onConcluir={(concluido) => mConcluir.mutate({ id: item.id, concluido })}
                      onExcluir={() => mExcluir.mutate(item.id)}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ItemCard({
  item,
  onHoras,
  onConcluir,
  onExcluir,
}: {
  item: ItemRoadmap;
  onHoras: (horas: number) => void;
  onConcluir: (concluido: boolean) => void;
  onExcluir: () => void;
}) {
  const buscarCursos = useServerFn(buscarCursosDaHabilidade);
  const [cursos, setCursos] = useState<CursoGratuito[] | null>(null);

  const mCursos = useMutation({
    mutationFn: () => buscarCursos({ data: { habilidade: item.habilidade } }),
    onSuccess: (lista) => {
      setCursos(lista);
      if (!lista.length) toast.info("Nenhum curso gratuito encontrado agora.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const estimadas = Number(item.horas_estimadas || 0);
  const feitas = Number(item.horas_feitas || 0);
  const pct = estimadas > 0 ? Math.min(100, Math.round((feitas / estimadas) * 100)) : 0;
  const concluido = item.status === "concluido";

  return (
    <Card className={cn("shadow-[var(--shadow-panel)]", concluido ? "opacity-75" : null)}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="font-display text-base leading-tight">{item.habilidade}</CardTitle>
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-xs",
              COR_PRIORIDADE[item.prioridade] ?? COR_PRIORIDADE["media"],
            )}
          >
            {item.prioridade}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {item.porque ? <p className="text-muted-foreground">{item.porque}</p> : null}
        {item.como_comprovar ? (
          <p className="text-muted-foreground">
            <span className="font-medium text-foreground">No currículo: </span>
            {item.como_comprovar}
          </p>
        ) : null}

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="numeros">
              {feitas} / {estimadas} h
            </span>
            <span className="numeros">{pct}%</span>
          </div>
          <Progress value={pct} />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {[0.5, 1, 2].map((h) => (
            <Button key={h} size="sm" variant="outline" onClick={() => onHoras(h)}>
              <Plus className="size-3.5" />
              {h} h
            </Button>
          ))}
          <Button
            size="sm"
            variant={concluido ? "default" : "ghost"}
            onClick={() => onConcluir(!concluido)}
          >
            {concluido ? "Concluído" : "Marcar concluído"}
          </Button>
          <Button size="sm" variant="ghost" onClick={onExcluir} aria-label="Remover item">
            <Trash2 className="size-4" />
          </Button>
        </div>

        <div className="space-y-2 border-t border-border pt-3">
          <Button
            size="sm"
            variant="outline"
            onClick={() => mCursos.mutate()}
            disabled={mCursos.isPending}
          >
            {mCursos.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <BookOpen className="size-4" />
            )}
            Cursos gratuitos
          </Button>

          {cursos?.length ? (
            <ul className="space-y-1.5">
              {cursos.map((c) => (
                <li key={c.url}>
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="flex items-start gap-1.5 text-xs text-primary hover:underline"
                  >
                    <ExternalLink className="mt-0.5 size-3 shrink-0" />
                    <span>
                      {c.titulo}
                      <span className="text-muted-foreground"> — {c.plataforma}</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
