import { History, TrendingDown, TrendingUp, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type EntradaHistorico = {
  id: string;
  criadaEm: string;
  score: number;
  resumo: string;
  problemas: number;
};

export function HistoricoAnalises({
  historico,
  setHistorico,
}: {
  historico: EntradaHistorico[];
  setHistorico: (v: EntradaHistorico[]) => void;
}) {
  if (historico.length === 0) return null;

  const atual = historico[0]!;
  const anterior = historico[1];
  const delta = anterior ? Math.round(atual.score - anterior.score) : null;

  return (
    <Card className="shadow-[var(--shadow-panel)]">
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle className="flex items-center gap-2 font-display text-base">
          <History className="size-4 text-primary" />
          Evolução do currículo
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={() => setHistorico([])}>
          <Trash2 className="size-4" />
          Limpar
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {delta !== null && (
          <div className="flex items-center gap-2 rounded-lg border bg-secondary/40 p-3 text-sm">
            {delta >= 0 ? (
              <TrendingUp className="size-4 text-primary" />
            ) : (
              <TrendingDown className="size-4 text-destructive" />
            )}
            <span>
              {delta === 0
                ? "Mesma nota da versão anterior."
                : `${delta > 0 ? "+" : ""}${delta} pontos em relação à versão anterior.`}
            </span>
          </div>
        )}

        <ol className="space-y-2">
          {historico.map((item, i) => (
            <li key={item.id} className="flex items-center gap-3 rounded-lg border p-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {Math.round(item.score)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                  {i === 0 ? "Versão atual" : `Versão ${historico.length - i}`}
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    {new Date(item.criadaEm).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                  </span>
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {item.problemas} problema{item.problemas === 1 ? "" : "s"} de ATS · {item.resumo}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
