import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const STATUS_CANDIDATURA = [
  "interessado",
  "enviada",
  "triagem",
  "entrevista",
  "teste",
  "oferta",
  "recusado",
] as const;

export type StatusCandidatura = (typeof STATUS_CANDIDATURA)[number];

export type Candidatura = {
  id: string;
  vaga_id: string | null;
  titulo: string;
  empresa: string;
  link: string;
  fonte: string;
  local: string;
  requisitos: string;
  compatibilidade: number;
  status: StatusCandidatura;
  notas: string;
  enviada_em: string | null;
  proximo_passo_em: string | null;
  updated_at: string;
  created_at: string;
};

const COLUNAS = "id, vaga_id, titulo, empresa, link, fonte, local, requisitos, compatibilidade, status, notas, enviada_em, proximo_passo_em, updated_at, created_at";

export const listarCandidaturas = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("candidaturas")
      .select(COLUNAS)
      .eq("user_id", context.userId)
      .order("updated_at", { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []) as Candidatura[];
  });

export type NovaCandidatura = {
  titulo: string;
  empresa?: string;
  link?: string;
  fonte?: string;
  local?: string;
  requisitos?: string;
  compatibilidade?: number;
  status?: StatusCandidatura;
  vagaId?: string | null;
};

export const criarCandidatura = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((entrada: NovaCandidatura) => {
    if (!entrada?.titulo?.trim()) throw new Error("Informe o cargo.");
    return entrada;
  })
  .handler(async ({ data, context }) => {
    const { data: criada, error } = await context.supabase
      .from("candidaturas")
      .insert({
        user_id: context.userId,
        vaga_id: data.vagaId ?? null,
        titulo: data.titulo.trim().slice(0, 200),
        empresa: (data.empresa ?? "").trim().slice(0, 200),
        link: (data.link ?? "").trim().slice(0, 2000),
        fonte: (data.fonte ?? "").trim().slice(0, 60),
        local: (data.local ?? "").trim().slice(0, 160),
        requisitos: (data.requisitos ?? "").slice(0, 15000),
        compatibilidade: Math.max(0, Math.min(100, Math.round(data.compatibilidade ?? 0))),
        status: data.status ?? "interessado",
        enviada_em: data.status === "enviada" ? new Date().toISOString() : null,
      })
      .select(COLUNAS)
      .single();

    if (error) throw new Error(error.message);
    return criada as Candidatura;
  });

export type AtualizacaoCandidatura = {
  id: string;
  status?: StatusCandidatura;
  notas?: string;
  proximoPassoEm?: string | null;
};

export const atualizarCandidatura = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((entrada: AtualizacaoCandidatura) => {
    if (!entrada?.id) throw new Error("Candidatura inválida.");
    return entrada;
  })
  .handler(async ({ data, context }) => {
    const patch: {
      status?: StatusCandidatura;
      enviada_em?: string;
      notas?: string;
      proximo_passo_em?: string | null;
    } = {};

    if (data.status) {
      patch["status"] = data.status;
      if (data.status === "enviada") patch["enviada_em"] = new Date().toISOString();
    }
    if (typeof data.notas === "string") patch["notas"] = data.notas.slice(0, 5000);
    if (data.proximoPassoEm !== undefined) patch["proximo_passo_em"] = data.proximoPassoEm;

    const { data: atualizada, error } = await context.supabase
      .from("candidaturas")
      .update(patch)
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .select(COLUNAS)
      .single();

    if (error) throw new Error(error.message);
    return atualizada as Candidatura;
  });

export const excluirCandidatura = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((entrada: { id: string }) => entrada)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("candidaturas")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export type VagaImportavel = {
  vagaId: string;
  titulo: string;
  empresa: string;
  link: string;
  fonte: string;
  local: string;
  compatibilidade: number;
  descricao: string;
};

/** Vagas do radar que ainda não viraram candidatura. */
export const vagasParaImportar = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("vagas_usuario")
      .select(
        "vaga_id, compatibilidade, vagas_encontradas!inner(id, titulo, empresa, link, fonte, local, descricao)",
      )
      .eq("user_id", context.userId)
      .is("removida_em", null)
      .order("compatibilidade", { ascending: false })
      .limit(60);

    if (error) throw new Error(error.message);

    const { data: existentes } = await context.supabase
      .from("candidaturas")
      .select("vaga_id")
      .eq("user_id", context.userId);
    const jaTem = new Set((existentes ?? []).map((c) => c.vaga_id).filter(Boolean));

    return (data ?? [])
      .filter((linha) => !jaTem.has(linha.vaga_id))
      .map((linha) => {
        const v = linha.vagas_encontradas as unknown as {
          titulo: string;
          empresa: string;
          link: string;
          fonte: string;
          local: string;
          descricao: string;
        };
        return {
          vagaId: linha.vaga_id,
          titulo: v.titulo,
          empresa: v.empresa ?? "",
          link: v.link ?? "",
          fonte: v.fonte ?? "",
          local: v.local ?? "",
          descricao: (v.descricao ?? "").slice(0, 8000),
          compatibilidade: linha.compatibilidade ?? 0,
        } as VagaImportavel;
      });
  });
