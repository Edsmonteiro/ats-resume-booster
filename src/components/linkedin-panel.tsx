import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { FileUp, Linkedin, Loader2, Lock, Sparkles } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { GravidadeBadge } from "@/components/gravidade-badge";
import { ScoreRing } from "@/components/score-ring";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { extrairTextoDoArquivo } from "@/lib/extrair-texto";
import { analisarPerfilLinkedin, type PerfilLinkedin } from "@/lib/linkedin.functions";
import { useAssinatura } from "@/lib/use-assinatura";

const rotuloArea: Record<string, string> = {
  header: "Header",
  visual: "Visual",
  experiencias: "Experiências",
  visibilidade: "Visibilidade",
};

function BarraArea({ nota }: { nota: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
      <div className="h-full rounded-full bg-primary" style={{ width: `${nota}%` }} />
    </div>
  );
}

export function LinkedinPanel({
  perfil,
  setPerfil,
}: {
  perfil: PerfilLinkedin | null;
  setPerfil: (v: PerfilLinkedin | null) => void;
}) {
  const analisar = useServerFn(analisarPerfilLinkedin);
  const { temAcessoA, carregando: carregandoAssinatura } = useAssinatura();
  const ativa = temAcessoA("linkedin");
  const [url, setUrl] = useState("");
  const [texto, setTexto] = useState("");
  const [area, setArea] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [lendoArquivo, setLendoArquivo] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function aoEscolherArquivo(file: File | undefined) {
    if (!file) return;
    setLendoArquivo(true);
    try {
      const extraido = await extrairTextoDoArquivo(file);
      if (extraido.length < 80) throw new Error("Não consegui ler texto suficiente nesse arquivo.");
      setTexto(extraido);
      toast.success("Perfil carregado do arquivo.");
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Falha ao ler o arquivo.");
    } finally {
      setLendoArquivo(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function executar() {
    if (texto.trim().length < 80 && !/linkedin\.com\/in\//i.test(url)) {
      toast.error("Cole o link do seu perfil (linkedin.com/in/...) ou envie o PDF do perfil.");
      return;
    }
    setCarregando(true);
    try {
      const resultado = await analisar({ data: { url, texto, area } });
      if ("error" in resultado) {
        toast.error(resultado.error);
        return;
      }
      setPerfil(resultado);
      toast.success("Análise do perfil concluída.");
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não consegui analisar o perfil agora.");
    } finally {
      setCarregando(false);
    }
  }

  if (!ativa && !carregandoAssinatura) {
    return (
      <Card className="border-primary/40 bg-primary/5">
        <CardContent className="flex flex-col items-start gap-3 py-8">
          <p className="flex items-center gap-2 font-display text-lg font-semibold">
            <Lock className="size-4 text-primary" /> Análise de perfil disponível no plano Pro
          </p>
          <p className="max-w-xl text-sm text-muted-foreground">
            Assim como o radar de vagas com IA, a análise do seu perfil do LinkedIn — nota,
            diagnóstico por área e reescritas de headhunter — é exclusiva para assinantes. A partir
            de R$ 10 por mês.
          </p>
          <Button asChild>
            <Link to="/planos">
              <Sparkles className="size-4" /> Ver planos
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.3fr)]">
      <Card className="h-fit lg:sticky lg:top-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Linkedin className="size-4 text-primary" />
            Seu perfil do LinkedIn
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Link do perfil público
            </label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.linkedin.com/in/seu-perfil"
            />
          </div>

          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.docx,.txt,.md"
            className="hidden"
            onChange={(e) => void aoEscolherArquivo(e.target.files?.[0])}
          />
          <Button
            variant="secondary"
            className="w-full gap-2"
            onClick={() => inputRef.current?.click()}
            disabled={lendoArquivo}
          >
            {lendoArquivo ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <FileUp className="size-4" />
            )}
            {texto.trim().length >= 80 ? "Trocar PDF do perfil" : "Enviar PDF do perfil"}
          </Button>
          <p className="text-xs text-muted-foreground">
            O LinkedIn às vezes bloqueia leitores externos. Se acontecer, use o PDF (Mais &gt;
            Salvar como PDF).
          </p>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Área ou objetivo de carreira
            </label>
            <Input
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="Ex.: Analista de dados pleno"
            />
          </div>

          <details className="rounded-lg border p-3">
            <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
              Colar o conteúdo manualmente
            </summary>
            <Textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Conteúdo do perfil"
              className="mt-3 min-h-32 font-mono text-xs"
            />
          </details>

          <Button className="w-full gap-2" onClick={() => void executar()} disabled={carregando}>
            {carregando ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            Analisar perfil
          </Button>
        </CardContent>
      </Card>

      {!perfil ? (
        <Card>
          <CardContent className="py-20 text-center text-sm text-muted-foreground">
            Envie o link ou o PDF do seu perfil para receber a nota e as orientações de um
            headhunter.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardContent className="flex flex-col gap-5 pt-6 sm:flex-row sm:items-center">
              <ScoreRing valor={perfil.nota} legenda={`Nível: ${perfil.nivel}`} />
              <div className="min-w-0 flex-1 space-y-3">
                <p className="text-sm text-foreground">{perfil.resumo}</p>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {perfil.notasPorArea.map((a) => (
                    <div key={a.area} className="space-y-1">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-medium">{rotuloArea[a.area] ?? a.area}</span>
                        <span className="font-display font-bold text-primary">{a.nota}</span>
                      </div>
                      <BarraArea nota={a.nota} />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="header">
            <TabsList className="flex w-full flex-wrap">
              <TabsTrigger value="header">Header</TabsTrigger>
              <TabsTrigger value="visual" className="gap-1">
                Visual
                <span className="rounded bg-primary/15 px-1.5 text-xs text-primary">
                  {perfil.visual.length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="experiencias" className="gap-1">
                Experiências
                <span className="rounded bg-primary/15 px-1.5 text-xs text-primary">
                  {perfil.experiencias.length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="visibilidade">Visibilidade</TabsTrigger>
              <TabsTrigger value="plano">Plano</TabsTrigger>
            </TabsList>

            <TabsContent value="header" className="mt-4 space-y-3">
              <Card>
                <CardContent className="space-y-3 pt-6 text-sm">
                  <div className="rounded-lg bg-secondary/50 p-3">
                    <p className="text-xs tracking-wide text-muted-foreground uppercase">
                      Headline sugerida
                    </p>
                    <p className="mt-1 font-medium">{perfil.header.tituloSugerido}</p>
                  </div>
                  <div className="rounded-lg bg-secondary/50 p-3">
                    <p className="text-xs tracking-wide text-muted-foreground uppercase">
                      Seção "Sobre" sugerida
                    </p>
                    <p className="mt-1 whitespace-pre-wrap">{perfil.header.sobreSugerido}</p>
                  </div>
                  <ul className="space-y-1.5 text-muted-foreground">
                    {perfil.header.problemas.map((p, i) => (
                      <li key={i}>• {p}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="visual" className="mt-4 grid gap-3 sm:grid-cols-2">
              {perfil.visual.map((v, i) => (
                <Card key={i}>
                  <CardContent className="pt-5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">{v.item}</span>
                      <GravidadeBadge nivel={v.gravidade} />
                    </div>
                    <p className="mt-1.5 text-sm text-muted-foreground">{v.comoCorrigir}</p>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="experiencias" className="mt-4 space-y-3">
              {perfil.experiencias.map((e, i) => (
                <Card key={i}>
                  <CardContent className="pt-5 text-sm">
                    <p className="font-medium">{e.cargo}</p>
                    <p className="mt-1 text-muted-foreground">{e.problema}</p>
                    <p className="mt-2 rounded bg-primary/10 p-2 text-foreground">{e.reescrita}</p>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="visibilidade" className="mt-4">
              <Card>
                <CardContent className="space-y-3 pt-6 text-sm">
                  <div className="flex flex-wrap gap-1.5">
                    {perfil.visibilidade.palavrasChaveFaltando.map((k, i) => (
                      <span
                        key={i}
                        className="rounded border border-realce/30 bg-realce/10 px-2 py-0.5 text-xs text-foreground"
                      >
                        {k}
                      </span>
                    ))}
                  </div>
                  <ul className="space-y-1.5 text-muted-foreground">
                    {perfil.visibilidade.acoes.map((a, i) => (
                      <li key={i}>• {a}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="plano" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Conselho do hunter</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p className="whitespace-pre-wrap">{perfil.conselhoDoHunter}</p>
                  <ol className="list-decimal space-y-1.5 pl-5 text-muted-foreground">
                    {perfil.proximosPassos.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
