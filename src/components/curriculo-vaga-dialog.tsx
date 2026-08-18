import { useServerFn } from "@tanstack/react-start";
import { Check, Copy, Download, FileText, FileType2, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { CurriculoPrevia } from "@/components/curriculo-previa";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { gerarCurriculoRevisado, type CurriculoRevisado, type JobMatch } from "@/lib/ats.functions";
import { exportarDocx, exportarPdf } from "@/lib/exportar-curriculo";
import { comIdentificacao, nomeArquivoCurriculo } from "@/lib/nome-arquivo";


function montarOrientacoes(cargo: string, empresa: string, requisitos: string, m: JobMatch | null) {
  const partes: string[] = [
    `Alvo: vaga de ${cargo}${empresa ? ` na ${empresa}` : ""}.`,
    `Requisitos da vaga:\n${requisitos.slice(0, 6000)}`,
  ];
  if (m) {
    if (m.palavrasChaveParaIncluir.length)
      partes.push("Palavras-chave a incluir quando forem verdadeiras: " + m.palavrasChaveParaIncluir.join(", "));
    if (m.ajustesNoCurriculo.length) partes.push("Ajustes recomendados:\n- " + m.ajustesNoCurriculo.join("\n- "));
    if (m.lacunas.length)
      partes.push("Lacunas a mitigar:\n" + m.lacunas.map((l) => `- (${l.gravidade}) ${l.requisito}: ${l.acao}`).join("\n"));
    if (m.requisitosAtendidos.length) partes.push("Destacar no topo: " + m.requisitosAtendidos.join("; "));
  }
  return partes.join("\n\n").slice(0, 8000);
}

export function CurriculoVagaDialog({
  curriculo,
  cargo,
  empresa,
  requisitos,
  resultado,
}: {
  curriculo: string;
  cargo: string;
  empresa: string;
  requisitos: string;
  resultado: JobMatch | null;
}) {
  const rodar = useServerFn(gerarCurriculoRevisado);
  const [aberto, setAberto] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [dados, setDados] = useState<CurriculoRevisado | null>(null);
  const [conteudo, setConteudo] = useState("");

  const textoFinal = comIdentificacao(conteudo, cargo, empresa);
  const nomeArquivo = (ext: string) => nomeArquivoCurriculo(textoFinal, `${cargo} ${empresa}`, ext);


  async function gerar() {
    if (curriculo.trim().length < 50) {
      toast.error("Cadastre seu currículo na aba Currículo antes de gerar a versão otimizada.");
      return;
    }
    setCarregando(true);
    try {
      const r = await rodar({
        data: {
          curriculo: curriculo.trim().slice(0, 30000),
          orientacoes: montarOrientacoes(cargo, empresa, requisitos, resultado),
        },
      });
      setDados(r);
      setConteudo(r.curriculo);
      toast.success("Currículo otimizado para a vaga.");
    } catch {
      toast.error("Não foi possível gerar o currículo agora. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  async function copiar() {
    await navigator.clipboard.writeText(textoFinal);
    setCopiado(true);
    toast.success("Currículo copiado.");
    setTimeout(() => setCopiado(false), 2000);
  }

  function baixarTxt() {
    const blob = new Blob([textoFinal], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nomeArquivo("txt");
    a.click();
    URL.revokeObjectURL(url);
  }

  async function baixarDocx() {
    setExportando(true);
    try {
      await exportarDocx(textoFinal, nomeArquivo("docx"));
      toast.success("DOCX gerado.");
    } catch {
      toast.error("Não foi possível gerar o DOCX.");
    } finally {
      setExportando(false);
    }
  }

  function baixarPdf() {
    try {
      exportarPdf(textoFinal, nomeArquivo("pdf"));
      toast.success("PDF gerado.");
    } catch {
      toast.error("Não foi possível gerar o PDF.");
    }
  }


  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-2">
          <Sparkles className="size-4" />
          Currículo otimizado
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-display">Currículo otimizado para esta vaga</DialogTitle>
          <DialogDescription>
            Reescrevemos seu currículo aplicando os termos e ajustes recomendados para {cargo}
            {empresa ? ` na ${empresa}` : ""}, em texto de uma coluna pronto para ATS. Nada é inventado: só o que já
            existe no original.
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-end">
          <Button size="sm" onClick={() => void gerar()} disabled={carregando}>
            {carregando ? <Loader2 className="size-4 animate-spin" /> : null}
            {carregando ? "Otimizando…" : dados ? "Gerar novamente" : "Gerar agora"}
          </Button>
        </div>

        {dados ? (
          <div className="space-y-4">
            <Tabs defaultValue="previa">
              <TabsList>
                <TabsTrigger value="previa">Prévia</TabsTrigger>
                <TabsTrigger value="editar">Editar texto</TabsTrigger>
              </TabsList>
              <TabsContent value="previa" className="mt-4">
                <CurriculoPrevia texto={textoFinal} />
              </TabsContent>
              <TabsContent value="editar" className="mt-4">
                <Textarea
                  value={conteudo}
                  onChange={(e) => setConteudo(e.target.value)}
                  className="min-h-96 resize-y font-mono text-xs leading-relaxed"
                />
              </TabsContent>
            </Tabs>

            <div className="flex flex-wrap justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => void copiar()}>
                {copiado ? <Check className="size-4" /> : <Copy className="size-4" />}
                {copiado ? "Copiado" : "Copiar"}
              </Button>
              <Button size="sm" variant="outline" onClick={baixarTxt}>
                <Download className="size-4" />
                .txt
              </Button>
              <Button size="sm" variant="outline" onClick={baixarPdf}>
                <FileText className="size-4" />
                Baixar PDF
              </Button>
              <Button size="sm" onClick={() => void baixarDocx()} disabled={exportando}>
                {exportando ? <Loader2 className="size-4 animate-spin" /> : <FileType2 className="size-4" />}
                Baixar DOCX
              </Button>
            </div>

            {dados.mudancas.length > 0 && (
              <div className="rounded-lg border bg-secondary/40 p-3">
                <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">O que mudou</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {dados.mudancas.map((m) => (
                    <li key={m} className="text-sm text-muted-foreground">
                      {m}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {dados.observacoes.length > 0 && (
              <div className="rounded-lg border p-3">
                <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                  Confirme antes de enviar
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {dados.observacoes.map((o) => (
                    <li key={o} className="text-sm text-muted-foreground">
                      {o}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Clique em “Gerar agora” para receber a versão sob medida para esta vaga.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
