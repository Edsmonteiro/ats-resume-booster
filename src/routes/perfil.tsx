import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, CreditCard, Mail, UserRound } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { CentralDados } from "@/components/central-dados";
import { PaymentTestModeBanner } from "@/components/payment-test-mode-banner";
import { PlanosPanel } from "@/components/planos-panel";
import { Rodape } from "@/components/rodape";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth";
import { useAssinatura } from "@/lib/use-assinatura";

export const Route = createFileRoute("/perfil")({
  head: () => ({
    meta: [
      { title: "Meu perfil — conta, plano e dados | Eu Passo" },
      {
        name: "description",
        content:
          "Veja os dados da sua conta no Eu Passo, tempo de uso, situação da assinatura, forma de pagamento e controles de privacidade.",
      },
      { property: "og:title", content: "Meu perfil — conta e plano | Eu Passo" },
      {
        property: "og:description",
        content:
          "Conta, assinatura, forma de pagamento e controle dos seus dados em um só lugar.",
      },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PerfilPage,
});

function dataBr(valor?: string | null) {
  if (!valor) return "—";
  return new Date(valor).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

const ROTULO_STATUS: Record<string, string> = {
  active: "Ativa",
  trialing: "Em teste",
  past_due: "Pagamento pendente",
  canceled: "Cancelada",
};

function PerfilPage() {
  const { user } = useAuth();
  const { assinatura, ativa, carregando } = useAssinatura();

  const criadoEm = user?.created_at ?? null;
  const diasDeUso = criadoEm
    ? Math.max(
        1,
        Math.floor((Date.now() - new Date(criadoEm).getTime()) / 86_400_000) + 1,
      )
    : 0;

  return (
    <AppShell titulo="Meu perfil" descricao="Conta, assinatura e dados">
      <PaymentTestModeBanner />
      <main className="mx-auto max-w-5xl space-y-5 px-4 py-5 sm:px-5 sm:py-6">
        <div>
          <h1 className="font-display text-lg font-semibold sm:text-xl">Meu perfil</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Tudo sobre a sua conta: acesso, tempo de uso, plano e privacidade.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-start gap-3 py-4">
              <Mail className="mt-0.5 size-4 shrink-0 text-primary" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{user?.email ?? "—"}</p>
                <p className="text-xs text-muted-foreground">E-mail de acesso</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-start gap-3 py-4">
              <CalendarDays className="mt-0.5 size-4 shrink-0 text-primary" />
              <div>
                <p className="font-display text-lg font-semibold tabular-nums">{diasDeUso}</p>
                <p className="text-xs text-muted-foreground">
                  dias de uso · desde {dataBr(criadoEm)}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-start gap-3 py-4">
              <CreditCard className="mt-0.5 size-4 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-medium">
                  {carregando
                    ? "Verificando…"
                    : ativa
                      ? "Eu Passo Pro"
                      : "Plano gratuito"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {assinatura
                    ? `${ROTULO_STATUS[assinatura.status] ?? assinatura.status}${
                        assinatura.current_period_end
                          ? ` · ${assinatura.cancel_at_period_end ? "encerra" : "renova"} em ${dataBr(assinatura.current_period_end)}`
                          : ""
                      }`
                    : "Sem assinatura ativa"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="conta">
          <TabsList className="mb-4 flex max-w-full overflow-x-auto">
            <TabsTrigger value="conta" className="gap-2">
              <UserRound className="size-4 shrink-0" />
              Conta e dados
            </TabsTrigger>
            <TabsTrigger value="plano" className="gap-2">
              <CreditCard className="size-4 shrink-0" />
              Plano e pagamento
            </TabsTrigger>
          </TabsList>

          <TabsContent value="conta" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="font-display text-base">Dados da conta</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">E-mail</p>
                  <p className="break-all">{user?.email ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Conta criada em</p>
                  <p>{dataBr(criadoEm)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Último acesso</p>
                  <p>{dataBr(user?.last_sign_in_at ?? null)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Forma de entrada</p>
                  <p className="capitalize">{user?.app_metadata?.provider ?? "e-mail"}</p>
                </div>
              </CardContent>
            </Card>

            <CentralDados />
          </TabsContent>

          <TabsContent value="plano">
            <PlanosPanel />
          </TabsContent>
        </Tabs>

        <Rodape />
      </main>
    </AppShell>
  );
}
