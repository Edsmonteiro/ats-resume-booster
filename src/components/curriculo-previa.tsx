import { estruturar } from "@/lib/exportar-curriculo";

/** Renderiza o currículo já formatado, como ele sairá no PDF/DOCX. */
export function CurriculoPrevia({ texto }: { texto: string }) {
  const blocos = estruturar(texto);

  return (
    <div className="space-y-1 rounded-lg border bg-background p-6 shadow-sm">
      {blocos.map((b, i) => {
        if (b.tipo === "titulo")
          return (
            <h4 key={i} className="font-display text-lg font-bold">
              {b.texto}
            </h4>
          );
        if (b.tipo === "secao")
          return (
            <h5
              key={i}
              className="mt-4 border-b pb-1 text-xs font-semibold tracking-[0.14em] uppercase"
            >
              {b.texto}
            </h5>
          );
        if (b.tipo === "bullet")
          return (
            <p key={i} className="flex gap-2 text-sm leading-relaxed">
              <span className="text-muted-foreground">•</span>
              <span>{b.texto}</span>
            </p>
          );
        return (
          <p key={i} className="text-sm leading-relaxed">
            {b.texto}
          </p>
        );
      })}
    </div>
  );
}
