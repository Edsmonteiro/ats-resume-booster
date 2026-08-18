import { useServerFn } from "@tanstack/react-start";
import { ExternalLink, History, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { RecomendacoesVagaDialog } from "@/components/recomendacoes-vaga-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  limparVagasEncerradas,
  listarHistoricoRadar,
  revalidarHistorico,
  type VagaHistorico,
} from "@/lib/radar.functions";
import { toast } from "sonner";

const ROTULO_STATUS: Record<string, string> = {
  nova: "Nova",
  vista: "Vista",
  salva: "Salva",
  descartada: "Descartada",
  baixa: "Match baixo",
  removida: "Removida",
};

function cor(valor: number) {
  if (valor >= 70) return "text-primary";
  if (valor >= 40) return "text-realce";
  return "text-muted-foreground";
}

export function HistoricoVagas() {
  const listar = useServerFn(listarHistoricoRadar);
  const limparEncerradas = useServerFn(limparVagasEncerradas);
  const reprocessar = useServerFn(revalidarHistorico);
  const [limpando, setLimpando] = useState(false);
  const [reprocessando, setReprocessando] = useState(false);
  const [itens, setItens] = useState<VagaHistorico[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtro, setFiltro] = useState<"todas" | "radar" | "descartadas" | "removidas">("todas");

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      setItens(await listar({}));
    } catch {
      setItens([]);
    } finally {
      setCarregando(false);
    }
  }, [listar]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  async function limpar() {
    setLimpando(true);
    try {
      const { removidas } = await limparEncerradas({});
      await carregar();
      toast.success(
        removidas > 0
          ? `${removidas} vaga(s) encerrada(s) removida(s) do histórico.`
          : "Nenhuma vaga encerrada encontrada.",
      );
    } catch {
      toast.error("Não foi possível limpar as vagas encerradas.");
    } finally {
      setLimpando(false);
    }
  }

  async function reprocessarTudo() {
    setReprocessando(true);
    try {
      const r = await reprocessar({});
      await carregar();
      toast.success(
        r.encerradas + r.foraDaJanela > 0
          ? `${r.encerradas} encerrada(s) e ${r.foraDaJanela} fora da janela marcada(s) em ${r.analisadas} vaga(s).`
          : `Tudo em dia: ${r.analisadas} vaga(s) verificada(s).`,
      );
    } catch {
      toast.error("Não foi possível reprocessar o histórico.");
    } finally {
      setReprocessando(false);
    }
  }

  const filtradas = itens.filter((v) => {
    if (filtro === "radar")
      return !["descartada", "baixa", "removida"].includes(v.status);
    if (filtro === "descartadas") return ["descartada", "baixa"].includes(v.status);
    if (filtro === "removidas") return v.status === "removida";
    return true;
  });

  if (carregando)
    return (
      <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Carregando histórico…
      </div>
    );

  if (itens.length === 0)
    return (
      <Card className="flex min-h-64 items-center justify-center border-dashed shadow-none">
        <CardContent className="max-w-sm py-12 text-center">
          <History className="mx-auto size-6 text-muted-foreground" />
          <p className="mt-3 font-display text-base font-semibold">Histórico vazio</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Cada vaga em que você clicar em "Abrir vaga" fica registrada aqui com o score, os
            motivos, as lacunas e o aviso caso ela saia do radar.
          </p>

        </CardContent>
      </Card>
    );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {(["todas", "radar", "descartadas", "removidas"] as const).map((f) => (
          <Button
            key={f}
            size="sm"
            variant={filtro === f ? "default" : "secondary"}
            onClick={() => setFiltro(f)}
          >
            {f === "todas"
              ? "Todas"
              : f === "radar"
                ? "No radar"
                : f === "descartadas"
                  ? "Fora do radar"
                  : "Removidas"}
          </Button>
        ))}
        <span className="text-xs text-muted-foreground">
          {filtradas.length} vaga(s) aberta(s)
        </span>
        <Button
          size="sm"
          variant="secondary"
          className="ml-auto"
          onClick={() => void reprocessarTudo()}
          disabled={reprocessando}
        >
          {reprocessando ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RefreshCw className="size-4" />
          )}
          Reprocessar histórico
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => void limpar()}
          disabled={limpando}
        >
          {limpando ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
          Limpar encerradas
        </Button>
      </div>

      {filtradas.map((v) => (
        <Card key={v.id} className="shadow-none">
          <CardContent className="space-y-3 py-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-display text-base font-semibold">{v.titulo}</p>
                <p className="text-sm text-muted-foreground">
                  {[v.empresa, v.local, v.modelo, v.fonte].filter(Boolean).join(" · ")}
                </p>
              </div>
              <div className="text-right">
                <p className={`font-display text-2xl font-semibold ${cor(v.compatibilidade)}`}>
                  {v.compatibilidade}%
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {ROTULO_STATUS[v.status] ?? v.status} ·{" "}
                  {new Date(v.publicadaEm ?? v.criadaEm).toLocaleDateString("pt-BR")}
                </p>
              </div>
            </div>

            {v.motivoRemocao && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
                Removida do radar: {v.motivoRemocao}
                {v.removidaEm
                  ? ` · ${new Date(v.removidaEm).toLocaleDateString("pt-BR")}`
                  : ""}
              </p>
            )}

            <p className="text-sm leading-relaxed">{v.motivo}</p>

            {v.lacunas.length > 0 && (
              <div>
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Lacunas detectadas
                </p>
                <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-muted-foreground">
                  {v.lacunas.map((l, i) => (
                    <li key={i}>{l}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <RecomendacoesVagaDialog
                vagaId={v.id}
                titulo={v.titulo}
                compatibilidade={v.compatibilidade}
              />
              {v.link && (
                <Button size="sm" variant="ghost" asChild>
                  <a href={v.link} target="_blank" rel="noreferrer">
                    <ExternalLink className="size-4" /> Ver anúncio
                  </a>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
