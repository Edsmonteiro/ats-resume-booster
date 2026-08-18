import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ConexaoExtensao = {
  id: string;
  dispositivo: string;
  ultimo_uso_em: string | null;
  created_at: string;
};

export const listarConexoesExtensao = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("extensao_tokens")
      .select("id, dispositivo, ultimo_uso_em, created_at")
      .eq("user_id", context.userId)
      .eq("revogado", false)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []) as ConexaoExtensao[];
  });

export const criarConexaoExtensao = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((entrada: { dispositivo?: string } | undefined) => entrada ?? {})
  .handler(async ({ data, context }) => {
    const { gerarToken, hashToken } = await import("@/lib/extensao.server");
    const token = gerarToken();
    const hash = await hashToken(token);

    const { error } = await context.supabase.from("extensao_tokens").insert({
      user_id: context.userId,
      token_hash: hash,
      dispositivo: (data.dispositivo ?? "Extensão do navegador").trim().slice(0, 80),
    });

    if (error) throw new Error(error.message);
    return { token };
  });

export const revogarConexaoExtensao = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((entrada: { id: string }) => {
    if (!entrada?.id) throw new Error("Conexão inválida.");
    return entrada;
  })
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("extensao_tokens")
      .update({ revogado: true })
      .eq("id", data.id)
      .eq("user_id", context.userId);

    if (error) throw new Error(error.message);
    return { ok: true };
  });
