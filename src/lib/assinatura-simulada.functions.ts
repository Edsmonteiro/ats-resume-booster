import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

import { MESES_POR_PRICE } from "./plano";

type Resultado = { ok: true } | { error: string };

export const ativarAssinaturaSimulada = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { priceId: string }) => {
    if (!MESES_POR_PRICE[data.priceId]) throw new Error("Plano inválido");
    return data;
  })
  .handler(async ({ data, context }): Promise<Resultado> => {
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

    if (error) return { error: "Não foi possível ativar o plano simulado." };
    return { ok: true };
  });

export const cancelarAssinaturaSimulada = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Resultado> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await supabaseAdmin
      .from("subscriptions")
      .update({
        status: "canceled",
        current_period_end: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_subscription_id", `sim_${context.userId}`);

    if (error) return { error: "Não foi possível cancelar o plano simulado." };
    return { ok: true };
  });
