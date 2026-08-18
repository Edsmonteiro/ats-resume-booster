import { useCallback, useEffect, useState } from "react";

export type VersaoCurriculo = {
  id: string;
  criadaEm: string;
  rotulo: string;
  texto: string;
  mudancas: string[];
  observacoes: string[];
  carta: { assunto: string; carta: string } | null;
};

const LIMITE = 12;

function chaveDe(vagaId: string) {
  return `eupasso:cv-versoes:${vagaId}`;
}

/** Histórico local de versões do currículo gerado para uma vaga. */
export function useVersoesCurriculo(vagaId: string) {
  const chave = chaveDe(vagaId);
  const [versoes, setVersoes] = useState<VersaoCurriculo[]>([]);

  useEffect(() => {
    try {
      const bruto = window.localStorage.getItem(chave);
      setVersoes(bruto ? (JSON.parse(bruto) as VersaoCurriculo[]) : []);
    } catch {
      setVersoes([]);
    }
  }, [chave]);

  const persistir = useCallback(
    (lista: VersaoCurriculo[]) => {
      setVersoes(lista);
      try {
        window.localStorage.setItem(chave, JSON.stringify(lista));
      } catch {
        /* armazenamento indisponível */
      }
    },
    [chave],
  );

  const adicionar = useCallback(
    (versao: Omit<VersaoCurriculo, "id" | "criadaEm" | "rotulo">) => {
      setVersoes((atual) => {
        const nova: VersaoCurriculo = {
          ...versao,
          id: crypto.randomUUID(),
          criadaEm: new Date().toISOString(),
          rotulo: `Versão ${atual.length + 1}`,
        };
        const lista = [nova, ...atual].slice(0, LIMITE);
        try {
          window.localStorage.setItem(chave, JSON.stringify(lista));
        } catch {
          /* armazenamento indisponível */
        }
        return lista;
      });
    },
    [chave],
  );

  const remover = useCallback(
    (id: string) => persistir(versoes.filter((v) => v.id !== id)),
    [persistir, versoes],
  );

  return { versoes, adicionar, remover };
}

export type LinhaDiff = { tipo: "igual" | "adicionada" | "removida"; texto: string };

/** Diff simples por linha entre duas versões do currículo. */
export function diffLinhas(anterior: string, atual: string): LinhaDiff[] {
  const a = anterior.split(/\r?\n/).filter((l) => l.trim());
  const b = atual.split(/\r?\n/).filter((l) => l.trim());
  const setA = new Set(a);
  const setB = new Set(b);

  const saida: LinhaDiff[] = [];
  for (const linha of a) if (!setB.has(linha)) saida.push({ tipo: "removida", texto: linha });
  for (const linha of b) saida.push({ tipo: setA.has(linha) ? "igual" : "adicionada", texto: linha });
  return saida;
}
