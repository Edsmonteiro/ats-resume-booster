import { Link, useRouterState } from "@tanstack/react-router";
import {
  BookOpen,
  Chrome,
  Gamepad2,
  Home,
  KanbanSquare,
  Map,
  Menu,
  Pin,
  PinOff,
  Radar,
  TrendingUp,
  Trophy,

} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { ContaMenu } from "@/components/conta-menu";
import { NotificacoesMenu } from "@/components/notificacoes-menu";
import { TemaMenu } from "@/components/tema-menu";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type ItemNav = {
  to: string;
  rotulo: string;
  icone: typeof Home;
};

const ITENS: ItemNav[] = [
  { to: "/", rotulo: "Início", icone: Home },
  { to: "/radar", rotulo: "Radar de vagas", icone: Radar },
  { to: "/candidaturas", rotulo: "Candidaturas", icone: KanbanSquare },
  { to: "/trilha", rotulo: "Trilha", icone: Map },
  { to: "/conquistas", rotulo: "Conquistas", icone: Trophy },
  { to: "/game", rotulo: "Quest", icone: Gamepad2 },
  { to: "/progresso", rotulo: "Progresso", icone: TrendingUp },
  { to: "/extensao", rotulo: "Extensão", icone: Chrome },
  { to: "/guia-ats", rotulo: "Guia ATS", icone: BookOpen },
];



const ITENS_BASE: ItemNav[] = [
  { to: "/", rotulo: "Início", icone: Home },
  { to: "/radar", rotulo: "Radar", icone: Radar },
  { to: "/candidaturas", rotulo: "Vagas", icone: KanbanSquare },
];

const CHAVE_FIXADA = "eupasso:sidebar-fixada";

function Marca({ expandido }: { expandido: boolean }) {
  return (
    <div className="flex h-14 items-center gap-3 px-4">
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
        <Radar className="size-4" />
      </span>
      <span
        className={cn(
          "font-display text-sm font-bold whitespace-nowrap transition-opacity duration-200",
          expandido ? "opacity-100" : "opacity-0",
        )}
      >
        Eu Passo
      </span>
    </div>
  );
}

function Itens({
  expandido,
  aoNavegar,
}: {
  expandido: boolean;
  aoNavegar?: () => void;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <TooltipProvider delayDuration={120}>
      <nav className="flex flex-col gap-1 px-2">
        {ITENS.map((item) => {
          const ativo = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
          const Icone = item.icone;
          const link = (
            <Link
              key={item.to}
              to={item.to}
              onClick={aoNavegar}
              title={expandido ? item.rotulo : undefined}
              className={cn(
                "flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                ativo
                  ? "bg-primary/12 text-primary"
                  : "text-muted-foreground hover:bg-accent/15 hover:text-foreground",
              )}
            >
              <Icone className="size-4 shrink-0" />
              <span
                className={cn(
                  "whitespace-nowrap transition-opacity duration-200",
                  expandido ? "opacity-100" : "opacity-0",
                )}
              >
                {item.rotulo}
              </span>
              {!expandido && <span className="sr-only">{item.rotulo}</span>}
            </Link>
          );

          return expandido ? (
            link
          ) : (
            <Tooltip key={item.to}>
              <TooltipTrigger asChild>{link}</TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                {item.rotulo}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </nav>
    </TooltipProvider>
  );
}

export function AppShell({
  children,
  titulo,
  descricao,
}: {
  children: ReactNode;
  titulo: string;
  descricao?: string;
}) {
  const [fixada, setFixada] = useState(false);
  const [hover, setHover] = useState(false);
  const [aberta, setAberta] = useState(false);

  useEffect(() => {
    setFixada(localStorage.getItem(CHAVE_FIXADA) === "1");
  }, []);

  function alternarFixada() {
    setFixada((atual) => {
      const proximo = !atual;
      localStorage.setItem(CHAVE_FIXADA, proximo ? "1" : "0");
      return proximo;
    });
  }

  const expandido = fixada || hover;

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar desktop: recolhida em ícones, expande no hover sobre o conteúdo */}
      <aside
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-border transition-all duration-200 ease-out md:flex",
          expandido
            ? "w-60 bg-card shadow-[0_0_40px_-12px_color-mix(in_oklab,var(--foreground)_12%,transparent)]"
            : "w-16 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75",
        )}
      >
        <Marca expandido={expandido} />
        <div className="mt-2 flex-1 overflow-y-auto">
          <Itens expandido={expandido} />
        </div>
        <div
          className={cn(
            "flex items-center gap-1 border-t border-border px-3 py-3 transition-opacity duration-200",
            expandido ? "opacity-100" : "opacity-0",
          )}
        >
          {expandido ? (
            <>
              <ContaMenu className="bg-secondary text-secondary-foreground hover:bg-accent/15" />
              <Button
                size="icon"
                variant="ghost"
                aria-label={fixada ? "Soltar menu" : "Fixar menu"}
                onClick={alternarFixada}
                className="ml-auto"
              >
                {fixada ? <PinOff className="size-4" /> : <Pin className="size-4" />}
              </Button>
            </>
          ) : null}
        </div>
      </aside>

      <div className={cn("transition-[padding] duration-200", fixada ? "md:pl-60" : "md:pl-16")}>
        {/* Barra superior */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur">
          <Sheet open={aberta} onOpenChange={setAberta}>
            <SheetTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="size-11 md:hidden"
                aria-label="Abrir menu"
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <Marca expandido />
              <div className="mt-2">
                <Itens expandido aoNavegar={() => setAberta(false)} />
              </div>
              <div className="mt-4 flex items-center gap-1 border-t border-border px-3 py-3">
                <ContaMenu className="bg-secondary text-secondary-foreground hover:bg-accent/15" />
              </div>
            </SheetContent>
          </Sheet>

          <div className="min-w-0">
            <h2 className="truncate font-display text-sm font-semibold">{titulo}</h2>
            {descricao ? (
              <p className="truncate text-xs text-muted-foreground">{descricao}</p>
            ) : null}
          </div>

          <div className="ml-auto flex items-center gap-1">
            <TemaMenu className="bg-transparent text-foreground hover:bg-accent/15" />
            <NotificacoesMenu />
            <span className="md:hidden">
              <ContaMenu className="bg-secondary text-secondary-foreground hover:bg-accent/15" />
            </span>
          </div>
        </header>

        <div className="pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">{children}</div>
      </div>

      <BarraInferior aoAbrirMais={() => setAberta(true)} />
    </div>
  );
}

/** Navegação principal no celular: barra fixa na base, some ao rolar para baixo. */
function BarraInferior({ aoAbrirMais }: { aoAbrirMais: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [visivel, setVisivel] = useState(true);

  useEffect(() => {
    let anterior = window.scrollY;
    const aoRolar = () => {
      const atual = window.scrollY;
      if (Math.abs(atual - anterior) > 8) {
        setVisivel(atual < anterior || atual < 80);
        anterior = atual;
      }
    };
    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => window.removeEventListener("scroll", aoRolar);
  }, []);

  return (
    <nav
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur transition-transform duration-200 md:hidden",
        visivel ? "translate-y-0" : "translate-y-full",
      )}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="grid grid-cols-4">
        {ITENS_BASE.map((item) => {
          const ativo = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
          const Icone = item.icone;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex min-h-[3.25rem] flex-col items-center justify-center gap-1 text-[0.68rem] font-medium",
                ativo ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icone className="size-5" />
              {item.rotulo}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={aoAbrirMais}
          className="flex min-h-[3.25rem] flex-col items-center justify-center gap-1 text-[0.68rem] font-medium text-muted-foreground"
        >
          <Menu className="size-5" />
          Mais
        </button>
      </div>
    </nav>
  );
}
