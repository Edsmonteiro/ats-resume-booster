import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/app-shell";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ExternalLink, Loader2, Radar as RadarIcon, Eraser, Save, Sparkles } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { HistoricoVagas } from "@/components/historico-vagas";
import { RecomendacoesVagaDialog } from "@/components/recomendacoes-vaga-dialog";
import { ScoreRing } from "@/components/score-ring";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { abrirLinkExterno } from "@/lib/abrir-link";
import { useAuth } from "@/lib/auth";

import {
  atualizarStatusVaga,
  carregarPreferencias,
  limparPreferencias,
  listarVagasRadar,
  registrarAberturaVaga,
  rodarRadar,
  salvarPreferencias,
  type Preferencias,
  type VagaRadar,
} from "@/lib/radar.functions";
import { CONTRATOS, JANELAS_DIAS, JANELA_PADRAO } from "@/lib/radar.schemas";
import { useAssinatura } from "@/lib/use-assinatura";

export const Route = createFileRoute("/radar")({
  head: () => ({
    meta: [
      { title: "Radar de vagas — Eu Passo" },
      {
        name: "description",
        content:
          "Seu recrutador de IA busca vagas nas principais plataformas e ordena tudo pela compatibilidade com o seu currículo.",
      },
      { property: "og:title", content: "Radar de vagas — Eu Passo" },
      {
        property: "og:description",
        content: "Vagas compatíveis com o seu currículo, encontradas automaticamente.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RadarPagina,
});

const MODELOS = ["remoto", "híbrido", "presencial"];
const SENIORIDADES = ["qualquer", "estágio", "júnior", "pleno", "sênior", "especialista"];

const PREFS_VAZIAS: Preferencias = {
  cargos: [],
  senioridade: "qualquer",
  cidade: "",
  estado: "",
  modelos: [],
  contratos: [],
  salarioMinimo: null,
  palavrasEvitar: [],
  ativo: true,
  alertaFrequencia: "nenhum",
  janelaDias: JANELA_PADRAO,
};

function RadarPagina() {
  const { user, carregando: carregandoAuth } = useAuth();
  const { temAcessoA, carregando: carregandoAssinatura } = useAssinatura();
  const ativa = temAcessoA("radar");
  const navigate = useNavigate();

  const carregarPrefs = useServerFn(carregarPreferencias);
  const salvarPrefs = useServerFn(salvarPreferencias);
  const listar = useServerFn(listarVagasRadar);
  const rodar = useServerFn(rodarRadar);
  const mudarStatus = useServerFn(atualizarStatusVaga);
  const limparPrefs = useServerFn(limparPreferencias);
  const registrarAbertura = useServerFn(registrarAberturaVaga);

  const [prefs, setPrefs] = useState<Preferencias>(PREFS_VAZIAS);
  const [cargosTexto, setCargosTexto] = useState("");
  const [evitarTexto, setEvitarTexto] = useState("");
  const [vagas, setVagas] = useState<VagaRadar[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [fonteFiltro, setFonteFiltro] = useState<string>("todas");
  const [limpando, setLimpando] = useState(false);
  const [ordenacao, setOrdenacao] = useState<
    "compatibilidade_desc" | "compatibilidade_asc" | "recentes" | "antigas"
  >("compatibilidade_desc");
  const soRemoto = prefs.modelos.length === 1 && prefs.modelos[0] === "remoto";

  const fontes = Array.from(
    vagas.reduce((mapa, v) => {
      const nome = v.fonte || "Outros";
      mapa.set(nome, (mapa.get(nome) ?? 0) + 1);
      return mapa;
    }, new Map<string, number>()),
  ).sort((a, b) => b[1] - a[1]);

  const vagasVisiveis =
    fonteFiltro === "todas" ? vagas : vagas.filter((v) => (v.fonte || "Outros") === fonteFiltro);

  const recarregarVagas = useCallback(async () => {
    try {
      setVagas(await listar({ data: { ordenacao } }));
    } catch {
      /* sem vagas ainda */
    }
  }, [listar, ordenacao]);

  useEffect(() => {
    if (carregandoAuth) return;
    if (!user) {
      void navigate({ to: "/auth" });
      return;
    }
    void (async () => {
      try {
        const p = await carregarPrefs({});
        setPrefs(p);
        setCargosTexto(p.cargos.join(", "));
        setEvitarTexto(p.palavrasEvitar.join(", "));
      } catch {
        /* usa padrão */
      }
      await recarregarVagas();
    })();
  }, [user, carregandoAuth, carregarPrefs, navigate, recarregarVagas]);

  function paraLista(texto: string) {
    return texto
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }

  async function salvar() {
    setSalvando(true);
    try {
      const atual: Preferencias = {
        ...prefs,
        cargos: paraLista(cargosTexto),
        palavrasEvitar: paraLista(evitarTexto),
      };
      const resultado = await salvarPrefs({ data: atual });
      setPrefs(atual);
      if (resultado.limpou > 0) {
        await recarregarVagas();
        toast.success(
          `Preferências salvas. Limpamos ${resultado.limpou} vaga(s) dos cargos antigos — rode o radar de novo.`,
        );
        return;
      }
      toast.success("Preferências salvas.");
    } catch {
      toast.error("Não foi possível salvar as preferências.");
    } finally {
      setSalvando(false);
    }
  }

  async function limpar() {
    setLimpando(true);
    try {
      const resultado = await limparPrefs({});
      setPrefs(PREFS_VAZIAS);
      setCargosTexto("");
      setEvitarTexto("");
      setFonteFiltro("todas");
      await recarregarVagas();
      toast.success(
        resultado.limpou > 0
          ? `Preferências zeradas e ${resultado.limpou} vaga(s) removida(s) do radar.`
          : "Preferências zeradas.",
      );
    } catch {
      toast.error("Não foi possível limpar as preferências.");
    } finally {
      setLimpando(false);
    }
  }

  async function buscar() {
    if (!ativa) {
      toast.info("O radar automático é exclusivo para assinantes.");
      void navigate({ to: "/planos" });
      return;
    }
    setBuscando(true);
    try {
      const resultado = await rodar({});
      if ("error" in resultado) {
        toast.error(resultado.error);
        return;
      }
      await recarregarVagas();
      toast.success(
        resultado.novas > 0
          ? `${resultado.novas} nova(s) vaga(s) compatível(is) encontrada(s).`
          : "Nenhuma vaga nova por agora. Tente novamente mais tarde.",
      );
    } catch {
      toast.error("O radar falhou nesta rodada. Tente novamente em alguns minutos.");
    } finally {
      setBuscando(false);
    }
  }

  async function descartar(id: string) {
    setVagas((atual) => atual.filter((v) => v.id !== id));
    try {
      await mudarStatus({ data: { id, status: "descartada" } });
    } catch {
      toast.error("Não foi possível descartar a vaga.");
    }
  }

  return (
    <AppShell
      titulo="Radar de vagas"
      descricao="Busca automática com IA nas principais plataformas"
    >
      <header className="text-deep-foreground" style={{ background: "var(--gradient-deep)" }}>
        <div className="mx-auto max-w-6xl px-5 py-7">
          <h1 className="font-display text-2xl sm:text-3xl">
            Vagas que combinam com o seu currículo
          </h1>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-5 py-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <div className="space-y-6">
          {!ativa && !carregandoAssinatura && (
            <Card className="border-primary/40 bg-primary/5">
              <CardContent className="space-y-3 py-5">
                <p className="flex items-center gap-2 font-display text-base font-semibold">
                  <Sparkles className="size-4 text-primary" /> Radar disponível no plano Pro
                </p>
                <p className="text-sm text-muted-foreground">
                  A busca automática nas plataformas de vagas é exclusiva para assinantes. A partir
                  de R$ 10 por mês.
                </p>
                <Button onClick={() => void navigate({ to: "/planos" })}>Ver planos</Button>
              </CardContent>
            </Card>
          )}

          <Card className="h-fit shadow-[var(--shadow-panel)]">
            <CardHeader>
              <CardTitle className="font-display text-lg">Suas preferências</CardTitle>
              <p className="text-sm text-muted-foreground">
                Quanto mais específico, melhor a qualidade das vagas encontradas.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cargos">Cargos desejados (separe por vírgula)</Label>
                <Input
                  id="cargos"
                  value={cargosTexto}
                  onChange={(e) => setCargosTexto(e.target.value)}
                  placeholder="Analista de Dados, Engenheiro de Dados"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="senioridade">Senioridade</Label>
                <select
                  id="senioridade"
                  value={prefs.senioridade}
                  onChange={(e) => setPrefs({ ...prefs, senioridade: e.target.value })}
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                >
                  {SENIORIDADES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>Modelos de trabalho</Label>
                <div className="flex flex-wrap gap-2">
                  {MODELOS.map((m) => {
                    const marcado = prefs.modelos.includes(m);
                    return (
                      <Button
                        key={m}
                        type="button"
                        size="sm"
                        variant={marcado ? "default" : "secondary"}
                        onClick={() => {
                          const modelos = marcado
                            ? prefs.modelos.filter((x) => x !== m)
                            : [...prefs.modelos, m];
                          const apenasRemoto = modelos.length === 1 && modelos[0] === "remoto";
                          setPrefs({
                            ...prefs,
                            modelos,
                            ...(apenasRemoto ? { cidade: "", estado: "" } : {}),
                          });
                        }}
                      >
                        {m}
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tipo de contrato</Label>
                <div className="flex flex-wrap gap-2">
                  {CONTRATOS.map((c) => {
                    const marcado = prefs.contratos.includes(c);
                    return (
                      <Button
                        key={c}
                        type="button"
                        size="sm"
                        variant={marcado ? "default" : "secondary"}
                        onClick={() =>
                          setPrefs({
                            ...prefs,
                            contratos: marcado
                              ? prefs.contratos.filter((x) => x !== c)
                              : [...prefs.contratos, c],
                          })
                        }
                      >
                        {c}
                      </Button>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  Sem seleção, buscamos qualquer tipo de contrato.
                </p>
              </div>

              {soRemoto ? (
                <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                  Como você escolheu apenas vagas remotas, não é preciso informar cidade e estado —
                  buscamos em todo o Brasil.
                </p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="cidade">Cidade</Label>
                    <Input
                      id="cidade"
                      value={prefs.cidade}
                      onChange={(e) => setPrefs({ ...prefs, cidade: e.target.value })}
                      placeholder="São Paulo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estado">Estado</Label>
                    <Input
                      id="estado"
                      value={prefs.estado}
                      onChange={(e) => setPrefs({ ...prefs, estado: e.target.value })}
                      placeholder="SP"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="evitar">Palavras a evitar (separe por vírgula)</Label>
                <Input
                  id="evitar"
                  value={evitarTexto}
                  onChange={(e) => setEvitarTexto(e.target.value)}
                  placeholder="comissionado, porta a porta"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="janela">Janela de postagem</Label>
                <select
                  id="janela"
                  value={prefs.janelaDias}
                  onChange={(e) => setPrefs({ ...prefs, janelaDias: Number(e.target.value) })}
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                >
                  {JANELAS_DIAS.map((d) => (
                    <option key={d} value={d}>
                      Últimos {d} dias
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  Anúncios publicados fora dessa janela saem do radar automaticamente.
                </p>
              </div>

              <div className="space-y-2 rounded-lg border border-primary/30 bg-primary/5 p-3">
                <Label htmlFor="alertas">Alertas de novas vagas</Label>
                <select
                  id="alertas"
                  value={prefs.alertaFrequencia}
                  onChange={(e) =>
                    setPrefs({
                      ...prefs,
                      alertaFrequencia: e.target.value as Preferencias["alertaFrequencia"],
                    })
                  }
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                >
                  <option value="nenhum">Desligados</option>
                  <option value="diario">Diários</option>
                  <option value="semanal">Semanais</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  Rodamos o radar automaticamente e avisamos no sino do app quando aparecerem vagas
                  compatíveis.
                </p>
              </div>

              <Button
                className="w-full"
                variant="secondary"
                onClick={() => void salvar()}
                disabled={salvando}
              >
                {salvando ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                Salvar preferências
              </Button>

              <Button
                className="w-full"
                variant="ghost"
                onClick={() => void limpar()}
                disabled={limpando || salvando}
              >
                {limpando ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Eraser className="size-4" />
                )}
                Limpar preferências
              </Button>

              <Button
                className="w-full"
                variant="default"
                onClick={() => void buscar()}
                disabled={buscando || carregandoAssinatura}
              >
                {buscando ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Sparkles className="size-4" />
                )}
                {buscando ? "Procurando vagas…" : "Rodar radar agora"}
              </Button>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="radar" className="space-y-4">
          <TabsList>
            <TabsTrigger value="radar">Radar ({vagas.length})</TabsTrigger>
            <TabsTrigger value="historico">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="radar" className="space-y-4">
            {fontes.length > 1 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                  Onde estão
                </span>
                <Button
                  size="sm"
                  variant={fonteFiltro === "todas" ? "default" : "secondary"}
                  onClick={() => setFonteFiltro("todas")}
                >
                  Todas ({vagas.length})
                </Button>
                {fontes.map(([nome, total]) => (
                  <Button
                    key={nome}
                    size="sm"
                    variant={fonteFiltro === nome ? "default" : "secondary"}
                    onClick={() => setFonteFiltro(nome)}
                  >
                    {nome} ({total})
                  </Button>
                ))}
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                Ordenar por
              </span>
              <select
                value={ordenacao}
                onChange={(e) => {
                  const nova = e.target.value as typeof ordenacao;
                  setOrdenacao(nova);
                  void recarregarVagas();
                }}
                className="h-8 rounded-md border border-input bg-transparent px-2 text-sm"
              >
                <option value="compatibilidade_desc">Maior compatibilidade</option>
                <option value="compatibilidade_asc">Menor compatibilidade</option>
                <option value="recentes">Mais recentes</option>
                <option value="antigas">Mais antigas</option>
              </select>
            </div>
            {vagasVisiveis.length === 0 ? (
              <Card className="flex min-h-80 items-center justify-center border-dashed shadow-none">
                <CardContent className="max-w-sm py-12 text-center">
                  <RadarIcon className="mx-auto size-6 text-muted-foreground" />
                  <p className="mt-3 font-display text-base font-semibold">
                    {vagas.length > 0 ? "Nada nesta plataforma" : "Nenhuma vaga no radar ainda"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {vagas.length > 0
                      ? "Nenhuma vaga desta plataforma no momento. Escolha outra fonte acima."
                      : "Salve suas preferências e rode o radar para receber as vagas mais compatíveis com o seu currículo."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              vagasVisiveis.map((vaga) => (
                <Card key={vaga.id} className="shadow-[var(--shadow-panel)]">
                  <CardContent className="flex flex-col gap-5 py-6 sm:flex-row">
                    <ScoreRing valor={vaga.compatibilidade} tamanho={96} legenda="Match" />
                    <div className="min-w-0 flex-1 space-y-3">
                      <div>
                        <p className="font-display text-base font-semibold">{vaga.titulo}</p>
                        <p className="text-sm text-muted-foreground">
                          {[vaga.empresa, vaga.local, vaga.modelo].filter(Boolean).join(" · ") ||
                            vaga.fonte}
                        </p>
                      </div>
                      <p className="text-sm leading-relaxed">{vaga.motivo}</p>
                      {vaga.lacunas.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                            O que pode pesar contra
                          </p>
                          <ul className="mt-1 list-disc space-y-1 pl-5">
                            {vaga.lacunas.map((l) => (
                              <li key={l} className="text-sm text-muted-foreground">
                                {l}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            abrirLinkExterno(vaga.link);
                            void registrarAbertura({ data: { id: vaga.id } }).catch(() => {});
                          }}
                        >
                          Abrir vaga <ExternalLink className="size-3" />
                        </Button>

                        <RecomendacoesVagaDialog
                          vagaId={vaga.id}
                          titulo={vaga.titulo}
                          compatibilidade={vaga.compatibilidade}
                        />
                        <span className="text-xs text-muted-foreground">via {vaga.fonte}</span>
                        <Button size="sm" variant="ghost" onClick={() => void descartar(vaga.id)}>
                          Descartar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="historico">
            <HistoricoVagas />
          </TabsContent>
        </Tabs>
      </main>
    </AppShell>
  );
}
