import { AppShell } from "@/components/app-shell";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Briefcase,
  Cloud,
  FileText,
  GraduationCap,
  Linkedin,
  PlayCircle,
  Radar,
  Target,
} from "lucide-react";
import { PainelHoje } from "@/components/painel-hoje";
import { ComparadorVagas } from "@/components/comparador-vagas";
import { CursosPanel } from "@/components/cursos-panel";



import { useLocalState } from "@/lib/use-local-state";

import { Rodape } from "@/components/rodape";

import { CurriculoPanel } from "@/components/curriculo-panel";
import { LinkedinPanel } from "@/components/linkedin-panel";
import { GupyPanel } from "@/components/gupy-panel";
import type { PerfilLinkedin } from "@/lib/linkedin.functions";
import type { PerfilGupy } from "@/lib/gupy.functions";
import { Button } from "@/components/ui/button";

import { VagasPanel } from "@/components/vagas-panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDadosApp } from "@/lib/use-dados";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Eu passo — Currículo aprovado no ATS e vagas rastreadas" },
      {
        name: "description",
        content:
          "Analise seu currículo para sistemas ATS, corrija o que trava a triagem automática e meça a compatibilidade com cada vaga.",
      },
      { property: "og:title", content: "Eu passo — Currículo aprovado no ATS e vagas rastreadas" },
      {
        property: "og:description",
        content:
          "Analise seu currículo para sistemas ATS, corrija o que trava a triagem automática e meça a compatibilidade com cada vaga.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://eupasso.lovable.app/" },
    ],
    links: [{ rel: "canonical", href: "https://eupasso.lovable.app/" }],
  }),
  component: Index,
});

function Index() {
  const {
    curriculo,
    setCurriculo,
    analise,
    setAnalise,
    historico,
    setHistorico,
    vagas,
    setVagas,
    sincronizando,
    naNuvem,
  } = useDadosApp();
  const [perfilLinkedin, setPerfilLinkedin] = useLocalState<PerfilLinkedin | null>(
    "eupasso:perfil-linkedin",
    null,
  );
  const [perfilGupy, setPerfilGupy] = useLocalState<PerfilGupy | null>("eupasso:perfil-gupy", null);

  return (
    <AppShell
      titulo="Painel do candidato"
      descricao="Currículo, vagas, LinkedIn e Gupy em um só lugar"
    >
      <header className="border-b border-border bg-card">
        <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-5 py-4 sm:flex sm:justify-between">
          <div className="min-w-0">
            <h1 className="truncate font-display text-lg font-semibold sm:text-xl">
              Passe pelos robôs de triagem
            </h1>
            <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
              {sincronizando ? <Cloud className="size-3.5 shrink-0 animate-pulse" /> : null}
              {sincronizando
                ? "Sincronizando…"
                : naNuvem
                  ? "Salvo na sua conta e sincronizado."
                  : "Dados apenas neste navegador."}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Button asChild size="sm">
              <Link to="/radar">
                <Radar className="size-4" />
                <span className="max-sm:sr-only">Radar de vagas</span>
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to="/demo">
                <PlayCircle className="size-4" />
                <span className="max-sm:sr-only">Demonstração</span>
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-5 px-4 py-5 sm:px-5 sm:py-6">
        <PainelHoje analise={analise} vagas={vagas} />

        <Tabs defaultValue="curriculo">
          <TabsList className="mb-4 flex max-w-full overflow-x-auto">
            <TabsTrigger value="curriculo" className="gap-2">
              <FileText className="size-4 shrink-0" />
              Currículo
            </TabsTrigger>
            <TabsTrigger value="vagas" className="gap-2">
              <Target className="size-4 shrink-0" />
              <span className="max-sm:sr-only">Rastreio de </span>Vagas
              {vagas.length > 0 ? (
                <span className="numeros ml-1 rounded-full bg-primary/12 px-1.5 text-xs text-primary">
                  {vagas.length}
                </span>
              ) : null}
            </TabsTrigger>
            <TabsTrigger value="cursos" className="gap-2">
              <GraduationCap className="size-4 shrink-0" />
              Cursos
            </TabsTrigger>


            <TabsTrigger value="linkedin" className="gap-2">
              <Linkedin className="size-4 shrink-0" />
              LinkedIn
              {perfilLinkedin ? (
                <span className="numeros ml-1 rounded-full bg-primary/12 px-1.5 text-xs text-primary">
                  {perfilLinkedin.nota}
                </span>
              ) : null}
            </TabsTrigger>
            <TabsTrigger value="gupy" className="gap-2">
              <Briefcase className="size-4 shrink-0" />
              Gupy
              {perfilGupy ? (
                <span className="numeros ml-1 rounded-full bg-primary/12 px-1.5 text-xs text-primary">
                  {perfilGupy.nota}
                </span>
              ) : null}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="curriculo">
            <CurriculoPanel
              texto={curriculo}
              setTexto={setCurriculo}
              analise={analise}
              setAnalise={setAnalise}
              historico={historico}
              setHistorico={setHistorico}
            />
          </TabsContent>

          <TabsContent value="vagas" className="space-y-4">
            <ComparadorVagas vagas={vagas} />
            <VagasPanel curriculo={curriculo} vagas={vagas} setVagas={setVagas} />
          </TabsContent>

          <TabsContent value="cursos">
            <CursosPanel curriculo={curriculo} setCurriculo={setCurriculo} />
          </TabsContent>




          <TabsContent value="linkedin">
            <LinkedinPanel perfil={perfilLinkedin} setPerfil={setPerfilLinkedin} />
          </TabsContent>

          <TabsContent value="gupy">
            <GupyPanel perfil={perfilGupy} setPerfil={setPerfilGupy} />
          </TabsContent>
        </Tabs>
      </main>

      <Rodape />
    </AppShell>
  );
}
