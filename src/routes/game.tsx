import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/app-shell";
import { GamePanel } from "@/components/game-panel";
import { Rodape } from "@/components/rodape";

export const Route = createFileRoute("/game")({
  head: () => ({
    meta: [
      { title: "Quest — treine currículo, entrevista e LinkedIn | Eu Passo" },
      {
        name: "description",
        content:
          "Jogo com perguntas objetivas e desafios escritos sobre currículo, ATS, entrevistas e LinkedIn. Errou? A IA te ensina na hora.",
      },
      { property: "og:title", content: "Quest | Eu Passo" },
      {
        property: "og:description",
        content:
          "Rodadas rápidas com pontuação, dicas e resposta modelo para você aprender a conquistar a vaga.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GamePage,
});

function GamePage() {
  return (
    <AppShell titulo="Quest" descricao="Aprenda jogando sobre carreira e seleção">
      <main className="mx-auto max-w-6xl space-y-5 px-4 py-5 sm:px-5 sm:py-6">
        <div>
          <h1 className="font-display text-lg font-semibold sm:text-xl">Quest</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Perguntas objetivas e desafios escritos. Quando você não souber, a gente ensina.
          </p>
        </div>

        <GamePanel />

        <Rodape />
      </main>
    </AppShell>
  );
}
