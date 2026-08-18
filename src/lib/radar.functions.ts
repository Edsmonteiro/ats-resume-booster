import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

import type { CartaApresentacao, CurriculoRevisado } from "./ats.schemas";
import { consumirRecurso } from "./plano.server";
import { JANELA_PADRAO, type FrequenciaAlerta, type RecomendacoesVaga } from "./radar.schemas";

export type { CartaApresentacao, CurriculoRevisado } from "./ats.schemas";
export type { RecomendacoesVaga } from "./radar.schemas";

export type Preferencias = {
  cargos: string[];
  senioridade: string;
  cidade: string;
  estado: string;
  modelos: string[];
  contratos: string[];
  salarioMinimo: number | null;
  palavrasEvitar: string[];
  ativo: boolean;
  alertaFrequencia: FrequenciaAlerta;
  janelaDias: number;
};

export type VagaRadar = {
  id: string;
  titulo: string;
  empresa: string;
  local: string;
  modelo: string;
  link: string;
  fonte: string;
  descricao: string;
  compatibilidade: number;
  motivo: string;
  lacunas: string[];
  status: string;
  criadaEm: string;
  publicadaEm: string | null;
  motivoRemocao: string | null;
  removidaEm: string | null;
};

const PREFERENCIAS_PADRAO: Preferencias = {
  cargos: [],
  senioridade: "qualquer",
  cidade: "",
  estado: "",
  modelos: [],
  contratos: [],
  salarioMinimo: null,
  palavrasEvitar: [],
  ativo: true,
  alertaFrequencia: "nenhum",
  janelaDias: JANELA_PADRAO,
};

export const carregarPreferencias = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Preferencias> => {
    const { data } = await context.supabase
      .from("preferencias_busca")
      .select("*")
      .eq("user_id", context.userId)
      .maybeSingle();

    if (!data) return PREFERENCIAS_PADRAO;
    return {
      cargos: data.cargos ?? [],
      senioridade: data.senioridade ?? "qualquer",
      cidade: data.cidade ?? "",
      estado: data.estado ?? "",
      modelos: data.modelos ?? [],
      contratos: data.contratos ?? [],
      salarioMinimo: data.salario_minimo ?? null,
      palavrasEvitar: data.palavras_evitar ?? [],
      ativo: data.ativo ?? true,
      alertaFrequencia: (data.alerta_frequencia ?? "nenhum") as FrequenciaAlerta,
      janelaDias: data.janela_dias ?? JANELA_PADRAO,
    };
  });

export const salvarPreferencias = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((entrada: Preferencias) => entrada)
  .handler(async ({ data, context }): Promise<{ ok: true; limpou: number }> => {
    const cargos = data.cargos.slice(0, 5).map((c) => c.slice(0, 80));

    const { data: anterior } = await context.supabase
      .from("preferencias_busca")
      .select("cargos")
      .eq("user_id", context.userId)
      .maybeSingle();

    const normalizar = (lista: string[]) =>
      [...lista.map((c) => c.trim().toLowerCase())].sort().join("|");
    const cargosMudaram = !!anterior && normalizar(anterior.cargos ?? []) !== normalizar(cargos);

    const { error } = await context.supabase.from("preferencias_busca").upsert(
      {
        user_id: context.userId,
        cargos,
        senioridade: data.senioridade.slice(0, 40),
        cidade: data.cidade.slice(0, 80),
        estado: data.estado.slice(0, 40),
        modelos: data.modelos.slice(0, 3),
        contratos: data.contratos.slice(0, 3),
        salario_minimo: data.salarioMinimo,
        palavras_evitar: data.palavrasEvitar.slice(0, 20).map((p) => p.slice(0, 60)),
        ativo: data.ativo,
        alerta_frequencia: data.alertaFrequencia,
        janela_dias: [7, 15, 30, 60].includes(data.janelaDias) ? data.janelaDias : JANELA_PADRAO,
      },
      { onConflict: "user_id" },
    );
    if (error) throw new Error(error.message);

    let limpou = 0;
    if (cargosMudaram) {
      // Só saem do radar as vagas que não combinam com os NOVOS cargos.
      const semAcento = (t: string) =>
        t
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");
      const termos = Array.from(
        new Set(
          cargos.flatMap((c) =>
            semAcento(c)
              .split(/[^a-z0-9]+/)
              .filter((t) => t.length > 3),
          ),
        ),
      );

      const { data: ativas } = await context.supabase
        .from("vagas_usuario")
        .select("id, vagas_encontradas(titulo)")
        .eq("user_id", context.userId)
        .in("status", ["nova", "vista"])
        .limit(300);

      const alvos = (ativas ?? [])
        .filter((linha) => {
          if (!termos.length) return true;
          const titulo = semAcento(linha.vagas_encontradas?.titulo ?? "");
          return !termos.some((t) => titulo.includes(t));
        })
        .map((linha) => linha.id);

      if (alvos.length) {
        const { data: arquivadas } = await context.supabase
          .from("vagas_usuario")
          .update({ status: "baixa" })
          .eq("user_id", context.userId)
          .in("id", alvos)
          .select("id");
        limpou = arquivadas?.length ?? 0;
      }
    }

    return { ok: true, limpou };
  });

export const listarVagasRadar = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (entrada: {
      ordenacao?: "compatibilidade_desc" | "compatibilidade_asc" | "recentes" | "antigas";
    }) => entrada,
  )
  .handler(async ({ data, context }): Promise<VagaRadar[]> => {
    const ordenacao = data.ordenacao ?? "compatibilidade_desc";

    const { data: linhas, error } = await context.supabase
      .from("vagas_usuario")
      .select(
        "id, compatibilidade, motivo, lacunas, status, created_at, motivo_remocao, removida_em, vagas_encontradas(titulo, empresa, local, modelo, link, fonte, descricao, publicada_em)",
      )
      .eq("user_id", context.userId)
      .not("status", "in", "(descartada,baixa,removida)")
      .order("created_at", { ascending: false })
      .limit(120);

    if (error) throw new Error(error.message);

    const { data: prefs } = await context.supabase
      .from("preferencias_busca")
      .select("janela_dias, cargos")
      .eq("user_id", context.userId)
      .maybeSingle();
    const janelaDias = prefs?.janela_dias ?? 30;
    const limite = Date.now() - janelaDias * 86_400_000;

    // Só entram no radar vagas cujo título combina com os cargos desejados
    // (todos os termos de ao menos um cargo).
    const semAcento = (t: string) =>
      t
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
    const cargos = prefs?.cargos ?? [];
    const gruposCargo = cargos
      .map((c: string) =>
        semAcento(c)
          .split(/[^a-z0-9]+/)
          .filter((t) => t.length > 3),
      )
      .filter((g: string[]) => g.length > 0);

    const resultado = (linhas ?? [])
      .map((linha) => {
        const vaga = linha.vagas_encontradas;
        return {
          id: linha.id,
          titulo: vaga?.titulo ?? "Vaga",
          empresa: vaga?.empresa ?? "",
          local: vaga?.local ?? "",
          modelo: vaga?.modelo ?? "",
          link: vaga?.link ?? "",
          fonte: vaga?.fonte ?? "",
          descricao: (vaga?.descricao ?? "").slice(0, 1200),
          compatibilidade: linha.compatibilidade,
          motivo: linha.motivo,
          lacunas: Array.isArray(linha.lacunas) ? (linha.lacunas as string[]) : [],
          status: linha.status,
          criadaEm: linha.created_at,
          publicadaEm: vaga?.publicada_em ?? null,
          motivoRemocao: linha.motivo_remocao ?? null,
          removidaEm: linha.removida_em ?? null,
        };
      })
      // Só vagas dentro da janela escolhida, mais recentes primeiro.
      .filter((v) => new Date(v.publicadaEm ?? v.criadaEm).getTime() >= limite)
      .filter((v) => {
        if (!gruposCargo.length) return true;
        const titulo = semAcento(v.titulo);
        return gruposCargo.some((grupo: string[]) => grupo.every((t) => titulo.includes(t)));
      });

    switch (ordenacao) {
      case "compatibilidade_asc":
        resultado.sort((a, b) => a.compatibilidade - b.compatibilidade);
        break;
      case "recentes":
        resultado.sort(
          (a, b) =>
            new Date(b.publicadaEm ?? b.criadaEm).getTime() -
            new Date(a.publicadaEm ?? a.criadaEm).getTime(),
        );
        break;
      case "antigas":
        resultado.sort(
          (a, b) =>
            new Date(a.publicadaEm ?? a.criadaEm).getTime() -
            new Date(b.publicadaEm ?? b.criadaEm).getTime(),
        );
        break;
      case "compatibilidade_desc":
      default:
        resultado.sort((a, b) => b.compatibilidade - a.compatibilidade);
        break;
    }

    return resultado.slice(0, 60);
  });

/** Apaga de vez as vagas já marcadas como removidas (encerradas / fora da janela). */
export const limparVagasEncerradas = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ removidas: number }> => {
    const { revalidarVagasUsuario } = await import("./revalidacao.server");
    const { data: prefs } = await context.supabase
      .from("preferencias_busca")
      .select("janela_dias")
      .eq("user_id", context.userId)
      .maybeSingle();

    await revalidarVagasUsuario(context.supabase, context.userId, prefs?.janela_dias ?? 30);

    const { data: apagadas, error } = await context.supabase
      .from("vagas_usuario")
      .delete()
      .eq("user_id", context.userId)
      .eq("status", "removida")
      .select("id");
    if (error) throw new Error(error.message);
    return { removidas: apagadas?.length ?? 0 };
  });

/** Reprocessa todo o histórico com a lógica atual de encerradas e janela de dias. */
export const revalidarHistorico = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(
    async ({
      context,
    }): Promise<{ encerradas: number; foraDaJanela: number; analisadas: number }> => {
      const { revalidarVagasUsuario } = await import("./revalidacao.server");
      const { data: prefs } = await context.supabase
        .from("preferencias_busca")
        .select("janela_dias")
        .eq("user_id", context.userId)
        .maybeSingle();

      return revalidarVagasUsuario(context.supabase, context.userId, prefs?.janela_dias ?? 30);
    },
  );

export const atualizarStatusVaga = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (entrada: { id: string; status: "nova" | "vista" | "salva" | "descartada" | "baixa" }) =>
      entrada,
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("vagas_usuario")
      .update({ status: data.status })
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Zera as preferências e tira todas as vagas do radar (elas ficam no histórico). */
export const limparPreferencias = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ ok: true; limpou: number }> => {
    const { error } = await context.supabase.from("preferencias_busca").upsert(
      {
        user_id: context.userId,
        cargos: [],
        senioridade: "qualquer",
        cidade: "",
        estado: "",
        modelos: [],
        contratos: [],
        salario_minimo: null,
        palavras_evitar: [],
        ativo: true,
        alerta_frequencia: "nenhum",
        janela_dias: JANELA_PADRAO,
      },
      { onConflict: "user_id" },
    );
    if (error) throw new Error(error.message);

    const { data: arquivadas } = await context.supabase
      .from("vagas_usuario")
      .update({ status: "baixa" })
      .eq("user_id", context.userId)
      .in("status", ["nova", "vista", "salva"])
      .select("id");

    return { ok: true, limpou: arquivadas?.length ?? 0 };
  });

export const rodarRadar = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(
    async ({ context }): Promise<{ novas: number; avaliadas: number } | { error: string }> => {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { executarRadar, registrarNotificacaoRadar } = await import("./radar-run.server");

      const bloqueio = await consumirRecurso(context.userId, "radar");
      if (bloqueio) return bloqueio;

      const resultado = await executarRadar(supabaseAdmin, context.userId);
      if ("error" in resultado) return resultado;

      await registrarNotificacaoRadar(supabaseAdmin, context.userId, resultado);
      return { novas: resultado.novas, avaliadas: resultado.avaliadas };
    },
  );

export type VagaHistorico = VagaRadar & { temRecomendacoes: boolean; abertaEm: string | null };

/** Marca que o usuário abriu o anúncio — é o que faz a vaga entrar no histórico. */
export const registrarAberturaVaga = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((entrada: { id: string }) => entrada)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("vagas_usuario")
      .update({ aberta_em: new Date().toISOString() })
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .is("aberta_em", null);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Histórico: apenas as vagas em que o usuário clicou em "Abrir vaga". */
export const listarHistoricoRadar = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<VagaHistorico[]> => {
    const { data, error } = await context.supabase
      .from("vagas_usuario")
      .select(
        "id, compatibilidade, motivo, lacunas, status, created_at, motivo_remocao, removida_em, aberta_em, recomendacoes, vagas_encontradas(titulo, empresa, local, modelo, link, fonte, descricao, publicada_em)",
      )
      .eq("user_id", context.userId)
      .not("aberta_em", "is", null)
      .order("aberta_em", { ascending: false })
      .limit(200);

    if (error) throw new Error(error.message);

    return (data ?? []).map((linha) => {
      const vaga = linha.vagas_encontradas;
      return {
        id: linha.id,
        titulo: vaga?.titulo ?? "Vaga",
        empresa: vaga?.empresa ?? "",
        local: vaga?.local ?? "",
        modelo: vaga?.modelo ?? "",
        link: vaga?.link ?? "",
        fonte: vaga?.fonte ?? "",
        descricao: (vaga?.descricao ?? "").slice(0, 1200),
        compatibilidade: linha.compatibilidade,
        motivo: linha.motivo,
        lacunas: Array.isArray(linha.lacunas) ? (linha.lacunas as string[]) : [],
        status: linha.status,
        criadaEm: linha.created_at,
        publicadaEm: vaga?.publicada_em ?? null,
        motivoRemocao: linha.motivo_remocao ?? null,
        removidaEm: linha.removida_em ?? null,
        temRecomendacoes: linha.recomendacoes != null,
        abertaEm: linha.aberta_em ?? null,
      };
    });
  });

export const gerarRecomendacoesVaga = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((entrada: { id: string; refazer?: boolean }) => entrada)
  .handler(
    async ({
      data,
      context,
    }): Promise<{ recomendacoes: RecomendacoesVaga } | { error: string }> => {
      const { data: linha, error } = await context.supabase
        .from("vagas_usuario")
        .select(
          "id, compatibilidade, lacunas, recomendacoes, vagas_encontradas(titulo, empresa, descricao)",
        )
        .eq("id", data.id)
        .eq("user_id", context.userId)
        .maybeSingle();

      if (error || !linha) return { error: "Vaga não encontrada no seu radar." };

      if (!data.refazer && linha.recomendacoes)
        return { recomendacoes: linha.recomendacoes as unknown as RecomendacoesVaga };

      const { data: dados } = await context.supabase
        .from("dados_usuario")
        .select("curriculo")
        .eq("user_id", context.userId)
        .maybeSingle();

      const curriculo = dados?.curriculo ?? "";
      if (curriculo.trim().length < 50)
        return { error: "Cadastre seu currículo para receber recomendações." };

      const { gerarRecomendacoes } = await import("./radar.server");

      let recomendacoes: RecomendacoesVaga;
      try {
        recomendacoes = await gerarRecomendacoes(curriculo, {
          titulo: linha.vagas_encontradas?.titulo ?? "Vaga",
          empresa: linha.vagas_encontradas?.empresa ?? "",
          descricao: linha.vagas_encontradas?.descricao ?? "",
          compatibilidade: linha.compatibilidade,
          lacunas: Array.isArray(linha.lacunas) ? (linha.lacunas as string[]) : [],
        });
      } catch (erro) {
        console.error("Falha ao gerar recomendações", erro);
        return { error: "Não foi possível gerar as recomendações agora. Tente novamente." };
      }

      await context.supabase
        .from("vagas_usuario")
        .update({ recomendacoes: JSON.parse(JSON.stringify(recomendacoes)) })
        .eq("id", linha.id)
        .eq("user_id", context.userId);

      return { recomendacoes };
    },
  );

export type Notificacao = {
  id: string;
  titulo: string;
  mensagem: string;
  lida: boolean;
  criadaEm: string;
};

export const listarNotificacoes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Notificacao[]> => {
    const { data, error } = await context.supabase
      .from("notificacoes")
      .select("id, titulo, mensagem, lida, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) throw new Error(error.message);
    return (data ?? []).map((n) => ({
      id: n.id,
      titulo: n.titulo,
      mensagem: n.mensagem,
      lida: n.lida,
      criadaEm: n.created_at,
    }));
  });

export const marcarNotificacoesLidas = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase
      .from("notificacoes")
      .update({ lida: true })
      .eq("user_id", context.userId)
      .eq("lida", false);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export type CurriculoVagaResultado = {
  curriculo: CurriculoRevisado;
  carta: CartaApresentacao | null;
};

export const gerarCurriculoVaga = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((entrada: { id: string; comCarta?: boolean }) => entrada)
  .handler(async ({ data, context }): Promise<CurriculoVagaResultado | { error: string }> => {
    const { data: linha, error } = await context.supabase
      .from("vagas_usuario")
      .select(
        "id, compatibilidade, lacunas, recomendacoes, vagas_encontradas(titulo, empresa, descricao)",
      )
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .maybeSingle();

    if (error || !linha) return { error: "Vaga não encontrada no seu radar." };

    const { data: dados } = await context.supabase
      .from("dados_usuario")
      .select("curriculo")
      .eq("user_id", context.userId)
      .maybeSingle();

    const curriculo = dados?.curriculo ?? "";
    if (curriculo.trim().length < 50)
      return { error: "Cadastre seu currículo para gerar a versão sob medida." };

    const { gerarCurriculoParaVaga, gerarRecomendacoes } = await import("./radar.server");

    const vaga = {
      titulo: linha.vagas_encontradas?.titulo ?? "Vaga",
      empresa: linha.vagas_encontradas?.empresa ?? "",
      descricao: linha.vagas_encontradas?.descricao ?? "",
      compatibilidade: linha.compatibilidade,
      lacunas: Array.isArray(linha.lacunas) ? (linha.lacunas as string[]) : [],
    };

    try {
      let recomendacoes = (linha.recomendacoes as unknown as RecomendacoesVaga | null) ?? null;
      if (!recomendacoes) {
        try {
          recomendacoes = await gerarRecomendacoes(curriculo, vaga);
          await context.supabase
            .from("vagas_usuario")
            .update({ recomendacoes: JSON.parse(JSON.stringify(recomendacoes)) })
            .eq("id", data.id)
            .eq("user_id", context.userId);
        } catch (erro) {
          console.error("Falha ao gerar recomendações antes do currículo", erro);
        }
      }

      return await gerarCurriculoParaVaga(curriculo, vaga, data.comCarta === true, recomendacoes);
    } catch (erro) {
      console.error("Falha ao gerar currículo da vaga", erro);
      return { error: "Não foi possível gerar o currículo agora. Tente novamente." };
    }
  });

export const gerarCartaVaga = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (entrada: { id: string; curriculo?: string; tom?: "formal" | "equilibrado" | "direto" }) =>
      entrada,
  )
  .handler(async ({ data, context }): Promise<{ carta: CartaApresentacao } | { error: string }> => {
    const { data: linha, error } = await context.supabase
      .from("vagas_usuario")
      .select("id, vagas_encontradas(titulo, empresa, descricao)")
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .maybeSingle();

    if (error || !linha) return { error: "Vaga não encontrada no seu radar." };

    let base = (data.curriculo ?? "").trim();
    if (base.length < 50) {
      const { data: dados } = await context.supabase
        .from("dados_usuario")
        .select("curriculo")
        .eq("user_id", context.userId)
        .maybeSingle();
      base = (dados?.curriculo ?? "").trim();
    }
    if (base.length < 50) return { error: "Cadastre seu currículo para gerar a carta." };

    const { gerarCartaParaVaga } = await import("./radar.server");
    try {
      const carta = await gerarCartaParaVaga(
        base.slice(0, 16000),
        {
          titulo: linha.vagas_encontradas?.titulo ?? "Vaga",
          empresa: linha.vagas_encontradas?.empresa ?? "",
          descricao: linha.vagas_encontradas?.descricao ?? "",
        },
        data.tom ?? "equilibrado",
      );
      return { carta };
    } catch (erro) {
      console.error("Falha ao gerar carta da vaga", erro);
      return { error: "Não foi possível gerar a carta agora. Tente novamente." };
    }
  });

/** Vagas retiradas do radar nos últimos dias, com o motivo da remoção. */
export const listarVagasRemovidas = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(
    async ({
      context,
    }): Promise<
      { id: string; titulo: string; fonte: string; motivoRemocao: string; removidaEm: string }[]
    > => {
      const { data, error } = await context.supabase
        .from("vagas_usuario")
        .select("id, motivo_remocao, removida_em, vagas_encontradas(titulo, fonte)")
        .eq("user_id", context.userId)
        .eq("status", "removida")
        .order("removida_em", { ascending: false })
        .limit(20);

      if (error) throw new Error(error.message);
      return (data ?? []).map((linha) => ({
        id: linha.id,
        titulo: linha.vagas_encontradas?.titulo ?? "Vaga",
        fonte: linha.vagas_encontradas?.fonte ?? "",
        motivoRemocao: linha.motivo_remocao ?? "Removida do radar",
        removidaEm: linha.removida_em ?? new Date().toISOString(),
      }));
    },
  );
