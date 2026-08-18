import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";

export type ResultadoRevalidacao = {
  encerradas: number;
  foraDaJanela: number;
  analisadas: number;
};

/**
 * Revalida as vagas de um usuário com a lógica atual: marca como "removida"
 * tudo que já não aceita candidaturas ou que saiu da janela de postagem,
 * registrando o motivo claro da remoção.
 */
export async function revalidarVagasUsuario(
  admin: SupabaseClient<Database>,
  userId: string,
  janelaDias: number,
): Promise<ResultadoRevalidacao> {
  const { vagaEncerrada } = await import("./vaga-encerrada");

  const { data } = await admin
    .from("vagas_usuario")
    .select("id, status, created_at, vagas_encontradas(titulo, descricao, publicada_em)")
    .eq("user_id", userId)
    .neq("status", "removida")
    .limit(500);

  const linhas = data ?? [];
  const limite = Date.now() - janelaDias * 86_400_000;

  const encerradas: string[] = [];
  const foraDaJanela: string[] = [];

  for (const linha of linhas) {
    const vaga = linha.vagas_encontradas;
    if (vagaEncerrada(vaga?.titulo, vaga?.descricao)) {
      encerradas.push(linha.id);
      continue;
    }
    const referencia = new Date(vaga?.publicada_em ?? linha.created_at).getTime();
    if (Number.isFinite(referencia) && referencia < limite) foraDaJanela.push(linha.id);
  }

  const agora = new Date().toISOString();

  if (encerradas.length)
    await admin
      .from("vagas_usuario")
      .update({
        status: "removida",
        motivo_remocao: "Não aceita mais candidaturas",
        removida_em: agora,
      })
      .in("id", encerradas);

  if (foraDaJanela.length)
    await admin
      .from("vagas_usuario")
      .update({
        status: "removida",
        motivo_remocao: `Fora da janela de ${janelaDias} dias`,
        removida_em: agora,
      })
      .in("id", foraDaJanela);

  return {
    encerradas: encerradas.length,
    foraDaJanela: foraDaJanela.length,
    analisadas: linhas.length,
  };
}

/** Lê a janela de postagem configurada pelo usuário (padrão 30 dias). */
export async function janelaDoUsuario(
  admin: SupabaseClient<Database>,
  userId: string,
): Promise<number> {
  const { data } = await admin
    .from("preferencias_busca")
    .select("janela_dias")
    .eq("user_id", userId)
    .maybeSingle();
  return data?.janela_dias ?? 30;
}
