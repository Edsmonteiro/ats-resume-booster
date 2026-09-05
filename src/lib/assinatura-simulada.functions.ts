import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

import { MESES_POR_PRICE } from "./plano";
import { assinaturaSimuladaPermitida } from "./plano.server";

type Resultado = { ok: true } | { error: string };

function validarModoSimulado(): Resultado | null {
  if (assinaturaSimuladaPermitida()) return null;
  return { error: "A ativação simulada está disponível apenas em ambientes de desenvolvimento e Deploy Preview." };
}

export const ativarAssinaturaSimulada = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { priceId: string }) => {
    if (!MESES_POR_PRICE[data.priceId]) throw new Error("Plano inválido");
    return data;
  })
  .handler(async ({ data, context }): Promise<Resultado> => {
    const bloqueioAmbiente = validarModoSimulado();
    if (bloqueioAmbiente) return bloqueioAmbiente;

    const meses = MESES_POR_PRICE[data.priceId] ?? 1;

    const inicio = new Date();
    const fim = new Date(inicio);
    fim.setMonth(fim.getMonth() + meses);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await supabaseAdmin.from("subscriptions").upsert(
      {
        user_id: context.userId,
        stripe_subscription_id: `sim_${context.userId}`,
        stripe_customer_id: `sim_${context.userId}`,
        product_id: "simulado",
        price_id: data.priceId,
        status: "active",
        current_period_start: inicio.toISOString(),
        current_period_end: fim.toISOString(),
        cancel_at_period_end: false,
        environment: "sandbox",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "stripe_subscription_id" },
    );

    if (error) {
      console.error("[Plano] Falha ao ativar assinatura simulada", {
        userId: context.userId,
        priceId: data.priceId,
        message: error.message,
      });
      return { error: "Não foi possível ativar o plano simulado." };
    }
    return { ok: true };
  });

export const cancelarAssinaturaSimulada = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Resultado> => {
    const bloqueioAmbiente = validarModoSimulado();
    if (bloqueioAmbiente) return bloqueioAmbiente;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await supabaseAdmin
      .from("subscriptions")
      .update({
        status: "canceled",
        current_period_end: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_subscription_id", `sim_${context.userId}`)
      .eq("environment", "sandbox");

    if (error) {
      console.error("[Plano] Falha ao cancelar assinatura simulada", {
        userId: context.userId,
        message: error.message,
      });
      return { error: "Não foi possível cancelar o plano simulado." };
    }
    return { ok: true };
  });
