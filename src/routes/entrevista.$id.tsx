import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, FileText, Loader2, Lock, MessagesSquare, Sparkles, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Rodape } from "@/components/rodape";
import { ScoreRing } from "@/components/score-ring";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import {
  avaliarResposta,
  carregarPreparo,
  gerarRoteiroEntrevista,
  type FeedbackResposta,
  type RoteiroEntrevista,
} from "@/lib/entrevista.functions";
import { exportarPdf } from "@/lib/exportar-curriculo";

export const Route = createFileRoute("/entrevista/$id")({
  head: () => ({
    meta: [
      { title: "Preparação para entrevista com IA | Eu Passo" },
      {
        name: "description",
        content:
          "Roteiro de entrevista provável para a vaga, respostas em formato STAR baseadas no seu currículo e treino com feedback da IA.",
      },
      { property: "og:title", content: "Preparação para entrevista — Eu Passo" },
      {
        property: "og:description",
        content: "Perguntas prováveis, respostas STAR e treino com feedback da IA.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PaginaEntrevista,
});

const TIPO: Record<string, string> = {
  tecnica: "Técnica",
  comportamental: "Comportamental",
  lacuna: "Lacuna",
  cultura: "Cultura",
};

function PaginaEntrevista() {
  const { id } = Route.useParams();
  const { user, carregando } = useAuth();
  const navigate = useNavigate();
  const buscar = useServerFn(carregarPreparo);
  const gerar = useServerFn(gerarRoteiroEntrevista);
  const qc = useQueryClient();

  useEffect(() => {
    if (!carregando && !user) void navigate({ to: "/auth" });
  }, [carregando, user, navigate]);

  const { data, isLoading } = useQuery({
    queryKey: ["preparo", id],
    queryFn: () => buscar({ data: { candidaturaId: id } }),
    enabled: !!user,
  });

  const mGerar = useMutation({
    mutationFn: () => gerar({ data: { candidaturaId: id } }),
    onSuccess: (r) => {
      if ("error" in r) {
        toast.error(r.error);
        return;
      }
      void qc.invalidateQueries({ queryKey: ["preparo", id] });
      toast.success("Roteiro pronto.");
    },
    onError: () => toast.error("Não foi possível gerar o roteiro agora."),
  });

  const roteiro = data?.roteiro ?? null;

  function baixarPdf() {
    if (!roteiro || !data) return;
    const linhas = [
      `Preparação de entrevista — ${data.candidatura.titulo}`,
      data.candidatura.empresa ? `Empresa: ${data.candidatura.empresa}` : "",
      "",
      roteiro.resumoDaVaga,
      "",
      "PONTOS FORTES",
      ...roteiro.pontosFortes.map((p) => `- ${p}`),
      "",
      "PERGUNTAS PROVÁVEIS",
      ...roteiro.perguntas.flatMap((p) => [
        `\n[${TIPO[p.tipo] ?? p.tipo}] ${p.pergunta}`,
        `Por que vem: ${p.porQueVemAqui}`,
        `S: ${p.respostaStar.situacao}`,
        `T: ${p.respostaStar.tarefa}`,
        `A: ${p.respostaStar.acao}`,
        `R: ${p.respostaStar.resultado}`,
      ]),
      "",
      "PERGUNTAS PARA VOCÊ FAZER",
      ...roteiro.perguntasParaFazer.map((p) => `- ${p}`),
      "",
      "PRETENSÃO SALARIAL",
      roteiro.salario.faixaSugerida,
      roteiro.salario.comoResponder,
      "",
      "CONSELHO FINAL",
      roteiro.conselhoFinal,
    ].join("\n");

    const nome = `entrevista-${data.candidatura.titulo}`
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .slice(0, 70);
    exportarPdf(linhas, `${nome}.pdf`);
    toast.success("PDF gerado.");
  }

  if (carregando || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-5 text-center">
        <p className="text-sm text-muted-foreground">Candidatura não encontrada.</p>
        <Button asChild variant="outline">
          <Link to="/candidaturas">Voltar ao quadro</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="text-deep-foreground" style={{ background: "var(--gradient-deep)" }}>
        <div className="mx-auto max-w-5xl px-5 py-8">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-deep-foreground hover:bg-white/10"
          >
            <Link to="/candidaturas">
              <ArrowLeft className="size-4" />
              Voltar ao quadro
            </Link>
          </Button>
          <h1 className="mt-4 flex items-center gap-2 font-display text-2xl font-bold sm:text-3xl">
            <MessagesSquare className="size-6" />
            Preparação para entrevista
          </h1>
          <p className="mt-2 text-sm opacity-80">
            {data.candidatura.titulo}
            {data.candidatura.empresa ? ` · ${data.candidatura.empresa}` : ""}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" onClick={() => mGerar.mutate()} disabled={mGerar.isPending}>
              {mGerar.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Sparkles className="size-4" />
              )}
              {roteiro ? "Gerar novamente" : "Gerar roteiro"}
            </Button>
            {roteiro ? (
              <Button size="sm" variant="secondary" onClick={baixarPdf}>
                <FileText className="size-4" />
                Baixar PDF
              </Button>
            ) : null}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-8">
        {data.bloqueado ? (
          <Card className="mb-4 border-primary/40">
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Lock className="size-4 text-primary" />A preparação para entrevista faz parte do Eu
                Passo Pro.
              </p>
              <Button asChild size="sm">
                <Link to="/planos">Ver planos</Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {roteiro ? (
          <Roteiro roteiro={roteiro} cargo={data.candidatura.titulo} bloqueado={data.bloqueado} />
        ) : (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Clique em “Gerar roteiro” para receber as perguntas prováveis desta vaga com respostas
            baseadas no seu currículo.
          </p>
        )}
      </main>

      <Rodape />
    </div>
  );
}

function Roteiro({
  roteiro,
  cargo,
  bloqueado,
}: {
  roteiro: RoteiroEntrevista;
  cargo: string;
  bloqueado: boolean;
}) {
  return (
    <Tabs defaultValue="perguntas">
      <TabsList className="mb-4">
        <TabsTrigger value="perguntas">Perguntas ({roteiro.perguntas.length})</TabsTrigger>
        <TabsTrigger value="riscos">Lacunas ({roteiro.riscos.length})</TabsTrigger>
        <TabsTrigger value="fechamento">Fechamento</TabsTrigger>
      </TabsList>

      <TabsContent value="perguntas" className="space-y-3">
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">
            {roteiro.resumoDaVaga}
            {roteiro.pontosFortes.length ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {roteiro.pontosFortes.map((p) => (
                  <span
                    key={p}
                    className="rounded-full bg-primary/12 px-2.5 py-1 text-xs text-primary"
                  >
                    {p}
                  </span>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>

        {roteiro.perguntas.map((p) => (
          <PerguntaCard key={p.pergunta} p={p} cargo={cargo} bloqueado={bloqueado} />
        ))}
      </TabsContent>

      <TabsContent value="riscos" className="space-y-3">
        {roteiro.riscos.map((r) => (
          <Card key={r.lacuna}>
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-base">{r.lacuna}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">{r.comoResponder}</CardContent>
          </Card>
        ))}
      </TabsContent>

      <TabsContent value="fechamento" className="space-y-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-base">Perguntas para você fazer</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
              {roteiro.perguntasParaFazer.map((q) => (
                <li key={q}>{q}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 font-display text-base">
              <Wallet className="size-4 text-primary" />
              Pretensão salarial
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">{roteiro.salario.faixaSugerida}</p>
            <p>{roteiro.salario.comoResponder}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-base">Conselho final</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {roteiro.conselhoFinal}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

function PerguntaCard({
  p,
  cargo,
  bloqueado,
}: {
  p: RoteiroEntrevista["perguntas"][number];
  cargo: string;
  bloqueado: boolean;
}) {
  const avaliar = useServerFn(avaliarResposta);
  const [treino, setTreino] = useState(false);
  const [resposta, setResposta] = useState("");
  const [feedback, setFeedback] = useState<FeedbackResposta | null>(null);
  const [avaliando, setAvaliando] = useState(false);

  async function enviar() {
    setAvaliando(true);
    try {
      const r = await avaliar({ data: { pergunta: p.pergunta, resposta, cargo } });
      if ("error" in r) {
        toast.error(r.error);
        return;
      }
      setFeedback(r);
    } catch {
      toast.error("Não foi possível avaliar agora.");
    } finally {
      setAvaliando(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="font-display text-base leading-snug">{p.pergunta}</CardTitle>
          <span className="shrink-0 rounded bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
            {TIPO[p.tipo] ?? p.tipo}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p className="text-muted-foreground">{p.porQueVemAqui}</p>
        <div className="grid gap-2 rounded-lg border bg-secondary/30 p-3 sm:grid-cols-2">
          <Bloco titulo="Situação" texto={p.respostaStar.situacao} />
          <Bloco titulo="Tarefa" texto={p.respostaStar.tarefa} />
          <Bloco titulo="Ação" texto={p.respostaStar.acao} />
          <Bloco titulo="Resultado" texto={p.respostaStar.resultado} />
        </div>

        {!treino ? (
          <Button size="sm" variant="outline" onClick={() => setTreino(true)} disabled={bloqueado}>
            Treinar minha resposta
          </Button>
        ) : (
          <div className="space-y-2">
            <Textarea
              value={resposta}
              onChange={(e) => setResposta(e.target.value)}
              placeholder="Escreva a resposta com suas palavras…"
              className="min-h-28"
            />
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={() => setTreino(false)}>
                Fechar
              </Button>
              <Button
                size="sm"
                disabled={resposta.trim().length < 20 || avaliando}
                onClick={() => void enviar()}
              >
                {avaliando ? <Loader2 className="size-4 animate-spin" /> : null}
                Avaliar resposta
              </Button>
            </div>

            {feedback ? (
              <div className="space-y-3 rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <ScoreRing valor={feedback.nota} tamanho={64} />
                  <p className="text-xs text-muted-foreground">Nota da sua resposta</p>
                </div>
                {feedback.pontosBons.length ? (
                  <div>
                    <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                      Funcionou
                    </p>
                    <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                      {feedback.pontosBons.map((b) => (
                        <li key={b}>{b}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {feedback.ajustes.length ? (
                  <div>
                    <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                      Ajuste
                    </p>
                    <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                      {feedback.ajustes.map((a) => (
                        <li key={a}>{a}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                <div>
                  <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                    Versão melhorada
                  </p>
                  <p className="mt-1 text-sm">{feedback.versaoMelhorada}</p>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Bloco({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
        {titulo}
      </p>
      <p className="mt-0.5 text-sm">{texto}</p>
    </div>
  );
}
