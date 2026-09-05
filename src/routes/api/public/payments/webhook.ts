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
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
  }
  return _supabase;
}

const MESES_POR_PLANO: Record<string, number> = {
  essencial_trimestral: 3,
  essencial_semestral: 6,
  pro_trimestral: 3,
  pro_semestral: 6,
};

function assertDb(error: { message: string } | null, operacao: string): void {
  if (!error) return;
  throw new Error(`${operacao}: ${error.message}`);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dadosDaAssinatura(subscription: any) {
  const item = subscription.items?.data?.[0];
  const priceId = item?.price?.lookup_key || item?.price?.id;
  const productId = item?.price?.product;
  const periodStart = item?.current_period_start ?? subscription.current_period_start;
  const periodEnd = item?.current_period_end ?? subscription.current_period_end;
  return { priceId, productId, periodStart, periodEnd };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function persistirAssinatura(subscription: any, env: StripeEnv) {
  const userId = subscription.metadata?.userId;
  if (!userId) throw new Error("Assinatura sem userId nos metadados");

  const { priceId, productId, periodStart, periodEnd } = dadosDaAssinatura(subscription);
  if (!priceId) throw new Error("Assinatura sem priceId");

  const { error } = await getSupabase()
    .from("subscriptions")
    .upsert(
      {
        user_id: userId,
        stripe_subscription_id: subscription.id,
        stripe_customer_id:
          typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id ?? "",
        product_id:
          typeof productId === "string" ? productId : productId?.id ?? "",
        price_id: priceId,
        status: subscription.status,
        current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
        current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
        cancel_at_period_end: subscription.cancel_at_period_end ?? false,
        environment: env,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "stripe_subscription_id" },
    );

  assertDb(error, "Falha ao persistir assinatura");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function assinaturaCancelada(subscription: any, env: StripeEnv) {
  const { error } = await getSupabase()
    .from("subscriptions")
    .update({
      status: "canceled",
      cancel_at_period_end: true,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id)
    .eq("environment", env);

  assertDb(error, "Falha ao cancelar assinatura");
}

// Planos trimestral e semestral são pagamentos únicos que liberam N meses de acesso.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function acessoPorPeriodo(session: any, env: StripeEnv) {
  const userId = session.metadata?.userId;
  const priceId = session.metadata?.priceId;
  const meses = priceId ? MESES_POR_PLANO[priceId] : undefined;
  if (!userId || !priceId || !meses) {
    throw new Error("Pagamento avulso sem metadados de plano válidos");
  }

  const supabase = getSupabase();
  const { data: atual, error: erroAtual } = await supabase
    .from("subscriptions")
    .select("current_period_end")
    .eq("user_id", userId)
    .eq("environment", env)
    .order("current_period_end", { ascending: false })
    .limit(1)
    .maybeSingle();
  assertDb(erroAtual, "Falha ao consultar período vigente");

  const fimAtual = atual?.current_period_end ? new Date(atual.current_period_end) : null;
  const inicio = fimAtual && fimAtual > new Date() ? fimAtual : new Date();
  const fim = new Date(inicio);
  fim.setMonth(fim.getMonth() + meses);

  const customerId =
    typeof session.customer === "string" ? session.customer : session.customer?.id ?? "";
  const productId = priceId.startsWith("essencial_") ? "eu_passo_essencial" : "eu_passo_pro";

  const { error } = await supabase.from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_subscription_id: session.id,
      stripe_customer_id: customerId,
      product_id: productId,
      price_id: priceId,
      status: "active",
      current_period_start: inicio.toISOString(),
      current_period_end: fim.toISOString(),
      cancel_at_period_end: true,
      environment: env,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "stripe_subscription_id" },
  );
  assertDb(error, "Falha ao liberar acesso por período");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function tratarEvento(event: { type: string; data: { object: any } }, env: StripeEnv) {
  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
      await persistirAssinatura(event.data.object, env);
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
      console.info("[Payments] Evento Stripe ignorado", { type: event.type, env });
  }
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawEnv = new URL(request.url).searchParams.get("env");
        if (rawEnv !== "sandbox" && rawEnv !== "live") {
          return new Response("Invalid environment", { status: 400 });
        }

        let event: Awaited<ReturnType<typeof verifyWebhook>>;
        try {
          event = await verifyWebhook(request, rawEnv);
        } catch (error) {
          console.warn("[Payments] Webhook rejeitado", {
            env: rawEnv,
            message: error instanceof Error ? error.message : String(error),
          });
          return new Response("Invalid webhook", { status: 400 });
        }

        try {
          await tratarEvento(event, rawEnv);
          return Response.json({ received: true });
        } catch (error) {
          // Retorna 500 para o Stripe tentar novamente. Nunca confirma um evento que não foi persistido.
          console.error("[Payments] Falha ao processar webhook", {
            env: rawEnv,
            type: event.type,
            message: error instanceof Error ? error.message : String(error),
          });
          return new Response("Webhook processing failed", { status: 500 });
        }
      },
    },
  },
});
