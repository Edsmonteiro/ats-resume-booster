import { createServerFn } from "@tanstack/react-start";
import { generateObject } from "ai";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

import { modelo, providerOptions } from "./ats.server";
import {
  atualizarItemInput,
  concluirPorTermoInput,
  gerarTrilhaInput,
  registrarHorasInput,
  ritmoInput,
  trilhaSchema,
  type ItemRoadmap,
  type RitmoEstudo,
  type SessaoEstudo,
} from "./roadmap.schemas";
import { checarRecurso } from "./plano.server";
import { SYSTEM_ROADMAP } from "./roadmap.server";

export type { ItemRoadmap, RitmoEstudo, SessaoEstudo } from "./roadmap.schemas";
export type { CursoGratuito } from "./cursos-gratuitos.server";

const COLUNAS =
  "id, habilidade, nivel, porque, como_comprovar, esforco, horas_estimadas, horas_feitas, concluido_em, prioridade, status, created_at";

export const listarRoadmap = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ItemRoadmap[]> => {
    const { data, error } = await context.supabase
      .from("roadmap_itens")
      .select(COLUNAS)
      .eq("user_id", context.userId)
      .order("created_at", { ascending: true });

    if (error) throw new Error(error.message);
    return (data ?? []) as ItemRoadmap[];
  });

export const carregarRitmo = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<RitmoEstudo> => {
    const { data, error } = await context.supabase
      .from("roadmap_ritmo")
      .select("horas_dia, dias_semana")
      .eq("user_id", context.userId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return {
      horas_dia: Number(data?.horas_dia ?? 1),
      dias_semana: Number(data?.dias_semana ?? 5),
    };
  });

export const salvarRitmo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ritmoInput.parse(input))
  .handler(async ({ data, context }): Promise<RitmoEstudo> => {
    const { error } = await context.supabase
      .from("roadmap_ritmo")
      .upsert({ user_id: context.userId, ...data }, { onConflict: "user_id" });
    if (error) throw new Error(error.message);
    return data;
  });

export const listarSessoes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SessaoEstudo[]> => {
    const { data, error } = await context.supabase
      .from("roadmap_sessoes")
      .select("dia, horas")
      .eq("user_id", context.userId)
      .order("dia", { ascending: true });

    if (error) throw new Error(error.message);

    const porDia = new Map<string, number>();
    for (const linha of data ?? []) {
      const dia = String(linha.dia);
      porDia.set(dia, (porDia.get(dia) ?? 0) + Number(linha.horas ?? 0));
    }
    return [...porDia.entries()].map(([dia, horas]) => ({ dia, horas }));
  });

export const registrarHoras = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => registrarHorasInput.parse(input))
  .handler(async ({ data, context }): Promise<ItemRoadmap> => {
    const { data: item, error: erroItem } = await context.supabase
      .from("roadmap_itens")
      .select("horas_feitas, horas_estimadas, status")
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .single();

    if (erroItem) throw new Error(erroItem.message);

    const feitas = Number(item.horas_feitas ?? 0) + data.horas;
    const estimadas = Number(item.horas_estimadas ?? 0);
    const concluiu = estimadas > 0 && feitas >= estimadas;

    const { error: erroSessao } = await context.supabase.from("roadmap_sessoes").insert({
      user_id: context.userId,
      item_id: data.id,
      horas: data.horas,
    });
    if (erroSessao) throw new Error(erroSessao.message);

    const { data: linha, error } = await context.supabase
      .from("roadmap_itens")
      .update({
        horas_feitas: feitas,
        status: concluiu ? "concluido" : "estudando",
        concluido_em: concluiu ? new Date().toISOString() : null,
      })
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .select(COLUNAS)
      .single();

    if (error) throw new Error(error.message);
    return linha as ItemRoadmap;
  });

export const buscarCursosDaHabilidade = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((entrada: { habilidade: string }) => ({
    habilidade: String(entrada.habilidade).slice(0, 200),
  }))
  .handler(async ({ data, context }) => {
    const bloqueio = await checarRecurso(context.userId, "roadmap");
    if (bloqueio) throw new Error(bloqueio.error);

    const { buscarCursosGratuitos } = await import("./cursos-gratuitos.server");
    return buscarCursosGratuitos(data.habilidade);
  });

export const gerarTrilha = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => gerarTrilhaInput.parse(input))
  .handler(async ({ data, context }): Promise<ItemRoadmap[]> => {
    const bloqueio = await checarRecurso(context.userId, "roadmap");
    if (bloqueio) throw new Error(bloqueio.error);

    const horasSemana = Math.round(data.horasDia * data.diasSemana * 10) / 10;
    const { object } = await generateObject({
      model: modelo(),
      schema: trilhaSchema,
      providerOptions,
      system: SYSTEM_ROADMAP,
      prompt: `Cargo desejado: ${data.cargo || "não informado"}
Ritmo de estudo disponível: ${data.horasDia} h por dia, ${data.diasSemana} dias por semana (${horasSemana} h por semana)
Lacunas já identificadas: ${data.lacunas.length ? data.lacunas.join("; ") : "nenhuma informada"}

CURRÍCULO:
---
${data.curriculo}
---

Monte a trilha de conhecimentos dentro desse ritmo.`,
    });

    await context.supabase.from("roadmap_itens").delete().eq("user_id", context.userId);
    await context.supabase.from("roadmap_sessoes").delete().eq("user_id", context.userId);

    const registros = object.itens.map((i) => ({
      user_id: context.userId,
      habilidade: i.habilidade,
      nivel: i.nivel,
      porque: i.porque,
      como_comprovar: i.comoComprovar,
      esforco: i.esforco,
      horas_estimadas: i.horasEstimadas,
      prioridade: i.prioridade,
    }));

    const { data: linhas, error } = await context.supabase
      .from("roadmap_itens")
      .insert(registros)
      .select(COLUNAS);



    if (error) throw new Error(error.message);
    return (linhas ?? []) as ItemRoadmap[];
  });

export const atualizarItemRoadmap = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => atualizarItemInput.parse(input))
  .handler(async ({ data, context }): Promise<ItemRoadmap> => {
    const { data: linha, error } = await context.supabase
      .from("roadmap_itens")
      .update({
        status: data.status,
        concluido_em: data.status === "concluido" ? new Date().toISOString() : null,
      })
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .select(COLUNAS)
      .single();


    if (error) throw new Error(error.message);
    return linha as ItemRoadmap;
  });

export const excluirItemRoadmap = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((entrada: { id: string }) => entrada)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("roadmap_itens")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Marca itens da trilha como concluídos quando um curso cobre aquela habilidade. */
export const concluirItensPorTexto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => concluirPorTermoInput.parse(input))
  .handler(async ({ data, context }): Promise<number> => {
    const { data: itens, error } = await context.supabase
      .from("roadmap_itens")
      .select("id, habilidade, status")
      .eq("user_id", context.userId)
      .neq("status", "concluido");

    if (error) throw new Error(error.message);

    const texto = data.texto.toLowerCase();
    const alvos = (itens ?? [])
      .filter((i) => {
        const termo = String(i.habilidade).toLowerCase().trim();
        return termo.length >= 3 && texto.includes(termo);
      })
      .map((i) => i.id);

    if (!alvos.length) return 0;

    const { error: erroUpdate } = await context.supabase
      .from("roadmap_itens")
      .update({ status: "concluido", concluido_em: new Date().toISOString() })
      .in("id", alvos)
      .eq("user_id", context.userId);

    if (erroUpdate) throw new Error(erroUpdate.message);
    return alvos.length;
  });
