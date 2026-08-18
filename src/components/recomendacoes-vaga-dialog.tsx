import { useServerFn } from "@tanstack/react-start";
import {
  Check,
  Copy,
  Download,
  Eye,
  FileText,
  History as HistoryIcon,
  Loader2,
  Mail,
  Pencil,
  RefreshCw,
  Save,
  Sparkles,
  Trash2,
  Undo2,
  Wand2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { CurriculoPrevia } from "@/components/curriculo-previa";
import { GravidadeBadge } from "@/components/gravidade-badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LIMITE_CARTA } from "@/lib/ats.schemas";
import { exportarDocx, exportarPdf } from "@/lib/exportar-curriculo";
import { comIdentificacao, nomeArquivoCurriculo } from "@/lib/nome-arquivo";

import {
  gerarCartaVaga,
  gerarCurriculoVaga,
  gerarRecomendacoesVaga,
  type CartaApresentacao,
  type CurriculoRevisado,
  type RecomendacoesVaga,
} from "@/lib/radar.functions";
import { diffLinhas, useVersoesCurriculo } from "@/lib/versoes-curriculo";

export function RecomendacoesVagaDialog({
  vagaId,
  titulo,
  compatibilidade,
}: {
  vagaId: string;
  titulo: string;
  compatibilidade: number;
}) {
  const rodar = useServerFn(gerarRecomendacoesVaga);
  const gerarCv = useServerFn(gerarCurriculoVaga);
  const pedirCarta = useServerFn(gerarCartaVaga);
  const { versoes, adicionar, remover } = useVersoesCurriculo(vagaId);
  const [aberto, setAberto] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [dados, setDados] = useState<RecomendacoesVaga | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [comCarta, setComCarta] = useState(false);
  const [gerandoCv, setGerandoCv] = useState(false);
  const [gerandoCarta, setGerandoCarta] = useState(false);
  const [cartaAberta, setCartaAberta] = useState(true);
  const [comparando, setComparando] = useState<string | null>(null);
  const [modo, setModo] = useState<"editar" | "previa">("editar");
  const [curriculo, setCurriculo] = useState<CurriculoRevisado | null>(null);
  const [textoCv, setTextoCv] = useState("");
  const [carta, setCarta] = useState<CartaApresentacao | null>(null);

  const textoCarta = carta ? `${carta.assunto}\n\n${carta.carta}` : "";
  const cvFinal = comIdentificacao(textoCv, titulo);
  const arquivoCv = (ext: string) => nomeArquivoCurriculo(cvFinal, titulo, ext);
  const arquivoCarta = (ext: string) => nomeArquivoCurriculo(cvFinal, titulo, ext, "carta");

  async function gerar(refazer = false) {
    setCarregando(true);
    try {
      const resposta = await rodar({ data: { id: vagaId, refazer } });
      if ("error" in resposta) {
        toast.error(resposta.error);
        return;
      }
      setDados(resposta.recomendacoes);
    } catch {
      toast.error("Não foi possível gerar as recomendações agora.");
    } finally {
      setCarregando(false);
    }
  }

  async function gerarCurriculo() {
    setGerandoCv(true);
    try {
      const resposta = await gerarCv({ data: { id: vagaId, comCarta } });
      if ("error" in resposta) {
        toast.error(resposta.error);
        return;
      }
      setCurriculo(resposta.curriculo);
      setTextoCv(resposta.curriculo.curriculo);
      setCarta(resposta.carta);
      adicionar({
        texto: resposta.curriculo.curriculo,
        mudancas: resposta.curriculo.mudancas,
        observacoes: resposta.curriculo.observacoes,
        carta: resposta.carta
          ? { assunto: resposta.carta.assunto, carta: resposta.carta.carta }
          : null,
      });
      toast.success("Currículo sob medida gerado.");
    } catch {
      toast.error("Não foi possível gerar o currículo agora.");
    } finally {
      setGerandoCv(false);
    }
  }

  const [tomCarta, setTomCarta] = useState<"formal" | "equilibrado" | "direto">("equilibrado");

  async function gerarCarta() {
    setGerandoCarta(true);
    try {
      const resposta = await pedirCarta({
        data: { id: vagaId, curriculo: textoCv, tom: tomCarta },
      });

      if ("error" in resposta) {
        toast.error(resposta.error);
        return;
      }
      setCarta(resposta.carta);
      setCartaAberta(true);
      toast.success("Carta de apresentação gerada.");
    } catch {
      toast.error("Não foi possível gerar a carta agora.");
    } finally {
      setGerandoCarta(false);
    }
  }

  function copiar() {
    if (!dados) return;
    const texto = [
      `Palavras-chave para incluir (${titulo}):`,
      ...dados.palavrasChave.map((p) => `- ${p.termo} — ${p.ondeUsar}: ${p.exemplo}`),
      "",
      "Trechos reescritos:",
      ...dados.trechos.map((t) => `Antes: ${t.original}\nDepois: ${t.sugerido}`),
    ].join("\n");
    void navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 1800);
  }

  return (
    <Dialog
      open={aberto}
      onOpenChange={(v) => {
        setAberto(v);
        if (v && !dados) void gerar();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary">
          <Wand2 className="size-4" /> Aumentar match
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Como aumentar o match desta vaga</DialogTitle>
          <DialogDescription>
            {titulo} — match atual {compatibilidade}%
            {dados ? ` · potencial ${Math.round(dados.ganhoEstimado)}% aplicando tudo` : ""}
          </DialogDescription>
        </DialogHeader>

        {carregando && !dados && (
          <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Comparando seu currículo com a vaga…
          </div>
        )}

        {dados && (
          <div className="space-y-6">
            <p className="rounded-lg bg-muted/60 p-4 text-sm leading-relaxed">{dados.resumo}</p>

            <section className="space-y-3">
              <h3 className="flex items-center gap-2 font-display text-sm font-semibold">
                <Sparkles className="size-4 text-primary" /> Palavras-chave para incluir
              </h3>
              {dados.palavrasChave.map((p) => (
                <div key={p.termo} className="rounded-lg border p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{p.termo}</span>
                    <GravidadeBadge nivel={p.importancia} />
                    <span className="text-xs text-muted-foreground">{p.ondeUsar}</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground italic">“{p.exemplo}”</p>
                </div>
              ))}
            </section>

            <section className="space-y-3">
              <h3 className="font-display text-sm font-semibold">Trechos do seu currículo</h3>
              {dados.trechos.map((t, i) => (
                <div key={i} className="space-y-2 rounded-lg border p-3 text-sm">
                  <p className="text-muted-foreground line-through">{t.original}</p>
                  <p className="font-medium">{t.sugerido}</p>
                  <p className="text-xs text-muted-foreground">{t.motivo}</p>
                </div>
              ))}
            </section>

            {dados.acoesRapidas.length > 0 && (
              <section className="space-y-2">
                <h3 className="font-display text-sm font-semibold">Antes de se candidatar</h3>
                <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {dados.acoesRapidas.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </section>
            )}

            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={copiar}>
                {copiado ? <Check className="size-4" /> : <Copy className="size-4" />}
                {copiado ? "Copiado" : "Copiar recomendações"}
              </Button>
              <Button variant="ghost" onClick={() => void gerar(true)} disabled={carregando}>
                {carregando ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <RefreshCw className="size-4" />
                )}
                Gerar de novo
              </Button>
            </div>

            <section className="space-y-3 rounded-lg border border-primary/30 bg-primary/5 p-4">
              <h3 className="flex items-center gap-2 font-display text-sm font-semibold">
                <FileText className="size-4 text-primary" /> Currículo sob medida para esta vaga
              </h3>
              <p className="text-sm text-muted-foreground">
                Geramos uma versão do seu currículo montada só para esta vaga, usando apenas as
                informações reais que você já cadastrou.
              </p>

              <div className="flex items-center gap-2">
                <Checkbox
                  id={`carta-${vagaId}`}
                  checked={comCarta}
                  onCheckedChange={(v) => setComCarta(v === true)}
                />
                <Label htmlFor={`carta-${vagaId}`} className="text-sm font-normal">
                  Gerar também a carta de apresentação
                </Label>
              </div>

              <Button onClick={() => void gerarCurriculo()} disabled={gerandoCv}>
                {gerandoCv ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <FileText className="size-4" />
                )}
                {gerandoCv
                  ? "Montando currículo…"
                  : curriculo
                    ? "Gerar nova versão"
                    : "Gerar currículo para esta vaga"}
              </Button>

              {curriculo && (
                <div className="space-y-3">
                  <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
                    <Button
                      size="sm"
                      variant={modo === "editar" ? "secondary" : "ghost"}
                      className="flex-1"
                      onClick={() => setModo("editar")}
                    >
                      <Pencil className="size-4" /> Editar
                    </Button>
                    <Button
                      size="sm"
                      variant={modo === "previa" ? "secondary" : "ghost"}
                      className="flex-1"
                      onClick={() => setModo("previa")}
                    >
                      <Eye className="size-4" /> Prévia
                    </Button>
                  </div>

                  {modo === "editar" ? (
                    <Textarea
                      value={textoCv}
                      onChange={(e) => setTextoCv(e.target.value)}
                      className="min-h-72 font-mono text-xs"
                    />
                  ) : (
                    <CurriculoPrevia texto={cvFinal} />
                  )}

                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => void exportarDocx(cvFinal, arquivoCv("docx"))}
                    >
                      <Download className="size-4" /> DOCX
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => exportarPdf(cvFinal, arquivoCv("pdf"))}
                    >
                      <Download className="size-4" /> PDF
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        void navigator.clipboard.writeText(textoCv);
                        toast.success("Currículo copiado.");
                      }}
                    >
                      <Copy className="size-4" /> Copiar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        adicionar({
                          texto: textoCv,
                          mudancas: curriculo.mudancas,
                          observacoes: curriculo.observacoes,
                          carta: carta ? { assunto: carta.assunto, carta: carta.carta } : null,
                        });
                        toast.success("Versão salva no histórico.");
                      }}
                    >
                      <Save className="size-4" /> Salvar versão
                    </Button>
                  </div>

                  {curriculo.mudancas.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                        O que mudou
                      </p>
                      <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                        {curriculo.mudancas.map((m, i) => (
                          <li key={i}>{m}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {curriculo.observacoes.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                        Confirme antes de enviar
                      </p>
                      <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                        {curriculo.observacoes.map((o, i) => (
                          <li key={i}>{o}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {(comCarta || carta) && (
                <div className="space-y-3 rounded-lg border bg-background p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Mail className="size-4 text-primary" />
                    <span className="font-display text-sm font-semibold">
                      Carta de apresentação
                    </span>
                    <Button
                      size="sm"
                      variant={carta ? "ghost" : "default"}
                      className="ml-auto"
                      onClick={() => void gerarCarta()}
                      disabled={gerandoCarta}
                    >
                      {gerandoCarta ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Wand2 className="size-4" />
                      )}
                      {gerandoCarta ? "Escrevendo…" : carta ? "Gerar de novo" : "Gerar carta"}
                    </Button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {(["formal", "equilibrado", "direto"] as const).map((t) => (
                      <Button
                        key={t}
                        size="sm"
                        variant={tomCarta === t ? "default" : "outline"}
                        onClick={() => setTomCarta(t)}
                      >
                        {t === "formal" ? "Formal" : t === "direto" ? "Direto" : "Equilibrado"}
                      </Button>
                    ))}
                    <span className="text-xs text-muted-foreground">
                      máx. {LIMITE_CARTA} caracteres
                    </span>
                  </div>

                  {carta && (
                    <>
                      <button
                        type="button"
                        className="text-left text-sm font-medium underline-offset-4 hover:underline"
                        onClick={() => setCartaAberta((v) => !v)}
                      >
                        {cartaAberta ? "Ocultar carta" : "Visualizar carta"} — {carta.assunto}
                      </button>
                      {cartaAberta && (
                        <>
                          <p className="rounded-lg bg-muted/60 p-3 text-sm leading-relaxed whitespace-pre-wrap">
                            {carta.carta}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {carta.carta.length}/{LIMITE_CARTA} caracteres
                          </p>
                        </>
                      )}
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => void exportarDocx(textoCarta, arquivoCarta("docx"))}
                        >
                          <Download className="size-4" /> DOCX
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => exportarPdf(textoCarta, arquivoCarta("pdf"))}
                        >
                          <Download className="size-4" /> PDF
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            void navigator.clipboard.writeText(textoCarta);
                            toast.success("Carta copiada.");
                          }}
                        >
                          <Copy className="size-4" /> Copiar carta
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {versoes.length > 0 && (
                <div className="space-y-2 rounded-lg border bg-background p-3">
                  <p className="flex items-center gap-2 font-display text-sm font-semibold">
                    <HistoryIcon className="size-4 text-primary" /> Histórico de versões
                  </p>
                  {versoes.map((v) => {
                    const diff = comparando === v.id ? diffLinhas(v.texto, textoCv) : null;
                    return (
                      <div key={v.id} className="rounded-lg border p-2 text-sm">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{v.rotulo}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(v.criadaEm).toLocaleString("pt-BR")}
                          </span>
                          {v.carta && (
                            <span className="text-xs text-muted-foreground">· com carta</span>
                          )}
                          <div className="ml-auto flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setComparando(comparando === v.id ? null : v.id)}
                            >
                              {comparando === v.id ? "Fechar" : "Comparar"}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setTextoCv(v.texto);
                                if (v.carta)
                                  setCarta({
                                    assunto: v.carta.assunto,
                                    carta: v.carta.carta,
                                    observacoes: [],
                                  });
                                setComparando(null);
                                toast.success(`${v.rotulo} restaurada.`);
                              }}
                            >
                              <Undo2 className="size-4" /> Restaurar
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => remover(v.id)}>
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </div>

                        {diff && (
                          <div className="mt-2 max-h-64 space-y-0.5 overflow-y-auto rounded bg-muted/50 p-2 font-mono text-xs">
                            {diff.map((l, i) => (
                              <p
                                key={i}
                                className={
                                  l.tipo === "adicionada"
                                    ? "text-primary"
                                    : l.tipo === "removida"
                                      ? "text-destructive line-through"
                                      : "text-muted-foreground"
                                }
                              >
                                {l.tipo === "adicionada"
                                  ? "+ "
                                  : l.tipo === "removida"
                                    ? "- "
                                    : "  "}
                                {l.texto}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
