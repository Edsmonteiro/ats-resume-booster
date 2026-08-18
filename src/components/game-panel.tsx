import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Check,
  Flame,
  GraduationCap,
  Loader2,
  Lock,
  Map as MapIcon,
  RefreshCw,
  Sparkles,
  Star,
  Trophy,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { avaliarResposta, gerarMapaQuest, gerarPergunta } from "@/lib/game.functions";
import type { Avaliacao, FaseQuest, Pergunta, TrilhaQuest } from "@/lib/game.schemas";
import { useAssinatura } from "@/lib/use-assinatura";
import { useLocalState } from "@/lib/use-local-state";
import { cn } from "@/lib/utils";

type Placar = { pontos: number; acertos: number; rodadas: number; sequencia: number };

const PLACAR_INICIAL: Placar = { pontos: 0, acertos: 0, rodadas: 0, sequencia: 0 };

const PERGUNTAS_POR_FASE = 3;

const ROTULO_NIVEL: Record<FaseQuest["nivel"], string> = {
  iniciante: "Básico",
  intermediario: "Intermediário",
  avancado: "Avançado",
};

export function GamePanel() {
  const [placar, setPlacar] = useLocalState<Placar>("eupasso:game-placar", PLACAR_INICIAL);
  const [trilhas, setTrilhas] = useLocalState<TrilhaQuest[]>("eupasso:quest-trilhas", []);
  const [progresso, setProgresso] = useLocalState<Record<string, number>>(
    "eupasso:quest-progresso",
    {},
  );
  const { temAcessoA, carregando: carregandoAssinatura } = useAssinatura();
  const ativa = temAcessoA("quest");

  const [trilhaAtiva, setTrilhaAtiva] = useState<number | null>(null);
  const [montando, setMontando] = useState(false);
  const [faseAtiva, setFaseAtiva] = useState<number | null>(null);
  const [pergunta, setPergunta] = useState<Pergunta | null>(null);
  const [historico, setHistorico] = useState<string[]>([]);
  const [rodadaFase, setRodadaFase] = useState(0);
  const [acertosFase, setAcertosFase] = useState(0);
  const [escolha, setEscolha] = useState<number | null>(null);
  const [texto, setTexto] = useState("");
  const [avaliacao, setAvaliacao] = useState<Avaliacao | null>(null);
  const [revelado, setRevelado] = useState(false);
  const [dica, setDica] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const trilha = trilhaAtiva !== null ? (trilhas[trilhaAtiva] ?? null) : null;
  const fases: FaseQuest[] = trilha?.fases ?? [];
  const chaveTrilha = trilha ? trilha.ferramenta : "";
  const concluidas = chaveTrilha ? (progresso[chaveTrilha] ?? 0) : 0;

  useEffect(() => {
    if (faseAtiva !== null && fases[faseAtiva] && !pergunta && !carregando) {
      void proximaPergunta(faseAtiva);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [faseAtiva]);

  async function montarMapa() {
    setMontando(true);
    try {
      const mapa = await gerarMapaQuest();
      setTrilhas(mapa.trilhas);
      setProgresso({});
      setTrilhaAtiva(null);
      setFaseAtiva(null);
      toast.success("Trilhas montadas a partir do seu currículo.");
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível montar as trilhas.");
    } finally {
      setMontando(false);
    }
  }

  function limparRodada() {
    setPergunta(null);
    setAvaliacao(null);
    setRevelado(false);
    setDica(false);
    setEscolha(null);
    setTexto("");
  }

  async function proximaPergunta(indice: number) {
    const fase = fases[indice];
    if (!fase) return;
    setCarregando(true);
    limparRodada();
    try {
      const nova = await gerarPergunta({
        data: {
          tema: fase.ferramenta,
          foco: fase.foco,
          nivel: fase.nivel,
          evitar: historico.slice(-8),
        },
      });
      setPergunta(nova);
      setHistorico((h) => [...h, nova.enunciado]);
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível criar a pergunta.");
    } finally {
      setCarregando(false);
    }
  }

  function registrar(pontos: number, acertou: boolean) {
    setPlacar({
      pontos: placar.pontos + pontos,
      acertos: placar.acertos + (acertou ? 1 : 0),
      rodadas: placar.rodadas + 1,
      sequencia: acertou ? placar.sequencia + 1 : 0,
    });
    setRodadaFase((r) => r + 1);
    if (acertou) setAcertosFase((a) => a + 1);
  }

  function responderObjetiva(indice: number) {
    if (revelado || !pergunta) return;
    setEscolha(indice);
    setRevelado(true);
    registrar(indice === pergunta.indiceCorreto ? 10 : 0, indice === pergunta.indiceCorreto);
  }

  async function responderSubjetiva() {
    if (!pergunta || faseAtiva === null || texto.trim().length < 5) {
      toast.info("Escreva sua resposta antes de enviar.");
      return;
    }
    setEnviando(true);
    try {
      const resultado = await avaliarResposta({
        data: {
          tema: fases[faseAtiva]?.ferramenta ?? "",
          enunciado: pergunta.enunciado,
          resposta: texto.trim(),
        },
      });
      setAvaliacao(resultado);
      setRevelado(true);
      registrar(Math.round(resultado.pontos / 10), resultado.acertou);
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível avaliar a resposta.");
    } finally {
      setEnviando(false);
    }
  }

  function encerrarFase() {
    if (faseAtiva === null) return;
    const passou = acertosFase >= 2;
    if (passou && faseAtiva === concluidas && chaveTrilha) {
      setProgresso({ ...progresso, [chaveTrilha]: concluidas + 1 });
      toast.success("Fase concluída! Próxima fase liberada.");
    } else if (!passou) {
      toast.info("Faltou pouco — tente a fase novamente.");
    }
    setFaseAtiva(null);
    setRodadaFase(0);
    setAcertosFase(0);
    limparRodada();
  }

  const aproveitamento = placar.rodadas ? Math.round((placar.acertos / placar.rodadas) * 100) : 0;
  const fase = faseAtiva !== null ? fases[faseAtiva] : null;

  if (!ativa && !carregandoAssinatura) {
    return (
      <Card className="border-primary/40 bg-primary/5">
        <CardContent className="flex flex-col items-start gap-3 py-8">
          <p className="flex items-center gap-2 font-display text-lg font-semibold">
            <Lock className="size-4 text-primary" /> Quest disponível no plano Pro
          </p>
          <p className="max-w-xl text-sm text-muted-foreground">
            Trilhas separadas por conhecimento do seu currículo, com fases do básico ao avançado e
            perguntas sorteadas pela IA. A partir de R$ 10 por mês.
          </p>
          <Button asChild>
            <Link to="/planos">
              <Sparkles className="size-4" /> Ver planos
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <Trophy className="size-5 shrink-0 text-primary" />
            <div>
              <p className="font-display text-xl font-semibold tabular-nums">{placar.pontos}</p>
              <p className="text-xs text-muted-foreground">Pontos acumulados</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <Check className="size-5 shrink-0 text-primary" />
            <div>
              <p className="font-display text-xl font-semibold tabular-nums">{aproveitamento}%</p>
              <p className="text-xs text-muted-foreground">
                {placar.acertos} acertos em {placar.rodadas} perguntas
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <Flame className="size-5 shrink-0 text-primary" />
            <div>
              <p className="font-display text-xl font-semibold tabular-nums">{placar.sequencia}</p>
              <p className="text-xs text-muted-foreground">Sequência de acertos</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {trilhas.length === 0 ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 font-display text-base">
              <MapIcon className="size-4 text-primary" /> Suas trilhas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Cada conhecimento do seu currículo vira uma trilha própria, com fases do básico ao
              avançado. As perguntas vêm sorteadas — você não escolhe o formato.
            </p>
            <Button onClick={() => void montarMapa()} disabled={montando}>
              {montando ? <Loader2 className="size-4 animate-spin" /> : null}
              Montar trilhas com meu currículo
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {trilhas.length > 0 && trilhaAtiva === null ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
            <CardTitle className="flex items-center gap-2 font-display text-base">
              <MapIcon className="size-4 text-primary" /> Trilhas de conhecimento
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => void montarMapa()} disabled={montando}>
              {montando ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RefreshCw className="size-4" />
              )}
              Refazer trilhas
            </Button>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {trilhas.map((t, i) => {
              const feitas = progresso[t.ferramenta] ?? 0;
              const total = t.fases.length;
              const pct = Math.round((feitas / total) * 100);
              return (
                <button
                  key={`${t.ferramenta}-${i}`}
                  type="button"
                  onClick={() => {
                    setTrilhaAtiva(i);
                    setFaseAtiva(null);
                  }}
                  className="rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:border-primary hover:bg-primary/5"
                >
                  <p className="font-display text-sm font-semibold">{t.ferramenta}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{t.resumo}</p>
                  <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {feitas}/{total} fases concluídas
                  </p>
                </button>
              );
            })}
          </CardContent>
        </Card>
      ) : null}

      {trilha && faseAtiva === null ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
            <CardTitle className="flex items-center gap-2 font-display text-base">
              <MapIcon className="size-4 text-primary" /> {trilha.ferramenta}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setTrilhaAtiva(null)}>
              <ArrowLeft className="size-4" /> Trilhas
            </Button>
          </CardHeader>
          <CardContent>
            <ol className="relative mx-auto flex max-w-md flex-col gap-3">
              {fases.map((f, i) => {
                const concluida = i < concluidas;
                const liberada = i <= concluidas;
                const alinhamento = i % 2 === 0 ? "self-start" : "self-end";
                return (
                  <li key={`${f.ferramenta}-${i}`} className={cn("w-[85%]", alinhamento)}>
                    <button
                      type="button"
                      disabled={!liberada}
                      onClick={() => {
                        setFaseAtiva(i);
                        setRodadaFase(0);
                        setAcertosFase(0);
                      }}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-colors",
                        concluida
                          ? "border-primary/40 bg-primary/10"
                          : liberada
                            ? "border-primary bg-card shadow-sm hover:bg-primary/10"
                            : "border-dashed border-border bg-muted/40 opacity-70",
                      )}
                    >
                      <span
                        className={cn(
                          "grid size-10 shrink-0 place-items-center rounded-full text-sm font-bold",
                          concluida
                            ? "bg-primary text-primary-foreground"
                            : liberada
                              ? "bg-primary/15 text-primary"
                              : "bg-muted text-muted-foreground",
                        )}
                      >
                        {concluida ? (
                          <Star className="size-5 fill-current" />
                        ) : liberada ? (
                          i + 1
                        ) : (
                          <Lock className="size-4" />
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-display text-sm font-semibold">
                          {f.titulo}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {f.ferramenta} · {ROTULO_NIVEL[f.nivel]}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </CardContent>
        </Card>
      ) : null}

      {fase ? (
        <Card>
          <CardHeader className="pb-3">
            <p className="text-xs font-medium text-muted-foreground">
              Fase {(faseAtiva ?? 0) + 1} · {fase.ferramenta} · {ROTULO_NIVEL[fase.nivel]} ·
              pergunta {Math.min(rodadaFase + 1, PERGUNTAS_POR_FASE)}/{PERGUNTAS_POR_FASE}
            </p>
            <CardTitle className="font-display text-base leading-snug">
              {carregando ? "Sorteando a pergunta…" : (pergunta?.enunciado ?? fase.titulo)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {carregando ? (
              <p className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Preparando…
              </p>
            ) : null}

            {pergunta && !carregando ? (
              <>
                {pergunta.tipo === "objetiva" ? (
                  <div className="grid grid-cols-1 gap-2">
                    {pergunta.alternativas.map((alt, i) => {
                      const correta = revelado && i === pergunta.indiceCorreto;
                      const errada = revelado && i === escolha && i !== pergunta.indiceCorreto;
                      return (
                        <button
                          key={alt}
                          type="button"
                          disabled={revelado}
                          onClick={() => responderObjetiva(i)}
                          className={cn(
                            "flex items-start gap-2 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors",
                            correta
                              ? "border-primary bg-primary/10"
                              : errada
                                ? "border-destructive bg-destructive/10"
                                : "border-border hover:border-primary hover:bg-primary/5",
                          )}
                        >
                          {correta ? (
                            <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                          ) : errada ? (
                            <X className="mt-0.5 size-4 shrink-0 text-destructive" />
                          ) : (
                            <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border text-[0.6rem]">
                              {String.fromCharCode(65 + i)}
                            </span>
                          )}
                          <span>{alt}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Textarea
                      value={texto}
                      onChange={(e) => setTexto(e.target.value)}
                      disabled={revelado}
                      rows={5}
                      placeholder="Escreva sua resposta como se fosse a real…"
                    />
                    {!revelado ? (
                      <Button onClick={() => void responderSubjetiva()} disabled={enviando}>
                        {enviando ? <Loader2 className="size-4 animate-spin" /> : null}
                        Enviar resposta
                      </Button>
                    ) : null}
                  </div>
                )}

                {!revelado ? (
                  <div className="flex flex-wrap items-center gap-2">
                    {dica ? (
                      <p className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
                        Dica: {pergunta.dica}
                      </p>
                    ) : (
                      <Button variant="ghost" size="sm" onClick={() => setDica(true)}>
                        Não sei — me dá uma dica
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={encerrarFase}>
                      Sair da fase
                    </Button>
                  </div>
                ) : null}

                {revelado ? (
                  <div className="space-y-3 rounded-lg border border-border bg-muted/40 p-4">
                    <p className="flex items-center gap-2 font-display text-sm font-semibold">
                      <GraduationCap className="size-4 text-primary" /> O que aprender aqui
                    </p>
                    {avaliacao ? (
                      <>
                        <p className="text-sm">
                          <span className="font-medium">
                            {avaliacao.acertou ? "Boa resposta" : "Quase lá"} · {avaliacao.pontos}
                            /100
                          </span>{" "}
                          — {avaliacao.feedback}
                        </p>
                        <p className="text-sm text-muted-foreground">{avaliacao.licao}</p>
                        <p className="rounded-md bg-background px-3 py-2 text-sm">
                          <span className="font-medium">Resposta modelo: </span>
                          {avaliacao.exemplo}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">{pergunta.explicacao}</p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {rodadaFase < PERGUNTAS_POR_FASE ? (
                        <Button
                          size="sm"
                          onClick={() => void proximaPergunta(faseAtiva as number)}
                        >
                          Próxima pergunta
                        </Button>
                      ) : (
                        <Button size="sm" onClick={encerrarFase}>
                          Concluir fase ({acertosFase}/{PERGUNTAS_POR_FASE} acertos)
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={encerrarFase}>
                        Voltar ao mapa
                      </Button>
                    </div>
                  </div>
                ) : null}
              </>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
