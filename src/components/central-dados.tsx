import { Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Download, Loader2, ShieldCheck, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { excluirMinhaConta, exportarMeusDados } from "@/lib/conta.functions";

export function CentralDados() {
  const exportar = useServerFn(exportarMeusDados);
  const excluir = useServerFn(excluirMinhaConta);
  const navigate = useNavigate();
  const [baixando, setBaixando] = useState(false);
  const [modoExcluir, setModoExcluir] = useState(false);
  const [confirmacao, setConfirmacao] = useState("");
  const [excluindo, setExcluindo] = useState(false);

  async function baixar() {
    setBaixando(true);
    try {
      const dados = await exportar();
      const blob = new Blob([JSON.stringify(dados, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `eu-passo-meus-dados-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Exportação concluída.");
    } catch {
      toast.error("Não foi possível exportar seus dados agora.");
    } finally {
      setBaixando(false);
    }
  }

  async function apagar() {
    setExcluindo(true);
    try {
      await excluir({ data: { confirmacao } });
      await supabase.auth.signOut();
      toast.success("Conta e dados excluídos.");
      void navigate({ to: "/", replace: true });
    } catch {
      toast.error("Não foi possível excluir a conta. Tente novamente.");
    } finally {
      setExcluindo(false);
    }
  }

  return (
    <div className="space-y-3 rounded-lg border p-3">
      <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
        <ShieldCheck className="size-3.5" />
        Meus dados
      </p>
      <p className="text-xs text-muted-foreground">
        Você pode levar tudo embora ou apagar de vez, quando quiser. Veja o que guardamos na{" "}
        <Link to="/privacidade" className="text-primary underline">
          política de privacidade
        </Link>
        .
      </p>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => void baixar()} disabled={baixando}>
          {baixando ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
          Exportar em JSON
        </Button>
        {!modoExcluir ? (
          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setModoExcluir(true)}>
            <Trash2 className="size-4" />
            Excluir conta
          </Button>
        ) : null}
      </div>

      {modoExcluir ? (
        <div className="space-y-2 rounded-md border border-destructive/40 bg-destructive/5 p-3">
          <p className="text-xs text-muted-foreground">
            Isso apaga currículo, análises, vagas, candidaturas e a própria conta — sem volta. Digite{" "}
            <strong className="text-foreground">EXCLUIR</strong> para confirmar.
          </p>
          <Input
            value={confirmacao}
            onChange={(e) => setConfirmacao(e.target.value)}
            placeholder="EXCLUIR"
            aria-label="Confirmação de exclusão"
          />
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setModoExcluir(false);
                setConfirmacao("");
              }}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={confirmacao.trim().toUpperCase() !== "EXCLUIR" || excluindo}
              onClick={() => void apagar()}
            >
              {excluindo ? <Loader2 className="size-4 animate-spin" /> : null}
              Excluir definitivamente
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
