import { useNavigate } from "@tanstack/react-router";
import { LogOut, User as UserIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { carregarPerfil, salvarPerfil } from "@/lib/dados.functions";

export function ContaMenu({ className }: { className?: string } = {}) {
  const estilo = className ?? "bg-white/15 text-deep-foreground hover:bg-white/25";
  const { user, carregando } = useAuth();
  const navigate = useNavigate();
  const [nome, setNome] = useState("");

  useEffect(() => {
    if (!user) return;
    let ativo = true;
    void (async () => {
      try {
        const perfil = await carregarPerfil();
        if (!ativo) return;
        const metadados = user.user_metadata ?? {};
        const nomeFinal =
          perfil.nome || (metadados["nome"] as string) || (metadados["full_name"] as string) || "";
        const cargoFinal = perfil.cargoDesejado || (metadados["cargo_desejado"] as string) || "";
        setNome(nomeFinal);
        if (!perfil.nome && nomeFinal) {
          await salvarPerfil({ data: { nome: nomeFinal, cargoDesejado: cargoFinal } });
        }
      } catch {
        /* perfil é opcional */
      }
    })();
    return () => {
      ativo = false;
    };
  }, [user]);

  if (carregando) return null;

  if (!user) {
    return (
      <Button
        size="sm"
        variant="secondary"
        onClick={() => void navigate({ to: "/auth" })}
        className={estilo}
      >
        Entrar / criar conta
      </Button>
    );
  }

  const rotulo = nome || user.email || "Minha conta";

  async function sair() {
    await supabase.auth.signOut();
    toast.success("Você saiu da conta.");
    void navigate({ to: "/", replace: true });
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="secondary"
        className={`gap-2 ${estilo}`}
        onClick={() => void navigate({ to: "/perfil" })}
      >
        <UserIcon className="size-4" />
        <span className="max-w-[10rem] truncate">{rotulo}</span>
      </Button>
      <Button
        size="sm"
        variant="ghost"
        aria-label="Sair da conta"
        title="Sair da conta"
        onClick={() => void sair()}
      >
        <LogOut className="size-4" />
      </Button>
    </div>
  );
}
