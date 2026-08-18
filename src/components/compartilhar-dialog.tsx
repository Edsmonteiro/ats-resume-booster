import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Check, Copy, Link2, Loader2, Share2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import type { AtsAnalysis } from "@/lib/ats.schemas";
import { criarLinkAnalise } from "@/lib/compartilhar.functions";

export function CompartilharDialog({ analise, scoreAntes }: { analise: AtsAnalysis; scoreAntes?: number | null }) {
  const criar = useServerFn(criarLinkAnalise);
  const [aberto, setAberto] = useState(false);
  const [gerando, setGerando] = useState(false);
  const [link, setLink] = useState("");
  const [copiado, setCopiado] = useState(false);
  const [cargo, setCargo] = useState("");

  async function gerar() {
    setGerando(true);
    try {
      const { id } = await criar({
        data: {
          score: analise.score,
          scoreAntes: scoreAntes ?? null,
          resumo: analise.resumo,
          cargoDesejado: cargo.slice(0, 200),
          pontosFortes: analise.pontosFortes.slice(0, 12),
          problemasAts: analise.problemasAts.slice(0, 20),
          palavrasChaveFaltando: analise.palavrasChaveFaltando.slice(0, 40),
          secoes: analise.secoes.slice(0, 20),
          reescritas: analise.reescritas.slice(0, 12),
        },
      });
      setLink(`${window.location.origin}/a/${id}`);
      toast.success("Link criado.");
    } catch {
      toast.error("Não foi possível criar o link agora.");
    } finally {
      setGerando(false);
    }
  }

  async function copiar() {
    await navigator.clipboard.writeText(link);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Share2 className="size-4" />
          Compartilhar análise
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display">Criar link público da análise</DialogTitle>
          <DialogDescription>
            O link mostra a nota (antes/depois), as travas, as palavras-chave e as seções destacadas. O texto do seu
            currículo não é compartilhado, e e-mails, telefones e links são removidos automaticamente.
          </DialogDescription>
        </DialogHeader>

        {link ? (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input readOnly value={link} className="text-xs" />
              <Button size="icon" variant="outline" onClick={() => void copiar()} aria-label="Copiar link">
                {copiado ? <Check className="size-4" /> : <Copy className="size-4" />}
              </Button>
            </div>
            <Button asChild variant="ghost" size="sm" className="gap-1.5 text-xs">
              <a href={link} target="_blank" rel="noreferrer">
                <Link2 className="size-3.5" />
                Abrir em nova aba
              </a>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium" htmlFor="cargo-share">
                Cargo-alvo (opcional, aparece no título)
              </label>
              <Input
                id="cargo-share"
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
                placeholder="Ex.: Analista de Dados Pleno"
              />
            </div>
            <Button onClick={() => void gerar()} disabled={gerando} className="w-full gap-2">
              {gerando ? <Loader2 className="size-4 animate-spin" /> : <Share2 className="size-4" />}
              {gerando ? "Criando…" : "Gerar link"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
