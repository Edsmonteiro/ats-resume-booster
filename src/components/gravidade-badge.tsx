import { Badge } from "@/components/ui/badge";

const estilos: Record<string, string> = {
  alta: "border-destructive/30 bg-destructive/10 text-destructive",
  media: "border-realce/40 bg-realce/10 text-realce",
  baixa: "border-primary/30 bg-primary/10 text-primary",
};

const rotulos: Record<string, string> = { alta: "Crítico", media: "Atenção", baixa: "Leve" };

export function GravidadeBadge({ nivel }: { nivel: "alta" | "media" | "baixa" }) {
  return (
    <Badge variant="outline" className={estilos[nivel]}>
      {rotulos[nivel]}
    </Badge>
  );
}
