import { hashToken, tokenDoHeader } from "@/lib/extensao.server";

export const corsExtensao = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, authorization",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

export function jsonExtensao(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsExtensao, "content-type": "application/json" },
  });
}

export type ContaExtensao = {
  userId: string;
  tokenId: string;
};

/**
 * Valida o token da extensão enviado em Authorization: Bearer.
 * Devolve null quando não há token ou ele é inválido/revogado.
 */
export async function contaDaExtensao(request: Request): Promise<ContaExtensao | null> {
  const token = tokenDoHeader(request);
  if (!token) return null;

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const hash = await hashToken(token);

  const { data, error } = await supabaseAdmin
    .from("extensao_tokens")
    .select("id, user_id, revogado")
    .eq("token_hash", hash)
    .maybeSingle();

  if (error || !data || data.revogado) return null;

  void supabaseAdmin
    .from("extensao_tokens")
    .update({ ultimo_uso_em: new Date().toISOString() })
    .eq("id", data.id)
    .then(() => undefined);

  return { userId: data.user_id, tokenId: data.id };
}

/** Currículo salvo na conta do usuário, usado pela extensão conectada. */
export async function curriculoDaConta(userId: string): Promise<string> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("dados_usuario")
    .select("curriculo")
    .eq("user_id", userId)
    .maybeSingle();

  return (data?.curriculo ?? "").trim();
}
