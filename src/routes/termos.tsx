import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { Rodape } from "@/components/rodape";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/termos")({
  head: () => ({
    meta: [
      { title: "Termos de uso — Eu Passo" },
      {
        name: "description",
        content:
          "Condições de uso do Eu Passo: planos, uso da IA, responsabilidades do usuário e cancelamento.",
      },
      { property: "og:title", content: "Termos de uso — Eu Passo" },
      {
        property: "og:description",
        content: "Condições de uso, planos, uso da IA e cancelamento do Eu Passo.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://eu-passo.netlify.app/termos" }],
  }),
  component: Termos,
});

function Termos() {
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
          <h1 className="mt-4 font-display text-3xl font-bold">Termos de uso</h1>
          <p className="mt-2 text-sm opacity-80">Última atualização: setembro de 2026.</p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-8 px-5 py-10 text-sm leading-relaxed text-muted-foreground">
        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold text-foreground">
            1. O que é o Eu Passo
          </h2>
          <p>
            O Eu Passo é uma ferramenta de apoio à busca de emprego. Ele analisa currículos e perfis
            profissionais para sistemas de triagem automatizada (ATS), calcula compatibilidade com
            vagas, gera materiais de apoio e ajuda a organizar a jornada de candidaturas.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold text-foreground">2. Uso da conta</h2>
          <p>
            Você é responsável pelas informações que insere e por manter suas credenciais seguras. É
            proibido enviar dados de terceiros sem autorização, conteúdo ilegal, automatizar uso não
            autorizado ou tentar burlar limites, controles de acesso e cotas da plataforma.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold text-foreground">
            3. Conteúdo gerado por IA
          </h2>
          <p>
            Notas, recomendações, currículos, cartas e outros materiais podem ser gerados por modelos
            de inteligência artificial e conter imprecisões. Nenhum resultado é garantia de aprovação,
            entrevista ou contratação. Revise todo material antes de utilizá-lo. Veja os detalhes em{" "}
            <Link to="/ia" className="text-primary underline">
              como usamos IA
            </Link>
            .
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold text-foreground">
            4. Vagas e candidaturas
          </h2>
          <p>
            As vagas exibidas podem vir de fontes públicas ou integrações externas e podem estar
            desatualizadas, alteradas ou encerradas. O Eu Passo não garante disponibilidade das vagas
            e não envia candidaturas sem uma ação explícita do usuário.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold text-foreground">
            5. Planos, cobrança e cancelamento
          </h2>
          <p>
            Alguns recursos possuem limites ou exigem um plano pago. As condições de cobrança,
            periodicidade, duração do acesso e eventual renovação são apresentadas na contratação.
            Planos recorrentes podem ser cancelados conforme as condições exibidas no checkout,
            mantendo-se o acesso já adquirido quando aplicável. Planos de período fechado podem ser
            cobrados em pagamento único. Consulte os valores e recursos vigentes em{" "}
            <Link to="/planos" className="text-primary underline">
              planos
            </Link>
            .
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold text-foreground">
            6. Limitação de responsabilidade
          </h2>
          <p>
            O serviço é uma ferramenta de apoio e não substitui avaliação profissional ou decisão de
            recrutamento. Não garantimos contratação, entrevista, compatibilidade com todos os sistemas
            ATS ou disponibilidade contínua de serviços e fontes de terceiros.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold text-foreground">7. Encerramento</h2>
          <p>
            Você pode excluir sua conta pela central de dados dentro do perfil. A exclusão remove os
            registros operacionais vinculados à conta, sem prejuízo de retenções que sejam estritamente
            necessárias para cumprimento de obrigação legal ou exercício regular de direitos quando
            aplicável.
          </p>
        </section>
      </main>

      <Rodape />
    </div>
  );
}
