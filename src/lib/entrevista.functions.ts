import { createServerFn } from "@tanstack/react-start";
import { generateObject } from "ai";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

import { modelo, providerOptions } from "./ats.server";
import {
  feedbackRespostaSchema,
  roteiroEntrevistaSchema,
  type FeedbackResposta,
  type RoteiroEntrevista,
} from "./entrevista.schemas";
import { SYSTEM_FEEDBACK, SYSTEM_ROTEIRO } from "./entrevista.server";
import { checarRecurso } from "./plano.server";

export type { FeedbackResposta, RoteiroEntrevista } from "./entrevista.schemas";

async function temPro(userId: string) {
  return (await checarRecurso(userId, "entrevista")) === null;
}

export type PreparoEntrevista = {
  candidatura: {
    id: string;
    titulo: string;
    empresa: string;
    requisitos: string;
    compatibilidade: number;
    link: string;
  };
  roteiro: RoteiroEntrevista | null;
  bloqueado: boolean;
};

export const carregarPreparo = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((entrada: { candidaturaId: string }) => entrada)
  .handler(async ({ data, context }): Promise<PreparoEntrevista | null> => {
    const { data: cand, error } = await context.supabase
      .from("candidaturas")
      .select("id, titulo, empresa, requisitos, compatibilidade, link")
      .eq("id", data.candidaturaId)
      .eq("user_id", context.userId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!cand) return null;

    const { data: preparo } = await context.supabase
      .from("preparos_entrevista")
      .select("roteiro")
      .eq("candidatura_id", cand.id)
      .eq("user_id", context.userId)
      .maybeSingle();

    const roteiro = preparo?.roteiro
      ? (roteiroEntrevistaSchema.safeParse(preparo.roteiro).data ?? null)
      : null;

    return { candidatura: cand, roteiro, bloqueado: !(await temPro(context.userId)) };
  });

export const gerarRoteiroEntrevista = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((entrada: unknown) =>
    z.object({ candidaturaId: z.string().uuid() }).parse(entrada),
  )
  .handler(async ({ data, context }): Promise<RoteiroEntrevista | { error: string }> => {
    if (!(await temPro(context.userId))) {
      return { error: "Assine o Eu Passo Pro para preparar entrevistas com IA." };
    }

    const { data: cand } = await context.supabase
      .from("candidaturas")
      .select("id, vaga_id, titulo, empresa, requisitos, compatibilidade")
      .eq("id", data.candidaturaId)
      .eq("user_id", context.userId)
      .maybeSingle();

    if (!cand) return { error: "Candidatura não encontrada." };

    let requisitos = cand.requisitos ?? "";
    if (requisitos.trim().length < 40 && cand.vaga_id) {
      const { data: vaga } = await context.supabase
        .from("vagas_encontradas")
        .select("descricao")
        .eq("id", cand.vaga_id)
        .maybeSingle();
      requisitos = vaga?.descricao ?? requisitos;
    }

    const { data: dados } = await context.supabase
      .from("dados_usuario")
      .select("curriculo")
      .eq("user_id", context.userId)
      .maybeSingle();

    const curriculo = (dados?.curriculo ?? "").trim();
    if (curriculo.length < 80) {
      return { error: "Salve seu currículo na aba Currículo antes de preparar a entrevista." };
    }

    const { object } = await generateObject({
      model: modelo(),
      schema: roteiroEntrevistaSchema,
      providerOptions,
      system: SYSTEM_ROTEIRO,
      prompt: `VAGA\nCargo: ${cand.titulo}\nEmpresa: ${cand.empresa || "não informada"}\nCompatibilidade calculada: ${cand.compatibilidade}%\nRequisitos e descrição:\n${requisitos.slice(0, 12000) || "não informados — use o cargo como referência"}\n\nCURRÍCULO DO CANDIDATO:\n${curriculo.slice(0, 20000)}\n\nMonte de 8 a 12 perguntas prováveis, com respostas STAR baseadas apenas neste currículo.`,
    });

    await context.supabase.from("preparos_entrevista").insert({
      user_id: context.userId,
      candidatura_id: cand.id,
      vaga_id: cand.vaga_id,
      titulo: cand.titulo,
      empresa: cand.empresa ?? "",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      roteiro: object as any,
    });

    return object;
  });

export const avaliarResposta = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((entrada: unknown) =>
    z
      .object({
        pergunta: z.string().min(5).max(1000),
        resposta: z.string().min(20).max(6000),
        cargo: z.string().max(200).default(""),
      })
      .parse(entrada),
  )
  .handler(async ({ data, context }): Promise<FeedbackResposta | { error: string }> => {
    if (!(await temPro(context.userId))) {
      return { error: "Assine o Eu Passo Pro para treinar respostas com IA." };
    }

    const { object } = await generateObject({
      model: modelo(),
      schema: feedbackRespostaSchema,
      providerOptions,
      system: SYSTEM_FEEDBACK,
      prompt: `Cargo em disputa: ${data.cargo || "não informado"}\n\nPERGUNTA:\n${data.pergunta}\n\nRESPOSTA DO CANDIDATO:\n${data.resposta}\n\nAvalie e reescreva melhor, mantendo os fatos.`,
    });

    return object;
  });
