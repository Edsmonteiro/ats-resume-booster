import { useServerFn } from "@tanstack/react-start";
import { ExternalLink, Loader2, Plus, Target, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { CartaDialog } from "@/components/carta-dialog";
import { CurriculoVagaDialog } from "@/components/curriculo-vaga-dialog";

import { ExtensaoCard } from "@/components/extensao-card";

import { GravidadeBadge } from "@/components/gravidade-badge";
import { ScoreRing } from "@/components/score-ring";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { analisarVaga, type CartaApresentacao, type JobMatch } from "@/lib/ats.functions";

export type Vaga = {
  id: string;
  cargo: string;
  empresa: string;
  link: string;
  requisitos: string;
  criadaEm: string;
  resultado: JobMatch | null;
  carta?: CartaApresentacao | null;
};


const vazio = { cargo: "", empresa: "", link: "", requisitos: "" };

export function VagasPanel({
  curriculo,
  vagas,
  setVagas,
}: {
  curriculo: string;
  vagas: Vaga[];
  setVagas: (v: Vaga[]) => void;
}) {
  const rodar = useServerFn(analisarVaga);
  const [form, setForm] = useState(vazio);
  const [carregando, setCarregando] = useState(false);

  async function adicionar() {
    if (curriculo.trim().length < 50) {
      toast.error("Cadastre seu currículo na aba Currículo antes de avaliar vagas.");
      return;
    }
    if (!form.cargo.trim() || form.requisitos.trim().length < 10) {
      toast.error("Informe ao menos a posição e os requisitos da vaga.");
      return;
    }
    setCarregando(true);
    try {
      const resultado = await rodar({
        data: {
          curriculo: curriculo.trim().slice(0, 30000),
          cargo: form.cargo.trim(),
          empresa: form.empresa.trim(),
          link: form.link.trim(),
          requisitos: form.requisitos.trim().slice(0, 15000),
        },
      });
      const nova: Vaga = {
        id: crypto.randomUUID(),
        ...form,
        criadaEm: new Date().toISOString(),
        resultado,
      };
      setVagas([nova, ...vagas]);
      setForm(vazio);
      toast.success(`Compatibilidade: ${Math.round(resultado.compatibilidade)}%`);
    } catch {
      toast.error("Não foi possível avaliar a vaga agora. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
      <Card className="h-fit shadow-[var(--shadow-panel)]">
        <CardHeader>
          <CardTitle className="font-display text-lg">Nova vaga</CardTitle>
          <p className="text-sm text-muted-foreground">
            Cole os requisitos da vaga e calculamos sua compatibilidade com base no currículo salvo.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cargo">Posição</Label>
            <Input
              id="cargo"
              value={form.cargo}
              onChange={(e) => setForm({ ...form, cargo: e.target.value })}
              placeholder="Analista de Dados Pleno"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="empresa">Empresa</Label>
              <Input
                id="empresa"
                value={form.empresa}
                onChange={(e) => setForm({ ...form, empresa: e.target.value })}
                placeholder="Nubank"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="link">Link da vaga</Label>
              <Input
                id="link"
                value={form.link}
                onChange={(e) => setForm({ ...form, link: e.target.value })}
                placeholder="https://…"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="requisitos">Requisitos e descrição</Label>
            <Textarea
              id="requisitos"
              value={form.requisitos}
              onChange={(e) => setForm({ ...form, requisitos: e.target.value })}
              placeholder="Cole aqui a descrição completa e os requisitos da vaga…"
              className="min-h-48 resize-y text-sm"
            />
          </div>
          <Button className="w-full" onClick={() => void adicionar()} disabled={carregando}>
            {carregando ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            {carregando ? "Calculando compatibilidade…" : "Rastrear vaga"}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <ExtensaoCard />

        {vagas.length === 0 ? (
          <Card className="flex min-h-64 items-center justify-center border-dashed shadow-none">
            <CardContent className="max-w-sm py-12 text-center">
              <Target className="mx-auto size-6 text-muted-foreground" />
              <p className="mt-3 font-display text-base font-semibold">Nenhuma vaga rastreada</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Cada vaga cadastrada fica aqui com a nota de compatibilidade e o que falta no seu currículo.
              </p>
            </CardContent>
          </Card>
        ) : (
          vagas.map((vaga) => (
            <Card key={vaga.id} className="shadow-[var(--shadow-panel)]">
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div className="min-w-0">
                  <CardTitle className="font-display text-base">{vaga.cargo}</CardTitle>
                  <p className="mt-1 truncate text-sm text-muted-foreground">
                    {vaga.empresa || "Empresa não informada"} ·{" "}
                    {new Date(vaga.criadaEm).toLocaleDateString("pt-BR")}
                  </p>
                  {vaga.link ? (
                    <a
                      href={vaga.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      Abrir vaga <ExternalLink className="size-3" />
                    </a>
                  ) : null}
                </div>
                <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                  <CurriculoVagaDialog
                    curriculo={curriculo}
                    cargo={vaga.cargo}
                    empresa={vaga.empresa}
                    requisitos={vaga.requisitos}
                    resultado={vaga.resultado}
                  />
                  <CartaDialog
                    curriculo={curriculo}
                    cargo={vaga.cargo}
                    empresa={vaga.empresa}
                    requisitos={vaga.requisitos}
                    carta={vaga.carta ?? null}
                    setCarta={(c) => setVagas(vagas.map((v) => (v.id === vaga.id ? { ...v, carta: c } : v)))}
                  />

                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Remover vaga"
                    onClick={() => setVagas(vagas.filter((v) => v.id !== vaga.id))}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>

              </CardHeader>
              {vaga.resultado ? (
                <CardContent className="flex flex-col gap-6 sm:flex-row">
                  <ScoreRing valor={vaga.resultado.compatibilidade} tamanho={112} legenda="Compatibilidade" />
                  <div className="flex-1 space-y-4">
                    <p className="text-sm leading-relaxed">{vaga.resultado.veredito}</p>

                    {vaga.resultado.requisitosAtendidos.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                          Você atende
                        </p>
                        <ul className="mt-2 space-y-1">
                          {vaga.resultado.requisitosAtendidos.map((r) => (
                            <li key={r} className="flex gap-2 text-sm text-muted-foreground">
                              <span className="text-primary">✓</span>
                              {r}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {vaga.resultado.lacunas.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                          Lacunas
                        </p>
                        <div className="mt-2 space-y-2">
                          {vaga.resultado.lacunas.map((l) => (
                            <div key={l.requisito} className="rounded-lg border bg-secondary/40 p-3">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-medium">{l.requisito}</span>
                                <GravidadeBadge nivel={l.gravidade} />
                              </div>
                              <p className="mt-1 text-sm text-muted-foreground">{l.acao}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {vaga.resultado.palavrasChaveParaIncluir.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                          Termos para incluir no currículo
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {vaga.resultado.palavrasChaveParaIncluir.map((k) => (
                            <span key={k} className="rounded-md bg-accent/20 px-2 py-1 text-xs font-medium">
                              {k}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {vaga.resultado.ajustesNoCurriculo.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                          Ajustes recomendados
                        </p>
                        <ul className="mt-2 list-disc space-y-1 pl-5">
                          {vaga.resultado.ajustesNoCurriculo.map((a) => (
                            <li key={a} className="text-sm text-muted-foreground">
                              {a}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              ) : null}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
