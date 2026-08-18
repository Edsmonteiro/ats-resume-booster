import { createServerFn } from "@tanstack/react-start";
import { generateObject } from "ai";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

import { checarRecurso } from "./plano.server";

import { modelo, providerOptions } from "./ats.server";
import {
  aplicarCursoInput,
  curriculoComCursoSchema,
  salvarCursoInput,
  type CurriculoComCurso,
  type Curso,
} from "./cursos.schemas";
import { promptCurso, SYSTEM_CURSO } from "./cursos.server";

export type { Curso, CurriculoComCurso } from "./cursos.schemas";

const COLUNAS =
  "id, nome, instituicao, carga_horaria, concluido_em, link, aprendizados, aplicado_em_curriculo, created_at";

export const listarCursos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Curso[]> => {
    const { data, error } = await context.supabase
      .from("cursos")
      .select(COLUNAS)
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []) as Curso[];
  });

export const salvarCurso = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => salvarCursoInput.parse(input))
  .handler(async ({ data, context }): Promise<Curso> => {
    const registro = {
      user_id: context.userId,
      nome: data.nome,
      instituicao: data.instituicao,
      carga_horaria: data.carga_horaria,
      concluido_em: data.concluido_em,
      link: data.link,
      aprendizados: data.aprendizados,
    };

    const consulta = data.id
      ? context.supabase
          .from("cursos")
          .update(registro)
          .eq("id", data.id)
          .eq("user_id", context.userId)
          .select(COLUNAS)
          .single()
      : context.supabase.from("cursos").insert(registro).select(COLUNAS).single();

    const { data: linha, error } = await consulta;
    if (error) throw new Error(error.message);
    return linha as Curso;
  });

export const marcarCursoAplicado = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((entrada: { id: string }) => entrada)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("cursos")
      .update({ aplicado_em_curriculo: true })
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const excluirCurso = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((entrada: { id: string }) => entrada)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("cursos")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const aplicarCursoNoCurriculo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => aplicarCursoInput.parse(input))
  .handler(async ({ data, context }): Promise<CurriculoComCurso> => {
    const bloqueio = await checarRecurso(context.userId, "cursos");
    if (bloqueio) throw new Error(bloqueio.error);

    const { object } = await generateObject({
      model: modelo(),
      schema: curriculoComCursoSchema,
      providerOptions,
      system: SYSTEM_CURSO,
      prompt: promptCurso({
        curriculo: data.curriculo,
        nome: data.curso.nome,
        instituicao: data.curso.instituicao,
        cargaHoraria: data.curso.carga_horaria,
        concluidoEm: data.curso.concluido_em,
        link: data.curso.link,
        aprendizados: data.curso.aprendizados,
      }),
    });
    return object;
  });
