import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/app-shell";
import { RoadmapPanel } from "@/components/roadmap-panel";
import { Rodape } from "@/components/rodape";
import { useDadosApp } from "@/lib/use-dados";

export const Route = createFileRoute("/trilha")({
  head: () => ({
    meta: [
      { title: "Trilha de conhecimentos — plano de estudos por ritmo | Eu Passo" },
      {
        name: "description",
        content:
          "Monte sua trilha de estudos a partir do currículo e das lacunas das vagas, registre horas e acompanhe o gráfico de evolução.",
      },
      { property: "og:title", content: "Trilha de conhecimentos | Eu Passo" },
      {
        property: "og:description",
        content:
          "Plano de estudos gerado por IA com base no seu ritmo semanal, registro de horas e evolução acumulada.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TrilhaPage,
});

function TrilhaPage() {
  const { curriculo, analise, vagas } = useDadosApp();

  return (
    <AppShell titulo="Trilha" descricao="Plano de estudos e evolução">
      <main className="mx-auto max-w-6xl space-y-5 px-4 py-5 sm:px-5 sm:py-6">
        <div>
          <h1 className="font-display text-lg font-semibold sm:text-xl">
            Trilha de conhecimentos
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            O que estudar, em qual ordem e quanto isso cabe na sua semana.
          </p>
        </div>

        <RoadmapPanel curriculo={curriculo} analise={analise} vagas={vagas} />

        <Rodape />
      </main>
    </AppShell>
  );
}
