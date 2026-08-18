import { useNavigate } from "@tanstack/react-router";
import { Check, Loader2, Minus, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { CheckoutEmbutido } from "@/components/checkout-embutido";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ativarAssinaturaSimulada,
  cancelarAssinaturaSimulada,
} from "@/lib/assinatura-simulada.functions";
import { useAuth } from "@/lib/auth";
import { criarPortal } from "@/lib/payments.functions";
import { ROTULO_TIER } from "@/lib/plano";
import {
  getStripeEnvironment,
  MODO_PAGAMENTO,
  PERIODICIDADES,
  planoDe,
  type Periodicidade,
} from "@/lib/stripe";
import { useAssinatura } from "@/lib/use-assinatura";

type Linha = { recurso: string; gratis: string | boolean; essencial: string | boolean; pro: string | boolean };

const COMPARATIVO: Linha[] = [
  { recurso: "Análise ATS do currículo", gratis: "3 / mês", essencial: "Ilimitado", pro: "Ilimitado" },
  { recurso: "Compatibilidade manual de vaga", gratis: "3 / mês", essencial: "Ilimitado", pro: "Ilimitado" },
  { recurso: "Carta de apresentação", gratis: "1 / mês", essencial: "Ilimitado", pro: "Ilimitado" },
  { recurso: "Currículo revisado (PDF/DOCX)", gratis: "1 / mês", essencial: "Ilimitado", pro: "Ilimitado" },
  { recurso: "Kanban de candidaturas e histórico", gratis: true, essencial: true, pro: true },
  { recurso: "Radar automático de vagas", gratis: false, essencial: "8 buscas / mês", pro: "Ilimitado" },
  { recurso: "Currículo otimizado por vaga", gratis: false, essencial: "10 / mês", pro: "Ilimitado" },
  { recurso: "Análise de perfil do LinkedIn", gratis: false, essencial: "2 / mês", pro: "Ilimitado" },
  { recurso: "Análise da conta Gupy", gratis: false, essencial: false, pro: true },
  { recurso: "Preparação de entrevista (STAR)", gratis: false, essencial: false, pro: true },
  { recurso: "Trilha de conhecimento e cursos", gratis: false, essencial: false, pro: true },
  { recurso: "Quest (trilhas gamificadas)", gratis: false, essencial: false, pro: true },
];

function Celula({ valor }: { valor: string | boolean }) {
  if (valor === true) return <Check className="mx-auto size-4 text-primary" />;
  if (valor === false) return <Minus className="mx-auto size-4 text-muted-foreground/50" />;
  return <span className="text-xs font-medium">{valor}</span>;
}

const BENEFICIOS = [
  "Busca automática de vagas na Gupy, Indeed, LinkedIn, Vagas.com, InfoJobs e Catho",
  "Compatibilidade calculada por IA contra o seu currículo",
  "Lacunas e ajustes recomendados para cada vaga",
  "Carta de apresentação e currículo revisado ilimitados",
  "Histórico de evolução do seu score ATS",
];

export function PlanosPanel() {
  const { user } = useAuth();
  const { assinatura, ativa, tier, carregando, recarregar } = useAssinatura();
  const navigate = useNavigate();
  const [periodicidade, setPeriodicidade] = useState<Periodicidade>("mensal");
  const [selecionado, setSelecionado] = useState<string | null>(null);
  const [abrindoPortal, setAbrindoPortal] = useState(false);
  const [processando, setProcessando] = useState<string | null>(null);
  const simulado = MODO_PAGAMENTO === "simulado";


  async function abrirPortal() {
    setAbrindoPortal(true);
    try {
      const resultado = await criarPortal({
        data: { returnUrl: window.location.href, environment: getStripeEnvironment() },
      });
      if ("error" in resultado) throw new Error(resultado.error);
      window.open(resultado.url, "_blank");
    } catch (erro) {
      toast.error(
        erro instanceof Error ? erro.message : "Não foi possível abrir a gestão da assinatura.",
      );
    } finally {
      setAbrindoPortal(false);
    }
  }

  async function ativarSimulado(priceId: string) {
    setProcessando(priceId);
    try {
      const resultado = await ativarAssinaturaSimulada({ data: { priceId } });
      if ("error" in resultado) throw new Error(resultado.error);
      await recarregar();
      toast.success("Plano ativado em modo simulado. Nenhuma cobrança foi feita.");
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível ativar.");
    } finally {
      setProcessando(null);
    }
  }

  async function cancelarSimulado() {
    setProcessando("cancelar");
    try {
      const resultado = await cancelarAssinaturaSimulada({});
      if ("error" in resultado) throw new Error(resultado.error);
      await recarregar();
      toast.success("Simulação cancelada.");
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível cancelar.");
    } finally {
      setProcessando(null);
    }
  }

  function escolher(priceId: string) {
    if (!user) {
      toast.info("Crie sua conta para assinar.");
      void navigate({ to: "/auth" });
      return;
    }
    if (simulado) {
      void ativarSimulado(priceId);
      return;
    }
    setSelecionado(priceId);
  }

  return (
    <div>
      {ativa && (
        <Card className="mb-6 border-primary/40 bg-primary/5">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 py-5">
            <div>
              <p className="font-display text-base font-semibold">Sua assinatura está ativa</p>
              <p className="text-sm text-muted-foreground">
                Plano {ROTULO_TIER[tier]} ·{" "}
                {assinatura?.price_id?.split("_")[1] ?? "mensal"}

                {assinatura?.current_period_end
                  ? ` · acesso até ${new Date(assinatura.current_period_end).toLocaleDateString("pt-BR")}`
                  : ""}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {simulado ? (
                <Button
                  variant="secondary"
                  onClick={() => void cancelarSimulado()}
                  disabled={processando !== null}
                >
                  {processando === "cancelar" ? <Loader2 className="size-4 animate-spin" /> : null}
                  Cancelar simulação
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  onClick={() => void abrirPortal()}
                  disabled={abrindoPortal}
                >
                  {abrindoPortal ? <Loader2 className="size-4 animate-spin" /> : null}
                  Gerenciar assinatura e pagamento
                </Button>
              )}
              <Button onClick={() => void navigate({ to: "/radar" })}>Ir para o radar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {selecionado ? (
        <Card className="shadow-[var(--shadow-panel)]">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-display text-lg">Finalizar assinatura</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setSelecionado(null)}>
              Trocar de plano
            </Button>
          </CardHeader>
          <CardContent>
            <CheckoutEmbutido priceId={selecionado} />
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            {PERIODICIDADES.map((p) => (
              <Button
                key={p.valor}
                size="sm"
                variant={periodicidade === p.valor ? "default" : "secondary"}
                onClick={() => setPeriodicidade(p.valor)}
              >
                {p.rotulo}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className={tier === "gratis" ? "border-primary/40" : ""}>
              <CardHeader className="pb-3">
                <CardTitle className="font-display text-base">Grátis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="font-display text-3xl font-semibold tabular-nums">
                  R$ 0<span className="text-sm font-normal text-muted-foreground">/mês</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Para testar: análise ATS, comparação de vaga e carta com limite mensal.
                </p>
                <Button className="w-full" variant="secondary" disabled>
                  {tier === "gratis" ? "Seu plano atual" : "Plano básico"}
                </Button>
              </CardContent>
            </Card>

            {(["essencial", "pro"] as const).map((nivel) => {
              const plano = planoDe(nivel, periodicidade);
              const destaque = nivel === "pro";
              return (
                <Card
                  key={plano.priceId}
                  className={destaque ? "border-primary shadow-[var(--shadow-panel)]" : ""}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="font-display text-base">
                        {ROTULO_TIER[nivel]}
                        {destaque ? (
                          <span className="ml-2 rounded-md bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
                            Completo
                          </span>
                        ) : null}
                      </CardTitle>
                      {plano.economia ? (
                        <span className="rounded-md bg-accent/20 px-2 py-0.5 text-xs font-medium">
                          {plano.economia}
                        </span>
                      ) : null}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="font-display text-3xl font-semibold tabular-nums">
                      {plano.preco}
                      <span className="text-sm font-normal text-muted-foreground">
                        {plano.periodo}
                      </span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {nivel === "essencial"
                        ? "Currículo sem limite, radar com 8 buscas por mês e LinkedIn."
                        : "Tudo sem limite: radar diário, Gupy, entrevistas, trilha e Quest."}
                    </p>
                    <Button
                      className="w-full"
                      variant={destaque ? "default" : "secondary"}
                      onClick={() => escolher(plano.priceId)}
                      disabled={carregando || processando !== null}
                    >
                      {processando === plano.priceId ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : null}
                      {tier === nivel
                        ? "Renovar / trocar período"
                        : ativa
                          ? "Trocar para este plano"
                          : simulado
                            ? "Ativar plano (simulado)"
                            : "Assinar"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card className="mt-6 overflow-hidden">
            <CardHeader>
              <CardTitle className="font-display text-lg">Comparativo dos planos</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground">
                    <th className="px-4 py-2 text-left font-medium">Recurso</th>
                    <th className="px-3 py-2 text-center font-medium">Grátis</th>
                    <th className="px-3 py-2 text-center font-medium">Essencial</th>
                    <th className="px-3 py-2 text-center font-medium">Pro</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARATIVO.map((linha) => (
                    <tr key={linha.recurso} className="border-b last:border-0">
                      <td className="px-4 py-2 text-left">{linha.recurso}</td>
                      <td className="px-3 py-2 text-center">
                        <Celula valor={linha.gratis} />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Celula valor={linha.essencial} />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Celula valor={linha.pro} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>


          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display text-lg">
                <Sparkles className="size-4 text-primary" /> O que está incluído
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {BENEFICIOS.map((b) => (
                  <li key={b} className="flex gap-2 text-sm text-muted-foreground">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                    {b}
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-xs text-muted-foreground">
                A análise de currículo, a compatibilidade manual de vagas e o guia ATS continuam
                gratuitos. A assinatura libera o radar automático de vagas.
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
