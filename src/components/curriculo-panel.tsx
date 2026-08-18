import { useServerFn } from "@tanstack/react-start";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  EyeOff,
  FileUp,
  Highlighter,
  Loader2,
  PlayCircle,
  Sparkles,
  Wand2,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { CompartilharDialog } from "@/components/compartilhar-dialog";
import { CurriculoDestacado, type TermoDestaque } from "@/components/curriculo-destacado";
import { CurriculoRevisadoDialog } from "@/components/curriculo-revisado-dialog";
import { GravidadeBadge } from "@/components/gravidade-badge";
import { HistoricoAnalises, type EntradaHistorico } from "@/components/historico-analises";
import { ScoreRing } from "@/components/score-ring";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { analisarCurriculo, type AtsAnalysis } from "@/lib/ats.functions";
import { CURRICULO_EXEMPLO } from "@/lib/curriculo-exemplo";
import { extrairTextoDoArquivo } from "@/lib/extrair-texto";

type Densidade = "compacta" | "confortavel";

const densidades: Record<Densidade, { header: string; conteudo: string; item: string; gap: string; gapMin: string }> = {
  compacta: { header: "pb-2", conteudo: "pt-0", item: "p-2.5", gap: "space-y-2", gapMin: "space-y-0.5" },
  confortavel: { header: "", conteudo: "", item: "p-4", gap: "space-y-4", gapMin: "space-y-2" },
};

function BotaoRestante({
  quantidade,
  aberto,
  onToggle,
}: {
  quantidade: number;
  aberto: boolean;
  onToggle: () => void;
}) {
  if (quantidade <= 0 && !aberto) return null;
  return (
    <Button variant="ghost" size="sm" className="mt-2 w-full gap-1 text-xs text-muted-foreground" onClick={onToggle}>
      {aberto ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
      {aberto ? "Mostrar só os críticos" : `Mostrar os outros ${quantidade}`}
    </Button>
  );
}


const statusEstilo: Record<string, string> = {
  ok: "text-primary",
  melhorar: "text-realce",
  ausente: "text-destructive",
};

export function CurriculoPanel({
  texto,
  setTexto,
  analise,
  setAnalise,
  historico,
  setHistorico,
}: {
  texto: string;
  setTexto: (v: string) => void;
  analise: AtsAnalysis | null;
  setAnalise: (v: AtsAnalysis | null) => void;
  historico: EntradaHistorico[];
  setHistorico: (v: EntradaHistorico[]) => void;
}) {
  const analisar = useServerFn(analisarCurriculo);
  const [carregando, setCarregando] = useState(false);
  const [lendoArquivo, setLendoArquivo] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const cartaoCurriculoRef = useRef<HTMLDivElement>(null);

  const [densidade, setDensidade] = useState<Densidade>("confortavel");
  const [somenteCriticos, setSomenteCriticos] = useState(true);
  const [destaque, setDestaque] = useState<TermoDestaque[]>([]);
  const [expandido, setExpandido] = useState({
    problemas: false,
    palavras: false,
    secoes: false,
    reescritas: false,
  });

  const d = densidades[densidade];

  function alternar(chave: keyof typeof expandido) {
    setExpandido((prev) => ({ ...prev, [chave]: !prev[chave] }));
  }

  function destacarTermos(termos: TermoDestaque[]) {
    setDestaque(termos);
    cartaoCurriculoRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const problemasTodos = analise?.problemasAts ?? [];
  const palavrasTodas = analise?.palavrasChaveFaltando ?? [];
  const secoesTodas = analise?.secoes ?? [];
  const reescritasTodas = analise?.reescritas ?? [];

  const filtrar = somenteCriticos;
  const problemasVisiveis =
    filtrar && !expandido.problemas
      ? problemasTodos.filter((p) => p.gravidade === "alta").length > 0
        ? problemasTodos.filter((p) => p.gravidade === "alta")
        : problemasTodos.slice(0, 2)
      : problemasTodos;
  const palavrasVisiveis = filtrar && !expandido.palavras ? palavrasTodas.slice(0, 8) : palavrasTodas;
  const secoesVisiveis =
    filtrar && !expandido.secoes ? secoesTodas.filter((s) => s.status !== "ok") : secoesTodas;
  const reescritasVisiveis = filtrar && !expandido.reescritas ? reescritasTodas.slice(0, 2) : reescritasTodas;




  async function aoEscolherArquivo(file: File | undefined) {
    if (!file) return;
    setLendoArquivo(true);
    try {
      const conteudo = await extrairTextoDoArquivo(file);
      if (conteudo.length < 50) throw new Error("Não consegui ler texto suficiente. O arquivo pode ser digitalizado.");
      setTexto(conteudo);
      toast.success(`Currículo carregado (${conteudo.length.toLocaleString("pt-BR")} caracteres).`);
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível ler o arquivo.");
    } finally {
      setLendoArquivo(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function rodarAnalise() {
    if (texto.trim().length < 50) {
      toast.error("Cole ou envie um currículo com mais conteúdo.");
      return;
    }
    setCarregando(true);
    try {
      const resultado = await analisar({ data: { texto: texto.trim().slice(0, 30000) } });
      setAnalise(resultado);
      setHistorico(
        [
          {
            id: crypto.randomUUID(),
            criadaEm: new Date().toISOString(),
            score: resultado.score,
            resumo: resultado.resumo,
            problemas: resultado.problemasAts.length,
          },
          ...historico,
        ].slice(0, 8),
      );
      toast.success("Análise concluída.");

    } catch {
      toast.error("Não foi possível analisar agora. Tente novamente em instantes.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      <Card ref={cartaoCurriculoRef} className="h-fit shadow-[var(--shadow-panel)]">
        <CardHeader>
          <CardTitle className="font-display text-lg">Seu currículo</CardTitle>
          <p className="text-sm text-muted-foreground">
            Envie um PDF, DOCX ou TXT — ou cole o texto. Tudo fica salvo apenas neste navegador.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.docx,.txt,.md"
            className="hidden"
            onChange={(e) => void aoEscolherArquivo(e.target.files?.[0])}
          />
          {destaque.length === 0 && (
            <Button
              variant="outline"
              className="h-24 w-full border-dashed"
              onClick={() => inputRef.current?.click()}
              disabled={lendoArquivo}
            >
              {lendoArquivo ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <span className="flex flex-col items-center gap-1">
                  <FileUp className="size-5" />
                  <span className="text-sm font-medium">Enviar arquivo do currículo</span>
                  <span className="text-xs text-muted-foreground">PDF, DOCX ou TXT</span>
                </span>
              )}
            </Button>
          )}

          {destaque.length > 0 ? (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-secondary/40 px-2 py-1.5">
                <span className="flex items-center gap-1.5 text-xs font-medium">
                  <Highlighter className="size-3.5 text-primary" />
                  Destacando: {destaque.map((t) => t.termo).slice(0, 3).join(", ")}
                  {destaque.length > 3 && ` +${destaque.length - 3}`}
                </span>
                <Button variant="ghost" size="sm" className="h-6 gap-1 text-xs" onClick={() => setDestaque([])}>
                  <EyeOff className="size-3" />
                  Sair do modo destaque
                </Button>
              </div>
              <CurriculoDestacado
                texto={texto}
                termos={destaque}
                className="max-h-96 overflow-y-auto rounded-md border bg-background p-3"
              />
            </div>
          ) : (
            <Textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Ou cole aqui o conteúdo do seu currículo…"
              className="min-h-64 resize-y font-mono text-xs leading-relaxed"
            />
          )}


          {texto.trim().length < 50 && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full gap-2 text-muted-foreground"
              onClick={() => {
                setTexto(CURRICULO_EXEMPLO);
                toast.info("Currículo de exemplo carregado — clique em Analisar para ATS.");
              }}
            >
              <PlayCircle className="size-4" />
              Testar com um currículo de exemplo
            </Button>
          )}

          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">
              {texto.trim() ? `${texto.trim().length.toLocaleString("pt-BR")} caracteres` : "Nenhum currículo ainda"}
            </span>
            <Button onClick={() => void rodarAnalise()} disabled={carregando}>
              {carregando ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              {carregando ? "Analisando…" : "Analisar para ATS"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <HistoricoAnalises historico={historico} setHistorico={setHistorico} />
        {!analise ? (
          <Card className="flex h-full min-h-80 items-center justify-center border-dashed shadow-none">
            <CardContent className="max-w-sm py-12 text-center">
              <Wand2 className="mx-auto size-6 text-muted-foreground" />
              <p className="mt-3 font-display text-base font-semibold">Nenhuma análise ainda</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Depois de carregar o currículo, mostramos a nota ATS, os pontos que travam robôs de triagem e
                reescritas prontas.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>

            <Card className="shadow-[var(--shadow-panel)]">
              <CardContent className="flex flex-col items-center gap-6 pt-6 sm:flex-row sm:items-start">
                <ScoreRing valor={analise.score} legenda="Nota ATS" />
                <div className="flex-1 space-y-3">
                  <p className="text-sm leading-relaxed text-foreground">{analise.resumo}</p>
                  {analise.pontosFortes.length > 0 && (
                    <ul className="space-y-1">
                      {analise.pontosFortes.map((p) => (
                        <li key={p} className="flex gap-2 text-sm text-muted-foreground">
                          <span className="text-primary">✓</span>
                          {p}
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="flex flex-wrap items-center gap-2">
                    <CurriculoRevisadoDialog texto={texto} analise={analise} />
                    <CompartilharDialog
                      analise={analise}
                      scoreAntes={historico.length > 1 ? historico[historico.length - 1]!.score : null}
                    />
                  </div>

                </div>
              </CardContent>
            </Card>


            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-secondary/30 px-3 py-2">
              <label className="flex cursor-pointer items-center gap-2 text-xs font-medium">
                <Switch checked={somenteCriticos} onCheckedChange={setSomenteCriticos} />
                Só itens críticos
              </label>
              <div className="flex items-center gap-2">
                {destaque.length > 0 && (
                  <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => setDestaque([])}>
                    <EyeOff className="size-3.5" />
                    Limpar destaques
                  </Button>
                )}
                <ToggleGroup
                  type="single"
                  value={densidade}
                  onValueChange={(v) => v && setDensidade(v as Densidade)}
                  className="rounded-md border bg-background"
                >
                  <ToggleGroupItem value="compacta" className="h-7 px-2 text-xs" aria-label="Densidade compacta">
                    Compacta
                  </ToggleGroupItem>
                  <ToggleGroupItem value="confortavel" className="h-7 px-2 text-xs" aria-label="Densidade confortável">
                    Confortável
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>

            <Tabs
              defaultValue={
                analise.problemasAts.length > 0
                  ? "problemas"
                  : analise.palavrasChaveFaltando.length > 0
                    ? "palavras"
                    : analise.secoes.length > 0
                      ? "secoes"
                      : "reescritas"
              }
              className="w-full"
            >
              <TabsList className="grid h-auto w-full grid-cols-2 gap-1 sm:grid-cols-4">
                <TabsTrigger value="problemas" className="text-xs">
                  Travas ATS
                  {analise.problemasAts.length > 0 && (
                    <span className="ml-1.5 rounded bg-accent/25 px-1 text-[10px]">
                      {analise.problemasAts.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="palavras" className="text-xs">
                  Palavras-chave
                  {analise.palavrasChaveFaltando.length > 0 && (
                    <span className="ml-1.5 rounded bg-accent/25 px-1 text-[10px]">
                      {analise.palavrasChaveFaltando.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="secoes" className="text-xs">
                  Seções
                  {analise.secoes.length > 0 && (
                    <span className="ml-1.5 rounded bg-accent/25 px-1 text-[10px]">{analise.secoes.length}</span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="reescritas" className="text-xs">
                  Reescritas
                  {analise.reescritas.length > 0 && (
                    <span className="ml-1.5 rounded bg-accent/25 px-1 text-[10px]">
                      {analise.reescritas.length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="problemas" className="mt-4">
                <Card className="shadow-[var(--shadow-panel)]">
                  <CardHeader className={d.header}>
                    <CardTitle className="flex items-center gap-2 font-display text-base">
                      <AlertTriangle className="size-4 text-accent" />O que trava o robô de triagem
                    </CardTitle>
                  </CardHeader>
                  <CardContent className={`max-h-[26rem] overflow-y-auto ${d.conteudo} ${d.gap}`}>
                    {analise.problemasAts.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nenhuma trava relevante encontrada.</p>
                    ) : (
                      <>
                        {problemasVisiveis.map((problema) => (
                          <div key={problema.titulo} className={`rounded-lg border bg-secondary/40 ${d.item}`}>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-semibold">{problema.titulo}</span>
                              <GravidadeBadge nivel={problema.gravidade} />
                              <button
                                type="button"
                                onClick={() => destacarTermos([{ termo: problema.titulo, tipo: "secao" }])}
                                className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                              >
                                <Highlighter className="size-3" />
                                Ver no currículo
                              </button>
                            </div>
                            {densidade === "confortavel" && (
                              <p className="mt-2 text-sm text-muted-foreground">{problema.explicacao}</p>
                            )}
                            <p className={densidade === "compacta" ? "mt-1 text-xs" : "mt-2 text-sm"}>
                              <span className="font-medium">Como corrigir: </span>
                              {problema.comoCorrigir}
                            </p>
                          </div>
                        ))}
                        <BotaoRestante
                          quantidade={analise.problemasAts.length - problemasVisiveis.length}
                          aberto={expandido.problemas}
                          onToggle={() => alternar("problemas")}
                        />
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="palavras" className="mt-4">
                <Card className="shadow-[var(--shadow-panel)]">
                  <CardHeader className={d.header}>
                    <CardTitle className="flex flex-wrap items-center justify-between gap-2 font-display text-base">
                      Palavras-chave ausentes
                      {analise.palavrasChaveFaltando.length > 0 && (
                        <button
                          type="button"
                          onClick={() =>
                            destacarTermos(
                              analise.palavrasChaveFaltando.map((k) => ({ termo: k, tipo: "palavra" as const })),
                            )
                          }
                          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                        >
                          <Highlighter className="size-3" />
                          Destacar todas
                        </button>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className={`max-h-[26rem] overflow-y-auto ${d.conteudo}`}>
                    {analise.palavrasChaveFaltando.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nenhuma palavra-chave crítica faltando.</p>
                    ) : (
                      <>
                        <div className={densidade === "compacta" ? "flex flex-wrap gap-1.5" : "flex flex-wrap gap-2"}>
                          {palavrasVisiveis.map((k) => (
                            <button
                              key={k}
                              type="button"
                              onClick={() => destacarTermos([{ termo: k, tipo: "palavra" }])}
                              className={`rounded-md bg-realce/20 font-medium transition hover:bg-realce/35 ${
                                densidade === "compacta" ? "px-1.5 py-0.5 text-[11px]" : "px-2 py-1 text-xs"
                              } ${destaque.some((t) => t.termo === k) ? "ring-1 ring-primary" : ""}`}
                            >
                              {k}
                            </button>
                          ))}
                        </div>
                        <BotaoRestante
                          quantidade={analise.palavrasChaveFaltando.length - palavrasVisiveis.length}
                          aberto={expandido.palavras}
                          onToggle={() => alternar("palavras")}
                        />
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="secoes" className="mt-4">
                <Card className="shadow-[var(--shadow-panel)]">
                  <CardHeader className={d.header}>
                    <CardTitle className="font-display text-base">Estrutura das seções</CardTitle>
                  </CardHeader>
                  <CardContent className={`max-h-[26rem] overflow-y-auto ${d.conteudo} ${d.gapMin}`}>
                    {analise.secoes.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Sem avaliação de seções nesta análise.</p>
                    ) : (
                      <>
                        {secoesVisiveis.map((s) => (
                          <button
                            key={s.nome}
                            type="button"
                            onClick={() => destacarTermos([{ termo: s.nome, tipo: "secao" }])}
                            className={`block w-full rounded-md text-left transition hover:bg-secondary/60 ${
                              densidade === "compacta" ? "px-2 py-1 text-xs" : "px-2 py-1.5 text-sm"
                            }`}
                          >
                            <span className={`font-medium ${statusEstilo[s.status]}`}>{s.nome}</span>
                            <span className="text-muted-foreground"> — {s.nota}</span>
                          </button>
                        ))}
                        <BotaoRestante
                          quantidade={analise.secoes.length - secoesVisiveis.length}
                          aberto={expandido.secoes}
                          onToggle={() => alternar("secoes")}
                        />
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reescritas" className="mt-4">
                <Card className="shadow-[var(--shadow-panel)]">
                  <CardHeader className={d.header}>
                    <CardTitle className="font-display text-base">Reescritas sugeridas</CardTitle>
                  </CardHeader>
                  <CardContent className={`max-h-[26rem] overflow-y-auto ${d.conteudo} ${d.gap}`}>
                    {analise.reescritas.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nenhuma reescrita sugerida.</p>
                    ) : (
                      <>
                        {reescritasVisiveis.map((r) => (
                          <div key={r.original} className={`space-y-1.5 rounded-lg border ${d.item}`}>
                            <div className="flex items-start justify-between gap-2">
                              <p
                                className={`text-muted-foreground line-through ${
                                  densidade === "compacta" ? "line-clamp-2 text-xs" : "text-sm"
                                }`}
                              >
                                {r.original}
                              </p>
                              <button
                                type="button"
                                onClick={() => destacarTermos([{ termo: r.original, tipo: "secao" }])}
                                className="shrink-0 text-xs font-medium text-primary hover:underline"
                              >
                                Ver no currículo
                              </button>
                            </div>
                            <p className={`font-medium text-foreground ${densidade === "compacta" ? "text-xs" : "text-sm"}`}>
                              {r.sugerida}
                            </p>
                          </div>
                        ))}
                        <BotaoRestante
                          quantidade={analise.reescritas.length - reescritasVisiveis.length}
                          aberto={expandido.reescritas}
                          onToggle={() => alternar("reescritas")}
                        />
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>


          </>
        )}
      </div>
    </div>
  );
}
