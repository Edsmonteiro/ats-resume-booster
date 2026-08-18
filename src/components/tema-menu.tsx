import { Check, Moon, Palette, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MODOS, PALETAS, useTema } from "@/lib/tema";

export function TemaMenu({ className }: { className?: string }) {
  const { paleta, modo, escuroAtivo, setPaleta, setModo } = useTema();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon"
          variant="secondary"
          aria-label="Temas e aparência"
          className={className ?? "bg-white/15 text-deep-foreground hover:bg-white/25"}
        >
          {escuroAtivo ? <Moon className="size-4" /> : <Sun className="size-4" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Palette className="size-4" />
          Tema
        </DropdownMenuLabel>
        {PALETAS.map((p) => (
          <DropdownMenuItem key={p.id} onSelect={() => setPaleta(p.id)} className="gap-2">
            <span className="flex shrink-0 items-center gap-1">
              {p.amostra.map((cor) => (
                <span
                  key={cor}
                  className="size-3 rounded-full border border-border"
                  style={{ background: cor }}
                />
              ))}
            </span>
            <span className="flex-1">
              <span className="block text-sm">{p.nome}</span>
              <span className="block text-xs text-muted-foreground">{p.descricao}</span>
            </span>
            {paleta === p.id ? <Check className="size-4" /> : null}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Aparência</DropdownMenuLabel>
        {MODOS.map((m) => (
          <DropdownMenuItem key={m.id} onSelect={() => setModo(m.id)} className="gap-2">
            <span className="flex-1 text-sm">{m.nome}</span>
            {modo === m.id ? <Check className="size-4" /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
