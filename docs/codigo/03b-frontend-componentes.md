# Front-end (2/3) — componentes da aplicação

## `src/components/app-shell.tsx`

```tsx
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
```

## `src/components/carta-dialog.tsx`

```tsx
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
```

## `src/components/central-dados.tsx`

```tsx
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
```

## `src/components/checkout-embutido.tsx`

```tsx
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";

import { criarCheckout } from "@/lib/payments.functions";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";

export function CheckoutEmbutido({ priceId, returnUrl }: { priceId: string; returnUrl?: string }) {
  const fetchClientSecret = async (): Promise<string> => {
    const resultado = await criarCheckout({
      data: {
        priceId,
        returnUrl:
          returnUrl ||
          `${window.location.origin}/planos?checkout=ok&session_id={CHECKOUT_SESSION_ID}`,
        environment: getStripeEnvironment(),
      },
    });
    if ("error" in resultado) throw new Error(resultado.error);
    if (!resultado.clientSecret) throw new Error("Não foi possível iniciar o pagamento.");
    return resultado.clientSecret;
  };

  return (
    <div id="checkout" className="min-h-[28rem]">
      <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
```

## `src/components/comparador-vagas.tsx`

```tsx
import { Columns3 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Vaga } from "@/components/vagas-panel";
import { cn } from "@/lib/utils";

const MAX = 3;

function Linha({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-[0.7rem] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
        {rotulo}
      </p>
      {children}
    </div>
  );
}

/** Compara até 3 vagas já avaliadas, sem novas chamadas de IA. */
export function ComparadorVagas({ vagas }: { vagas: Vaga[] }) {
  const avaliadas = vagas.filter((v) => v.resultado);
  const [aberto, setAberto] = useState(false);
  const [ids, setIds] = useState<string[]>([]);

  if (avaliadas.length < 2) return null;

  const selecionadas = avaliadas.filter((v) => ids.includes(v.id));
  const melhor = selecionadas.reduce<Vaga | null>(
    (top, v) =>
      !top || (v.resultado?.compatibilidade ?? 0) > (top.resultado?.compatibilidade ?? 0) ? v : top,
    null,
  );

  function alternar(id: string) {
    setIds((atual) =>
      atual.includes(id)
        ? atual.filter((i) => i !== id)
        : atual.length >= MAX
          ? atual
          : [...atual, id],
    );
  }

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 max-sm:w-full">
          <Columns3 className="size-4" />
          Comparar vagas
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="font-display">Comparar vagas</DialogTitle>
          <DialogDescription>
            Escolha até {MAX} vagas já avaliadas para ver match, requisitos e lacunas lado a lado.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-2">
          {avaliadas.map((v) => (
            <Button
              key={v.id}
              size="sm"
              variant={ids.includes(v.id) ? "default" : "outline"}
              onClick={() => alternar(v.id)}
              className="max-w-full"
            >
              <span className="truncate">
                {v.cargo}
                {v.empresa ? ` · ${v.empresa}` : ""}
              </span>
            </Button>
          ))}
        </div>

        {selecionadas.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Selecione ao menos duas vagas para comparar.
          </p>
        ) : (
          <div
            className={cn(
              "grid gap-3",
              selecionadas.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3",
            )}
          >
            {selecionadas.map((v) => {
              const r = v.resultado!;
              const vencedora = melhor?.id === v.id && selecionadas.length > 1;
              return (
                <Card
                  key={v.id}
                  className={cn("h-full", vencedora && "border-primary shadow-[var(--shadow-panel)]")}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="font-display text-base leading-tight">
                      {v.cargo}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {v.empresa || "Empresa não informada"}
                    </p>
                    <p className="mt-2 font-display text-3xl font-bold text-primary">
                      {Math.round(r.compatibilidade)}%
                      {vencedora ? (
                        <span className="ml-2 align-middle text-[0.65rem] font-semibold tracking-wide text-primary uppercase">
                          melhor match
                        </span>
                      ) : null}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Linha rotulo="Veredito">
                      <p className="text-sm leading-relaxed text-muted-foreground">{r.veredito}</p>
                    </Linha>
                    <Linha rotulo={`Atende (${r.requisitosAtendidos.length})`}>
                      <ul className="space-y-1">
                        {r.requisitosAtendidos.slice(0, 5).map((x) => (
                          <li key={x} className="text-sm text-muted-foreground">
                            <span className="text-primary">✓</span> {x}
                          </li>
                        ))}
                      </ul>
                    </Linha>
                    <Linha rotulo={`Lacunas (${r.lacunas.length})`}>
                      <ul className="space-y-1">
                        {r.lacunas.slice(0, 5).map((l) => (
                          <li key={l.requisito} className="text-sm text-muted-foreground">
                            • {l.requisito}
                          </li>
                        ))}
                      </ul>
                    </Linha>
                    {v.link ? (
                      <Button asChild size="sm" variant="outline" className="w-full">
                        <a href={v.link} target="_blank" rel="noopener noreferrer">
                          Abrir vaga
                        </a>
                      </Button>
                    ) : null}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

## `src/components/compartilhar-dialog.tsx`

```tsx
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
```

## `src/components/conquistas-panel.tsx`

```tsx
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Copy, Loader2, Plus, Sparkles, Trash2, Trophy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import {
  excluirConquista,
  listarConquistas,
  salvarConquista,
  sugerirConquistas,
  type Conquista,
} from "@/lib/conquistas.functions";

type Rascunho = {
  id?: string;
  titulo: string;
  situacao: string;
  tarefa: string;
  acao: string;
  resultado: string;
  tags: string[];
};

const VAZIO: Rascunho = {
  titulo: "",
  situacao: "",
  tarefa: "",
  acao: "",
  resultado: "",
  tags: [],
};

function textoStar(c: Rascunho | Conquista) {
  return [
    c.titulo,
    c.situacao && `Situação: ${c.situacao}`,
    c.tarefa && `Tarefa: ${c.tarefa}`,
    c.acao && `Ação: ${c.acao}`,
    c.resultado && `Resultado: ${c.resultado}`,
  ]
    .filter(Boolean)
    .join("\n");
}

/** Banco de conquistas STAR reutilizáveis em currículos, cartas e entrevistas. */
export function ConquistasPanel({ curriculo }: { curriculo: string }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const buscar = useServerFn(listarConquistas);
  const salvar = useServerFn(salvarConquista);
  const excluir = useServerFn(excluirConquista);
  const sugerir = useServerFn(sugerirConquistas);

  const [rascunho, setRascunho] = useState<Rascunho | null>(null);

  const lista = useQuery({
    queryKey: ["conquistas", user?.id],
    queryFn: () => buscar(),
    enabled: Boolean(user),
  });

  const mSalvar = useMutation({
    mutationFn: (r: Rascunho) => salvar({ data: r }),
    onSuccess: () => {
      setRascunho(null);
      toast.success("Conquista salva");
      qc.invalidateQueries({ queryKey: ["conquistas", user?.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const mExcluir = useMutation({
    mutationFn: (id: string) => excluir({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["conquistas", user?.id] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const mSugerir = useMutation({
    mutationFn: () => sugerir({ data: { curriculo } }),
    onSuccess: async (sugestoes) => {
      for (const s of sugestoes) await salvar({ data: s });
      toast.success(`${sugestoes.length} conquistas extraídas do seu currículo`);
      qc.invalidateQueries({ queryKey: ["conquistas", user?.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!user) {
    return (
      <Card className="shadow-[var(--shadow-panel)]">
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <Trophy className="size-8 text-muted-foreground" />
          <p className="max-w-sm text-sm text-muted-foreground">
            Entre na sua conta para montar seu banco de conquistas e reaproveitá-las em currículos,
            cartas e entrevistas.
          </p>
        </CardContent>
      </Card>
    );
  }

  const conquistas = lista.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          onClick={() => mSugerir.mutate()}
          disabled={curriculo.trim().length < 50 || mSugerir.isPending}
          className="max-sm:w-full"
        >
          {mSugerir.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Sparkles className="size-4" />
          )}
          Extrair do currículo
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setRascunho({ ...VAZIO })}
          className="max-sm:w-full"
        >
          <Plus className="size-4" /> Nova conquista
        </Button>
      </div>

      {curriculo.trim().length < 50 ? (
        <p className="text-xs text-muted-foreground">
          Cole seu currículo na aba Currículo para extrair conquistas automaticamente.
        </p>
      ) : null}

      {rascunho ? (
        <Card className="shadow-[var(--shadow-panel)]">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base">
              {rascunho.id ? "Editar conquista" : "Nova conquista"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Título (ex.: Reduzi o custo de compras em 18%)"
              value={rascunho.titulo}
              onChange={(e) => setRascunho({ ...rascunho, titulo: e.target.value })}
            />
            {(
              [
                ["situacao", "Situação — qual era o contexto?"],
                ["tarefa", "Tarefa — o que você precisava resolver?"],
                ["acao", "Ação — o que você fez?"],
                ["resultado", "Resultado — qual foi o impacto (com número, se possível)?"],
              ] as const
            ).map(([campo, rotulo]) => (
              <Textarea
                key={campo}
                placeholder={rotulo}
                rows={2}
                value={rascunho[campo]}
                onChange={(e) => setRascunho({ ...rascunho, [campo]: e.target.value })}
              />
            ))}
            <Input
              placeholder="Etiquetas separadas por vírgula (ex.: negociação, SAP)"
              value={rascunho.tags.join(", ")}
              onChange={(e) =>
                setRascunho({
                  ...rascunho,
                  tags: e.target.value
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean),
                })
              }
            />
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() => mSalvar.mutate(rascunho)}
                disabled={rascunho.titulo.trim().length < 2 || mSalvar.isPending}
              >
                {mSalvar.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                Salvar
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setRascunho(null)}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {lista.isLoading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Carregando conquistas…</p>
      ) : conquistas.length === 0 ? (
        <Card className="shadow-[var(--shadow-panel)]">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Trophy className="size-8 text-muted-foreground" />
            <p className="max-w-sm text-sm text-muted-foreground">
              Nenhuma conquista ainda. Extraia do seu currículo ou escreva a primeira — elas viram
              respostas prontas em entrevistas e bullets fortes no currículo.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {conquistas.map((c) => (
            <Card key={c.id} className="shadow-[var(--shadow-panel)]">
              <CardHeader className="pb-2">
                <CardTitle className="font-display text-base leading-tight">{c.titulo}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <dl className="space-y-1.5 text-sm text-muted-foreground">
                  {(
                    [
                      ["Situação", c.situacao],
                      ["Tarefa", c.tarefa],
                      ["Ação", c.acao],
                      ["Resultado", c.resultado],
                    ] as const
                  )
                    .filter(([, v]) => v)
                    .map(([rotulo, valor]) => (
                      <div key={rotulo}>
                        <dt className="inline font-semibold text-foreground">{rotulo}: </dt>
                        <dd className="inline">{valor}</dd>
                      </div>
                    ))}
                </dl>
                {c.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {c.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded bg-secondary px-2 py-0.5 text-xs text-muted-foreground"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(textoStar(c));
                      toast.success("Conquista copiada");
                    }}
                  >
                    <Copy className="size-4" /> Copiar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      setRascunho({
                        id: c.id,
                        titulo: c.titulo,
                        situacao: c.situacao,
                        tarefa: c.tarefa,
                        acao: c.acao,
                        resultado: c.resultado,
                        tags: c.tags,
                      })
                    }
                  >
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label="Excluir conquista"
                    onClick={() => mExcluir.mutate(c.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
```

## `src/components/conta-menu.tsx`

```tsx
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
```

## `src/components/curriculo-destacado.tsx`

```tsx
import { useMemo } from "react";

export type TermoDestaque = { termo: string; tipo: "palavra" | "secao" };

function normalizarPreservandoIndices(texto: string) {
  let saida = "";
  for (const char of texto) {
    const base = char.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    saida += (base.length === 1 ? base : char).toLowerCase();
  }
  return saida.length === texto.length ? saida : texto.toLowerCase();
}

function escaparRegex(v: string) {
  return v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function variacoes(termo: string) {
  const limpo = termo.trim();
  if (!limpo) return [];
  const alvos = [limpo];
  const tokens = limpo.split(/[\s/,\-–—]+/).filter((t) => t.length >= 4);
  if (tokens.length > 1) alvos.push(...tokens);
  return alvos;
}

type Segmento = { texto: string; tipo?: TermoDestaque["tipo"]; termo?: string };

function montarSegmentos(texto: string, termos: TermoDestaque[]): Segmento[] {
  const normalizado = normalizarPreservandoIndices(texto);
  const encontrados: { inicio: number; fim: number; tipo: TermoDestaque["tipo"]; termo: string }[] = [];

  for (const { termo, tipo } of termos) {
    for (const alvo of variacoes(termo)) {
      const alvoNorm = normalizarPreservandoIndices(alvo);
      if (alvoNorm.length < 3) continue;
      const re = new RegExp(`(?<![\\p{L}\\p{N}])${escaparRegex(alvoNorm)}`, "giu");
      let m: RegExpExecArray | null;
      while ((m = re.exec(normalizado)) !== null) {
        encontrados.push({ inicio: m.index, fim: m.index + alvoNorm.length, tipo, termo });
        if (m.index === re.lastIndex) re.lastIndex++;
      }
    }
  }

  if (encontrados.length === 0) return [{ texto }];

  encontrados.sort((a, b) => a.inicio - b.inicio || b.fim - a.fim);
  const segmentos: Segmento[] = [];
  let cursor = 0;
  for (const achado of encontrados) {
    if (achado.inicio < cursor) continue;
    if (achado.inicio > cursor) segmentos.push({ texto: texto.slice(cursor, achado.inicio) });
    segmentos.push({ texto: texto.slice(achado.inicio, achado.fim), tipo: achado.tipo, termo: achado.termo });
    cursor = achado.fim;
  }
  if (cursor < texto.length) segmentos.push({ texto: texto.slice(cursor) });
  return segmentos;
}

export function CurriculoDestacado({
  texto,
  termos,
  className,
}: {
  texto: string;
  termos: TermoDestaque[];
  className?: string;
}) {
  const segmentos = useMemo(() => montarSegmentos(texto, termos), [texto, termos]);
  const totalDestaques = segmentos.filter((s) => s.tipo).length;

  return (
    <div className={className}>
      <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-foreground">
        {segmentos.map((s, i) =>
          s.tipo ? (
            <mark
              key={`${i}-${s.termo}`}
              data-destaque={s.tipo}
              title={s.tipo === "palavra" ? `Palavra-chave: ${s.termo}` : `Seção: ${s.termo}`}
              className={
                s.tipo === "palavra"
                  ? "rounded bg-accent/40 px-0.5 text-foreground"
                  : "rounded bg-primary/25 px-0.5 text-foreground underline decoration-primary/60 underline-offset-2"
              }
            >
              {s.texto}
            </mark>
          ) : (
            <span key={i}>{s.texto}</span>
          ),
        )}
      </pre>
      {totalDestaques === 0 && (
        <p className="mt-3 rounded-md border border-dashed p-3 text-xs text-muted-foreground">
          Nenhum trecho correspondente encontrado no texto — isso costuma confirmar que o termo está mesmo ausente do
          currículo.
        </p>
      )}
    </div>
  );
}
```

## `src/components/curriculo-panel.tsx`

```tsx
import { useServerFn } from "@tanstack/react-start";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  EyeOff,
  FileUp,
  Highlighter,
  Loader2,
  PlayCircle,
  Sparkles,
  Wand2,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { CompartilharDialog } from "@/components/compartilhar-dialog";
import { CurriculoDestacado, type TermoDestaque } from "@/components/curriculo-destacado";
import { CurriculoRevisadoDialog } from "@/components/curriculo-revisado-dialog";
import { GravidadeBadge } from "@/components/gravidade-badge";
import { HistoricoAnalises, type EntradaHistorico } from "@/components/historico-analises";
import { ScoreRing } from "@/components/score-ring";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { analisarCurriculo, type AtsAnalysis } from "@/lib/ats.functions";
import { CURRICULO_EXEMPLO } from "@/lib/curriculo-exemplo";
import { extrairTextoDoArquivo } from "@/lib/extrair-texto";

type Densidade = "compacta" | "confortavel";

const densidades: Record<Densidade, { header: string; conteudo: string; item: string; gap: string; gapMin: string }> = {
  compacta: { header: "pb-2", conteudo: "pt-0", item: "p-2.5", gap: "space-y-2", gapMin: "space-y-0.5" },
  confortavel: { header: "", conteudo: "", item: "p-4", gap: "space-y-4", gapMin: "space-y-2" },
};

function BotaoRestante({
  quantidade,
  aberto,
  onToggle,
}: {
  quantidade: number;
  aberto: boolean;
  onToggle: () => void;
}) {
  if (quantidade <= 0 && !aberto) return null;
  return (
    <Button variant="ghost" size="sm" className="mt-2 w-full gap-1 text-xs text-muted-foreground" onClick={onToggle}>
      {aberto ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
      {aberto ? "Mostrar só os críticos" : `Mostrar os outros ${quantidade}`}
    </Button>
  );
}


const statusEstilo: Record<string, string> = {
  ok: "text-primary",
  melhorar: "text-realce",
  ausente: "text-destructive",
};

export function CurriculoPanel({
  texto,
  setTexto,
  analise,
  setAnalise,
  historico,
  setHistorico,
}: {
  texto: string;
  setTexto: (v: string) => void;
  analise: AtsAnalysis | null;
  setAnalise: (v: AtsAnalysis | null) => void;
  historico: EntradaHistorico[];
  setHistorico: (v: EntradaHistorico[]) => void;
}) {
  const analisar = useServerFn(analisarCurriculo);
  const [carregando, setCarregando] = useState(false);
  const [lendoArquivo, setLendoArquivo] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const cartaoCurriculoRef = useRef<HTMLDivElement>(null);

  const [densidade, setDensidade] = useState<Densidade>("confortavel");
  const [somenteCriticos, setSomenteCriticos] = useState(true);
  const [destaque, setDestaque] = useState<TermoDestaque[]>([]);
  const [expandido, setExpandido] = useState({
    problemas: false,
    palavras: false,
    secoes: false,
    reescritas: false,
  });

  const d = densidades[densidade];

  function alternar(chave: keyof typeof expandido) {
    setExpandido((prev) => ({ ...prev, [chave]: !prev[chave] }));
  }

  function destacarTermos(termos: TermoDestaque[]) {
    setDestaque(termos);
    cartaoCurriculoRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const problemasTodos = analise?.problemasAts ?? [];
  const palavrasTodas = analise?.palavrasChaveFaltando ?? [];
  const secoesTodas = analise?.secoes ?? [];
  const reescritasTodas = analise?.reescritas ?? [];

  const filtrar = somenteCriticos;
  const problemasVisiveis =
    filtrar && !expandido.problemas
      ? problemasTodos.filter((p) => p.gravidade === "alta").length > 0
        ? problemasTodos.filter((p) => p.gravidade === "alta")
        : problemasTodos.slice(0, 2)
      : problemasTodos;
  const palavrasVisiveis = filtrar && !expandido.palavras ? palavrasTodas.slice(0, 8) : palavrasTodas;
  const secoesVisiveis =
    filtrar && !expandido.secoes ? secoesTodas.filter((s) => s.status !== "ok") : secoesTodas;
  const reescritasVisiveis = filtrar && !expandido.reescritas ? reescritasTodas.slice(0, 2) : reescritasTodas;




  async function aoEscolherArquivo(file: File | undefined) {
    if (!file) return;
    setLendoArquivo(true);
    try {
      const conteudo = await extrairTextoDoArquivo(file);
      if (conteudo.length < 50) throw new Error("Não consegui ler texto suficiente. O arquivo pode ser digitalizado.");
      setTexto(conteudo);
      toast.success(`Currículo carregado (${conteudo.length.toLocaleString("pt-BR")} caracteres).`);
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível ler o arquivo.");
    } finally {
      setLendoArquivo(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function rodarAnalise() {
    if (texto.trim().length < 50) {
      toast.error("Cole ou envie um currículo com mais conteúdo.");
      return;
    }
    setCarregando(true);
    try {
      const resultado = await analisar({ data: { texto: texto.trim().slice(0, 30000) } });
      setAnalise(resultado);
      setHistorico(
        [
          {
            id: crypto.randomUUID(),
            criadaEm: new Date().toISOString(),
            score: resultado.score,
            resumo: resultado.resumo,
            problemas: resultado.problemasAts.length,
          },
          ...historico,
        ].slice(0, 8),
      );
      toast.success("Análise concluída.");

    } catch {
      toast.error("Não foi possível analisar agora. Tente novamente em instantes.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      <Card ref={cartaoCurriculoRef} className="h-fit shadow-[var(--shadow-panel)]">
        <CardHeader>
          <CardTitle className="font-display text-lg">Seu currículo</CardTitle>
          <p className="text-sm text-muted-foreground">
            Envie um PDF, DOCX ou TXT — ou cole o texto. Tudo fica salvo apenas neste navegador.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.docx,.txt,.md"
            className="hidden"
            onChange={(e) => void aoEscolherArquivo(e.target.files?.[0])}
          />
          {destaque.length === 0 && (
            <Button
              variant="outline"
              className="h-24 w-full border-dashed"
              onClick={() => inputRef.current?.click()}
              disabled={lendoArquivo}
            >
              {lendoArquivo ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <span className="flex flex-col items-center gap-1">
                  <FileUp className="size-5" />
                  <span className="text-sm font-medium">Enviar arquivo do currículo</span>
                  <span className="text-xs text-muted-foreground">PDF, DOCX ou TXT</span>
                </span>
              )}
            </Button>
          )}

          {destaque.length > 0 ? (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-secondary/40 px-2 py-1.5">
                <span className="flex items-center gap-1.5 text-xs font-medium">
                  <Highlighter className="size-3.5 text-primary" />
                  Destacando: {destaque.map((t) => t.termo).slice(0, 3).join(", ")}
                  {destaque.length > 3 && ` +${destaque.length - 3}`}
                </span>
                <Button variant="ghost" size="sm" className="h-6 gap-1 text-xs" onClick={() => setDestaque([])}>
                  <EyeOff className="size-3" />
                  Sair do modo destaque
                </Button>
              </div>
              <CurriculoDestacado
                texto={texto}
                termos={destaque}
                className="max-h-96 overflow-y-auto rounded-md border bg-background p-3"
              />
            </div>
          ) : (
            <Textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Ou cole aqui o conteúdo do seu currículo…"
              className="min-h-64 resize-y font-mono text-xs leading-relaxed"
            />
          )}


          {texto.trim().length < 50 && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full gap-2 text-muted-foreground"
              onClick={() => {
                setTexto(CURRICULO_EXEMPLO);
                toast.info("Currículo de exemplo carregado — clique em Analisar para ATS.");
              }}
            >
              <PlayCircle className="size-4" />
              Testar com um currículo de exemplo
            </Button>
          )}

          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">
              {texto.trim() ? `${texto.trim().length.toLocaleString("pt-BR")} caracteres` : "Nenhum currículo ainda"}
            </span>
            <Button onClick={() => void rodarAnalise()} disabled={carregando}>
              {carregando ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              {carregando ? "Analisando…" : "Analisar para ATS"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <HistoricoAnalises historico={historico} setHistorico={setHistorico} />
        {!analise ? (
          <Card className="flex h-full min-h-80 items-center justify-center border-dashed shadow-none">
            <CardContent className="max-w-sm py-12 text-center">
              <Wand2 className="mx-auto size-6 text-muted-foreground" />
              <p className="mt-3 font-display text-base font-semibold">Nenhuma análise ainda</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Depois de carregar o currículo, mostramos a nota ATS, os pontos que travam robôs de triagem e
                reescritas prontas.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>

            <Card className="shadow-[var(--shadow-panel)]">
              <CardContent className="flex flex-col items-center gap-6 pt-6 sm:flex-row sm:items-start">
                <ScoreRing valor={analise.score} legenda="Nota ATS" />
                <div className="flex-1 space-y-3">
                  <p className="text-sm leading-relaxed text-foreground">{analise.resumo}</p>
                  {analise.pontosFortes.length > 0 && (
                    <ul className="space-y-1">
                      {analise.pontosFortes.map((p) => (
                        <li key={p} className="flex gap-2 text-sm text-muted-foreground">
                          <span className="text-primary">✓</span>
                          {p}
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="flex flex-wrap items-center gap-2">
                    <CurriculoRevisadoDialog texto={texto} analise={analise} />
                    <CompartilharDialog
                      analise={analise}
                      scoreAntes={historico.length > 1 ? historico[historico.length - 1]!.score : null}
                    />
                  </div>

                </div>
              </CardContent>
            </Card>


            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-secondary/30 px-3 py-2">
              <label className="flex cursor-pointer items-center gap-2 text-xs font-medium">
                <Switch checked={somenteCriticos} onCheckedChange={setSomenteCriticos} />
                Só itens críticos
              </label>
              <div className="flex items-center gap-2">
                {destaque.length > 0 && (
                  <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => setDestaque([])}>
                    <EyeOff className="size-3.5" />
                    Limpar destaques
                  </Button>
                )}
                <ToggleGroup
                  type="single"
                  value={densidade}
                  onValueChange={(v) => v && setDensidade(v as Densidade)}
                  className="rounded-md border bg-background"
                >
                  <ToggleGroupItem value="compacta" className="h-7 px-2 text-xs" aria-label="Densidade compacta">
                    Compacta
                  </ToggleGroupItem>
                  <ToggleGroupItem value="confortavel" className="h-7 px-2 text-xs" aria-label="Densidade confortável">
                    Confortável
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>

            <Tabs
              defaultValue={
                analise.problemasAts.length > 0
                  ? "problemas"
                  : analise.palavrasChaveFaltando.length > 0
                    ? "palavras"
                    : analise.secoes.length > 0
                      ? "secoes"
                      : "reescritas"
              }
              className="w-full"
            >
              <TabsList className="grid h-auto w-full grid-cols-2 gap-1 sm:grid-cols-4">
                <TabsTrigger value="problemas" className="text-xs">
                  Travas ATS
                  {analise.problemasAts.length > 0 && (
                    <span className="ml-1.5 rounded bg-accent/25 px-1 text-[10px]">
                      {analise.problemasAts.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="palavras" className="text-xs">
                  Palavras-chave
                  {analise.palavrasChaveFaltando.length > 0 && (
                    <span className="ml-1.5 rounded bg-accent/25 px-1 text-[10px]">
                      {analise.palavrasChaveFaltando.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="secoes" className="text-xs">
                  Seções
                  {analise.secoes.length > 0 && (
                    <span className="ml-1.5 rounded bg-accent/25 px-1 text-[10px]">{analise.secoes.length}</span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="reescritas" className="text-xs">
                  Reescritas
                  {analise.reescritas.length > 0 && (
                    <span className="ml-1.5 rounded bg-accent/25 px-1 text-[10px]">
                      {analise.reescritas.length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="problemas" className="mt-4">
                <Card className="shadow-[var(--shadow-panel)]">
                  <CardHeader className={d.header}>
                    <CardTitle className="flex items-center gap-2 font-display text-base">
                      <AlertTriangle className="size-4 text-accent" />O que trava o robô de triagem
                    </CardTitle>
                  </CardHeader>
                  <CardContent className={`max-h-[26rem] overflow-y-auto ${d.conteudo} ${d.gap}`}>
                    {analise.problemasAts.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nenhuma trava relevante encontrada.</p>
                    ) : (
                      <>
                        {problemasVisiveis.map((problema) => (
                          <div key={problema.titulo} className={`rounded-lg border bg-secondary/40 ${d.item}`}>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-semibold">{problema.titulo}</span>
                              <GravidadeBadge nivel={problema.gravidade} />
                              <button
                                type="button"
                                onClick={() => destacarTermos([{ termo: problema.titulo, tipo: "secao" }])}
                                className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                              >
                                <Highlighter className="size-3" />
                                Ver no currículo
                              </button>
                            </div>
                            {densidade === "confortavel" && (
                              <p className="mt-2 text-sm text-muted-foreground">{problema.explicacao}</p>
                            )}
                            <p className={densidade === "compacta" ? "mt-1 text-xs" : "mt-2 text-sm"}>
                              <span className="font-medium">Como corrigir: </span>
                              {problema.comoCorrigir}
                            </p>
                          </div>
                        ))}
                        <BotaoRestante
                          quantidade={analise.problemasAts.length - problemasVisiveis.length}
                          aberto={expandido.problemas}
                          onToggle={() => alternar("problemas")}
                        />
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="palavras" className="mt-4">
                <Card className="shadow-[var(--shadow-panel)]">
                  <CardHeader className={d.header}>
                    <CardTitle className="flex flex-wrap items-center justify-between gap-2 font-display text-base">
                      Palavras-chave ausentes
                      {analise.palavrasChaveFaltando.length > 0 && (
                        <button
                          type="button"
                          onClick={() =>
                            destacarTermos(
                              analise.palavrasChaveFaltando.map((k) => ({ termo: k, tipo: "palavra" as const })),
                            )
                          }
                          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                        >
                          <Highlighter className="size-3" />
                          Destacar todas
                        </button>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className={`max-h-[26rem] overflow-y-auto ${d.conteudo}`}>
                    {analise.palavrasChaveFaltando.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nenhuma palavra-chave crítica faltando.</p>
                    ) : (
                      <>
                        <div className={densidade === "compacta" ? "flex flex-wrap gap-1.5" : "flex flex-wrap gap-2"}>
                          {palavrasVisiveis.map((k) => (
                            <button
                              key={k}
                              type="button"
                              onClick={() => destacarTermos([{ termo: k, tipo: "palavra" }])}
                              className={`rounded-md bg-realce/20 font-medium transition hover:bg-realce/35 ${
                                densidade === "compacta" ? "px-1.5 py-0.5 text-[11px]" : "px-2 py-1 text-xs"
                              } ${destaque.some((t) => t.termo === k) ? "ring-1 ring-primary" : ""}`}
                            >
                              {k}
                            </button>
                          ))}
                        </div>
                        <BotaoRestante
                          quantidade={analise.palavrasChaveFaltando.length - palavrasVisiveis.length}
                          aberto={expandido.palavras}
                          onToggle={() => alternar("palavras")}
                        />
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="secoes" className="mt-4">
                <Card className="shadow-[var(--shadow-panel)]">
                  <CardHeader className={d.header}>
                    <CardTitle className="font-display text-base">Estrutura das seções</CardTitle>
                  </CardHeader>
                  <CardContent className={`max-h-[26rem] overflow-y-auto ${d.conteudo} ${d.gapMin}`}>
                    {analise.secoes.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Sem avaliação de seções nesta análise.</p>
                    ) : (
                      <>
                        {secoesVisiveis.map((s) => (
                          <button
                            key={s.nome}
                            type="button"
                            onClick={() => destacarTermos([{ termo: s.nome, tipo: "secao" }])}
                            className={`block w-full rounded-md text-left transition hover:bg-secondary/60 ${
                              densidade === "compacta" ? "px-2 py-1 text-xs" : "px-2 py-1.5 text-sm"
                            }`}
                          >
                            <span className={`font-medium ${statusEstilo[s.status]}`}>{s.nome}</span>
                            <span className="text-muted-foreground"> — {s.nota}</span>
                          </button>
                        ))}
                        <BotaoRestante
                          quantidade={analise.secoes.length - secoesVisiveis.length}
                          aberto={expandido.secoes}
                          onToggle={() => alternar("secoes")}
                        />
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reescritas" className="mt-4">
                <Card className="shadow-[var(--shadow-panel)]">
                  <CardHeader className={d.header}>
                    <CardTitle className="font-display text-base">Reescritas sugeridas</CardTitle>
                  </CardHeader>
                  <CardContent className={`max-h-[26rem] overflow-y-auto ${d.conteudo} ${d.gap}`}>
                    {analise.reescritas.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nenhuma reescrita sugerida.</p>
                    ) : (
                      <>
                        {reescritasVisiveis.map((r) => (
                          <div key={r.original} className={`space-y-1.5 rounded-lg border ${d.item}`}>
                            <div className="flex items-start justify-between gap-2">
                              <p
                                className={`text-muted-foreground line-through ${
                                  densidade === "compacta" ? "line-clamp-2 text-xs" : "text-sm"
                                }`}
                              >
                                {r.original}
                              </p>
                              <button
                                type="button"
                                onClick={() => destacarTermos([{ termo: r.original, tipo: "secao" }])}
                                className="shrink-0 text-xs font-medium text-primary hover:underline"
                              >
                                Ver no currículo
                              </button>
                            </div>
                            <p className={`font-medium text-foreground ${densidade === "compacta" ? "text-xs" : "text-sm"}`}>
                              {r.sugerida}
                            </p>
                          </div>
                        ))}
                        <BotaoRestante
                          quantidade={analise.reescritas.length - reescritasVisiveis.length}
                          aberto={expandido.reescritas}
                          onToggle={() => alternar("reescritas")}
                        />
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>


          </>
        )}
      </div>
    </div>
  );
}
```

## `src/components/curriculo-previa.tsx`

```tsx
import { estruturar } from "@/lib/exportar-curriculo";

/** Renderiza o currículo já formatado, como ele sairá no PDF/DOCX. */
export function CurriculoPrevia({ texto }: { texto: string }) {
  const blocos = estruturar(texto);

  return (
    <div className="space-y-1 rounded-lg border bg-background p-6 shadow-sm">
      {blocos.map((b, i) => {
        if (b.tipo === "titulo")
          return (
            <h4 key={i} className="font-display text-lg font-bold">
              {b.texto}
            </h4>
          );
        if (b.tipo === "secao")
          return (
            <h5
              key={i}
              className="mt-4 border-b pb-1 text-xs font-semibold tracking-[0.14em] uppercase"
            >
              {b.texto}
            </h5>
          );
        if (b.tipo === "bullet")
          return (
            <p key={i} className="flex gap-2 text-sm leading-relaxed">
              <span className="text-muted-foreground">•</span>
              <span>{b.texto}</span>
            </p>
          );
        return (
          <p key={i} className="text-sm leading-relaxed">
            {b.texto}
          </p>
        );
      })}
    </div>
  );
}
```

## `src/components/curriculo-revisado-dialog.tsx`

```tsx
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
```

## `src/components/curriculo-vaga-dialog.tsx`

```tsx
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
```

## `src/components/cursos-panel.tsx`

```tsx
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, GraduationCap, Loader2, Plus, Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import {
  aplicarCursoNoCurriculo,
  excluirCurso,
  listarCursos,
  marcarCursoAplicado,
  salvarCurso,
  type CurriculoComCurso,
  type Curso,
} from "@/lib/cursos.functions";
import { concluirItensPorTexto } from "@/lib/roadmap.functions";

type Rascunho = {
  nome: string;
  instituicao: string;
  carga_horaria: string;
  concluido_em: string;
  link: string;
  aprendizados: string;
};

const VAZIO: Rascunho = {
  nome: "",
  instituicao: "",
  carga_horaria: "",
  concluido_em: "",
  link: "",
  aprendizados: "",
};

/** Registra cursos concluídos e devolve o currículo já atualizado com eles. */
export function CursosPanel({
  curriculo,
  setCurriculo,
}: {
  curriculo: string;
  setCurriculo: (v: string) => void;
}) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const buscar = useServerFn(listarCursos);
  const salvar = useServerFn(salvarCurso);
  const excluir = useServerFn(excluirCurso);
  const aplicar = useServerFn(aplicarCursoNoCurriculo);
  const marcar = useServerFn(marcarCursoAplicado);
  const concluirTrilha = useServerFn(concluirItensPorTexto);

  const [rascunho, setRascunho] = useState<Rascunho>({ ...VAZIO });
  const [previa, setPrevia] = useState<{ curso: Curso; resultado: CurriculoComCurso } | null>(null);

  const lista = useQuery({
    queryKey: ["cursos", user?.id],
    queryFn: () => buscar(),
    enabled: Boolean(user),
  });

  const mAplicar = useMutation({
    mutationFn: async (dados: Rascunho) => {
      const curso = await salvar({ data: dados });
      const resultado = await aplicar({ data: { curriculo, curso: dados } });
      return { curso, resultado };
    },
    onSuccess: (dados) => {
      setPrevia(dados);
      setRascunho({ ...VAZIO });
      qc.invalidateQueries({ queryKey: ["cursos", user?.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const mReaplicar = useMutation({
    mutationFn: async (curso: Curso) => {
      const resultado = await aplicar({
        data: {
          curriculo,
          curso: {
            nome: curso.nome,
            instituicao: curso.instituicao,
            carga_horaria: curso.carga_horaria,
            concluido_em: curso.concluido_em,
            link: curso.link,
            aprendizados: curso.aprendizados,
          },
        },
      });
      return { curso, resultado };
    },
    onSuccess: (dados) => setPrevia(dados),
    onError: (e: Error) => toast.error(e.message),
  });

  const mExcluir = useMutation({
    mutationFn: (id: string) => excluir({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cursos", user?.id] }),
    onError: (e: Error) => toast.error(e.message),
  });

  async function aceitar() {
    if (!previa) return;
    setCurriculo(previa.resultado.curriculo);
    await marcar({ data: { id: previa.curso.id } }).catch(() => null);
    const marcados = await concluirTrilha({
      data: { texto: `${previa.curso.nome} ${previa.curso.aprendizados}`.slice(0, 3000) },
    }).catch(() => 0);
    toast.success(
      marcados
        ? `Currículo atualizado e ${marcados} item(ns) da trilha concluído(s)`
        : "Currículo atualizado com o curso",
    );
    setPrevia(null);
    qc.invalidateQueries({ queryKey: ["cursos", user?.id] });
    qc.invalidateQueries({ queryKey: ["roadmap", user?.id] });
  }

  if (!user) {
    return (
      <Card className="shadow-[var(--shadow-panel)]">
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <GraduationCap className="size-8 text-muted-foreground" />
          <p className="max-w-sm text-sm text-muted-foreground">
            Entre na sua conta para registrar cursos concluídos e atualizar o currículo
            automaticamente.
          </p>
        </CardContent>
      </Card>
    );
  }

  const cursos = lista.data ?? [];
  const semCurriculo = curriculo.trim().length < 50;

  return (
    <div className="space-y-4">
      <Card className="shadow-[var(--shadow-panel)]">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-base">Registrar curso concluído</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              placeholder="Nome do curso"
              value={rascunho.nome}
              onChange={(e) => setRascunho({ ...rascunho, nome: e.target.value })}
            />
            <Input
              placeholder="Instituição"
              value={rascunho.instituicao}
              onChange={(e) => setRascunho({ ...rascunho, instituicao: e.target.value })}
            />
            <Input
              placeholder="Carga horária (ex.: 40h)"
              value={rascunho.carga_horaria}
              onChange={(e) => setRascunho({ ...rascunho, carga_horaria: e.target.value })}
            />
            <Input
              placeholder="Conclusão (MM/AAAA)"
              value={rascunho.concluido_em}
              onChange={(e) => setRascunho({ ...rascunho, concluido_em: e.target.value })}
            />
          </div>
          <Input
            placeholder="Link do certificado (opcional)"
            value={rascunho.link}
            onChange={(e) => setRascunho({ ...rascunho, link: e.target.value })}
          />
          <Textarea
            rows={2}
            placeholder="O que você aprendeu na prática (opcional) — ajuda a reforçar competências"
            value={rascunho.aprendizados}
            onChange={(e) => setRascunho({ ...rascunho, aprendizados: e.target.value })}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => mAplicar.mutate(rascunho)}
              disabled={rascunho.nome.trim().length < 2 || semCurriculo || mAplicar.isPending}
              className="max-sm:w-full"
            >
              {mAplicar.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Sparkles className="size-4" />
              )}
              Atualizar currículo com este curso
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setRascunho({ ...VAZIO })}
              className="max-sm:w-full"
            >
              <Plus className="size-4" /> Limpar campos
            </Button>
          </div>
          {semCurriculo ? (
            <p className="text-xs text-muted-foreground">
              Cole seu currículo na aba Currículo para poder atualizá-lo com o curso.
            </p>
          ) : null}
        </CardContent>
      </Card>

      {previa ? (
        <Card className="shadow-[var(--shadow-panel)]">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base">
              Prévia — currículo com “{previa.curso.nome}”
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {previa.resultado.mudancas.length ? (
              <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {previa.resultado.mudancas.map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            ) : null}
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Antes</p>
                <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-md border border-border bg-muted/40 p-3 text-xs">
                  {curriculo}
                </pre>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Depois</p>
                <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-md border border-primary/40 bg-primary/5 p-3 text-xs">
                  {previa.resultado.curriculo}
                </pre>
              </div>
            </div>
            {previa.resultado.observacoes.length ? (
              <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                {previa.resultado.observacoes.map((o, i) => (
                  <li key={i}>{o}</li>
                ))}
              </ul>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => void aceitar()}>
                <Check className="size-4" /> Usar este currículo
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setPrevia(null)}>
                Descartar
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {lista.isLoading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Carregando cursos…</p>
      ) : cursos.length === 0 ? (
        <Card className="shadow-[var(--shadow-panel)]">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <GraduationCap className="size-8 text-muted-foreground" />
            <p className="max-w-sm text-sm text-muted-foreground">
              Nenhum curso registrado ainda. Ao terminar um curso, preencha o formulário acima e o
              currículo já sai atualizado.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {cursos.map((c) => (
            <Card key={c.id} className="shadow-[var(--shadow-panel)]">
              <CardHeader className="pb-2">
                <CardTitle className="font-display text-base leading-tight">{c.nome}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p className="numeros text-xs">
                  {[c.instituicao, c.carga_horaria, c.concluido_em].filter(Boolean).join(" • ")}
                </p>
                {c.aprendizados ? <p>{c.aprendizados}</p> : null}
                <div className="flex flex-wrap items-center gap-2">
                  {c.aplicado_em_curriculo ? (
                    <span className="rounded-full bg-primary/12 px-2 py-0.5 text-xs text-primary">
                      Já no currículo
                    </span>
                  ) : null}
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={semCurriculo || mReaplicar.isPending}
                    onClick={() => mReaplicar.mutate(c)}
                  >
                    {mReaplicar.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Sparkles className="size-4" />
                    )}
                    Aplicar no currículo
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label="Remover curso"
                    onClick={() => mExcluir.mutate(c.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
```

## `src/components/extensao-card.tsx`

```tsx
import { Chrome, Download } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const passos = [
  "Descompacte o arquivo baixado.",
  "Abra chrome://extensions no Chrome, Edge, Brave ou Opera.",
  "Ative o Modo do desenvolvedor no canto superior direito.",
  "Clique em Carregar sem compactação e escolha a pasta descompactada.",
  "Abra uma vaga no LinkedIn, clique no ícone da extensão e cole seu currículo uma vez.",
];

export function ExtensaoCard() {
  function baixar() {
    fetch("/cv-radar-extensao.zip")
      .then((res) => {
        if (!res.ok) throw new Error(`Download falhou: ${res.status}`);
        return res.blob();
      })
      .then((blob) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "cv-radar-extensao.zip";
        a.click();
        URL.revokeObjectURL(a.href);
      })
      .catch((e) => toast.error(e.message));
  }

  return (
    <Card className="shadow-[var(--shadow-panel)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display text-base">
          <Chrome className="size-4" />
          Extensão para vagas no navegador
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Com a vaga aberta (LinkedIn, Gupy, Indeed e outros sites), a extensão lê o anúncio e mostra na hora sua
          compatibilidade, as lacunas e uma carta de apresentação — o clique em candidatar-se continua sendo seu. Se
          algum site bloquear a leitura, dá para colar a descrição direto na extensão. Versão 1.1: se você já tinha a
          extensão instalada, baixe de novo e recarregue em <code>chrome://extensions</code>.
        </p>

      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={baixar} className="gap-2">
          <Download className="size-4" />
          Baixar extensão (.zip)
        </Button>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
          {passos.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
```

## `src/components/game-panel.tsx`

```tsx
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Check,
  Flame,
  GraduationCap,
  Loader2,
  Lock,
  Map as MapIcon,
  RefreshCw,
  Sparkles,
  Star,
  Trophy,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { avaliarResposta, gerarMapaQuest, gerarPergunta } from "@/lib/game.functions";
import type { Avaliacao, FaseQuest, Pergunta, TrilhaQuest } from "@/lib/game.schemas";
import { useAssinatura } from "@/lib/use-assinatura";
import { useLocalState } from "@/lib/use-local-state";
import { cn } from "@/lib/utils";

type Placar = { pontos: number; acertos: number; rodadas: number; sequencia: number };

const PLACAR_INICIAL: Placar = { pontos: 0, acertos: 0, rodadas: 0, sequencia: 0 };

const PERGUNTAS_POR_FASE = 3;

const ROTULO_NIVEL: Record<FaseQuest["nivel"], string> = {
  iniciante: "Básico",
  intermediario: "Intermediário",
  avancado: "Avançado",
};

export function GamePanel() {
  const [placar, setPlacar] = useLocalState<Placar>("eupasso:game-placar", PLACAR_INICIAL);
  const [trilhas, setTrilhas] = useLocalState<TrilhaQuest[]>("eupasso:quest-trilhas", []);
  const [progresso, setProgresso] = useLocalState<Record<string, number>>(
    "eupasso:quest-progresso",
    {},
  );
  const { temAcessoA, carregando: carregandoAssinatura } = useAssinatura();
  const ativa = temAcessoA("quest");

  const [trilhaAtiva, setTrilhaAtiva] = useState<number | null>(null);
  const [montando, setMontando] = useState(false);
  const [faseAtiva, setFaseAtiva] = useState<number | null>(null);
  const [pergunta, setPergunta] = useState<Pergunta | null>(null);
  const [historico, setHistorico] = useState<string[]>([]);
  const [rodadaFase, setRodadaFase] = useState(0);
  const [acertosFase, setAcertosFase] = useState(0);
  const [escolha, setEscolha] = useState<number | null>(null);
  const [texto, setTexto] = useState("");
  const [avaliacao, setAvaliacao] = useState<Avaliacao | null>(null);
  const [revelado, setRevelado] = useState(false);
  const [dica, setDica] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const trilha = trilhaAtiva !== null ? (trilhas[trilhaAtiva] ?? null) : null;
  const fases: FaseQuest[] = trilha?.fases ?? [];
  const chaveTrilha = trilha ? trilha.ferramenta : "";
  const concluidas = chaveTrilha ? (progresso[chaveTrilha] ?? 0) : 0;

  useEffect(() => {
    if (faseAtiva !== null && fases[faseAtiva] && !pergunta && !carregando) {
      void proximaPergunta(faseAtiva);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [faseAtiva]);

  async function montarMapa() {
    setMontando(true);
    try {
      const mapa = await gerarMapaQuest();
      setTrilhas(mapa.trilhas);
      setProgresso({});
      setTrilhaAtiva(null);
      setFaseAtiva(null);
      toast.success("Trilhas montadas a partir do seu currículo.");
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível montar as trilhas.");
    } finally {
      setMontando(false);
    }
  }

  function limparRodada() {
    setPergunta(null);
    setAvaliacao(null);
    setRevelado(false);
    setDica(false);
    setEscolha(null);
    setTexto("");
  }

  async function proximaPergunta(indice: number) {
    const fase = fases[indice];
    if (!fase) return;
    setCarregando(true);
    limparRodada();
    try {
      const nova = await gerarPergunta({
        data: {
          tema: fase.ferramenta,
          foco: fase.foco,
          nivel: fase.nivel,
          evitar: historico.slice(-8),
        },
      });
      setPergunta(nova);
      setHistorico((h) => [...h, nova.enunciado]);
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível criar a pergunta.");
    } finally {
      setCarregando(false);
    }
  }

  function registrar(pontos: number, acertou: boolean) {
    setPlacar({
      pontos: placar.pontos + pontos,
      acertos: placar.acertos + (acertou ? 1 : 0),
      rodadas: placar.rodadas + 1,
      sequencia: acertou ? placar.sequencia + 1 : 0,
    });
    setRodadaFase((r) => r + 1);
    if (acertou) setAcertosFase((a) => a + 1);
  }

  function responderObjetiva(indice: number) {
    if (revelado || !pergunta) return;
    setEscolha(indice);
    setRevelado(true);
    registrar(indice === pergunta.indiceCorreto ? 10 : 0, indice === pergunta.indiceCorreto);
  }

  async function responderSubjetiva() {
    if (!pergunta || faseAtiva === null || texto.trim().length < 5) {
      toast.info("Escreva sua resposta antes de enviar.");
      return;
    }
    setEnviando(true);
    try {
      const resultado = await avaliarResposta({
        data: {
          tema: fases[faseAtiva]?.ferramenta ?? "",
          enunciado: pergunta.enunciado,
          resposta: texto.trim(),
        },
      });
      setAvaliacao(resultado);
      setRevelado(true);
      registrar(Math.round(resultado.pontos / 10), resultado.acertou);
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível avaliar a resposta.");
    } finally {
      setEnviando(false);
    }
  }

  function encerrarFase() {
    if (faseAtiva === null) return;
    const passou = acertosFase >= 2;
    if (passou && faseAtiva === concluidas && chaveTrilha) {
      setProgresso({ ...progresso, [chaveTrilha]: concluidas + 1 });
      toast.success("Fase concluída! Próxima fase liberada.");
    } else if (!passou) {
      toast.info("Faltou pouco — tente a fase novamente.");
    }
    setFaseAtiva(null);
    setRodadaFase(0);
    setAcertosFase(0);
    limparRodada();
  }

  const aproveitamento = placar.rodadas ? Math.round((placar.acertos / placar.rodadas) * 100) : 0;
  const fase = faseAtiva !== null ? fases[faseAtiva] : null;

  if (!ativa && !carregandoAssinatura) {
    return (
      <Card className="border-primary/40 bg-primary/5">
        <CardContent className="flex flex-col items-start gap-3 py-8">
          <p className="flex items-center gap-2 font-display text-lg font-semibold">
            <Lock className="size-4 text-primary" /> Quest disponível no plano Pro
          </p>
          <p className="max-w-xl text-sm text-muted-foreground">
            Trilhas separadas por conhecimento do seu currículo, com fases do básico ao avançado e
            perguntas sorteadas pela IA. A partir de R$ 10 por mês.
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
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <Trophy className="size-5 shrink-0 text-primary" />
            <div>
              <p className="font-display text-xl font-semibold tabular-nums">{placar.pontos}</p>
              <p className="text-xs text-muted-foreground">Pontos acumulados</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <Check className="size-5 shrink-0 text-primary" />
            <div>
              <p className="font-display text-xl font-semibold tabular-nums">{aproveitamento}%</p>
              <p className="text-xs text-muted-foreground">
                {placar.acertos} acertos em {placar.rodadas} perguntas
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <Flame className="size-5 shrink-0 text-primary" />
            <div>
              <p className="font-display text-xl font-semibold tabular-nums">{placar.sequencia}</p>
              <p className="text-xs text-muted-foreground">Sequência de acertos</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {trilhas.length === 0 ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 font-display text-base">
              <MapIcon className="size-4 text-primary" /> Suas trilhas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Cada conhecimento do seu currículo vira uma trilha própria, com fases do básico ao
              avançado. As perguntas vêm sorteadas — você não escolhe o formato.
            </p>
            <Button onClick={() => void montarMapa()} disabled={montando}>
              {montando ? <Loader2 className="size-4 animate-spin" /> : null}
              Montar trilhas com meu currículo
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {trilhas.length > 0 && trilhaAtiva === null ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
            <CardTitle className="flex items-center gap-2 font-display text-base">
              <MapIcon className="size-4 text-primary" /> Trilhas de conhecimento
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => void montarMapa()} disabled={montando}>
              {montando ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RefreshCw className="size-4" />
              )}
              Refazer trilhas
            </Button>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {trilhas.map((t, i) => {
              const feitas = progresso[t.ferramenta] ?? 0;
              const total = t.fases.length;
              const pct = Math.round((feitas / total) * 100);
              return (
                <button
                  key={`${t.ferramenta}-${i}`}
                  type="button"
                  onClick={() => {
                    setTrilhaAtiva(i);
                    setFaseAtiva(null);
                  }}
                  className="rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:border-primary hover:bg-primary/5"
                >
                  <p className="font-display text-sm font-semibold">{t.ferramenta}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{t.resumo}</p>
                  <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {feitas}/{total} fases concluídas
                  </p>
                </button>
              );
            })}
          </CardContent>
        </Card>
      ) : null}

      {trilha && faseAtiva === null ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
            <CardTitle className="flex items-center gap-2 font-display text-base">
              <MapIcon className="size-4 text-primary" /> {trilha.ferramenta}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setTrilhaAtiva(null)}>
              <ArrowLeft className="size-4" /> Trilhas
            </Button>
          </CardHeader>
          <CardContent>
            <ol className="relative mx-auto flex max-w-md flex-col gap-3">
              {fases.map((f, i) => {
                const concluida = i < concluidas;
                const liberada = i <= concluidas;
                const alinhamento = i % 2 === 0 ? "self-start" : "self-end";
                return (
                  <li key={`${f.ferramenta}-${i}`} className={cn("w-[85%]", alinhamento)}>
                    <button
                      type="button"
                      disabled={!liberada}
                      onClick={() => {
                        setFaseAtiva(i);
                        setRodadaFase(0);
                        setAcertosFase(0);
                      }}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-colors",
                        concluida
                          ? "border-primary/40 bg-primary/10"
                          : liberada
                            ? "border-primary bg-card shadow-sm hover:bg-primary/10"
                            : "border-dashed border-border bg-muted/40 opacity-70",
                      )}
                    >
                      <span
                        className={cn(
                          "grid size-10 shrink-0 place-items-center rounded-full text-sm font-bold",
                          concluida
                            ? "bg-primary text-primary-foreground"
                            : liberada
                              ? "bg-primary/15 text-primary"
                              : "bg-muted text-muted-foreground",
                        )}
                      >
                        {concluida ? (
                          <Star className="size-5 fill-current" />
                        ) : liberada ? (
                          i + 1
                        ) : (
                          <Lock className="size-4" />
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-display text-sm font-semibold">
                          {f.titulo}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {f.ferramenta} · {ROTULO_NIVEL[f.nivel]}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </CardContent>
        </Card>
      ) : null}

      {fase ? (
        <Card>
          <CardHeader className="pb-3">
            <p className="text-xs font-medium text-muted-foreground">
              Fase {(faseAtiva ?? 0) + 1} · {fase.ferramenta} · {ROTULO_NIVEL[fase.nivel]} ·
              pergunta {Math.min(rodadaFase + 1, PERGUNTAS_POR_FASE)}/{PERGUNTAS_POR_FASE}
            </p>
            <CardTitle className="font-display text-base leading-snug">
              {carregando ? "Sorteando a pergunta…" : (pergunta?.enunciado ?? fase.titulo)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {carregando ? (
              <p className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Preparando…
              </p>
            ) : null}

            {pergunta && !carregando ? (
              <>
                {pergunta.tipo === "objetiva" ? (
                  <div className="grid grid-cols-1 gap-2">
                    {pergunta.alternativas.map((alt, i) => {
                      const correta = revelado && i === pergunta.indiceCorreto;
                      const errada = revelado && i === escolha && i !== pergunta.indiceCorreto;
                      return (
                        <button
                          key={alt}
                          type="button"
                          disabled={revelado}
                          onClick={() => responderObjetiva(i)}
                          className={cn(
                            "flex items-start gap-2 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors",
                            correta
                              ? "border-primary bg-primary/10"
                              : errada
                                ? "border-destructive bg-destructive/10"
                                : "border-border hover:border-primary hover:bg-primary/5",
                          )}
                        >
                          {correta ? (
                            <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                          ) : errada ? (
                            <X className="mt-0.5 size-4 shrink-0 text-destructive" />
                          ) : (
                            <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border text-[0.6rem]">
                              {String.fromCharCode(65 + i)}
                            </span>
                          )}
                          <span>{alt}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Textarea
                      value={texto}
                      onChange={(e) => setTexto(e.target.value)}
                      disabled={revelado}
                      rows={5}
                      placeholder="Escreva sua resposta como se fosse a real…"
                    />
                    {!revelado ? (
                      <Button onClick={() => void responderSubjetiva()} disabled={enviando}>
                        {enviando ? <Loader2 className="size-4 animate-spin" /> : null}
                        Enviar resposta
                      </Button>
                    ) : null}
                  </div>
                )}

                {!revelado ? (
                  <div className="flex flex-wrap items-center gap-2">
                    {dica ? (
                      <p className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
                        Dica: {pergunta.dica}
                      </p>
                    ) : (
                      <Button variant="ghost" size="sm" onClick={() => setDica(true)}>
                        Não sei — me dá uma dica
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={encerrarFase}>
                      Sair da fase
                    </Button>
                  </div>
                ) : null}

                {revelado ? (
                  <div className="space-y-3 rounded-lg border border-border bg-muted/40 p-4">
                    <p className="flex items-center gap-2 font-display text-sm font-semibold">
                      <GraduationCap className="size-4 text-primary" /> O que aprender aqui
                    </p>
                    {avaliacao ? (
                      <>
                        <p className="text-sm">
                          <span className="font-medium">
                            {avaliacao.acertou ? "Boa resposta" : "Quase lá"} · {avaliacao.pontos}
                            /100
                          </span>{" "}
                          — {avaliacao.feedback}
                        </p>
                        <p className="text-sm text-muted-foreground">{avaliacao.licao}</p>
                        <p className="rounded-md bg-background px-3 py-2 text-sm">
                          <span className="font-medium">Resposta modelo: </span>
                          {avaliacao.exemplo}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">{pergunta.explicacao}</p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {rodadaFase < PERGUNTAS_POR_FASE ? (
                        <Button
                          size="sm"
                          onClick={() => void proximaPergunta(faseAtiva as number)}
                        >
                          Próxima pergunta
                        </Button>
                      ) : (
                        <Button size="sm" onClick={encerrarFase}>
                          Concluir fase ({acertosFase}/{PERGUNTAS_POR_FASE} acertos)
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={encerrarFase}>
                        Voltar ao mapa
                      </Button>
                    </div>
                  </div>
                ) : null}
              </>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
```

## `src/components/gravidade-badge.tsx`

```tsx
import { Badge } from "@/components/ui/badge";

const estilos: Record<string, string> = {
  alta: "border-destructive/30 bg-destructive/10 text-destructive",
  media: "border-realce/40 bg-realce/10 text-realce",
  baixa: "border-primary/30 bg-primary/10 text-primary",
};

const rotulos: Record<string, string> = { alta: "Crítico", media: "Atenção", baixa: "Leve" };

export function GravidadeBadge({ nivel }: { nivel: "alta" | "media" | "baixa" }) {
  return (
    <Badge variant="outline" className={estilos[nivel]}>
      {rotulos[nivel]}
    </Badge>
  );
}
```

## `src/components/gupy-panel.tsx`

```tsx
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Briefcase, FileUp, Loader2, Lock, Sparkles } from "lucide-react";
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
import { analisarPerfilGupy, type PerfilGupy } from "@/lib/gupy.functions";
import { useAssinatura } from "@/lib/use-assinatura";

const rotuloArea: Record<string, string> = {
  dados_pessoais: "Dados pessoais",
  formacao: "Formação",
  experiencias: "Experiências",
  conquistas: "Conquistas",
  triagem: "Triagem Gupy",
};

function BarraArea({ nota }: { nota: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
      <div className="h-full rounded-full bg-primary" style={{ width: `${nota}%` }} />
    </div>
  );
}

export function GupyPanel({
  perfil,
  setPerfil,
}: {
  perfil: PerfilGupy | null;
  setPerfil: (v: PerfilGupy | null) => void;
}) {
  const analisar = useServerFn(analisarPerfilGupy);
  const { temAcessoA, carregando: carregandoAssinatura } = useAssinatura();
  const ativa = temAcessoA("gupy");
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
      toast.success("Currículo da Gupy carregado.");
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Falha ao ler o arquivo.");
    } finally {
      setLendoArquivo(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function executar() {
    if (texto.trim().length < 80) {
      toast.error("Envie o PDF do seu currículo baixado na Gupy ou cole o conteúdo.");
      return;
    }
    setCarregando(true);
    try {
      const resultado = await analisar({ data: { texto, area } });
      if ("error" in resultado) {
        toast.error(resultado.error);
        return;
      }
      setPerfil(resultado);
      toast.success("Análise da conta Gupy concluída.");
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não consegui analisar agora.");
    } finally {
      setCarregando(false);
    }
  }

  if (!ativa && !carregandoAssinatura) {
    return (
      <Card className="border-primary/40 bg-primary/5">
        <CardContent className="flex flex-col items-start gap-3 py-8">
          <p className="flex items-center gap-2 font-display text-lg font-semibold">
            <Lock className="size-4 text-primary" /> Análise da conta Gupy disponível no plano Pro
          </p>
          <p className="max-w-xl text-sm text-muted-foreground">
            Descubra o que trava seu perfil no ranqueamento da Gupy: campos incompletos, experiências
            fracas e palavras-chave que faltam. A partir de R$ 10 por mês.
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
            <Briefcase className="size-4 text-primary" />
            Sua conta Gupy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
            {texto.trim().length >= 80 ? "Trocar arquivo da Gupy" : "Enviar PDF da Gupy"}
          </Button>
          <p className="text-xs text-muted-foreground">
            Na Gupy, abra seu perfil e use “Baixar currículo”. É esse PDF que analisamos aqui.
          </p>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Cargo ou área que você busca
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
              placeholder="Conteúdo do currículo da Gupy"
              className="mt-3 min-h-32 font-mono text-xs"
            />
          </details>

          <Button className="w-full gap-2" onClick={() => void executar()} disabled={carregando}>
            {carregando ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            Analisar conta Gupy
          </Button>
        </CardContent>
      </Card>

      {!perfil ? (
        <Card>
          <CardContent className="py-20 text-center text-sm text-muted-foreground">
            Envie o currículo baixado da Gupy para receber a nota e o diagnóstico de triagem.
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

          <Tabs defaultValue="campos">
            <TabsList className="flex w-full flex-wrap">
              <TabsTrigger value="campos" className="gap-1">
                Campos
                <span className="rounded bg-primary/15 px-1.5 text-xs text-primary">
                  {perfil.camposIncompletos.length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="experiencias" className="gap-1">
                Experiências
                <span className="rounded bg-primary/15 px-1.5 text-xs text-primary">
                  {perfil.experiencias.length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="triagem">Triagem</TabsTrigger>
              <TabsTrigger value="plano">Plano</TabsTrigger>
            </TabsList>

            <TabsContent value="campos" className="mt-4 grid gap-3 sm:grid-cols-2">
              {perfil.camposIncompletos.map((c, i) => (
                <Card key={i}>
                  <CardContent className="pt-5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">{c.campo}</span>
                      <GravidadeBadge nivel={c.gravidade} />
                    </div>
                    <p className="mt-1.5 text-sm text-muted-foreground">{c.comoCorrigir}</p>
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

            <TabsContent value="triagem" className="mt-4">
              <Card>
                <CardContent className="space-y-3 pt-6 text-sm">
                  <div className="flex flex-wrap gap-1.5">
                    {perfil.palavrasChaveFaltando.map((k, i) => (
                      <span
                        key={i}
                        className="rounded border border-realce/30 bg-realce/10 px-2 py-0.5 text-xs text-foreground"
                      >
                        {k}
                      </span>
                    ))}
                  </div>
                  <ul className="space-y-1.5 text-muted-foreground">
                    {perfil.riscosDeTriagem.map((r, i) => (
                      <li key={i}>• {r}</li>
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
```

## `src/components/historico-analises.tsx`

```tsx
import { History, TrendingDown, TrendingUp, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type EntradaHistorico = {
  id: string;
  criadaEm: string;
  score: number;
  resumo: string;
  problemas: number;
};

export function HistoricoAnalises({
  historico,
  setHistorico,
}: {
  historico: EntradaHistorico[];
  setHistorico: (v: EntradaHistorico[]) => void;
}) {
  if (historico.length === 0) return null;

  const atual = historico[0]!;
  const anterior = historico[1];
  const delta = anterior ? Math.round(atual.score - anterior.score) : null;

  return (
    <Card className="shadow-[var(--shadow-panel)]">
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle className="flex items-center gap-2 font-display text-base">
          <History className="size-4 text-primary" />
          Evolução do currículo
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={() => setHistorico([])}>
          <Trash2 className="size-4" />
          Limpar
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {delta !== null && (
          <div className="flex items-center gap-2 rounded-lg border bg-secondary/40 p-3 text-sm">
            {delta >= 0 ? (
              <TrendingUp className="size-4 text-primary" />
            ) : (
              <TrendingDown className="size-4 text-destructive" />
            )}
            <span>
              {delta === 0
                ? "Mesma nota da versão anterior."
                : `${delta > 0 ? "+" : ""}${delta} pontos em relação à versão anterior.`}
            </span>
          </div>
        )}

        <ol className="space-y-2">
          {historico.map((item, i) => (
            <li key={item.id} className="flex items-center gap-3 rounded-lg border p-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {Math.round(item.score)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                  {i === 0 ? "Versão atual" : `Versão ${historico.length - i}`}
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    {new Date(item.criadaEm).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                  </span>
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {item.problemas} problema{item.problemas === 1 ? "" : "s"} de ATS · {item.resumo}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
```

## `src/components/historico-vagas.tsx`

```tsx
import { useServerFn } from "@tanstack/react-start";
import { ExternalLink, History, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { RecomendacoesVagaDialog } from "@/components/recomendacoes-vaga-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  limparVagasEncerradas,
  listarHistoricoRadar,
  revalidarHistorico,
  type VagaHistorico,
} from "@/lib/radar.functions";
import { toast } from "sonner";

const ROTULO_STATUS: Record<string, string> = {
  nova: "Nova",
  vista: "Vista",
  salva: "Salva",
  descartada: "Descartada",
  baixa: "Match baixo",
  removida: "Removida",
};

function cor(valor: number) {
  if (valor >= 70) return "text-primary";
  if (valor >= 40) return "text-realce";
  return "text-muted-foreground";
}

export function HistoricoVagas() {
  const listar = useServerFn(listarHistoricoRadar);
  const limparEncerradas = useServerFn(limparVagasEncerradas);
  const reprocessar = useServerFn(revalidarHistorico);
  const [limpando, setLimpando] = useState(false);
  const [reprocessando, setReprocessando] = useState(false);
  const [itens, setItens] = useState<VagaHistorico[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtro, setFiltro] = useState<"todas" | "radar" | "descartadas" | "removidas">("todas");

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      setItens(await listar({}));
    } catch {
      setItens([]);
    } finally {
      setCarregando(false);
    }
  }, [listar]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  async function limpar() {
    setLimpando(true);
    try {
      const { removidas } = await limparEncerradas({});
      await carregar();
      toast.success(
        removidas > 0
          ? `${removidas} vaga(s) encerrada(s) removida(s) do histórico.`
          : "Nenhuma vaga encerrada encontrada.",
      );
    } catch {
      toast.error("Não foi possível limpar as vagas encerradas.");
    } finally {
      setLimpando(false);
    }
  }

  async function reprocessarTudo() {
    setReprocessando(true);
    try {
      const r = await reprocessar({});
      await carregar();
      toast.success(
        r.encerradas + r.foraDaJanela > 0
          ? `${r.encerradas} encerrada(s) e ${r.foraDaJanela} fora da janela marcada(s) em ${r.analisadas} vaga(s).`
          : `Tudo em dia: ${r.analisadas} vaga(s) verificada(s).`,
      );
    } catch {
      toast.error("Não foi possível reprocessar o histórico.");
    } finally {
      setReprocessando(false);
    }
  }

  const filtradas = itens.filter((v) => {
    if (filtro === "radar")
      return !["descartada", "baixa", "removida"].includes(v.status);
    if (filtro === "descartadas") return ["descartada", "baixa"].includes(v.status);
    if (filtro === "removidas") return v.status === "removida";
    return true;
  });

  if (carregando)
    return (
      <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Carregando histórico…
      </div>
    );

  if (itens.length === 0)
    return (
      <Card className="flex min-h-64 items-center justify-center border-dashed shadow-none">
        <CardContent className="max-w-sm py-12 text-center">
          <History className="mx-auto size-6 text-muted-foreground" />
          <p className="mt-3 font-display text-base font-semibold">Histórico vazio</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Cada vaga em que você clicar em "Abrir vaga" fica registrada aqui com o score, os
            motivos, as lacunas e o aviso caso ela saia do radar.
          </p>

        </CardContent>
      </Card>
    );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {(["todas", "radar", "descartadas", "removidas"] as const).map((f) => (
          <Button
            key={f}
            size="sm"
            variant={filtro === f ? "default" : "secondary"}
            onClick={() => setFiltro(f)}
          >
            {f === "todas"
              ? "Todas"
              : f === "radar"
                ? "No radar"
                : f === "descartadas"
                  ? "Fora do radar"
                  : "Removidas"}
          </Button>
        ))}
        <span className="text-xs text-muted-foreground">
          {filtradas.length} vaga(s) aberta(s)
        </span>
        <Button
          size="sm"
          variant="secondary"
          className="ml-auto"
          onClick={() => void reprocessarTudo()}
          disabled={reprocessando}
        >
          {reprocessando ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RefreshCw className="size-4" />
          )}
          Reprocessar histórico
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => void limpar()}
          disabled={limpando}
        >
          {limpando ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
          Limpar encerradas
        </Button>
      </div>

      {filtradas.map((v) => (
        <Card key={v.id} className="shadow-none">
          <CardContent className="space-y-3 py-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-display text-base font-semibold">{v.titulo}</p>
                <p className="text-sm text-muted-foreground">
                  {[v.empresa, v.local, v.modelo, v.fonte].filter(Boolean).join(" · ")}
                </p>
              </div>
              <div className="text-right">
                <p className={`font-display text-2xl font-semibold ${cor(v.compatibilidade)}`}>
                  {v.compatibilidade}%
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {ROTULO_STATUS[v.status] ?? v.status} ·{" "}
                  {new Date(v.publicadaEm ?? v.criadaEm).toLocaleDateString("pt-BR")}
                </p>
              </div>
            </div>

            {v.motivoRemocao && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
                Removida do radar: {v.motivoRemocao}
                {v.removidaEm
                  ? ` · ${new Date(v.removidaEm).toLocaleDateString("pt-BR")}`
                  : ""}
              </p>
            )}

            <p className="text-sm leading-relaxed">{v.motivo}</p>

            {v.lacunas.length > 0 && (
              <div>
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Lacunas detectadas
                </p>
                <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-muted-foreground">
                  {v.lacunas.map((l, i) => (
                    <li key={i}>{l}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <RecomendacoesVagaDialog
                vagaId={v.id}
                titulo={v.titulo}
                compatibilidade={v.compatibilidade}
              />
              {v.link && (
                <Button size="sm" variant="ghost" asChild>
                  <a href={v.link} target="_blank" rel="noreferrer">
                    <ExternalLink className="size-4" /> Ver anúncio
                  </a>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

## `src/components/linkedin-panel.tsx`

```tsx
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
```

## `src/components/notificacoes-menu.tsx`

```tsx
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
```

## `src/components/painel-hoje.tsx`

```tsx
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowRight, Minus, Plus, Radar, Sparkles, Target } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Vaga } from "@/components/vagas-panel";
import type { AtsAnalysis } from "@/lib/ats.functions";
import { useAuth } from "@/lib/auth";
import { listarCandidaturas } from "@/lib/candidaturas.functions";
import { listarVagasRadar } from "@/lib/radar.functions";
import { useLocalState } from "@/lib/use-local-state";

const DIA = 86_400_000;
const PARADA_APOS_DIAS = 7;

function Indicador({
  rotulo,
  valor,
  detalhe,
}: {
  rotulo: string;
  valor: string;
  detalhe?: string;
}) {
  return (
    <div className="cartao min-w-0 px-3.5 py-3">
      <p className="truncate text-[0.68rem] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
        {rotulo}
      </p>
      <p className="numeros mt-1 font-display text-2xl leading-none font-bold">{valor}</p>
      {detalhe ? <p className="mt-1 truncate text-xs text-muted-foreground">{detalhe}</p> : null}
    </div>
  );
}

export function PainelHoje({ analise, vagas }: { analise: AtsAnalysis | null; vagas: Vaga[] }) {
  const { user } = useAuth();
  const buscarCandidaturas = useServerFn(listarCandidaturas);
  const buscarRadar = useServerFn(listarVagasRadar);

  const [meta, setMeta] = useLocalState<number>("eupasso:meta-semanal", 5);

  const candidaturas = useQuery({
    queryKey: ["candidaturas", user?.id],
    queryFn: () => buscarCandidaturas(),
    enabled: Boolean(user),
  });

  const radar = useQuery({
    queryKey: ["radar-hoje", user?.id],
    queryFn: () => buscarRadar({ data: { ordenacao: "recentes" } }),
    enabled: Boolean(user),
  });

  const lista = candidaturas.data ?? [];
  const agora = Date.now();

  const enviadasNaSemana = lista.filter(
    (c) => c.enviada_em && agora - new Date(c.enviada_em).getTime() < 7 * DIA,
  ).length;

  const paradas = lista.filter(
    (c) =>
      !["recusado", "oferta", "interessado"].includes(c.status) &&
      agora - new Date(c.updated_at).getTime() > PARADA_APOS_DIAS * DIA,
  );

  const ativas = lista.filter((c) => !["recusado", "oferta"].includes(c.status)).length;

  const novasNoRadar = (radar.data ?? []).filter(
    (v) => v.status === "nova" && agora - new Date(v.criadaEm).getTime() < 3 * DIA,
  ).length;

  const comMatch = vagas.filter((v) => v.resultado);
  const matchMedio = comMatch.length
    ? Math.round(
        comMatch.reduce((t, v) => t + (v.resultado?.compatibilidade ?? 0), 0) / comMatch.length,
      )
    : null;

  const fortesSemCarta = vagas.filter(
    (v) => (v.resultado?.compatibilidade ?? 0) >= 80 && !v.carta,
  ).length;

  const progresso = Math.min(100, meta > 0 ? Math.round((enviadasNaSemana / meta) * 100) : 0);

  const proximoPasso = !analise
    ? { texto: "Analise seu currículo para saber o que trava você na triagem.", para: null }
    : paradas.length > 0
      ? {
          texto: `${paradas.length} candidatura${paradas.length > 1 ? "s" : ""} sem movimento há mais de ${PARADA_APOS_DIAS} dias — faça o follow-up.`,
          para: "/candidaturas" as const,
        }
      : novasNoRadar > 0
        ? {
            texto: `${novasNoRadar} vaga${novasNoRadar > 1 ? "s novas" : " nova"} no radar esperando sua avaliação.`,
            para: "/radar" as const,
          }
        : fortesSemCarta > 0
          ? {
              texto: `${fortesSemCarta} vaga${fortesSemCarta > 1 ? "s" : ""} com match acima de 80% ainda sem carta gerada.`,
              para: null,
            }
          : enviadasNaSemana < meta
            ? {
                texto: `Faltam ${meta - enviadasNaSemana} candidatura${meta - enviadasNaSemana > 1 ? "s" : ""} para bater a meta da semana.`,
                para: "/radar" as const,
              }
            : { texto: "Meta da semana batida. Aproveite para revisar seu LinkedIn.", para: null };

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Indicador
          rotulo="Score ATS"
          valor={analise ? String(Math.round(analise.score)) : "—"}
          detalhe={analise ? "do seu currículo" : "sem análise ainda"}
        />
        <Indicador
          rotulo="Match médio"
          valor={matchMedio !== null ? `${matchMedio}%` : "—"}
          detalhe={`${comMatch.length} vaga${comMatch.length === 1 ? "" : "s"} avaliada${comMatch.length === 1 ? "" : "s"}`}
        />
        <Indicador
          rotulo="Candidaturas"
          valor={user ? String(ativas) : "—"}
          detalhe={user ? "em andamento" : "entre na conta"}
        />
        <Indicador
          rotulo="Radar"
          valor={user ? String(novasNoRadar) : "—"}
          detalhe="novas em 3 dias"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card className="shadow-[var(--shadow-panel)]">
          <CardContent className="space-y-4 py-5">
            <div className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/12 text-primary">
                <Sparkles className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="text-[0.7rem] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                  Seu próximo passo
                </p>
                <p className="mt-1 text-sm leading-relaxed font-medium">{proximoPasso.texto}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {proximoPasso.para ? (
                <Button asChild size="sm" className="max-sm:w-full">
                  <Link to={proximoPasso.para}>
                    Ir agora <ArrowRight className="size-4" />
                  </Link>
                </Button>
              ) : null}
              <Button asChild size="sm" variant="outline" className="max-sm:w-full">
                <Link to="/radar">
                  <Radar className="size-4" /> Radar de vagas
                </Link>
              </Button>
            </div>

            {paradas.length > 0 ? (
              <div className="rounded-lg border border-border bg-secondary/40 p-3">
                <p className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                  <AlertTriangle className="size-3.5" /> Paradas há mais de {PARADA_APOS_DIAS} dias
                </p>
                <ul className="mt-2 space-y-1">
                  {paradas.slice(0, 3).map((c) => (
                    <li key={c.id} className="truncate text-sm">
                      {c.titulo}
                      {c.empresa ? ` · ${c.empresa}` : ""}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="shadow-[var(--shadow-panel)]">
          <CardContent className="space-y-4 py-5">
            <div className="flex items-center gap-2">
              <Target className="size-4 text-primary" />
              <p className="text-[0.7rem] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                Meta da semana
              </p>
            </div>

            <div>
              <p className="numeros font-display text-2xl font-bold">
                {enviadasNaSemana}
                <span className="text-base font-medium text-muted-foreground"> / {meta}</span>
              </p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-500"
                  style={{ width: `${progresso}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Candidaturas enviadas nos últimos 7 dias.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="outline"
                aria-label="Diminuir meta"
                onClick={() => setMeta(Math.max(1, meta - 1))}
              >
                <Minus className="size-4" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                aria-label="Aumentar meta"
                onClick={() => setMeta(Math.min(30, meta + 1))}
              >
                <Plus className="size-4" />
              </Button>
              <span className="text-xs text-muted-foreground">Ajuste sua meta semanal</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
```

## `src/components/payment-test-mode-banner.tsx`

```tsx
import { MODO_PAGAMENTO } from "@/lib/stripe";

const clientToken = import.meta.env["VITE_PAYMENTS_CLIENT_TOKEN"] as string | undefined;

export function PaymentTestModeBanner() {
  if (MODO_PAGAMENTO === "simulado") {
    return (
      <div className="w-full border-b border-realce/40 bg-realce/10 px-4 py-2 text-center text-sm text-foreground">
        Modo simulado: a assinatura é ativada apenas para teste e nenhuma cobrança é feita.
      </div>
    );
  }
  if (!clientToken) {
    return (
      <div className="w-full border-b border-destructive/30 bg-destructive/10 px-4 py-2 text-center text-sm text-destructive">
        O checkout de produção ainda não está configurado neste site.
      </div>
    );
  }
  if (clientToken.startsWith("pk_test_")) {
    return (
      <div className="w-full border-b border-realce/40 bg-realce/10 px-4 py-2 text-center text-sm text-foreground">
        Todos os pagamentos feitos na pré-visualização são em modo de teste.
      </div>
    );
  }
  return null;
}
```

## `src/components/planos-panel.tsx`

```tsx
import { useNavigate } from "@tanstack/react-router";
import { Check, Loader2, Minus, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { CheckoutEmbutido } from "@/components/checkout-embutido";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ativarAssinaturaSimulada,
  cancelarAssinaturaSimulada,
} from "@/lib/assinatura-simulada.functions";
import { useAuth } from "@/lib/auth";
import { criarPortal } from "@/lib/payments.functions";
import { ROTULO_TIER } from "@/lib/plano";
import {
  getStripeEnvironment,
  MODO_PAGAMENTO,
  PERIODICIDADES,
  planoDe,
  type Periodicidade,
} from "@/lib/stripe";
import { useAssinatura } from "@/lib/use-assinatura";

type Linha = { recurso: string; gratis: string | boolean; essencial: string | boolean; pro: string | boolean };

const COMPARATIVO: Linha[] = [
  { recurso: "Análise ATS do currículo", gratis: "3 / mês", essencial: "Ilimitado", pro: "Ilimitado" },
  { recurso: "Compatibilidade manual de vaga", gratis: "3 / mês", essencial: "Ilimitado", pro: "Ilimitado" },
  { recurso: "Carta de apresentação", gratis: "1 / mês", essencial: "Ilimitado", pro: "Ilimitado" },
  { recurso: "Currículo revisado (PDF/DOCX)", gratis: "1 / mês", essencial: "Ilimitado", pro: "Ilimitado" },
  { recurso: "Kanban de candidaturas e histórico", gratis: true, essencial: true, pro: true },
  { recurso: "Radar automático de vagas", gratis: false, essencial: "8 buscas / mês", pro: "Ilimitado" },
  { recurso: "Currículo otimizado por vaga", gratis: false, essencial: "10 / mês", pro: "Ilimitado" },
  { recurso: "Análise de perfil do LinkedIn", gratis: false, essencial: "2 / mês", pro: "Ilimitado" },
  { recurso: "Análise da conta Gupy", gratis: false, essencial: false, pro: true },
  { recurso: "Preparação de entrevista (STAR)", gratis: false, essencial: false, pro: true },
  { recurso: "Trilha de conhecimento e cursos", gratis: false, essencial: false, pro: true },
  { recurso: "Quest (trilhas gamificadas)", gratis: false, essencial: false, pro: true },
];

function Celula({ valor }: { valor: string | boolean }) {
  if (valor === true) return <Check className="mx-auto size-4 text-primary" />;
  if (valor === false) return <Minus className="mx-auto size-4 text-muted-foreground/50" />;
  return <span className="text-xs font-medium">{valor}</span>;
}

const BENEFICIOS = [
  "Busca automática de vagas na Gupy, Indeed, LinkedIn, Vagas.com, InfoJobs e Catho",
  "Compatibilidade calculada por IA contra o seu currículo",
  "Lacunas e ajustes recomendados para cada vaga",
  "Carta de apresentação e currículo revisado ilimitados",
  "Histórico de evolução do seu score ATS",
];

export function PlanosPanel() {
  const { user } = useAuth();
  const { assinatura, ativa, tier, carregando, recarregar } = useAssinatura();
  const navigate = useNavigate();
  const [periodicidade, setPeriodicidade] = useState<Periodicidade>("mensal");
  const [selecionado, setSelecionado] = useState<string | null>(null);
  const [abrindoPortal, setAbrindoPortal] = useState(false);
  const [processando, setProcessando] = useState<string | null>(null);
  const simulado = MODO_PAGAMENTO === "simulado";


  async function abrirPortal() {
    setAbrindoPortal(true);
    try {
      const resultado = await criarPortal({
        data: { returnUrl: window.location.href, environment: getStripeEnvironment() },
      });
      if ("error" in resultado) throw new Error(resultado.error);
      window.open(resultado.url, "_blank");
    } catch (erro) {
      toast.error(
        erro instanceof Error ? erro.message : "Não foi possível abrir a gestão da assinatura.",
      );
    } finally {
      setAbrindoPortal(false);
    }
  }

  async function ativarSimulado(priceId: string) {
    setProcessando(priceId);
    try {
      const resultado = await ativarAssinaturaSimulada({ data: { priceId } });
      if ("error" in resultado) throw new Error(resultado.error);
      await recarregar();
      toast.success("Plano ativado em modo simulado. Nenhuma cobrança foi feita.");
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível ativar.");
    } finally {
      setProcessando(null);
    }
  }

  async function cancelarSimulado() {
    setProcessando("cancelar");
    try {
      const resultado = await cancelarAssinaturaSimulada({});
      if ("error" in resultado) throw new Error(resultado.error);
      await recarregar();
      toast.success("Simulação cancelada.");
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível cancelar.");
    } finally {
      setProcessando(null);
    }
  }

  function escolher(priceId: string) {
    if (!user) {
      toast.info("Crie sua conta para assinar.");
      void navigate({ to: "/auth" });
      return;
    }
    if (simulado) {
      void ativarSimulado(priceId);
      return;
    }
    setSelecionado(priceId);
  }

  return (
    <div>
      {ativa && (
        <Card className="mb-6 border-primary/40 bg-primary/5">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 py-5">
            <div>
              <p className="font-display text-base font-semibold">Sua assinatura está ativa</p>
              <p className="text-sm text-muted-foreground">
                Plano {ROTULO_TIER[tier]} ·{" "}
                {assinatura?.price_id?.split("_")[1] ?? "mensal"}

                {assinatura?.current_period_end
                  ? ` · acesso até ${new Date(assinatura.current_period_end).toLocaleDateString("pt-BR")}`
                  : ""}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {simulado ? (
                <Button
                  variant="secondary"
                  onClick={() => void cancelarSimulado()}
                  disabled={processando !== null}
                >
                  {processando === "cancelar" ? <Loader2 className="size-4 animate-spin" /> : null}
                  Cancelar simulação
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  onClick={() => void abrirPortal()}
                  disabled={abrindoPortal}
                >
                  {abrindoPortal ? <Loader2 className="size-4 animate-spin" /> : null}
                  Gerenciar assinatura e pagamento
                </Button>
              )}
              <Button onClick={() => void navigate({ to: "/radar" })}>Ir para o radar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {selecionado ? (
        <Card className="shadow-[var(--shadow-panel)]">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-display text-lg">Finalizar assinatura</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setSelecionado(null)}>
              Trocar de plano
            </Button>
          </CardHeader>
          <CardContent>
            <CheckoutEmbutido priceId={selecionado} />
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            {PERIODICIDADES.map((p) => (
              <Button
                key={p.valor}
                size="sm"
                variant={periodicidade === p.valor ? "default" : "secondary"}
                onClick={() => setPeriodicidade(p.valor)}
              >
                {p.rotulo}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className={tier === "gratis" ? "border-primary/40" : ""}>
              <CardHeader className="pb-3">
                <CardTitle className="font-display text-base">Grátis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="font-display text-3xl font-semibold tabular-nums">
                  R$ 0<span className="text-sm font-normal text-muted-foreground">/mês</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Para testar: análise ATS, comparação de vaga e carta com limite mensal.
                </p>
                <Button className="w-full" variant="secondary" disabled>
                  {tier === "gratis" ? "Seu plano atual" : "Plano básico"}
                </Button>
              </CardContent>
            </Card>

            {(["essencial", "pro"] as const).map((nivel) => {
              const plano = planoDe(nivel, periodicidade);
              const destaque = nivel === "pro";
              return (
                <Card
                  key={plano.priceId}
                  className={destaque ? "border-primary shadow-[var(--shadow-panel)]" : ""}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="font-display text-base">
                        {ROTULO_TIER[nivel]}
                        {destaque ? (
                          <span className="ml-2 rounded-md bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
                            Completo
                          </span>
                        ) : null}
                      </CardTitle>
                      {plano.economia ? (
                        <span className="rounded-md bg-accent/20 px-2 py-0.5 text-xs font-medium">
                          {plano.economia}
                        </span>
                      ) : null}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="font-display text-3xl font-semibold tabular-nums">
                      {plano.preco}
                      <span className="text-sm font-normal text-muted-foreground">
                        {plano.periodo}
                      </span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {nivel === "essencial"
                        ? "Currículo sem limite, radar com 8 buscas por mês e LinkedIn."
                        : "Tudo sem limite: radar diário, Gupy, entrevistas, trilha e Quest."}
                    </p>
                    <Button
                      className="w-full"
                      variant={destaque ? "default" : "secondary"}
                      onClick={() => escolher(plano.priceId)}
                      disabled={carregando || processando !== null}
                    >
                      {processando === plano.priceId ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : null}
                      {tier === nivel
                        ? "Renovar / trocar período"
                        : ativa
                          ? "Trocar para este plano"
                          : simulado
                            ? "Ativar plano (simulado)"
                            : "Assinar"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card className="mt-6 overflow-hidden">
            <CardHeader>
              <CardTitle className="font-display text-lg">Comparativo dos planos</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground">
                    <th className="px-4 py-2 text-left font-medium">Recurso</th>
                    <th className="px-3 py-2 text-center font-medium">Grátis</th>
                    <th className="px-3 py-2 text-center font-medium">Essencial</th>
                    <th className="px-3 py-2 text-center font-medium">Pro</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARATIVO.map((linha) => (
                    <tr key={linha.recurso} className="border-b last:border-0">
                      <td className="px-4 py-2 text-left">{linha.recurso}</td>
                      <td className="px-3 py-2 text-center">
                        <Celula valor={linha.gratis} />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Celula valor={linha.essencial} />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Celula valor={linha.pro} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>


          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display text-lg">
                <Sparkles className="size-4 text-primary" /> O que está incluído
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {BENEFICIOS.map((b) => (
                  <li key={b} className="flex gap-2 text-sm text-muted-foreground">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                    {b}
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-xs text-muted-foreground">
                A análise de currículo, a compatibilidade manual de vagas e o guia ATS continuam
                gratuitos. A assinatura libera o radar automático de vagas.
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
```

## `src/components/recomendacoes-vaga-dialog.tsx`

```tsx
import { useServerFn } from "@tanstack/react-start";
import {
  Check,
  Copy,
  Download,
  Eye,
  FileText,
  History as HistoryIcon,
  Loader2,
  Mail,
  Pencil,
  RefreshCw,
  Save,
  Sparkles,
  Trash2,
  Undo2,
  Wand2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { CurriculoPrevia } from "@/components/curriculo-previa";
import { GravidadeBadge } from "@/components/gravidade-badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LIMITE_CARTA } from "@/lib/ats.schemas";
import { exportarDocx, exportarPdf } from "@/lib/exportar-curriculo";
import { comIdentificacao, nomeArquivoCurriculo } from "@/lib/nome-arquivo";

import {
  gerarCartaVaga,
  gerarCurriculoVaga,
  gerarRecomendacoesVaga,
  type CartaApresentacao,
  type CurriculoRevisado,
  type RecomendacoesVaga,
} from "@/lib/radar.functions";
import { diffLinhas, useVersoesCurriculo } from "@/lib/versoes-curriculo";

export function RecomendacoesVagaDialog({
  vagaId,
  titulo,
  compatibilidade,
}: {
  vagaId: string;
  titulo: string;
  compatibilidade: number;
}) {
  const rodar = useServerFn(gerarRecomendacoesVaga);
  const gerarCv = useServerFn(gerarCurriculoVaga);
  const pedirCarta = useServerFn(gerarCartaVaga);
  const { versoes, adicionar, remover } = useVersoesCurriculo(vagaId);
  const [aberto, setAberto] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [dados, setDados] = useState<RecomendacoesVaga | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [comCarta, setComCarta] = useState(false);
  const [gerandoCv, setGerandoCv] = useState(false);
  const [gerandoCarta, setGerandoCarta] = useState(false);
  const [cartaAberta, setCartaAberta] = useState(true);
  const [comparando, setComparando] = useState<string | null>(null);
  const [modo, setModo] = useState<"editar" | "previa">("editar");
  const [curriculo, setCurriculo] = useState<CurriculoRevisado | null>(null);
  const [textoCv, setTextoCv] = useState("");
  const [carta, setCarta] = useState<CartaApresentacao | null>(null);

  const textoCarta = carta ? `${carta.assunto}\n\n${carta.carta}` : "";
  const cvFinal = comIdentificacao(textoCv, titulo);
  const arquivoCv = (ext: string) => nomeArquivoCurriculo(cvFinal, titulo, ext);
  const arquivoCarta = (ext: string) => nomeArquivoCurriculo(cvFinal, titulo, ext, "carta");

  async function gerar(refazer = false) {
    setCarregando(true);
    try {
      const resposta = await rodar({ data: { id: vagaId, refazer } });
      if ("error" in resposta) {
        toast.error(resposta.error);
        return;
      }
      setDados(resposta.recomendacoes);
    } catch {
      toast.error("Não foi possível gerar as recomendações agora.");
    } finally {
      setCarregando(false);
    }
  }

  async function gerarCurriculo() {
    setGerandoCv(true);
    try {
      const resposta = await gerarCv({ data: { id: vagaId, comCarta } });
      if ("error" in resposta) {
        toast.error(resposta.error);
        return;
      }
      setCurriculo(resposta.curriculo);
      setTextoCv(resposta.curriculo.curriculo);
      setCarta(resposta.carta);
      adicionar({
        texto: resposta.curriculo.curriculo,
        mudancas: resposta.curriculo.mudancas,
        observacoes: resposta.curriculo.observacoes,
        carta: resposta.carta
          ? { assunto: resposta.carta.assunto, carta: resposta.carta.carta }
          : null,
      });
      toast.success("Currículo sob medida gerado.");
    } catch {
      toast.error("Não foi possível gerar o currículo agora.");
    } finally {
      setGerandoCv(false);
    }
  }

  const [tomCarta, setTomCarta] = useState<"formal" | "equilibrado" | "direto">("equilibrado");

  async function gerarCarta() {
    setGerandoCarta(true);
    try {
      const resposta = await pedirCarta({
        data: { id: vagaId, curriculo: textoCv, tom: tomCarta },
      });

      if ("error" in resposta) {
        toast.error(resposta.error);
        return;
      }
      setCarta(resposta.carta);
      setCartaAberta(true);
      toast.success("Carta de apresentação gerada.");
    } catch {
      toast.error("Não foi possível gerar a carta agora.");
    } finally {
      setGerandoCarta(false);
    }
  }

  function copiar() {
    if (!dados) return;
    const texto = [
      `Palavras-chave para incluir (${titulo}):`,
      ...dados.palavrasChave.map((p) => `- ${p.termo} — ${p.ondeUsar}: ${p.exemplo}`),
      "",
      "Trechos reescritos:",
      ...dados.trechos.map((t) => `Antes: ${t.original}\nDepois: ${t.sugerido}`),
    ].join("\n");
    void navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 1800);
  }

  return (
    <Dialog
      open={aberto}
      onOpenChange={(v) => {
        setAberto(v);
        if (v && !dados) void gerar();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary">
          <Wand2 className="size-4" /> Aumentar match
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Como aumentar o match desta vaga</DialogTitle>
          <DialogDescription>
            {titulo} — match atual {compatibilidade}%
            {dados ? ` · potencial ${Math.round(dados.ganhoEstimado)}% aplicando tudo` : ""}
          </DialogDescription>
        </DialogHeader>

        {carregando && !dados && (
          <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Comparando seu currículo com a vaga…
          </div>
        )}

        {dados && (
          <div className="space-y-6">
            <p className="rounded-lg bg-muted/60 p-4 text-sm leading-relaxed">{dados.resumo}</p>

            <section className="space-y-3">
              <h3 className="flex items-center gap-2 font-display text-sm font-semibold">
                <Sparkles className="size-4 text-primary" /> Palavras-chave para incluir
              </h3>
              {dados.palavrasChave.map((p) => (
                <div key={p.termo} className="rounded-lg border p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{p.termo}</span>
                    <GravidadeBadge nivel={p.importancia} />
                    <span className="text-xs text-muted-foreground">{p.ondeUsar}</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground italic">“{p.exemplo}”</p>
                </div>
              ))}
            </section>

            <section className="space-y-3">
              <h3 className="font-display text-sm font-semibold">Trechos do seu currículo</h3>
              {dados.trechos.map((t, i) => (
                <div key={i} className="space-y-2 rounded-lg border p-3 text-sm">
                  <p className="text-muted-foreground line-through">{t.original}</p>
                  <p className="font-medium">{t.sugerido}</p>
                  <p className="text-xs text-muted-foreground">{t.motivo}</p>
                </div>
              ))}
            </section>

            {dados.acoesRapidas.length > 0 && (
              <section className="space-y-2">
                <h3 className="font-display text-sm font-semibold">Antes de se candidatar</h3>
                <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {dados.acoesRapidas.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </section>
            )}

            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={copiar}>
                {copiado ? <Check className="size-4" /> : <Copy className="size-4" />}
                {copiado ? "Copiado" : "Copiar recomendações"}
              </Button>
              <Button variant="ghost" onClick={() => void gerar(true)} disabled={carregando}>
                {carregando ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <RefreshCw className="size-4" />
                )}
                Gerar de novo
              </Button>
            </div>

            <section className="space-y-3 rounded-lg border border-primary/30 bg-primary/5 p-4">
              <h3 className="flex items-center gap-2 font-display text-sm font-semibold">
                <FileText className="size-4 text-primary" /> Currículo sob medida para esta vaga
              </h3>
              <p className="text-sm text-muted-foreground">
                Geramos uma versão do seu currículo montada só para esta vaga, usando apenas as
                informações reais que você já cadastrou.
              </p>

              <div className="flex items-center gap-2">
                <Checkbox
                  id={`carta-${vagaId}`}
                  checked={comCarta}
                  onCheckedChange={(v) => setComCarta(v === true)}
                />
                <Label htmlFor={`carta-${vagaId}`} className="text-sm font-normal">
                  Gerar também a carta de apresentação
                </Label>
              </div>

              <Button onClick={() => void gerarCurriculo()} disabled={gerandoCv}>
                {gerandoCv ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <FileText className="size-4" />
                )}
                {gerandoCv
                  ? "Montando currículo…"
                  : curriculo
                    ? "Gerar nova versão"
                    : "Gerar currículo para esta vaga"}
              </Button>

              {curriculo && (
                <div className="space-y-3">
                  <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
                    <Button
                      size="sm"
                      variant={modo === "editar" ? "secondary" : "ghost"}
                      className="flex-1"
                      onClick={() => setModo("editar")}
                    >
                      <Pencil className="size-4" /> Editar
                    </Button>
                    <Button
                      size="sm"
                      variant={modo === "previa" ? "secondary" : "ghost"}
                      className="flex-1"
                      onClick={() => setModo("previa")}
                    >
                      <Eye className="size-4" /> Prévia
                    </Button>
                  </div>

                  {modo === "editar" ? (
                    <Textarea
                      value={textoCv}
                      onChange={(e) => setTextoCv(e.target.value)}
                      className="min-h-72 font-mono text-xs"
                    />
                  ) : (
                    <CurriculoPrevia texto={cvFinal} />
                  )}

                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => void exportarDocx(cvFinal, arquivoCv("docx"))}
                    >
                      <Download className="size-4" /> DOCX
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => exportarPdf(cvFinal, arquivoCv("pdf"))}
                    >
                      <Download className="size-4" /> PDF
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        void navigator.clipboard.writeText(textoCv);
                        toast.success("Currículo copiado.");
                      }}
                    >
                      <Copy className="size-4" /> Copiar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        adicionar({
                          texto: textoCv,
                          mudancas: curriculo.mudancas,
                          observacoes: curriculo.observacoes,
                          carta: carta ? { assunto: carta.assunto, carta: carta.carta } : null,
                        });
                        toast.success("Versão salva no histórico.");
                      }}
                    >
                      <Save className="size-4" /> Salvar versão
                    </Button>
                  </div>

                  {curriculo.mudancas.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                        O que mudou
                      </p>
                      <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                        {curriculo.mudancas.map((m, i) => (
                          <li key={i}>{m}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {curriculo.observacoes.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                        Confirme antes de enviar
                      </p>
                      <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                        {curriculo.observacoes.map((o, i) => (
                          <li key={i}>{o}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {(comCarta || carta) && (
                <div className="space-y-3 rounded-lg border bg-background p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Mail className="size-4 text-primary" />
                    <span className="font-display text-sm font-semibold">
                      Carta de apresentação
                    </span>
                    <Button
                      size="sm"
                      variant={carta ? "ghost" : "default"}
                      className="ml-auto"
                      onClick={() => void gerarCarta()}
                      disabled={gerandoCarta}
                    >
                      {gerandoCarta ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Wand2 className="size-4" />
                      )}
                      {gerandoCarta ? "Escrevendo…" : carta ? "Gerar de novo" : "Gerar carta"}
                    </Button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {(["formal", "equilibrado", "direto"] as const).map((t) => (
                      <Button
                        key={t}
                        size="sm"
                        variant={tomCarta === t ? "default" : "outline"}
                        onClick={() => setTomCarta(t)}
                      >
                        {t === "formal" ? "Formal" : t === "direto" ? "Direto" : "Equilibrado"}
                      </Button>
                    ))}
                    <span className="text-xs text-muted-foreground">
                      máx. {LIMITE_CARTA} caracteres
                    </span>
                  </div>

                  {carta && (
                    <>
                      <button
                        type="button"
                        className="text-left text-sm font-medium underline-offset-4 hover:underline"
                        onClick={() => setCartaAberta((v) => !v)}
                      >
                        {cartaAberta ? "Ocultar carta" : "Visualizar carta"} — {carta.assunto}
                      </button>
                      {cartaAberta && (
                        <>
                          <p className="rounded-lg bg-muted/60 p-3 text-sm leading-relaxed whitespace-pre-wrap">
                            {carta.carta}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {carta.carta.length}/{LIMITE_CARTA} caracteres
                          </p>
                        </>
                      )}
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => void exportarDocx(textoCarta, arquivoCarta("docx"))}
                        >
                          <Download className="size-4" /> DOCX
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => exportarPdf(textoCarta, arquivoCarta("pdf"))}
                        >
                          <Download className="size-4" /> PDF
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            void navigator.clipboard.writeText(textoCarta);
                            toast.success("Carta copiada.");
                          }}
                        >
                          <Copy className="size-4" /> Copiar carta
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {versoes.length > 0 && (
                <div className="space-y-2 rounded-lg border bg-background p-3">
                  <p className="flex items-center gap-2 font-display text-sm font-semibold">
                    <HistoryIcon className="size-4 text-primary" /> Histórico de versões
                  </p>
                  {versoes.map((v) => {
                    const diff = comparando === v.id ? diffLinhas(v.texto, textoCv) : null;
                    return (
                      <div key={v.id} className="rounded-lg border p-2 text-sm">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{v.rotulo}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(v.criadaEm).toLocaleString("pt-BR")}
                          </span>
                          {v.carta && (
                            <span className="text-xs text-muted-foreground">· com carta</span>
                          )}
                          <div className="ml-auto flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setComparando(comparando === v.id ? null : v.id)}
                            >
                              {comparando === v.id ? "Fechar" : "Comparar"}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setTextoCv(v.texto);
                                if (v.carta)
                                  setCarta({
                                    assunto: v.carta.assunto,
                                    carta: v.carta.carta,
                                    observacoes: [],
                                  });
                                setComparando(null);
                                toast.success(`${v.rotulo} restaurada.`);
                              }}
                            >
                              <Undo2 className="size-4" /> Restaurar
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => remover(v.id)}>
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </div>

                        {diff && (
                          <div className="mt-2 max-h-64 space-y-0.5 overflow-y-auto rounded bg-muted/50 p-2 font-mono text-xs">
                            {diff.map((l, i) => (
                              <p
                                key={i}
                                className={
                                  l.tipo === "adicionada"
                                    ? "text-primary"
                                    : l.tipo === "removida"
                                      ? "text-destructive line-through"
                                      : "text-muted-foreground"
                                }
                              >
                                {l.tipo === "adicionada"
                                  ? "+ "
                                  : l.tipo === "removida"
                                    ? "- "
                                    : "  "}
                                {l.texto}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

## `src/components/roadmap-panel.tsx`

```tsx
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BookOpen, ExternalLink, Loader2, Map, Plus, RefreshCw, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import type { AtsAnalysis } from "@/lib/ats.functions";
import { useAuth } from "@/lib/auth";
import { carregarPerfil } from "@/lib/dados.functions";
import {
  atualizarItemRoadmap,
  buscarCursosDaHabilidade,
  carregarRitmo,
  excluirItemRoadmap,
  gerarTrilha,
  listarRoadmap,
  listarSessoes,
  registrarHoras,
  salvarRitmo,
  type CursoGratuito,
  type ItemRoadmap,
} from "@/lib/roadmap.functions";
import { NIVEIS, ROTULO_NIVEL } from "@/lib/roadmap.schemas";
import { cn } from "@/lib/utils";

type VagaLacunas = Record<string, unknown>;

function lacunasDe(analise: AtsAnalysis | null, vagas: unknown[]): string[] {
  const termos = new Set<string>();
  for (const p of analise?.palavrasChaveFaltando ?? []) termos.add(p);
  for (const v of vagas as VagaLacunas[]) {
    const lista = Array.isArray(v?.["lacunas"]) ? (v["lacunas"] as { requisito?: string }[]) : [];
    for (const l of lista) if (l?.requisito) termos.add(l.requisito);
  }
  return [...termos].slice(0, 40);
}

const COR_PRIORIDADE: Record<string, string> = {
  alta: "bg-destructive/12 text-destructive",
  media: "bg-primary/12 text-primary",
  baixa: "bg-muted text-muted-foreground",
};

const DIA_CURTO = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" });

/** Trilha de conhecimentos com ritmo de estudo e gráfico de evolução. */
export function RoadmapPanel({
  curriculo,
  analise,
  vagas,
}: {
  curriculo: string;
  analise: AtsAnalysis | null;
  vagas: unknown[];
}) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const buscar = useServerFn(listarRoadmap);
  const gerar = useServerFn(gerarTrilha);
  const atualizar = useServerFn(atualizarItemRoadmap);
  const excluir = useServerFn(excluirItemRoadmap);
  const perfil = useServerFn(carregarPerfil);
  const lerRitmo = useServerFn(carregarRitmo);
  const gravarRitmo = useServerFn(salvarRitmo);
  const lerSessoes = useServerFn(listarSessoes);
  const gravarHoras = useServerFn(registrarHoras);

  const [horasDia, setHorasDia] = useState(1);
  const [diasSemana, setDiasSemana] = useState(5);

  const lista = useQuery({
    queryKey: ["roadmap", user?.id],
    queryFn: () => buscar(),
    enabled: Boolean(user),
  });

  const ritmo = useQuery({
    queryKey: ["roadmap-ritmo", user?.id],
    queryFn: () => lerRitmo(),
    enabled: Boolean(user),
  });

  const sessoes = useQuery({
    queryKey: ["roadmap-sessoes", user?.id],
    queryFn: () => lerSessoes(),
    enabled: Boolean(user),
  });

  useEffect(() => {
    if (ritmo.data) {
      setHorasDia(Number(ritmo.data.horas_dia));
      setDiasSemana(Number(ritmo.data.dias_semana));
    }
  }, [ritmo.data]);

  const mRitmo = useMutation({
    mutationFn: () => gravarRitmo({ data: { horas_dia: horasDia, dias_semana: diasSemana } }),
    onSuccess: () => {
      toast.success("Ritmo de estudo salvo");
      qc.invalidateQueries({ queryKey: ["roadmap-ritmo", user?.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const mGerar = useMutation({
    mutationFn: async () => {
      const p = await perfil().catch(() => ({ cargoDesejado: "" }));
      return gerar({
        data: {
          curriculo,
          cargo: p.cargoDesejado ?? "",
          lacunas: lacunasDe(analise, vagas),
          horasDia,
          diasSemana,
        },
      });
    },
    onSuccess: (itens) => {
      toast.success(`Trilha com ${itens.length} conhecimentos pronta`);
      qc.invalidateQueries({ queryKey: ["roadmap", user?.id] });
      qc.invalidateQueries({ queryKey: ["roadmap-sessoes", user?.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const mHoras = useMutation({
    mutationFn: (v: { id: string; horas: number }) => gravarHoras({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["roadmap", user?.id] });
      qc.invalidateQueries({ queryKey: ["roadmap-sessoes", user?.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const mConcluir = useMutation({
    mutationFn: (v: { id: string; concluido: boolean }) =>
      atualizar({ data: { id: v.id, status: v.concluido ? "concluido" : "estudando" } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["roadmap", user?.id] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const mExcluir = useMutation({
    mutationFn: (id: string) => excluir({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["roadmap", user?.id] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const itens = useMemo(() => lista.data ?? [], [lista.data]);
  const horasSemana = Math.round(horasDia * diasSemana * 10) / 10;
  const totalHoras = itens.reduce((s, i) => s + Number(i.horas_estimadas || 0), 0);
  const horasFeitas = itens.reduce((s, i) => s + Number(i.horas_feitas || 0), 0);
  const semanas = horasSemana > 0 ? Math.ceil(Math.max(totalHoras - horasFeitas, 0) / horasSemana) : 0;
  const progresso = totalHoras > 0 ? Math.round((horasFeitas / totalHoras) * 100) : 0;

  const dadosGrafico = useMemo(() => {
    const registros = sessoes.data ?? [];
    if (!registros.length) return [];
    let acumulado = 0;
    return registros.map((s, indice) => {
      acumulado += Number(s.horas);
      const data = new Date(`${s.dia}T12:00:00`);
      return {
        dia: DIA_CURTO.format(data),
        estudado: Math.round(acumulado * 10) / 10,
        meta: Math.round(((horasSemana / 7) * (indice + 1)) * 10) / 10,
      };
    });
  }, [sessoes.data, horasSemana]);

  if (!user) {
    return (
      <Card className="shadow-[var(--shadow-panel)]">
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <Map className="size-8 text-muted-foreground" />
          <p className="max-w-sm text-sm text-muted-foreground">
            Entre na sua conta para montar sua trilha de conhecimentos e acompanhar a evolução.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="shadow-[var(--shadow-panel)]">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-base">Quanto tempo você tem para estudar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Horas por dia</span>
                <span className="numeros font-semibold">{horasDia.toFixed(2).replace(/\.?0+$/, "")} h</span>
              </div>
              <Slider
                value={[horasDia]}
                min={0.5}
                max={8}
                step={0.5}
                onValueChange={([v]) => setHorasDia(v ?? 1)}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Dias por semana</span>
                <span className="numeros font-semibold">{diasSemana}</span>
              </div>
              <Slider
                value={[diasSemana]}
                min={1}
                max={7}
                step={1}
                onValueChange={([v]) => setDiasSemana(v ?? 5)}
              />
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            <span className="numeros font-semibold text-foreground">{horasSemana} h</span> por semana
            {totalHoras > 0 ? (
              <>
                {" "}
                — trilha atual de{" "}
                <span className="numeros font-semibold text-foreground">{totalHoras} h</span>, restam
                cerca de{" "}
                <span className="numeros font-semibold text-foreground">{semanas} semana(s)</span>.
              </>
            ) : null}
          </p>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => mRitmo.mutate()} className="max-sm:w-full">
              Salvar ritmo
            </Button>
            <Button
              size="sm"
              onClick={() => mGerar.mutate()}
              disabled={curriculo.trim().length < 50 || mGerar.isPending}
              className="max-sm:w-full"
            >
              {mGerar.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RefreshCw className="size-4" />
              )}
              {itens.length ? "Refazer trilha nesse ritmo" : "Montar trilha"}
            </Button>
          </div>
          {curriculo.trim().length < 50 ? (
            <p className="text-xs text-muted-foreground">
              Cole seu currículo na página inicial para montar a trilha.
            </p>
          ) : null}
        </CardContent>
      </Card>

      {itens.length ? (
        <Card className="shadow-[var(--shadow-panel)]">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-base">Evolução dos estudos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                <span className="numeros font-semibold text-foreground">{horasFeitas}</span> de{" "}
                <span className="numeros">{totalHoras}</span> h concluídas
              </span>
              <span className="numeros font-semibold">{progresso}%</span>
            </div>
            <Progress value={progresso} />

            {dadosGrafico.length ? (
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dadosGrafico} margin={{ left: -20, right: 8, top: 8 }}>
                    <defs>
                      <linearGradient id="grad-estudo" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="dia" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <ChartTooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                      formatter={(valor: number, nome: string) => [
                        `${valor} h`,
                        nome === "estudado" ? "Estudado" : "Meta do ritmo",
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="estudado"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      fill="url(#grad-estudo)"
                    />
                    <Line
                      type="monotone"
                      dataKey="meta"
                      stroke="hsl(var(--muted-foreground))"
                      strokeDasharray="4 4"
                      strokeWidth={1.5}
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Registre horas nos itens abaixo para o gráfico começar a desenhar sua evolução.
              </p>
            )}
          </CardContent>
        </Card>
      ) : null}

      {lista.isLoading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Carregando trilha…</p>
      ) : itens.length === 0 ? (
        <Card className="shadow-[var(--shadow-panel)]">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Map className="size-8 text-muted-foreground" />
            <p className="max-w-sm text-sm text-muted-foreground">
              Ainda sem trilha. A IA lê seu currículo, o cargo desejado e as lacunas das vagas e
              distribui os estudos dentro do tempo que você tem.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-5">
          {NIVEIS.map((nivel) => {
            const doNivel = itens.filter((i) => i.nivel === nivel);
            if (!doNivel.length) return null;
            return (
              <section key={nivel} className="space-y-3">
                <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {ROTULO_NIVEL[nivel]}
                </h3>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {doNivel.map((item) => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      onHoras={(horas) => mHoras.mutate({ id: item.id, horas })}
                      onConcluir={(concluido) => mConcluir.mutate({ id: item.id, concluido })}
                      onExcluir={() => mExcluir.mutate(item.id)}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ItemCard({
  item,
  onHoras,
  onConcluir,
  onExcluir,
}: {
  item: ItemRoadmap;
  onHoras: (horas: number) => void;
  onConcluir: (concluido: boolean) => void;
  onExcluir: () => void;
}) {
  const buscarCursos = useServerFn(buscarCursosDaHabilidade);
  const [cursos, setCursos] = useState<CursoGratuito[] | null>(null);

  const mCursos = useMutation({
    mutationFn: () => buscarCursos({ data: { habilidade: item.habilidade } }),
    onSuccess: (lista) => {
      setCursos(lista);
      if (!lista.length) toast.info("Nenhum curso gratuito encontrado agora.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const estimadas = Number(item.horas_estimadas || 0);
  const feitas = Number(item.horas_feitas || 0);
  const pct = estimadas > 0 ? Math.min(100, Math.round((feitas / estimadas) * 100)) : 0;
  const concluido = item.status === "concluido";

  return (
    <Card className={cn("shadow-[var(--shadow-panel)]", concluido ? "opacity-75" : null)}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="font-display text-base leading-tight">{item.habilidade}</CardTitle>
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-xs",
              COR_PRIORIDADE[item.prioridade] ?? COR_PRIORIDADE["media"],
            )}
          >
            {item.prioridade}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {item.porque ? <p className="text-muted-foreground">{item.porque}</p> : null}
        {item.como_comprovar ? (
          <p className="text-muted-foreground">
            <span className="font-medium text-foreground">No currículo: </span>
            {item.como_comprovar}
          </p>
        ) : null}

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="numeros">
              {feitas} / {estimadas} h
            </span>
            <span className="numeros">{pct}%</span>
          </div>
          <Progress value={pct} />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {[0.5, 1, 2].map((h) => (
            <Button key={h} size="sm" variant="outline" onClick={() => onHoras(h)}>
              <Plus className="size-3.5" />
              {h} h
            </Button>
          ))}
          <Button
            size="sm"
            variant={concluido ? "default" : "ghost"}
            onClick={() => onConcluir(!concluido)}
          >
            {concluido ? "Concluído" : "Marcar concluído"}
          </Button>
          <Button size="sm" variant="ghost" onClick={onExcluir} aria-label="Remover item">
            <Trash2 className="size-4" />
          </Button>
        </div>

        <div className="space-y-2 border-t border-border pt-3">
          <Button
            size="sm"
            variant="outline"
            onClick={() => mCursos.mutate()}
            disabled={mCursos.isPending}
          >
            {mCursos.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <BookOpen className="size-4" />
            )}
            Cursos gratuitos
          </Button>

          {cursos?.length ? (
            <ul className="space-y-1.5">
              {cursos.map((c) => (
                <li key={c.url}>
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="flex items-start gap-1.5 text-xs text-primary hover:underline"
                  >
                    <ExternalLink className="mt-0.5 size-3 shrink-0" />
                    <span>
                      {c.titulo}
                      <span className="text-muted-foreground"> — {c.plataforma}</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
```

## `src/components/rodape.tsx`

```tsx
import { Link } from "@tanstack/react-router";

export function Rodape() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-md">
          As análises são geradas por IA e servem como orientação — revise antes de enviar seu
          currículo.
        </p>
        <nav className="flex flex-wrap gap-x-4 gap-y-2">
          <Link to="/planos" className="hover:text-foreground">
            Planos
          </Link>
          <Link to="/guia-ats" className="hover:text-foreground">
            Guia ATS
          </Link>
          <Link to="/ia" className="hover:text-foreground">
            Como usamos IA
          </Link>
          <Link to="/privacidade" className="hover:text-foreground">
            Privacidade
          </Link>
          <Link to="/termos" className="hover:text-foreground">
            Termos de uso
          </Link>
        </nav>
      </div>
    </footer>
  );
}
```

## `src/components/score-ring.tsx`

```tsx
import { cn } from "@/lib/utils";

function faixa(valor: number) {
  if (valor >= 75) return { cor: "var(--color-primary)", rotulo: "Forte" };
  if (valor >= 50) return { cor: "var(--color-accent)", rotulo: "Mediano" };
  return { cor: "var(--color-destructive)", rotulo: "Fraco" };
}

export function ScoreRing({
  valor,
  tamanho = 132,
  legenda,
  className,
}: {
  valor: number;
  tamanho?: number;
  legenda?: string;
  className?: string;
}) {
  const seguro = Math.max(0, Math.min(100, Math.round(valor)));
  const { cor, rotulo } = faixa(seguro);
  const raio = tamanho / 2 - 9;
  const circ = 2 * Math.PI * raio;

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div className="relative" style={{ width: tamanho, height: tamanho }}>
        <svg width={tamanho} height={tamanho} className="-rotate-90">
          <circle
            cx={tamanho / 2}
            cy={tamanho / 2}
            r={raio}
            fill="none"
            strokeWidth={9}
            className="stroke-secondary"
          />
          <circle
            cx={tamanho / 2}
            cy={tamanho / 2}
            r={raio}
            fill="none"
            strokeWidth={9}
            strokeLinecap="round"
            stroke={cor}
            strokeDasharray={circ}
            strokeDashoffset={circ - (circ * seguro) / 100}
            style={{ transition: "stroke-dashoffset 900ms cubic-bezier(0.22,1,0.36,1)" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-3xl leading-none font-bold text-foreground">{seguro}</span>
          <span className="mt-1 text-[10px] tracking-[0.18em] text-muted-foreground uppercase">{rotulo}</span>
        </div>
      </div>
      {legenda ? <p className="text-xs text-muted-foreground">{legenda}</p> : null}
    </div>
  );
}
```

## `src/components/tema-menu.tsx`

```tsx
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
```

## `src/components/vagas-panel.tsx`

```tsx
import { useServerFn } from "@tanstack/react-start";
import { ExternalLink, Loader2, Plus, Target, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { CartaDialog } from "@/components/carta-dialog";
import { CurriculoVagaDialog } from "@/components/curriculo-vaga-dialog";

import { ExtensaoCard } from "@/components/extensao-card";

import { GravidadeBadge } from "@/components/gravidade-badge";
import { ScoreRing } from "@/components/score-ring";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { analisarVaga, type CartaApresentacao, type JobMatch } from "@/lib/ats.functions";

export type Vaga = {
  id: string;
  cargo: string;
  empresa: string;
  link: string;
  requisitos: string;
  criadaEm: string;
  resultado: JobMatch | null;
  carta?: CartaApresentacao | null;
};


const vazio = { cargo: "", empresa: "", link: "", requisitos: "" };

export function VagasPanel({
  curriculo,
  vagas,
  setVagas,
}: {
  curriculo: string;
  vagas: Vaga[];
  setVagas: (v: Vaga[]) => void;
}) {
  const rodar = useServerFn(analisarVaga);
  const [form, setForm] = useState(vazio);
  const [carregando, setCarregando] = useState(false);

  async function adicionar() {
    if (curriculo.trim().length < 50) {
      toast.error("Cadastre seu currículo na aba Currículo antes de avaliar vagas.");
      return;
    }
    if (!form.cargo.trim() || form.requisitos.trim().length < 10) {
      toast.error("Informe ao menos a posição e os requisitos da vaga.");
      return;
    }
    setCarregando(true);
    try {
      const resultado = await rodar({
        data: {
          curriculo: curriculo.trim().slice(0, 30000),
          cargo: form.cargo.trim(),
          empresa: form.empresa.trim(),
          link: form.link.trim(),
          requisitos: form.requisitos.trim().slice(0, 15000),
        },
      });
      const nova: Vaga = {
        id: crypto.randomUUID(),
        ...form,
        criadaEm: new Date().toISOString(),
        resultado,
      };
      setVagas([nova, ...vagas]);
      setForm(vazio);
      toast.success(`Compatibilidade: ${Math.round(resultado.compatibilidade)}%`);
    } catch {
      toast.error("Não foi possível avaliar a vaga agora. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
      <Card className="h-fit shadow-[var(--shadow-panel)]">
        <CardHeader>
          <CardTitle className="font-display text-lg">Nova vaga</CardTitle>
          <p className="text-sm text-muted-foreground">
            Cole os requisitos da vaga e calculamos sua compatibilidade com base no currículo salvo.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cargo">Posição</Label>
            <Input
              id="cargo"
              value={form.cargo}
              onChange={(e) => setForm({ ...form, cargo: e.target.value })}
              placeholder="Analista de Dados Pleno"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="empresa">Empresa</Label>
              <Input
                id="empresa"
                value={form.empresa}
                onChange={(e) => setForm({ ...form, empresa: e.target.value })}
                placeholder="Nubank"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="link">Link da vaga</Label>
              <Input
                id="link"
                value={form.link}
                onChange={(e) => setForm({ ...form, link: e.target.value })}
                placeholder="https://…"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="requisitos">Requisitos e descrição</Label>
            <Textarea
              id="requisitos"
              value={form.requisitos}
              onChange={(e) => setForm({ ...form, requisitos: e.target.value })}
              placeholder="Cole aqui a descrição completa e os requisitos da vaga…"
              className="min-h-48 resize-y text-sm"
            />
          </div>
          <Button className="w-full" onClick={() => void adicionar()} disabled={carregando}>
            {carregando ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            {carregando ? "Calculando compatibilidade…" : "Rastrear vaga"}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <ExtensaoCard />

        {vagas.length === 0 ? (
          <Card className="flex min-h-64 items-center justify-center border-dashed shadow-none">
            <CardContent className="max-w-sm py-12 text-center">
              <Target className="mx-auto size-6 text-muted-foreground" />
              <p className="mt-3 font-display text-base font-semibold">Nenhuma vaga rastreada</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Cada vaga cadastrada fica aqui com a nota de compatibilidade e o que falta no seu currículo.
              </p>
            </CardContent>
          </Card>
        ) : (
          vagas.map((vaga) => (
            <Card key={vaga.id} className="shadow-[var(--shadow-panel)]">
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div className="min-w-0">
                  <CardTitle className="font-display text-base">{vaga.cargo}</CardTitle>
                  <p className="mt-1 truncate text-sm text-muted-foreground">
                    {vaga.empresa || "Empresa não informada"} ·{" "}
                    {new Date(vaga.criadaEm).toLocaleDateString("pt-BR")}
                  </p>
                  {vaga.link ? (
                    <a
                      href={vaga.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      Abrir vaga <ExternalLink className="size-3" />
                    </a>
                  ) : null}
                </div>
                <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                  <CurriculoVagaDialog
                    curriculo={curriculo}
                    cargo={vaga.cargo}
                    empresa={vaga.empresa}
                    requisitos={vaga.requisitos}
                    resultado={vaga.resultado}
                  />
                  <CartaDialog
                    curriculo={curriculo}
                    cargo={vaga.cargo}
                    empresa={vaga.empresa}
                    requisitos={vaga.requisitos}
                    carta={vaga.carta ?? null}
                    setCarta={(c) => setVagas(vagas.map((v) => (v.id === vaga.id ? { ...v, carta: c } : v)))}
                  />

                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Remover vaga"
                    onClick={() => setVagas(vagas.filter((v) => v.id !== vaga.id))}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>

              </CardHeader>
              {vaga.resultado ? (
                <CardContent className="flex flex-col gap-6 sm:flex-row">
                  <ScoreRing valor={vaga.resultado.compatibilidade} tamanho={112} legenda="Compatibilidade" />
                  <div className="flex-1 space-y-4">
                    <p className="text-sm leading-relaxed">{vaga.resultado.veredito}</p>

                    {vaga.resultado.requisitosAtendidos.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                          Você atende
                        </p>
                        <ul className="mt-2 space-y-1">
                          {vaga.resultado.requisitosAtendidos.map((r) => (
                            <li key={r} className="flex gap-2 text-sm text-muted-foreground">
                              <span className="text-primary">✓</span>
                              {r}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {vaga.resultado.lacunas.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                          Lacunas
                        </p>
                        <div className="mt-2 space-y-2">
                          {vaga.resultado.lacunas.map((l) => (
                            <div key={l.requisito} className="rounded-lg border bg-secondary/40 p-3">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-medium">{l.requisito}</span>
                                <GravidadeBadge nivel={l.gravidade} />
                              </div>
                              <p className="mt-1 text-sm text-muted-foreground">{l.acao}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {vaga.resultado.palavrasChaveParaIncluir.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                          Termos para incluir no currículo
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {vaga.resultado.palavrasChaveParaIncluir.map((k) => (
                            <span key={k} className="rounded-md bg-accent/20 px-2 py-1 text-xs font-medium">
                              {k}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {vaga.resultado.ajustesNoCurriculo.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                          Ajustes recomendados
                        </p>
                        <ul className="mt-2 list-disc space-y-1 pl-5">
                          {vaga.resultado.ajustesNoCurriculo.map((a) => (
                            <li key={a} className="text-sm text-muted-foreground">
                              {a}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              ) : null}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
```
