import { Columns3 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Vaga } from "@/components/vagas-panel";
import { cn } from "@/lib/utils";

const MAX = 3;

function Linha({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-[0.7rem] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
        {rotulo}
      </p>
      {children}
    </div>
  );
}

/** Compara até 3 vagas já avaliadas, sem novas chamadas de IA. */
export function ComparadorVagas({ vagas }: { vagas: Vaga[] }) {
  const avaliadas = vagas.filter((v) => v.resultado);
  const [aberto, setAberto] = useState(false);
  const [ids, setIds] = useState<string[]>([]);

  if (avaliadas.length < 2) return null;

  const selecionadas = avaliadas.filter((v) => ids.includes(v.id));
  const melhor = selecionadas.reduce<Vaga | null>(
    (top, v) =>
      !top || (v.resultado?.compatibilidade ?? 0) > (top.resultado?.compatibilidade ?? 0) ? v : top,
    null,
  );

  function alternar(id: string) {
    setIds((atual) =>
      atual.includes(id)
        ? atual.filter((i) => i !== id)
        : atual.length >= MAX
          ? atual
          : [...atual, id],
    );
  }

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 max-sm:w-full">
          <Columns3 className="size-4" />
          Comparar vagas
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="font-display">Comparar vagas</DialogTitle>
          <DialogDescription>
            Escolha até {MAX} vagas já avaliadas para ver match, requisitos e lacunas lado a lado.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-2">
          {avaliadas.map((v) => (
            <Button
              key={v.id}
              size="sm"
              variant={ids.includes(v.id) ? "default" : "outline"}
              onClick={() => alternar(v.id)}
              className="max-w-full"
            >
              <span className="truncate">
                {v.cargo}
                {v.empresa ? ` · ${v.empresa}` : ""}
              </span>
            </Button>
          ))}
        </div>

        {selecionadas.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Selecione ao menos duas vagas para comparar.
          </p>
        ) : (
          <div
            className={cn(
              "grid gap-3",
              selecionadas.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3",
            )}
          >
            {selecionadas.map((v) => {
              const r = v.resultado!;
              const vencedora = melhor?.id === v.id && selecionadas.length > 1;
              return (
                <Card
                  key={v.id}
                  className={cn("h-full", vencedora && "border-primary shadow-[var(--shadow-panel)]")}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="font-display text-base leading-tight">
                      {v.cargo}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {v.empresa || "Empresa não informada"}
                    </p>
                    <p className="mt-2 font-display text-3xl font-bold text-primary">
                      {Math.round(r.compatibilidade)}%
                      {vencedora ? (
                        <span className="ml-2 align-middle text-[0.65rem] font-semibold tracking-wide text-primary uppercase">
                          melhor match
                        </span>
                      ) : null}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Linha rotulo="Veredito">
                      <p className="text-sm leading-relaxed text-muted-foreground">{r.veredito}</p>
                    </Linha>
                    <Linha rotulo={`Atende (${r.requisitosAtendidos.length})`}>
                      <ul className="space-y-1">
                        {r.requisitosAtendidos.slice(0, 5).map((x) => (
                          <li key={x} className="text-sm text-muted-foreground">
                            <span className="text-primary">✓</span> {x}
                          </li>
                        ))}
                      </ul>
                    </Linha>
                    <Linha rotulo={`Lacunas (${r.lacunas.length})`}>
                      <ul className="space-y-1">
                        {r.lacunas.slice(0, 5).map((l) => (
                          <li key={l.requisito} className="text-sm text-muted-foreground">
                            • {l.requisito}
                          </li>
                        ))}
                      </ul>
                    </Linha>
                    {v.link ? (
                      <Button asChild size="sm" variant="outline" className="w-full">
                        <a href={v.link} target="_blank" rel="noopener noreferrer">
                          Abrir vaga
                        </a>
                      </Button>
                    ) : null}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
