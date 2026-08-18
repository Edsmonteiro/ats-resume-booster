import { loadStripe, type Stripe } from "@stripe/stripe-js";

type StripeEnv = "sandbox" | "live";

/** "simulado" = assinatura de teste interna, sem provedor de pagamento nem cobrança. */
export const MODO_PAGAMENTO: "simulado" | "stripe" = "simulado";

const clientToken = import.meta.env["VITE_PAYMENTS_CLIENT_TOKEN"] as string | undefined;

function paymentsEnvironment(): StripeEnv {
  if (MODO_PAGAMENTO === "simulado") return "sandbox";
  if (clientToken?.startsWith("pk_test_")) return "sandbox";
  if (clientToken?.startsWith("pk_live_")) return "live";
  throw new Error(
    "Os pagamentos ainda não estão configurados nesta versão do site. Conclua a ativação de pagamentos para liberar o checkout.",
  );
}


let stripePromise: Promise<Stripe | null> | null = null;

export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    paymentsEnvironment();
    stripePromise = loadStripe(clientToken as string);
  }
  return stripePromise;
}

export function getStripeEnvironment(): StripeEnv {
  return paymentsEnvironment();
}

export const PLANOS = [
  {
    priceId: "essencial_mensal",
    tier: "essencial",
    nome: "Mensal",
    preco: "R$ 10",
    periodo: "/mês",
    detalhe: "Cobrança mensal recorrente. Cancele quando quiser.",
    economia: "",
    recorrente: true,
  },
  {
    priceId: "essencial_trimestral",
    tier: "essencial",
    nome: "Trimestral",
    preco: "R$ 27",
    periodo: "/3 meses",
    detalhe: "Pagamento único que libera 3 meses.",
    economia: "Economize 10%",
    recorrente: false,
  },
  {
    priceId: "essencial_semestral",
    tier: "essencial",
    nome: "Semestral",
    preco: "R$ 51",
    periodo: "/6 meses",
    detalhe: "Pagamento único que libera 6 meses.",
    economia: "Economize 15%",
    recorrente: false,
  },
  {
    priceId: "essencial_anual",
    tier: "essencial",
    nome: "Anual",
    preco: "R$ 90",
    periodo: "/ano",
    detalhe: "Cobrança anual recorrente. O melhor custo por mês.",
    economia: "Economize 25%",
    recorrente: true,
  },
  {
    priceId: "pro_mensal",
    tier: "pro",
    nome: "Mensal",
    preco: "R$ 19",
    periodo: "/mês",
    detalhe: "Cobrança mensal recorrente. Cancele quando quiser.",
    economia: "",
    recorrente: true,
  },
  {
    priceId: "pro_trimestral",
    tier: "pro",
    nome: "Trimestral",
    preco: "R$ 51",
    periodo: "/3 meses",
    detalhe: "Pagamento único que libera 3 meses.",
    economia: "Economize 11%",
    recorrente: false,
  },
  {
    priceId: "pro_semestral",
    tier: "pro",
    nome: "Semestral",
    preco: "R$ 97",
    periodo: "/6 meses",
    detalhe: "Pagamento único que libera 6 meses.",
    economia: "Economize 15%",
    recorrente: false,
  },
  {
    priceId: "pro_anual",
    tier: "pro",
    nome: "Anual",
    preco: "R$ 170",
    periodo: "/ano",
    detalhe: "Cobrança anual recorrente. O melhor custo por mês.",
    economia: "Economize 25%",
    recorrente: true,
  },
] as const;

export type Periodicidade = "mensal" | "trimestral" | "semestral" | "anual";

export const PERIODICIDADES: { valor: Periodicidade; rotulo: string }[] = [
  { valor: "mensal", rotulo: "Mensal" },
  { valor: "trimestral", rotulo: "Trimestral" },
  { valor: "semestral", rotulo: "Semestral" },
  { valor: "anual", rotulo: "Anual" },
];

export function planoDe(tier: "essencial" | "pro", periodicidade: Periodicidade) {
  return PLANOS.find((p) => p.priceId === `${tier}_${periodicidade}`)!;
}

export type Plano = (typeof PLANOS)[number];

