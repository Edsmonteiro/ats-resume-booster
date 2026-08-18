import { useServerFn } from "@tanstack/react-start";
import { Check, Copy, Download, FileCheck2, FileText, FileType2, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { gerarCurriculoRevisado, type AtsAnalysis, type CurriculoRevisado } from "@/lib/ats.functions";
import { exportarDocx, exportarPdf } from "@/lib/exportar-curriculo";
import { nomeArquivoCurriculo } from "@/lib/nome-arquivo";


function montarOrientacoes(analise: AtsAnalysis) {
  const partes: string[] = [];
  if (analise.problemasAts.length)
    partes.push(
      "Problemas a corrigir:\n" +
        analise.problemasAts.map((p) => `- (${p.gravidade}) ${p.titulo}: ${p.comoCorrigir}`).join("\n"),
    );
  if (analise.palavrasChaveFaltando.length)
    partes.push("Palavras-chave a incluir quando fizerem sentido: " + analise.palavrasChaveFaltando.join(", "));
  if (analise.verbosFracos.length) partes.push("Substituir verbos fracos: " + analise.verbosFracos.join(", "));
  if (analise.secoes.length)
    partes.push("Seções: " + analise.secoes.map((s) => `${s.nome} (${s.status}) — ${s.nota}`).join("; "));
  if (analise.reescritas.length)
    partes.push("Reescritas sugeridas:\n" + analise.reescritas.map((r) => `- "${r.original}" → "${r.sugerida}"`).join("\n"));
  return partes.join("\n\n").slice(0, 8000);
}

export function CurriculoRevisadoDialog({ texto, analise }: { texto: string; analise: AtsAnalysis }) {
  const rodar = useServerFn(gerarCurriculoRevisado);
  const [aberto, setAberto] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [resultado, setResultado] = useState<CurriculoRevisado | null>(null);
  const [conteudo, setConteudo] = useState("");
  const [exportando, setExportando] = useState(false);

  async function gerar() {
    setCarregando(true);
    try {
      const r = await rodar({
        data: { curriculo: texto.trim().slice(0, 30000), orientacoes: montarOrientacoes(analise) },
      });
      setResultado(r);
      setConteudo(r.curriculo);
      toast.success("Currículo revisado gerado.");
    } catch {
      toast.error("Não foi possível gerar o currículo revisado agora. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  async function copiar() {
    await navigator.clipboard.writeText(conteudo);
    setCopiado(true);
    toast.success("Currículo copiado.");
    setTimeout(() => setCopiado(false), 2000);
  }

  function baixarTxt() {
    const blob = new Blob([conteudo], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nomeArquivoCurriculo(conteudo, "ats", "txt", "curriculo-revisado");
    a.click();
    URL.revokeObjectURL(url);
  }

  async function baixarDocx() {
    setExportando(true);
    try {
      await exportarDocx(conteudo, nomeArquivoCurriculo(conteudo, "ats", "docx"));
      toast.success("DOCX gerado.");
    } catch {
      toast.error("Não foi possível gerar o DOCX.");
    } finally {
      setExportando(false);
    }
  }

  function baixarPdf() {
    try {
      exportarPdf(conteudo, nomeArquivoCurriculo(conteudo, "ats", "pdf"));
      toast.success("PDF gerado.");
    } catch {
      toast.error("Não foi possível gerar o PDF.");
    }
  }


  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <FileCheck2 className="size-4" />
          Gerar currículo revisado
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-display">Currículo revisado para ATS</DialogTitle>
          <DialogDescription>
            Reescrita do seu currículo aplicando as melhorias da análise, em texto simples de uma coluna — o formato
            que os robôs de triagem leem melhor. Nada é inventado: só o que já existe no original.
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-end">
          <Button size="sm" onClick={() => void gerar()} disabled={carregando}>
            {carregando ? <Loader2 className="size-4 animate-spin" /> : null}
            {carregando ? "Reescrevendo…" : resultado ? "Gerar novamente" : "Gerar agora"}
          </Button>
        </div>

        {resultado ? (
          <div className="space-y-4">
            <Textarea
              value={conteudo}
              onChange={(e) => setConteudo(e.target.value)}
              className="min-h-96 resize-y font-mono text-xs leading-relaxed"
            />
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

            {resultado.mudancas.length > 0 && (
              <div className="rounded-lg border bg-secondary/40 p-3">
                <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                  O que mudou
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {resultado.mudancas.map((m) => (
                    <li key={m} className="text-sm text-muted-foreground">
                      {m}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {resultado.observacoes.length > 0 && (
              <div className="rounded-lg border p-3">
                <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                  Confirme antes de enviar
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {resultado.observacoes.map((o) => (
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
            Clique em “Gerar agora” para receber a versão revisada, pronta para copiar ou baixar.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
