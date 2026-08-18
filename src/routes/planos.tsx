import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/app-shell";
import { PaymentTestModeBanner } from "@/components/payment-test-mode-banner";
import { PlanosPanel } from "@/components/planos-panel";

export const Route = createFileRoute("/planos")({
  head: () => ({
    meta: [
      { title: "Planos do Eu Passo — Radar de vagas com IA a partir de R$ 10" },
      {
        name: "description",
        content:
          "Assine o Eu Passo Pro e receba, todos os dias, as vagas mais compatíveis com o seu currículo nas principais plataformas do Brasil.",
      },
      { property: "og:title", content: "Planos do Eu Passo — Radar de vagas com IA" },
      {
        property: "og:description",
        content:
          "Radar automático de vagas compatíveis com o seu currículo. Mensal, trimestral, semestral ou anual.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://eupasso.lovable.app/planos" }],
  }),
  component: Planos,
});

function Planos() {
  return (
    <AppShell titulo="Planos" descricao="Assinatura Eu Passo">
      <PaymentTestModeBanner />
      <header className="text-deep-foreground" style={{ background: "var(--gradient-deep)" }}>
        <div className="mx-auto max-w-5xl px-5 py-10">
          <div className="max-w-2xl">
            <h1 className="font-display text-2xl leading-tight sm:text-3xl">
              Um recrutador de IA procurando vagas para você todos os dias
            </h1>
            <p className="mt-3 text-sm leading-relaxed opacity-85">
              O radar varre as plataformas confiáveis, compara cada anúncio com o seu currículo e
              mostra só o que realmente vale a sua candidatura. Você continua se aplicando — nós
              tiramos o garimpo do caminho.
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-5 sm:py-10">
        <PlanosPanel />
      </main>
    </AppShell>
  );
}

