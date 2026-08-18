import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";

export type ResultadoRadar = { novas: number; avaliadas: number; titulos: string[] };

/**
 * Roda uma varredura completa do radar para um usuário: lê preferências e
 * currículo, busca anúncios reais, avalia com IA e grava o resultado.
 * Usado tanto pelo botão "Rodar radar agora" quanto pelo job de alertas.
 */
export const JANELA_DIAS = 30;

/** Marca como removidas as vagas encerradas/fora da janela, com motivo claro. */
export async function limparVagasEncerradas(
  admin: SupabaseClient<Database>,
  userId: string,
  janelaDias = JANELA_DIAS,
): Promise<number> {
  const { revalidarVagasUsuario } = await import("./revalidacao.server");
  const resultado = await revalidarVagasUsuario(admin, userId, janelaDias);
  return resultado.encerradas + resultado.foraDaJanela;
}

export async function executarRadar(
  admin: SupabaseClient<Database>,
  userId: string,
): Promise<ResultadoRadar | { error: string }> {
  const { avaliarVaga, buscarVagas, montarConsultas } = await import("./radar.server");
  const { vagaEncerrada } = await import("./vaga-encerrada");

  const { data: prefsRow } = await admin
    .from("preferencias_busca")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  const janelaDias = prefsRow?.janela_dias ?? JANELA_DIAS;
  await limparVagasEncerradas(admin, userId, janelaDias);

  const cargos = prefsRow?.cargos ?? [];
  if (!cargos.length) return { error: "Cadastre ao menos um cargo desejado nas preferências." };

  const { data: dados } = await admin
    .from("dados_usuario")
    .select("curriculo")
    .eq("user_id", userId)
    .maybeSingle();

  const curriculo = dados?.curriculo ?? "";
  if (curriculo.trim().length < 50)
    return { error: "Cadastre seu currículo antes de ativar o radar." };

  const prefs = {
    cargos,
    cidade: prefsRow?.cidade ?? "",
    estado: prefsRow?.estado ?? "",
    modelos: prefsRow?.modelos ?? [],
    contratos: prefsRow?.contratos ?? [],
    senioridade: prefsRow?.senioridade ?? "qualquer",
  };

  const evitar = (prefsRow?.palavras_evitar ?? []).map((p: string) => p.toLowerCase());

  let brutas;
  try {
    brutas = await buscarVagas(montarConsultas(prefs), 10, janelaDias);
  } catch (erro) {
    console.error(erro);
    return { error: "Não foi possível buscar vagas agora. Tente novamente em alguns minutos." };
  }

  const semAcento = (t: string) =>
    t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  // Cada cargo desejado vira um conjunto de termos: o título precisa conter TODOS
  // os termos de ao menos um cargo (ex.: "analista" + "dados").
  const gruposCargo = cargos
    .map((c: string) =>
      semAcento(c)
        .split(/[^a-z0-9]+/)
        .filter((t) => t.length > 3),
    )
    .filter((g: string[]) => g.length > 0);

  // Pontua o quanto o título casa com os cargos desejados: casamento total vale
  // mais, mas aceitamos casamento parcial forte para não perder vagas boas.
  const pontuarTitulo = (titulo: string) => {
    if (!gruposCargo.length) return 1;
    let melhor = 0;
    for (const grupo of gruposCargo) {
      const acertos = grupo.filter((t) => titulo.includes(t)).length;
      melhor = Math.max(melhor, acertos / grupo.length);
    }
    return melhor;
  };

  const candidatas = brutas
    .filter((v) => !evitar.some((p) => `${v.titulo} ${v.descricao}`.toLowerCase().includes(p)))
    .map((v) => ({ vaga: v, pontos: pontuarTitulo(semAcento(v.titulo)) }))
    .filter((c) => c.pontos >= 0.5)
    .sort((a, b) => b.pontos - a.pontos);

  const filtradas = candidatas.slice(0, 40).map((c) => c.vaga);

  const resumoPrefs = `Cargos: ${prefs.cargos.join(", ")}. Senioridade: ${prefs.senioridade}. Local: ${[prefs.cidade, prefs.estado].filter(Boolean).join("/") || "indiferente"}. Modelos aceitos: ${prefs.modelos.join(", ") || "indiferente"}. Tipos de contrato aceitos: ${prefs.contratos.join(", ") || "indiferente"}.`;

  let novas = 0;
  let avaliadas = 0;
  const titulos: string[] = [];

  // Avalia em paralelo (lotes) para conseguir cobrir muito mais anúncios por rodada.
  const paraAvaliar = filtradas.filter((v) => !vagaEncerrada(v.titulo, v.descricao));
  const avaliacoes: { bruta: (typeof filtradas)[number]; avaliacao: NonNullable<Awaited<ReturnType<typeof avaliarVaga>>> }[] = [];
  const LOTE_IA = 5;
  for (let i = 0; i < paraAvaliar.length; i += LOTE_IA) {
    const lote = paraAvaliar.slice(i, i + LOTE_IA);
    const resultados = await Promise.all(
      lote.map(async (bruta) => ({ bruta, avaliacao: await avaliarVaga(curriculo, resumoPrefs, bruta) })),
    );
    for (const r of resultados) {
      if (!r.avaliacao || !r.avaliacao.relevante || !r.avaliacao.aceitandoCandidaturas) continue;
      avaliacoes.push({ bruta: r.bruta, avaliacao: r.avaliacao });
    }
  }

  for (const { bruta, avaliacao } of avaliacoes) {


    // Só entram anúncios publicados dentro da janela escolhida pelo usuário.
    const dataPublicacao = avaliacao.publicadaEm ? new Date(avaliacao.publicadaEm) : null;
    const publicadaEm =
      dataPublicacao && !Number.isNaN(dataPublicacao.getTime()) ? dataPublicacao : null;
    const dias = publicadaEm
      ? Math.floor((Date.now() - publicadaEm.getTime()) / 86_400_000)
      : avaliacao.diasDesdePublicacao;
    if (dias > janelaDias) continue;

    avaliadas += 1;

    const noRadar = avaliacao.compatibilidade >= 40;

    const { data: vagaSalva, error: erroVaga } = await admin
      .from("vagas_encontradas")
      .upsert(
        {
          chave: bruta.chave,
          titulo: bruta.titulo,
          empresa: avaliacao.empresa,
          local: avaliacao.local,
          modelo: avaliacao.modelo,
          descricao: bruta.descricao.slice(0, 8000),
          link: bruta.link,
          fonte: bruta.fonte,
          publicada_em: publicadaEm
            ? publicadaEm.toISOString()
            : dias >= 0
              ? new Date(Date.now() - dias * 86_400_000).toISOString()
              : new Date().toISOString(),
        },
        { onConflict: "chave" },
      )
      .select("id")
      .single();

    if (erroVaga || !vagaSalva) continue;

    const { data: existente } = await admin
      .from("vagas_usuario")
      .select("id, status")
      .eq("user_id", userId)
      .eq("vaga_id", vagaSalva.id)
      .maybeSingle();

    if (existente) {
      // Reativa vagas que ficaram arquivadas mas voltaram a ser compatíveis.
      const podeReativar = ["baixa", "removida"].includes(existente.status);
      if (!podeReativar) continue;
      if (!noRadar) continue;
      const { error: erroUpd } = await admin
        .from("vagas_usuario")
        .update({
          compatibilidade: Math.round(avaliacao.compatibilidade),
          motivo: avaliacao.motivo,
          lacunas: avaliacao.lacunas,
          status: "nova",
          motivo_remocao: null,
          removida_em: null,
        })
        .eq("id", existente.id);
      if (erroUpd) continue;
    } else {
      const { error: erroLink } = await admin.from("vagas_usuario").insert({
        user_id: userId,
        vaga_id: vagaSalva.id,
        compatibilidade: Math.round(avaliacao.compatibilidade),
        motivo: avaliacao.motivo,
        lacunas: avaliacao.lacunas,
        status: noRadar ? "nova" : "baixa",
      });
      if (erroLink) continue;
    }

    if (noRadar) {
      novas += 1;
      if (titulos.length < 5) titulos.push(bruta.titulo);
    }
  }

  return { novas, avaliadas, titulos };
}

export async function registrarNotificacaoRadar(
  admin: SupabaseClient<Database>,
  userId: string,
  resultado: ResultadoRadar,
) {
  if (resultado.novas <= 0) return;
  await admin.from("notificacoes").insert({
    user_id: userId,
    titulo: `${resultado.novas} nova${resultado.novas > 1 ? "s" : ""} vaga${resultado.novas > 1 ? "s" : ""} no seu radar`,
    mensagem: resultado.titulos.join(" · ").slice(0, 400),
    tipo: "radar",
    dados: { novas: resultado.novas, avaliadas: resultado.avaliadas },
  });
}
