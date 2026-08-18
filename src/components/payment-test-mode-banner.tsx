import { MODO_PAGAMENTO } from "@/lib/stripe";

const clientToken = import.meta.env["VITE_PAYMENTS_CLIENT_TOKEN"] as string | undefined;

export function PaymentTestModeBanner() {
  if (MODO_PAGAMENTO === "simulado") {
    return (
      <div className="w-full border-b border-realce/40 bg-realce/10 px-4 py-2 text-center text-sm text-foreground">
        Modo simulado: a assinatura é ativada apenas para teste e nenhuma cobrança é feita.
      </div>
    );
  }
  if (!clientToken) {
    return (
      <div className="w-full border-b border-destructive/30 bg-destructive/10 px-4 py-2 text-center text-sm text-destructive">
        O checkout de produção ainda não está configurado neste site.
      </div>
    );
  }
  if (clientToken.startsWith("pk_test_")) {
    return (
      <div className="w-full border-b border-realce/40 bg-realce/10 px-4 py-2 text-center text-sm text-foreground">
        Todos os pagamentos feitos na pré-visualização são em modo de teste.
      </div>
    );
  }
  return null;
}
