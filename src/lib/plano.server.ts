import { getRequest } from "@tanstack/react-start/server";

import { limiteDe, planoNecessario, ROTULO_TIER, tierDoPrice, type Recurso, type Tier } from "./plano";

export type AmbientePagamento = "live" | "sandbox";

/**
 * Ambiente financeiro explícito. Em produção, ausência/valor inválido bloqueia a leitura de planos
 * em vez de inferir o modo pela presença de uma chave do Stripe.
 */
export function ambientePagamento(): AmbientePagamento {
  const modo = process.env["PAYMENTS_MODE"];
  if (modo === "live" || modo === "sandbox") return modo;

  // Mantém desenvolvimento local utilizável sem abrir uma exceção silenciosa em produção.
  if (process.env["NODE_ENV"] !== "production") return "sandbox";

  throw new Error("PAYMENTS_MODE precisa ser definido como 'sandbox' ou 'live'.");
}

/**
 * Assinatura simulada só existe fora do deploy de produção e somente em sandbox.
 * No Netlify, CONTEXT=production identifica o site principal.
 */
export function assinaturaSimuladaPermitida(): boolean {
  if (ambientePagamento() !== "sandbox") return false;

  const contextoNetlify = process.env["CONTEXT"];
  if (contextoNetlify === "production") return false;
  if (contextoNetlify === "deploy-preview" || contextoNetlify === "branch-deploy") return true;

  return process.env["NODE_ENV"] !== "production";
}

/** Tier atual do usuário, lido da assinatura vigente. */
export async function tierDoUsuario(userId: string): Promise<Tier> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .select("price_id, status, current_period_end")
    .eq("user_id", userId)
    .eq("environment", ambientePagamento())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[Plano] Falha ao consultar assinatura", { userId, message: error.message });
    return "gratis";
  }

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

  if (error) {
    // Falha fechada: não libera consumo pago/gratuito quando não foi possível registrar a cota.
    console.error("[Plano] Falha ao consumir cota", {
      userId,
      recurso,
      limite,
      message: error.message,
    });
    return { error: "Não foi possível validar seu limite de uso agora. Tente novamente em instantes." };
  }

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

/**
 * Compatibilidade para fluxos públicos legados. Não deve ser usado em endpoints com custo de IA.
 */
export async function consumirRecursoOpcional(recurso: Recurso): Promise<{ error: string } | null> {
  const userId = await usuarioOpcional();
  if (!userId) return null;
  return consumirRecurso(userId, recurso);
}
