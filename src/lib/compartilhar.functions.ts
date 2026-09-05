import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { anonimizarLista, anonimizarTexto } from "@/lib/anonimizar";
import type { Database } from "@/integrations/supabase/types";

const compartilharInput = z.object({
  score: z.number().min(0).max(100),
  scoreAntes: z.number().min(0).max(100).nullable().optional(),
  resumo: z.string().max(2000).default(""),
  cargoDesejado: z.string().max(200).default(""),
  pontosFortes: z.array(z.string().max(400)).max(12).default([]),
  problemasAts: z
    .array(
      z.object({
        titulo: z.string().max(300),
        gravidade: z.enum(["alta", "media", "baixa"]),
        explicacao: z.string().max(1200),
        comoCorrigir: z.string().max(1200),
      }),
    )
    .max(20)
    .default([]),
  palavrasChaveFaltando: z.array(z.string().max(120)).max(40).default([]),
  secoes: z
    .array(z.object({ nome: z.string().max(120), status: z.enum(["ok", "melhorar", "ausente"]), nota: z.string().max(600) }))
    .max(20)
    .default([]),
  reescritas: z.array(z.object({ original: z.string().max(800), sugerida: z.string().max(800) })).max(12).default([]),
});

export type AnalisePublica = {
  id: string;
  score: number;
  scoreAntes: number | null;
  resumo: string;
  cargoDesejado: string;
  criadaEm: string;
  pontosFortes: string[];
  problemasAts: Array<{ titulo: string; gravidade: "alta" | "media" | "baixa"; explicacao: string; comoCorrigir: string }>;
  palavrasChaveFaltando: string[];
  secoes: Array<{ nome: string; status: "ok" | "melhorar" | "ausente"; nota: string }>;
  reescritas: Array<{ original: string; sugerida: string }>;
};

function clientePublico() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export const criarLinkAnalise = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((entrada: unknown) => compartilharInput.parse(entrada))
  .handler(async ({ data, context }) => {
    const dados = {
      pontosFortes: anonimizarLista(data.pontosFortes),
      problemasAts: data.problemasAts.map((p) => ({
        ...p,
        titulo: anonimizarTexto(p.titulo),
        explicacao: anonimizarTexto(p.explicacao),
        comoCorrigir: anonimizarTexto(p.comoCorrigir),
      })),
      palavrasChaveFaltando: anonimizarLista(data.palavrasChaveFaltando),
      secoes: data.secoes.map((s) => ({ ...s, nota: anonimizarTexto(s.nota) })),
      reescritas: data.reescritas.map((r) => ({
        original: anonimizarTexto(r.original),
        sugerida: anonimizarTexto(r.sugerida),
      })),
    };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: linha, error } = await supabaseAdmin
      .from("analises_publicas")
      .insert({
        score: Math.round(data.score),
        score_antes: typeof data.scoreAntes === "number" ? Math.round(data.scoreAntes) : null,
        resumo: anonimizarTexto(data.resumo),
        cargo_desejado: anonimizarTexto(data.cargoDesejado),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        dados: dados as any,
      })
      .select("id")
      .single();

    if (error) {
      console.error("[Compartilhar] Falha ao criar análise pública", {
        userId: context.userId,
        message: error.message,
      });
      throw new Error("Não foi possível criar o link compartilhável agora.");
    }
    return { id: linha.id as string };
  });

export const carregarAnalisePublica = createServerFn({ method: "GET" })
  .inputValidator((entrada: unknown) => z.object({ id: z.string().uuid() }).parse(entrada))
  .handler(async ({ data }): Promise<AnalisePublica | null> => {
    const { data: linha, error } = await clientePublico()
      .from("analises_publicas")
      .select("id, score, score_antes, resumo, cargo_desejado, dados, created_at")
      .eq("id", data.id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!linha) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const d = (linha.dados ?? {}) as any;
    return {
      id: linha.id,
      score: linha.score,
      scoreAntes: linha.score_antes,
      resumo: linha.resumo,
      cargoDesejado: linha.cargo_desejado,
      criadaEm: linha.created_at,
      pontosFortes: Array.isArray(d.pontosFortes) ? d.pontosFortes : [],
      problemasAts: Array.isArray(d.problemasAts) ? d.problemasAts : [],
      palavrasChaveFaltando: Array.isArray(d.palavrasChaveFaltando) ? d.palavrasChaveFaltando : [],
      secoes: Array.isArray(d.secoes) ? d.secoes : [],
      reescritas: Array.isArray(d.reescritas) ? d.reescritas : [],
    };
  });
