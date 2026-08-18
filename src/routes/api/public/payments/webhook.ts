import { createClient } from "@supabase/supabase-js";
import { createFileRoute } from "@tanstack/react-router";

import type { Database } from "@/integrations/supabase/types";
import { verifyWebhook, type StripeEnv } from "@/lib/stripe.server";

let _supabase: ReturnType<typeof createClient<Database>> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient<Database>(
      process.env["SUPABASE_URL"]!,
      process.env["SUPABASE_SERVICE_ROLE_KEY"]!,
    );
  }
  return _supabase;
}

const MESES_POR_PLANO: Record<string, number> = {
  pro_trimestral: 3,
  pro_semestral: 6,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dadosDaAssinatura(subscription: any) {
  const item = subscription.items?.data?.[0];
  const priceId =
    item?.price?.lookup_key || item?.price?.metadata?.lovable_external_id || item?.price?.id;
  const productId = item?.price?.product;
  const periodStart = item?.current_period_start ?? subscription.current_period_start;
  const periodEnd = item?.current_period_end ?? subscription.current_period_end;
  return { priceId, productId, periodStart, periodEnd };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function assinaturaCriada(subscription: any, env: StripeEnv) {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.error("Assinatura sem userId nos metadados");
    return;
  }
  const { priceId, productId, periodStart, periodEnd } = dadosDaAssinatura(subscription);

  await getSupabase()
    .from("subscriptions")
    .upsert(
      {
        user_id: userId,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: subscription.customer,
        product_id: productId ?? "",
        price_id: priceId ?? "",
        status: subscription.status,
        current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
        current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
        cancel_at_period_end: subscription.cancel_at_period_end ?? false,
        environment: env,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "stripe_subscription_id" },
    );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function assinaturaAtualizada(subscription: any, env: StripeEnv) {
  const { priceId, productId, periodStart, periodEnd } = dadosDaAssinatura(subscription);

  await getSupabase()
    .from("subscriptions")
    .update({
      status: subscription.status,
      product_id: productId ?? "",
      price_id: priceId ?? "",
      current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      cancel_at_period_end: subscription.cancel_at_period_end ?? false,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id)
    .eq("environment", env);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function assinaturaCancelada(subscription: any, env: StripeEnv) {
  await getSupabase()
    .from("subscriptions")
    .update({ status: "canceled", updated_at: new Date().toISOString() })
    .eq("stripe_subscription_id", subscription.id)
    .eq("environment", env);
}

// Planos trimestral e semestral são pagamentos únicos que liberam N meses de acesso.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function acessoPorPeriodo(session: any, env: StripeEnv) {
  const userId = session.metadata?.userId;
  const priceId = session.metadata?.priceId;
  const meses = priceId ? MESES_POR_PLANO[priceId] : undefined;
  if (!userId || !meses) return;

  const supabase = getSupabase();
  const { data: atual } = await supabase
    .from("subscriptions")
    .select("current_period_end")
    .eq("user_id", userId)
    .eq("environment", env)
    .order("current_period_end", { ascending: false })
    .limit(1)
    .maybeSingle();

  const fimAtual = atual?.current_period_end ? new Date(atual.current_period_end) : null;
  const inicio = fimAtual && fimAtual > new Date() ? fimAtual : new Date();
  const fim = new Date(inicio);
  fim.setMonth(fim.getMonth() + meses);

  await supabase.from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_subscription_id: session.id,
      stripe_customer_id: session.customer ?? "",
      product_id: "eu_passo_pro",
      price_id: priceId,
      status: "active",
      current_period_start: new Date().toISOString(),
      current_period_end: fim.toISOString(),
      cancel_at_period_end: true,
      environment: env,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "stripe_subscription_id" },
  );
}

async function tratarEvento(req: Request, env: StripeEnv) {
  const event = await verifyWebhook(req, env);

  switch (event.type) {
    case "customer.subscription.created":
      await assinaturaCriada(event.data.object, env);
      break;
    case "customer.subscription.updated":
      await assinaturaAtualizada(event.data.object, env);
      break;
    case "customer.subscription.deleted":
      await assinaturaCancelada(event.data.object, env);
      break;
    case "checkout.session.completed": {
      const session = event.data.object;
      if (session.mode === "payment" && session.payment_status !== "unpaid") {
        await acessoPorPeriodo(session, env);
      }
      break;
    }
    case "checkout.session.async_payment_succeeded":
      if (event.data.object.mode === "payment") await acessoPorPeriodo(event.data.object, env);
      break;
    default:
      console.log("Evento não tratado:", event.type);
  }
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawEnv = new URL(request.url).searchParams.get("env");
        if (rawEnv !== "sandbox" && rawEnv !== "live") {
          console.error("Webhook com env inválido:", rawEnv);
          return Response.json({ received: true, ignored: "invalid env" });
        }
        try {
          await tratarEvento(request, rawEnv);
          return Response.json({ received: true });
        } catch (e) {
          console.error("Webhook error:", e);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});
