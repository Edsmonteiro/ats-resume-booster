import { useServerFn } from "@tanstack/react-start";
import { Bell, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAuth } from "@/lib/auth";
import { listarNotificacoes, marcarNotificacoesLidas, type Notificacao } from "@/lib/radar.functions";

function quando(iso: string) {
  const data = new Date(iso);
  const minutos = Math.round((Date.now() - data.getTime()) / 60000);
  if (minutos < 1) return "agora";
  if (minutos < 60) return `há ${minutos} min`;
  if (minutos < 1440) return `há ${Math.round(minutos / 60)} h`;
  return data.toLocaleDateString("pt-BR");
}

export function NotificacoesMenu() {
  const { user } = useAuth();
  const listar = useServerFn(listarNotificacoes);
  const marcar = useServerFn(marcarNotificacoesLidas);
  const [itens, setItens] = useState<Notificacao[]>([]);
  const [carregando, setCarregando] = useState(false);

  const carregar = useCallback(async () => {
    if (!user) return;
    setCarregando(true);
    try {
      setItens(await listar({}));
    } catch {
      /* silencioso */
    } finally {
      setCarregando(false);
    }
  }, [listar, user]);

  useEffect(() => {
    void carregar();
    const id = setInterval(() => void carregar(), 120000);
    return () => clearInterval(id);
  }, [carregar]);

  if (!user) return null;

  const naoLidas = itens.filter((i) => !i.lida).length;

  return (
    <Popover
      onOpenChange={(aberto) => {
        if (!aberto || naoLidas === 0) return;
        setItens((atual) => atual.map((i) => ({ ...i, lida: true })));
        void marcar({});
      }}
    >
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notificações">
          <Bell className="size-4" />
          {naoLidas > 0 && (
            <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
              {naoLidas > 9 ? "9+" : naoLidas}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b px-4 py-3 font-display text-sm font-semibold">Notificações</div>
        <div className="max-h-80 overflow-y-auto">
          {carregando && itens.length === 0 && (
            <div className="flex items-center gap-2 px-4 py-6 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Carregando…
            </div>
          )}
          {!carregando && itens.length === 0 && (
            <p className="px-4 py-6 text-sm text-muted-foreground">
              Nada por aqui ainda. Ative os alertas do radar para receber avisos de novas vagas.
            </p>
          )}
          {itens.map((n) => (
            <div key={n.id} className="border-b px-4 py-3 last:border-b-0">
              <p className="text-sm font-medium">{n.titulo}</p>
              {n.mensagem && (
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{n.mensagem}</p>
              )}
              <p className="mt-1 text-[11px] text-muted-foreground">{quando(n.criadaEm)}</p>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
