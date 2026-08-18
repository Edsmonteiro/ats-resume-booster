import { useMemo } from "react";

export type TermoDestaque = { termo: string; tipo: "palavra" | "secao" };

function normalizarPreservandoIndices(texto: string) {
  let saida = "";
  for (const char of texto) {
    const base = char.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    saida += (base.length === 1 ? base : char).toLowerCase();
  }
  return saida.length === texto.length ? saida : texto.toLowerCase();
}

function escaparRegex(v: string) {
  return v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function variacoes(termo: string) {
  const limpo = termo.trim();
  if (!limpo) return [];
  const alvos = [limpo];
  const tokens = limpo.split(/[\s/,\-–—]+/).filter((t) => t.length >= 4);
  if (tokens.length > 1) alvos.push(...tokens);
  return alvos;
}

type Segmento = { texto: string; tipo?: TermoDestaque["tipo"]; termo?: string };

function montarSegmentos(texto: string, termos: TermoDestaque[]): Segmento[] {
  const normalizado = normalizarPreservandoIndices(texto);
  const encontrados: { inicio: number; fim: number; tipo: TermoDestaque["tipo"]; termo: string }[] = [];

  for (const { termo, tipo } of termos) {
    for (const alvo of variacoes(termo)) {
      const alvoNorm = normalizarPreservandoIndices(alvo);
      if (alvoNorm.length < 3) continue;
      const re = new RegExp(`(?<![\\p{L}\\p{N}])${escaparRegex(alvoNorm)}`, "giu");
      let m: RegExpExecArray | null;
      while ((m = re.exec(normalizado)) !== null) {
        encontrados.push({ inicio: m.index, fim: m.index + alvoNorm.length, tipo, termo });
        if (m.index === re.lastIndex) re.lastIndex++;
      }
    }
  }

  if (encontrados.length === 0) return [{ texto }];

  encontrados.sort((a, b) => a.inicio - b.inicio || b.fim - a.fim);
  const segmentos: Segmento[] = [];
  let cursor = 0;
  for (const achado of encontrados) {
    if (achado.inicio < cursor) continue;
    if (achado.inicio > cursor) segmentos.push({ texto: texto.slice(cursor, achado.inicio) });
    segmentos.push({ texto: texto.slice(achado.inicio, achado.fim), tipo: achado.tipo, termo: achado.termo });
    cursor = achado.fim;
  }
  if (cursor < texto.length) segmentos.push({ texto: texto.slice(cursor) });
  return segmentos;
}

export function CurriculoDestacado({
  texto,
  termos,
  className,
}: {
  texto: string;
  termos: TermoDestaque[];
  className?: string;
}) {
  const segmentos = useMemo(() => montarSegmentos(texto, termos), [texto, termos]);
  const totalDestaques = segmentos.filter((s) => s.tipo).length;

  return (
    <div className={className}>
      <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-foreground">
        {segmentos.map((s, i) =>
          s.tipo ? (
            <mark
              key={`${i}-${s.termo}`}
              data-destaque={s.tipo}
              title={s.tipo === "palavra" ? `Palavra-chave: ${s.termo}` : `Seção: ${s.termo}`}
              className={
                s.tipo === "palavra"
                  ? "rounded bg-accent/40 px-0.5 text-foreground"
                  : "rounded bg-primary/25 px-0.5 text-foreground underline decoration-primary/60 underline-offset-2"
              }
            >
              {s.texto}
            </mark>
          ) : (
            <span key={i}>{s.texto}</span>
          ),
        )}
      </pre>
      {totalDestaques === 0 && (
        <p className="mt-3 rounded-md border border-dashed p-3 text-xs text-muted-foreground">
          Nenhum trecho correspondente encontrado no texto — isso costuma confirmar que o termo está mesmo ausente do
          currículo.
        </p>
      )}
    </div>
  );
}
