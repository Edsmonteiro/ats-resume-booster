import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";

import { criarCheckout } from "@/lib/payments.functions";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";

export function CheckoutEmbutido({ priceId, returnUrl }: { priceId: string; returnUrl?: string }) {
  const fetchClientSecret = async (): Promise<string> => {
    const resultado = await criarCheckout({
      data: {
        priceId,
        returnUrl:
          returnUrl ||
          `${window.location.origin}/planos?checkout=ok&session_id={CHECKOUT_SESSION_ID}`,
        environment: getStripeEnvironment(),
      },
    });
    if ("error" in resultado) throw new Error(resultado.error);
    if (!resultado.clientSecret) throw new Error("Não foi possível iniciar o pagamento.");
    return resultado.clientSecret;
  };

  return (
    <div id="checkout" className="min-h-[28rem]">
      <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
