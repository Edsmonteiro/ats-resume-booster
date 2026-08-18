import { cn } from "@/lib/utils";

function faixa(valor: number) {
  if (valor >= 75) return { cor: "var(--color-primary)", rotulo: "Forte" };
  if (valor >= 50) return { cor: "var(--color-accent)", rotulo: "Mediano" };
  return { cor: "var(--color-destructive)", rotulo: "Fraco" };
}

export function ScoreRing({
  valor,
  tamanho = 132,
  legenda,
  className,
}: {
  valor: number;
  tamanho?: number;
  legenda?: string;
  className?: string;
}) {
  const seguro = Math.max(0, Math.min(100, Math.round(valor)));
  const { cor, rotulo } = faixa(seguro);
  const raio = tamanho / 2 - 9;
  const circ = 2 * Math.PI * raio;

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div className="relative" style={{ width: tamanho, height: tamanho }}>
        <svg width={tamanho} height={tamanho} className="-rotate-90">
          <circle
            cx={tamanho / 2}
            cy={tamanho / 2}
            r={raio}
            fill="none"
            strokeWidth={9}
            className="stroke-secondary"
          />
          <circle
            cx={tamanho / 2}
            cy={tamanho / 2}
            r={raio}
            fill="none"
            strokeWidth={9}
            strokeLinecap="round"
            stroke={cor}
            strokeDasharray={circ}
            strokeDashoffset={circ - (circ * seguro) / 100}
            style={{ transition: "stroke-dashoffset 900ms cubic-bezier(0.22,1,0.36,1)" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-3xl leading-none font-bold text-foreground">{seguro}</span>
          <span className="mt-1 text-[10px] tracking-[0.18em] text-muted-foreground uppercase">{rotulo}</span>
        </div>
      </div>
      {legenda ? <p className="text-xs text-muted-foreground">{legenda}</p> : null}
    </div>
  );
}
