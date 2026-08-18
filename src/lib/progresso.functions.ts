import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type PontoEvolucao = { data: string; score: number };

export type Progresso = {
  evolucao: PontoEvolucao[];
  scoreAtual: number | null;
  scoreInicial: number | null;
  vagasAnalisadas: number;
  compatibilidadeMedia: number;
  melhorCompatibilidade: number;
  piorCompatibilidade: number;
  funil: { status: string; total: number }[];
  totalCandidaturas: number;
  taxaEntrevista: number;
  palavrasFaltando: { termo: string; vezes: number }[];
  semana: { vagasNovas: number; candidaturasNovas: number; entrevistas: number };
};

type ItemHistorico = { criadaEm?: string; score?: number };

export const carregarProgresso = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Progresso> => {
    const uid = context.userId;
    const sb = context.supabase;

    const [dados, vagas, candidaturas] = await Promise.all([
      sb.from("dados_usuario").select("historico").eq("user_id", uid).maybeSingle(),
      sb
        .from("vagas_usuario")
        .select("compatibilidade, lacunas, created_at, removida_em")
        .eq("user_id", uid),
      sb.from("candidaturas").select("status, created_at").eq("user_id", uid),
    ]);

    const historico = (Array.isArray(dados.data?.historico) ? dados.data.historico : []) as ItemHistorico[];
    const evolucao = historico
      .filter((h) => typeof h?.score === "number" && h?.criadaEm)
      .map((h) => ({ data: String(h.criadaEm), score: Math.round(Number(h.score)) }))
      .sort((a, b) => a.data.localeCompare(b.data));

    const listaVagas = vagas.data ?? [];
    const notas = listaVagas.map((v) => v.compatibilidade ?? 0).filter((n) => n > 0);
    const media = notas.length ? Math.round(notas.reduce((a, b) => a + b, 0) / notas.length) : 0;

    const contagem = new Map<string, number>();
    for (const v of listaVagas) {
      const lacunas = Array.isArray(v.lacunas) ? v.lacunas : [];
      for (const l of lacunas) {
        const termo = typeof l === "string" ? l : ((l as { termo?: string })?.termo ?? "");
        const limpo = termo.trim().toLowerCase();
        if (limpo.length < 2 || limpo.length > 40) continue;
        contagem.set(limpo, (contagem.get(limpo) ?? 0) + 1);
      }
    }
    const palavrasFaltando = [...contagem.entries()]
      .map(([termo, vezes]) => ({ termo, vezes }))
      .sort((a, b) => b.vezes - a.vezes)
      .slice(0, 12);

    const lista = candidaturas.data ?? [];
    const porStatus = new Map<string, number>();
    for (const c of lista) porStatus.set(c.status, (porStatus.get(c.status) ?? 0) + 1);
    const funil = ["enviada", "triagem", "entrevista", "teste", "oferta", "recusado"].map((s) => ({
      status: s,
      total: porStatus.get(s) ?? 0,
    }));

    const enviadasTotal = lista.filter((c) => c.status !== "interessado").length;
    const entrevistasTotal = lista.filter((c) =>
      ["entrevista", "teste", "oferta"].includes(c.status),
    ).length;

    const seteDias = Date.now() - 7 * 86_400_000;
    const semana = {
      vagasNovas: listaVagas.filter((v) => new Date(v.created_at).getTime() >= seteDias).length,
      candidaturasNovas: lista.filter((c) => new Date(c.created_at).getTime() >= seteDias).length,
      entrevistas: entrevistasTotal,
    };

    return {
      evolucao,
      scoreAtual: evolucao.length ? evolucao[evolucao.length - 1]!.score : null,
      scoreInicial: evolucao.length ? evolucao[0]!.score : null,
      vagasAnalisadas: listaVagas.length,
      compatibilidadeMedia: media,
      melhorCompatibilidade: notas.length ? Math.max(...notas) : 0,
      piorCompatibilidade: notas.length ? Math.min(...notas) : 0,
      funil,
      totalCandidaturas: lista.length,
      taxaEntrevista: enviadasTotal ? Math.round((entrevistasTotal / enviadasTotal) * 100) : 0,
      palavrasFaltando,
      semana,
    };
  });
