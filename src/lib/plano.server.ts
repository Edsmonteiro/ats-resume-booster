import { getRequest } from "@tanstack/react-start/server";

import { limiteDe, planoNecessario, ROTULO_TIER, tierDoPrice, type Recurso, type Tier } from "./plano";

export function ambientePagamento(): "live" | "sandbox" {
  return process.env["STRIPE_LIVE_API_KEY"] ? "live" : "sandbox";
}

/** Tier atual do usuário, lido da assinatura vigente. */
export async function tierDoUsuario(userId: string): Promise<Tier> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("subscriptions")
    .select("price_id, status, current_period_end")
    .eq("user_id", userId)
    .eq("environment", ambientePagamento())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return "gratis";
  const fim = data.current_period_end ? new Date(data.current_period_end) : null;
  const noPrazo = !fim || fim > new Date();
  const ativa =
    (["active", "trialing", "past_due"].includes(data.status) && noPrazo) ||
    (data.status === "canceled" && !!fim && fim > new Date());
  if (!ativa) return "gratis";
  return tierDoPrice(data.price_id);
}

function mensagemBloqueio(recurso: Recurso): string {
  const necessario = planoNecessario(recurso);
  return `Este recurso faz parte do plano ${ROTULO_TIER[necessario]}. Faça o upgrade no seu perfil para liberar.`;
}

function mensagemLimite(tier: Tier): string {
  return tier === "gratis"
    ? "Você atingiu o limite mensal do plano Grátis. Assine o Essencial para continuar usando sem limite."
    : "Você atingiu o limite mensal deste recurso no seu plano. Faça o upgrade para o Pro para uso ilimitado.";
}

/**
 * Verifica acesso e consome uma unidade da cota mensal.
 * Retorna null quando pode seguir, ou { error } quando bloqueado.
 */
export async function consumirRecurso(
  userId: string,
  recurso: Recurso,
): Promise<{ error: string } | null> {
  const tier = await tierDoUsuario(userId);
  const limite = limiteDe(tier, recurso);
  if (limite === 0) return { error: mensagemBloqueio(recurso) };
  if (limite < 0) return null;

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.rpc("consumir_cota", {
    _user_id: userId,
    _recurso: recurso,
    _limite: limite,
  });
  if (error) return null; // nunca bloqueia por falha de contagem
  if (data === false) return { error: mensagemLimite(tier) };
  return null;
}

/** Só checa o acesso, sem consumir cota. */
export async function checarRecurso(
  userId: string,
  recurso: Recurso,
): Promise<{ error: string } | null> {
  const tier = await tierDoUsuario(userId);
  if (limiteDe(tier, recurso) === 0) return { error: mensagemBloqueio(recurso) };
  return null;
}

/** Id do usuário quando a requisição traz um bearer válido; null para visitante. */
export async function usuarioOpcional(): Promise<string | null> {
  try {
    const request = getRequest();
    const header = request?.headers?.get("authorization");
    if (!header?.startsWith("Bearer ")) return null;
    const token = header.slice(7);
    if (token.split(".").length !== 3) return null;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.auth.getUser(token);
    return data?.user?.id ?? null;
  } catch {
    return null;
  }
}

/** Cota para funções públicas: visitante segue livre, usuário logado respeita o plano. */
export async function consumirRecursoOpcional(recurso: Recurso): Promise<{ error: string } | null> {
  const userId = await usuarioOpcional();
  if (!userId) return null;
  return consumirRecurso(userId, recurso);
}
