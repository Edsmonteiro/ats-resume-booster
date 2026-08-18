import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/app-shell";
import { ConquistasPanel } from "@/components/conquistas-panel";
import { Rodape } from "@/components/rodape";
import { useDadosApp } from "@/lib/use-dados";

export const Route = createFileRoute("/conquistas")({
  head: () => ({
    meta: [
      { title: "Banco de conquistas STAR para entrevistas | Eu Passo" },
      {
        name: "description",
        content:
          "Transforme sua experiência em conquistas no formato STAR e tenha respostas prontas para entrevistas e para o currículo.",
      },
      { property: "og:title", content: "Banco de conquistas STAR | Eu Passo" },
      {
        property: "og:description",
        content:
          "Situação, Tarefa, Ação e Resultado: conquistas geradas do seu currículo para usar em entrevistas.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ConquistasPage,
});

function ConquistasPage() {
  const { curriculo } = useDadosApp();

  return (
    <AppShell titulo="Conquistas" descricao="Banco de histórias STAR">
      <main className="mx-auto max-w-6xl space-y-5 px-4 py-5 sm:px-5 sm:py-6">
        <div>
          <h1 className="font-display text-lg font-semibold sm:text-xl">Banco de conquistas</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Suas histórias em formato STAR, prontas para entrevistas e para o currículo.
          </p>
        </div>

        <ConquistasPanel curriculo={curriculo} />

        <Rodape />
      </main>
    </AppShell>
  );
}
