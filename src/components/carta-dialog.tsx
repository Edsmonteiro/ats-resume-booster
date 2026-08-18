import { useServerFn } from "@tanstack/react-start";
import { Check, Copy, Loader2, Mail } from "lucide-react";
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
import { gerarCarta, type CartaApresentacao } from "@/lib/ats.functions";
import { LIMITE_CARTA } from "@/lib/ats.schemas";

type Tom = "formal" | "equilibrado" | "direto";

const tons: { valor: Tom; rotulo: string }[] = [
  { valor: "formal", rotulo: "Formal" },
  { valor: "equilibrado", rotulo: "Equilibrado" },
  { valor: "direto", rotulo: "Direto" },
];

export function CartaDialog({
  curriculo,
  cargo,
  empresa,
  requisitos,
  carta,
  setCarta,
}: {
  curriculo: string;
  cargo: string;
  empresa: string;
  requisitos: string;
  carta: CartaApresentacao | null;
  setCarta: (c: CartaApresentacao) => void;
}) {
  const rodar = useServerFn(gerarCarta);
  const [aberto, setAberto] = useState(false);
  const [tom, setTom] = useState<Tom>("equilibrado");
  const [carregando, setCarregando] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [texto, setTexto] = useState(carta?.carta ?? "");

  async function gerar() {
    if (curriculo.trim().length < 50) {
      toast.error("Cadastre seu currículo na aba Currículo antes de gerar a carta.");
      return;
    }
    setCarregando(true);
    try {
      const resultado = await rodar({
        data: {
          curriculo: curriculo.trim().slice(0, 30000),
          cargo,
          empresa,
          requisitos: requisitos.trim().slice(0, 15000),
          tom,
        },
      });
      setCarta(resultado);
      setTexto(resultado.carta);
      toast.success("Carta gerada.");
    } catch {
      toast.error("Não foi possível gerar a carta agora. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  async function copiar() {
    await navigator.clipboard.writeText(texto);
    setCopiado(true);
    toast.success("Carta copiada.");
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Mail className="size-4" />
          {carta ? "Ver carta" : "Gerar carta"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display">Carta de apresentação</DialogTitle>
          <DialogDescription>
            Escrita a partir do seu currículo e dos requisitos de {cargo}
            {empresa ? ` na ${empresa}` : ""}. Revise antes de enviar.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2">
          {tons.map((t) => (
            <Button
              key={t.valor}
              size="sm"
              variant={tom === t.valor ? "default" : "outline"}
              onClick={() => setTom(t.valor)}
            >
              {t.rotulo}
            </Button>
          ))}
          <Button size="sm" className="ml-auto" onClick={() => void gerar()} disabled={carregando}>
            {carregando ? <Loader2 className="size-4 animate-spin" /> : null}
            {carregando ? "Escrevendo…" : carta ? "Gerar novamente" : "Gerar carta"}
          </Button>
        </div>

        {carta ? (
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                Assunto do e-mail
              </p>
              <p className="mt-1 text-sm font-medium">{carta.assunto}</p>
            </div>

            <Textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              className="min-h-72 resize-y text-sm leading-relaxed"
            />

            <div className="flex items-center justify-between gap-3">
              <p
                className={
                  texto.length > LIMITE_CARTA
                    ? "text-xs font-medium text-destructive"
                    : "text-xs text-muted-foreground"
                }
              >
                {texto.length}/{LIMITE_CARTA} caracteres — limite de campos como o da Gupy
              </p>
              <Button size="sm" variant="outline" onClick={() => void copiar()}>
                {copiado ? <Check className="size-4" /> : <Copy className="size-4" />}
                {copiado ? "Copiado" : "Copiar carta"}
              </Button>
            </div>

            {carta.observacoes.length > 0 && (
              <div className="rounded-lg border bg-secondary/40 p-3">
                <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                  Personalize antes de enviar
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {carta.observacoes.map((o) => (
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
            Escolha o tom e gere uma carta usando apenas o que já existe no seu currículo.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
