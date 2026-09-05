import { createServerFn } from "@tanstack/react-start";
import { generateObject } from "ai";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

import { modelo, providerOptions } from "./ats.server";
import {
  salvarConquistaInput,
  sugerirConquistasInput,
  sugestoesConquistasSchema,
  type Conquista,
  type ConquistaSugerida,
} from "./conquistas.schemas";
import { SYSTEM_CONQUISTAS } from "./conquistas.server";
import { consumirRecurso } from "./plano.server";

export type { Conquista, ConquistaSugerida } from "./conquistas.schemas";

const COLUNAS = "id, titulo, situacao, tarefa, acao, resultado, tags, created_at";

export const listarConquistas = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Conquista[]> => {
    const { data, error } = await context.supabase
      .from("conquistas")
      .select(COLUNAS)
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []) as Conquista[];
  });

export const salvarConquista = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => salvarConquistaInput.parse(input))
  .handler(async ({ data, context }): Promise<Conquista> => {
    const registro = {
      user_id: context.userId,
      titulo: data.titulo,
      situacao: data.situacao,
      tarefa: data.tarefa,
      acao: data.acao,
      resultado: data.resultado,
      tags: data.tags,
    };

    const consulta = data.id
      ? context.supabase
          .from("conquistas")
          .update(registro)
          .eq("id", data.id)
          .eq("user_id", context.userId)
          .select(COLUNAS)
          .single()
      : context.supabase.from("conquistas").insert(registro).select(COLUNAS).single();

    const { data: linha, error } = await consulta;
    if (error) throw new Error(error.message);
    return linha as Conquista;
  });

export const excluirConquista = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((entrada: { id: string }) => entrada)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("conquistas")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const sugerirConquistas = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => sugerirConquistasInput.parse(input))
  .handler(async ({ data, context }): Promise<ConquistaSugerida[]> => {
    // A extração de conquistas é uma análise do currículo e compartilha a mesma cota de ATS.
    const bloqueio = await consumirRecurso(context.userId, "ats");
    if (bloqueio) throw new Error(bloqueio.error);

    const { object } = await generateObject({
      model: modelo(),
      schema: sugestoesConquistasSchema,
      providerOptions,
      system: SYSTEM_CONQUISTAS,
      prompt: `Extraia conquistas STAR do currículo abaixo.\n\n---\n${data.curriculo}\n---`,
    });
    return object.conquistas;
  });
