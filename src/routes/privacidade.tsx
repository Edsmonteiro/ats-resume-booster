import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { Rodape } from "@/components/rodape";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Política de privacidade (LGPD) — Eu Passo" },
      {
        name: "description",
        content:
          "Como o Eu Passo trata seus dados: quais informações coletamos, por quanto tempo guardamos e como exportar ou excluir tudo.",
      },
      { property: "og:title", content: "Política de privacidade — Eu Passo" },
      {
        property: "og:description",
        content: "Tratamento de dados, base legal, retenção e seus direitos como titular (LGPD).",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://eupasso.lovable.app/privacidade" }],
  }),
  component: Privacidade,
});

function Privacidade() {
  return (
    <div className="min-h-screen bg-background">
      <header className="text-deep-foreground" style={{ background: "var(--gradient-deep)" }}>
        <div className="mx-auto max-w-3xl px-5 py-10">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-deep-foreground hover:bg-white/10"
          >
            <Link to="/">
              <ArrowLeft className="size-4" />
              Voltar
            </Link>
          </Button>
          <h1 className="mt-4 font-display text-3xl font-bold">Política de privacidade</h1>
          <p className="mt-2 text-sm opacity-80">
            Escrita conforme a Lei Geral de Proteção de Dados (Lei 13.709/2018).
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-8 px-5 py-10 text-sm leading-relaxed text-muted-foreground">
        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold text-foreground">
            Quais dados tratamos
          </h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>Cadastro: e-mail, nome e cargo desejado.</li>
            <li>
              Conteúdo enviado por você: texto do currículo, PDFs do LinkedIn e da conta Gupy.
            </li>
            <li>Preferências de busca: cargos, senioridade, localidade, modelo de trabalho.</li>
            <li>Uso do produto: vagas analisadas, candidaturas acompanhadas, notas geradas.</li>
            <li>
              Assinatura: status, plano e período — o pagamento é processado pelo provedor, que
              guarda os dados do cartão. Nós não armazenamos dados de cartão.
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold text-foreground">Para que usamos</h2>
          <p>
            Exclusivamente para prestar o serviço: analisar seu currículo, buscar e pontuar vagas,
            gerar documentos e alertas. Não vendemos, alugamos nem compartilhamos seus dados com
            recrutadores ou anunciantes.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold text-foreground">Base legal</h2>
          <p>
            Execução de contrato (art. 7º, V) para os recursos que você solicita, e consentimento
            (art. 7º, I) para o envio de alertas por e-mail, que pode ser desativado a qualquer
            momento nas preferências do radar.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold text-foreground">
            Inteligência artificial
          </h2>
          <p>
            Os textos que você envia são processados por modelos de IA de terceiros para gerar as
            análises. O conteúdo é usado apenas para produzir a resposta solicitada. Recomendamos
            não incluir dados sensíveis (CPF, RG, dados de saúde, biometria) no currículo enviado.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold text-foreground">
            Compartilhamento anônimo
          </h2>
          <p>
            Links de análise compartilhável são públicos e anônimos: removemos nome, e-mail e
            telefone antes de publicar. Só existem se você criar o link.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold text-foreground">Retenção</h2>
          <p>
            Guardamos seus dados enquanto a conta existir. Vagas do radar seguem a janela de
            postagem configurada (7 a 60 dias) e são arquivadas depois disso. Ao excluir a conta,
            tudo é apagado de forma definitiva.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold text-foreground">Seus direitos</h2>
          <p>
            Você pode acessar, corrigir, exportar e excluir seus dados diretamente no aplicativo:
            abra <strong className="text-foreground">Seu perfil</strong> e use a seção{" "}
            <strong className="text-foreground">Meus dados</strong> para baixar tudo em JSON ou
            excluir a conta.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold text-foreground">Segurança</h2>
          <p>
            Os dados ficam isolados por conta no banco, com regras de acesso por usuário. Somente
            você enxerga o seu conteúdo.
          </p>
        </section>
      </main>

      <Rodape />
    </div>
  );
}
