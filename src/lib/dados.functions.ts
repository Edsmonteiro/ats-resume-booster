import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Json } from "@/integrations/supabase/types";

export type DadosUsuario = {
  curriculo: string;
  analise: Json | null;
  historico: Json[];
  vagas: Json[];
};

export const carregarDados = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("dados_usuario")
      .select("curriculo, analise, historico, vagas")
      .eq("user_id", context.userId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return null;

    return {
      curriculo: data.curriculo ?? "",
      analise: data.analise ?? null,
      historico: Array.isArray(data.historico) ? data.historico : [],
      vagas: Array.isArray(data.vagas) ? data.vagas : [],
    } as DadosUsuario;
  });

export const salvarDados = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((entrada: DadosUsuario) => entrada)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("dados_usuario").upsert(
      {
        user_id: context.userId,
        curriculo: typeof data.curriculo === "string" ? data.curriculo.slice(0, 200_000) : "",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        analise: (data.analise ?? null) as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        historico: (Array.isArray(data.historico) ? data.historico.slice(0, 20) : []) as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vagas: (Array.isArray(data.vagas) ? data.vagas.slice(0, 200) : []) as any,
      },
      { onConflict: "user_id" },
    );

    if (error) throw new Error(error.message);
    return { ok: true };
  });

export type Perfil = { nome: string; cargoDesejado: string };

export const carregarPerfil = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("perfis")
      .select("nome, cargo_desejado")
      .eq("id", context.userId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return { nome: data?.nome ?? "", cargoDesejado: data?.cargo_desejado ?? "" } as Perfil;
  });

export const salvarPerfil = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((entrada: Perfil) => entrada)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("perfis").upsert(
      {
        id: context.userId,
        nome: (data.nome ?? "").slice(0, 120),
        cargo_desejado: (data.cargoDesejado ?? "").slice(0, 120),
      },
      { onConflict: "id" },
    );

    if (error) throw new Error(error.message);
    return { ok: true };
  });
