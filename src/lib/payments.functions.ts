import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { MESES_POR_PRICE } from "@/lib/plano";
import { ambientePagamento } from "@/lib/plano.server";
import { createStripeClient, getStripeErrorMessage, type StripeEnv } from "@/lib/stripe.server";

type CheckoutSessionResult = { clientSecret: string } | { error: string };
type PortalSessionResult = { url: string } | { error: string };

function origemPrincipal(): string {
  for (const value of [process.env["APP_URL"], process.env["URL"]]) {
    if (!value) continue;
    try {
      return new URL(value).origin;
    } catch {
      // tenta a próxima origem configurada
    }
  }
  return "https://eu-passo.netlify.app";
}

function origensPermitidas(): Set<string> {
  const values = [
    process.env["APP_URL"],
    process.env["URL"],
    process.env["DEPLOY_PRIME_URL"],
    process.env["DEPLOY_URL"],
  ];
  const result = new Set<string>();
  for (const value of values) {
    if (!value) continue;
    try {
      result.add(new URL(value).origin);
    } catch {
      // ignora configuração inválida e mantém as demais
    }
  }
  result.add(origemPrincipal());
  return result;
}

function validarReturnUrl(value: string | undefined): string {
  if (!value) return `${origemPrincipal()}/`;
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") throw new Error("invalid protocol");
    if (!origensPermitidas().has(parsed.origin)) throw new Error("invalid origin");
    return parsed.toString();
  } catch {
    return `${origemPrincipal()}/`;
  }
}

function validarAmbienteSolicitado(environment: StripeEnv): StripeEnv {
  const esperado = ambientePagamento();
  if (environment !== esperado) {
    throw new Error("Ambiente de pagamento incompatível com a configuração do servidor.");
  }
  return esperado;
}

async function resolveOrCreateCustomer(
  stripe: ReturnType<typeof createStripeClient>,
  options: { email?: string; userId?: string },
): Promise<string> {
  if (options.userId && !/^[a-zA-Z0-9_-]+$/.test(options.userId)) {
    throw new Error("Invalid userId");
  }
  if (options.userId) {
    const found = await stripe.customers.search({
      query: `metadata['userId']:'${options.userId}'`,
      limit: 1,
    });
    if (found.data.length && found.data[0]) return found.data[0].id;
  }
  if (options.email) {
    const existing = await stripe.customers.list({ email: options.email, limit: 1 });
    const customer = existing.data[0];
    if (customer) {
      if (options.userId && customer.metadata?.["userId"] !== options.userId) {
        await stripe.customers.update(customer.id, {
          metadata: { ...customer.metadata, userId: options.userId },
        });
      }
      return customer.id;
    }
  }
  const created = await stripe.customers.create({
    ...(options.email && { email: options.email }),
    ...(options.userId && { metadata: { userId: options.userId } }),
  });
  return created.id;
}

export const criarCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { priceId: string; returnUrl: string; environment: StripeEnv }) => {
    if (!Object.prototype.hasOwnProperty.call(MESES_POR_PRICE, data.priceId)) {
      throw new Error("Plano inválido");
    }
    return data;
  })
  .handler(async ({ data, context }): Promise<CheckoutSessionResult> => {
    try {
      const environment = validarAmbienteSolicitado(data.environment);
      const stripe = createStripeClient(environment);
      const {
        data: { user },
      } = await context.supabase.auth.getUser();

      const prices = await stripe.prices.list({ lookup_keys: [data.priceId], active: true, limit: 1 });
      const stripePrice = prices.data[0];
      if (!stripePrice) throw new Error("Plano não encontrado no Stripe");
      const isRecurring = stripePrice.type === "recurring";

      const customerId = await resolveOrCreateCustomer(stripe, {
        ...(user?.email ? { email: user.email } : {}),
        userId: context.userId,
      });

      let productDescription: string | undefined;
      if (!isRecurring) {
        const productId =
          typeof stripePrice.product === "string"
            ? stripePrice.product
            : (stripePrice.product as { id: string }).id;
        const product = await stripe.products.retrieve(productId);
        productDescription = "name" in product ? product.name : undefined;
      }

      const session = await stripe.checkout.sessions.create({
        line_items: [{ price: stripePrice.id, quantity: 1 }],
        mode: isRecurring ? "subscription" : "payment",
        ui_mode: "embedded_page",
        return_url: validarReturnUrl(data.returnUrl),
        customer: customerId,
        automatic_tax: { enabled: true },
        ...(!isRecurring && productDescription
          ? { payment_intent_data: { description: productDescription } }
          : {}),
        metadata: { userId: context.userId, priceId: data.priceId },
        ...(isRecurring && {
          subscription_data: { metadata: { userId: context.userId, priceId: data.priceId } },
        }),
      });

      if (!session.client_secret) throw new Error("Stripe não retornou client_secret");
      return { clientSecret: session.client_secret };
    } catch (error) {
      console.error("[Payments] Falha ao criar checkout", {
        userId: context.userId,
        priceId: data.priceId,
        message: getStripeErrorMessage(error),
      });
      return { error: "Não foi possível iniciar o pagamento agora. Tente novamente em instantes." };
    }
  });

export const criarPortal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { returnUrl?: string; environment: StripeEnv }) => data)
  .handler(async ({ data, context }): Promise<PortalSessionResult> => {
    let environment: StripeEnv;
    try {
      environment = validarAmbienteSolicitado(data.environment);
    } catch {
      return { error: "Ambiente de pagamento inválido." };
    }

    const { data: sub } = await context.supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", context.userId)
      .eq("environment", environment)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!sub?.stripe_customer_id) return { error: "Nenhuma assinatura encontrada." };

    try {
      const stripe = createStripeClient(environment);
      const portal = await stripe.billingPortal.sessions.create({
        customer: sub.stripe_customer_id,
        return_url: validarReturnUrl(data.returnUrl),
      });
      return { url: portal.url };
    } catch (error) {
      console.error("[Payments] Falha ao criar portal", {
        userId: context.userId,
        message: getStripeErrorMessage(error),
      });
      return { error: "Não foi possível abrir o portal de assinatura agora." };
    }
  });
