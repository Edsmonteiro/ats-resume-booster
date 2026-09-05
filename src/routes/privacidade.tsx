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
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://eu-passo.netlify.app/privacidade" }],
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
              Conteúdo enviado por você: texto do currículo e arquivos que você escolhe importar
              para análise.
            </li>
            <li>Preferências de busca: cargos, senioridade, localidade e modelo de trabalho.</li>
            <li>Uso do produto: vagas analisadas, candidaturas acompanhadas, notas e progresso.</li>
            <li>
              Assinatura: status, plano e período — quando pagamentos reais estiverem habilitados,
              os dados do cartão serão tratados pelo provedor de pagamento e não pelo Eu Passo.
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold text-foreground">Para que usamos</h2>
          <p>
            Para prestar e melhorar o serviço: analisar seu currículo, comparar vagas, organizar
            candidaturas, gerar documentos e exibir alertas configurados por você. Não vendemos nem
            alugamos seus dados pessoais a recrutadores ou anunciantes.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold text-foreground">Base legal</h2>
          <p>
            Usamos as bases legais aplicáveis ao funcionamento do serviço, incluindo execução de
            contrato ou procedimentos preliminares relacionados ao serviço solicitado (art. 7º, V)
            e consentimento quando uma funcionalidade depender de uma escolha opcional do usuário.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold text-foreground">
            Inteligência artificial
          </h2>
          <p>
            Quando você solicita uma funcionalidade de IA, o conteúdo necessário à tarefa é enviado
            ao provedor de inteligência artificial contratado para produzir a resposta. Não envie
            dados sensíveis desnecessários, como CPF, RG, informações de saúde ou biometria, no
            currículo ou nas descrições de vaga.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold text-foreground">
            Links compartilháveis
          </h2>
          <p>
            Links de análise compartilhável são públicos para quem possuir o endereço. Antes da
            publicação, o sistema aplica anonimização ao conteúdo apresentado. Esses links só são
            criados mediante ação do usuário e ficam vinculados à conta que os criou.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold text-foreground">Retenção</h2>
          <p>
            Mantemos os dados da conta enquanto forem necessários para prestar o serviço ou enquanto
            a conta permanecer ativa, observadas obrigações legais eventualmente aplicáveis. Vagas
            do radar respeitam a janela de busca configurada. Ao excluir a conta pelo aplicativo,
            os registros vinculados à conta, inclusive links de análise compartilhável, são
            removidos do banco operacional.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold text-foreground">Seus direitos</h2>
          <p>
            Você pode acessar, corrigir, exportar e excluir seus dados diretamente no aplicativo:
            abra <strong className="text-foreground">Seu perfil</strong> e use a seção{" "}
            <strong className="text-foreground">Meus dados</strong> para baixar seus dados em JSON
            ou excluir a conta. Outros direitos previstos na LGPD podem ser solicitados pelos canais
            de atendimento que forem disponibilizados pelo Eu Passo.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold text-foreground">Segurança</h2>
          <p>
            Aplicamos autenticação, segregação por usuário no banco de dados e regras de acesso em
            nível de linha para reduzir o risco de acesso indevido. Nenhum sistema é isento de risco,
            por isso as medidas técnicas e operacionais são revisadas continuamente.
          </p>
        </section>
      </main>

      <Rodape />
    </div>
  );
}
