# Front-end (1/3) — rotas

## `src/routes/__root.tsx`

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/lib/auth";
import { SCRIPT_TEMA, TemaProvider } from "@/lib/tema";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent/15"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Eu passo — Currículo aprovado no ATS e vagas rastreadas" },
      {
        name: "description",
        content:
          "Analise seu currículo para sistemas ATS, corrija o que trava a triagem automática e meça a compatibilidade com cada vaga.",
      },
      { name: "author", content: "Lovable" },
      { property: "og:title", content: "Eu passo — Currículo aprovado no ATS e vagas rastreadas" },
      {
        property: "og:description",
        content:
          "Analise seu currículo para sistemas ATS, corrija o que trava a triagem automática e meça a compatibilidade com cada vaga.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@Lovable" },
      { name: "twitter:title", content: "Eu passo — Currículo aprovado no ATS e vagas rastreadas" },
      {
        name: "twitter:description",
        content:
          "Analise seu currículo para sistemas ATS, corrija o que trava a triagem automática e meça a compatibilidade com cada vaga.",
      },
      {
        property: "og:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/83d733f6-a808-4e03-9719-56ca3083c684/id-preview-c767563d--f98a034b-fa20-441f-8382-7da030a141d0.lovable.app-1785776695166.png",
      },
      {
        name: "twitter:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/83d733f6-a808-4e03-9719-56ca3083c684/id-preview-c767563d--f98a034b-fa20-441f-8382-7da030a141d0.lovable.app-1785776695166.png",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700&family=Figtree:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" data-tema="navy">
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <TemaProvider>
        <AuthProvider>
          {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
          <Outlet />
        </AuthProvider>
        <Toaster richColors position="top-center" />
      </TemaProvider>
    </QueryClientProvider>
  );
}
```

## `src/routes/a.$id.tsx`

```tsx
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowRight, Radar, TrendingUp } from "lucide-react";

import { GravidadeBadge } from "@/components/gravidade-badge";
import { ScoreRing } from "@/components/score-ring";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { carregarAnalisePublica, type AnalisePublica } from "@/lib/compartilhar.functions";

const statusEstilo: Record<string, string> = {
  ok: "text-primary",
  melhorar: "text-realce",
  ausente: "text-destructive",
};

export const Route = createFileRoute("/a/$id")({
  loader: async ({ params }) => {
    const analise = await carregarAnalisePublica({ data: { id: params.id } });
    if (!analise) throw notFound();
    return analise;
  },
  head: ({ params, loaderData }) => {
    const titulo = loaderData
      ? `Nota ATS ${loaderData.score}/100 — análise de currículo compartilhada`
      : "Análise de currículo compartilhada";
    const descricao =
      loaderData?.resumo?.slice(0, 155) || "Veja uma análise ATS compartilhada no Eu passo.";
    const url = `https://eupasso.lovable.app/a/${params.id}`;
    return {
      meta: [
        { title: `${titulo} | Eu passo` },
        { name: "description", content: descricao },
        { property: "og:title", content: titulo },
        { property: "og:description", content: descricao },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  component: AnaliseCompartilhada,
});

function AnaliseCompartilhada() {
  const a = Route.useLoaderData() as AnalisePublica;
  const ganho = a.scoreAntes != null ? a.score - a.scoreAntes : null;

  return (
    <div className="min-h-screen bg-background">
      <header className="text-deep-foreground" style={{ background: "var(--gradient-deep)" }}>
        <div className="mx-auto max-w-4xl px-5 py-8 sm:py-12">
          <Link
            to="/"
            className="flex items-center gap-2 text-xs tracking-[0.22em] uppercase opacity-70"
          >
            <Radar className="size-4" />
            Eu Passo
          </Link>
          <h1 className="mt-4 font-display text-2xl leading-tight font-bold sm:text-3xl">
            Análise ATS compartilhada{a.cargoDesejado ? ` — ${a.cargoDesejado}` : ""}
          </h1>
          <p className="mt-2 text-sm opacity-80">
            Currículo anonimizado: o texto original e os dados de contato não são compartilhados.
            Gerado em {new Date(a.criadaEm).toLocaleDateString("pt-BR")}.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-5 py-8">
        <Card className="shadow-[var(--shadow-panel)]">
          <CardContent className="flex flex-col items-center gap-6 pt-6 sm:flex-row sm:items-start">
            {a.scoreAntes != null ? (
              <div className="flex items-center gap-4">
                <ScoreRing valor={a.scoreAntes} legenda="Antes" />
                <ArrowRight className="size-5 text-muted-foreground" />
                <ScoreRing valor={a.score} legenda="Depois" />
              </div>
            ) : (
              <ScoreRing valor={a.score} legenda="Nota ATS" />
            )}
            <div className="flex-1 space-y-3">
              {ganho != null && ganho > 0 ? (
                <p className="flex items-center gap-1.5 text-sm font-medium text-primary">
                  <TrendingUp className="size-4" />+{ganho} pontos entre a primeira e a última
                  análise
                </p>
              ) : null}
              <p className="text-sm leading-relaxed">{a.resumo}</p>
              {a.pontosFortes.length > 0 && (
                <ul className="space-y-1">
                  {a.pontosFortes.map((p) => (
                    <li key={p} className="flex gap-2 text-sm text-muted-foreground">
                      <span className="text-primary">✓</span>
                      {p}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>

        {a.problemasAts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-base">
                O que trava o robô de triagem
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {a.problemasAts.map((p) => (
                <div key={p.titulo} className="rounded-md border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium">{p.titulo}</p>
                    <GravidadeBadge nivel={p.gravidade} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{p.explicacao}</p>
                  <p className="mt-1 text-xs">
                    <strong>Como corrigir:</strong> {p.comoCorrigir}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {a.palavrasChaveFaltando.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-base">Palavras-chave ausentes</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-1.5">
                {a.palavrasChaveFaltando.map((k) => (
                  <span key={k} className="rounded bg-secondary px-2 py-1 text-xs">
                    {k}
                  </span>
                ))}
              </CardContent>
            </Card>
          )}

          {a.secoes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-base">Seções destacadas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {a.secoes.map((s) => (
                  <div key={s.nome} className="rounded-md border p-2.5">
                    <p className="text-sm font-medium">
                      {s.nome}{" "}
                      <span className={`text-xs ${statusEstilo[s.status]}`}>· {s.status}</span>
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{s.nota}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {a.reescritas.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-base">Reescritas sugeridas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {a.reescritas.map((r) => (
                <div key={r.sugerida} className="rounded-md border p-3 text-xs">
                  <p className="text-muted-foreground line-through">{r.original}</p>
                  <p className="mt-1.5 text-foreground">{r.sugerida}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <div className="rounded-lg border bg-secondary/30 p-6 text-center">
          <p className="font-display text-lg font-semibold">
            Quer a mesma análise do seu currículo?
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link to="/">Analisar meu currículo</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/guia-ats">Guia ATS com exemplos</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
```

## `src/routes/auth.tsx`

```tsx
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2, Radar } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar ou criar conta — Eu passo" },
      {
        name: "description",
        content:
          "Crie sua conta no Eu passo para salvar seu currículo, o histórico de notas ATS e as vagas rastreadas em qualquer dispositivo.",
      },
      { property: "og:title", content: "Entrar ou criar conta — Eu passo" },
      {
        property: "og:description",
        content: "Salve currículo, histórico de notas ATS e vagas rastreadas na sua conta.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.5 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.45a5.5 5.5 0 0 1-2.39 3.62v3h3.86c2.26-2.08 3.58-5.15 3.58-8.81Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.08 7.94-2.92l-3.86-3c-1.08.72-2.45 1.15-4.08 1.15-3.13 0-5.79-2.11-6.74-4.96H1.28v3.09A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.26 14.27a7.2 7.2 0 0 1 0-4.54V6.64H1.28a12 12 0 0 0 0 10.72l3.98-3.09Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.17 15.24 0 12 0A12 12 0 0 0 1.28 6.64l3.98 3.09C6.21 6.86 8.87 4.75 12 4.75Z"
      />
    </svg>
  );
}

function AuthPage() {
  const navigate = useNavigate();
  const { user, carregando } = useAuth();
  const [ocupado, setOcupado] = useState(false);
  const [emailEnviado, setEmailEnviado] = useState(false);

  const [entrarEmail, setEntrarEmail] = useState("");
  const [entrarSenha, setEntrarSenha] = useState("");

  const [nome, setNome] = useState("");
  const [cargo, setCargo] = useState("");
  const [novoEmail, setNovoEmail] = useState("");
  const [novaSenha, setNovaSenha] = useState("");

  useEffect(() => {
    if (!carregando && user) void navigate({ to: "/", replace: true });
  }, [user, carregando, navigate]);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setOcupado(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: entrarEmail.trim(),
      password: entrarSenha,
    });
    setOcupado(false);
    if (error) {
      toast.error(
        error.message.includes("Invalid login")
          ? "E-mail ou senha incorretos."
          : "Não foi possível entrar: " + error.message,
      );
      return;
    }
    void navigate({ to: "/", replace: true });
  }

  async function criarConta(e: React.FormEvent) {
    e.preventDefault();
    if (novaSenha.length < 6) {
      toast.error("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    setOcupado(true);
    const { data, error } = await supabase.auth.signUp({
      email: novoEmail.trim(),
      password: novaSenha,
      options: {
        emailRedirectTo: window.location.origin,
        data: { nome: nome.trim(), cargo_desejado: cargo.trim() },
      },
    });
    setOcupado(false);
    if (error) {
      toast.error(
        error.message.includes("already registered")
          ? "Esse e-mail já tem conta. Use a aba Entrar."
          : "Não foi possível criar a conta: " + error.message,
      );
      return;
    }
    if (!data.session) {
      setEmailEnviado(true);
      return;
    }
    void navigate({ to: "/", replace: true });
  }

  async function entrarComGoogle() {
    setOcupado(true);
    const resultado = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (resultado.error) {
      setOcupado(false);
      toast.error("Não foi possível entrar com o Google.");
      return;
    }
    if (resultado.redirected) return;
    void navigate({ to: "/", replace: true });
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="text-deep-foreground" style={{ background: "var(--gradient-deep)" }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
          <Link
            to="/"
            className="flex items-center gap-2 text-xs tracking-[0.22em] uppercase opacity-80"
          >
            <Radar className="size-4" />
            Eu Passo
          </Link>
          <Link to="/" className="text-xs underline underline-offset-4 opacity-80">
            Usar sem conta
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-10">
        {emailEnviado ? (
          <Card>
            <CardHeader>
              <h1 className="font-display text-xl font-semibold">Confirme seu e-mail</h1>
              <p className="text-sm text-muted-foreground">
                Enviamos um link de confirmação para <strong>{novoEmail}</strong>. Depois de
                confirmar, volte aqui e entre com seu e-mail e senha.
              </p>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" onClick={() => setEmailEnviado(false)}>
                Voltar
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="space-y-1">
              <h1 className="font-display text-2xl font-semibold">Sua conta no Eu passo</h1>
              <p className="text-sm text-muted-foreground">
                Com conta, currículo, histórico de notas e vagas ficam salvos e acompanham você em
                qualquer dispositivo.
              </p>
            </CardHeader>
            <CardContent className="space-y-5">
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => void entrarComGoogle()}
                disabled={ocupado}
              >
                <GoogleIcon />
                Continuar com Google
              </Button>

              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                ou com e-mail
                <span className="h-px flex-1 bg-border" />
              </div>

              <Tabs defaultValue="entrar">
                <TabsList className="mb-4 w-full">
                  <TabsTrigger value="entrar" className="flex-1">
                    Entrar
                  </TabsTrigger>
                  <TabsTrigger value="criar" className="flex-1">
                    Criar conta
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="entrar">
                  <form className="space-y-4" onSubmit={(e) => void entrar(e)}>
                    <div className="space-y-2">
                      <Label htmlFor="entrar-email">E-mail</Label>
                      <Input
                        id="entrar-email"
                        type="email"
                        required
                        autoComplete="email"
                        value={entrarEmail}
                        onChange={(e) => setEntrarEmail(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="entrar-senha">Senha</Label>
                      <Input
                        id="entrar-senha"
                        type="password"
                        required
                        autoComplete="current-password"
                        value={entrarSenha}
                        onChange={(e) => setEntrarSenha(e.target.value)}
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={ocupado}>
                      {ocupado ? <Loader2 className="size-4 animate-spin" /> : null}
                      Entrar
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="criar">
                  <form className="space-y-4" onSubmit={(e) => void criarConta(e)}>
                    <div className="space-y-2">
                      <Label htmlFor="novo-nome">Nome</Label>
                      <Input
                        id="novo-nome"
                        required
                        autoComplete="name"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        placeholder="Maria Silva"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="novo-cargo">Cargo desejado</Label>
                      <Input
                        id="novo-cargo"
                        value={cargo}
                        onChange={(e) => setCargo(e.target.value)}
                        placeholder="Analista de Dados Pleno"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="novo-email">E-mail</Label>
                      <Input
                        id="novo-email"
                        type="email"
                        required
                        autoComplete="email"
                        value={novoEmail}
                        onChange={(e) => setNovoEmail(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nova-senha">Senha</Label>
                      <Input
                        id="nova-senha"
                        type="password"
                        required
                        autoComplete="new-password"
                        value={novaSenha}
                        onChange={(e) => setNovaSenha(e.target.value)}
                        placeholder="Mínimo de 6 caracteres"
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={ocupado}>
                      {ocupado ? <Loader2 className="size-4 animate-spin" /> : null}
                      Criar conta
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
```

## `src/routes/candidaturas.tsx`

```tsx
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  AlertCircle,
  Building2,
  ExternalLink,
  KanbanSquare,
  Loader2,
  MessageSquareText,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Rodape } from "@/components/rodape";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { abrirLinkExterno } from "@/lib/abrir-link";
import { useAuth } from "@/lib/auth";
import {
  atualizarCandidatura,
  criarCandidatura,
  excluirCandidatura,
  listarCandidaturas,
  STATUS_CANDIDATURA,
  vagasParaImportar,
  type Candidatura,
  type StatusCandidatura,
} from "@/lib/candidaturas.functions";

export const Route = createFileRoute("/candidaturas")({
  head: () => ({
    meta: [
      { title: "Candidaturas — acompanhe cada vaga até a resposta | Eu Passo" },
      {
        name: "description",
        content:
          "Quadro de candidaturas do Eu Passo: mova cada vaga entre triagem, entrevista e oferta, anote detalhes e receba lembrete de follow-up.",
      },
      { property: "og:title", content: "Candidaturas — Eu Passo" },
      {
        property: "og:description",
        content: "Acompanhe cada vaga do envio à oferta, com anotações e lembretes de follow-up.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://eupasso.lovable.app/candidaturas" }],
  }),
  component: PaginaCandidaturas,
});

const ROTULOS: Record<StatusCandidatura, string> = {
  interessado: "Interessado",
  enviada: "Candidatura enviada",
  triagem: "Triagem",
  entrevista: "Entrevista",
  teste: "Teste / case",
  oferta: "Oferta",
  recusado: "Recusado",
};

const DIAS_PARADO = 7;

function diasDesde(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

function parado(c: Candidatura) {
  if (c.status === "oferta" || c.status === "recusado" || c.status === "interessado") return false;
  return diasDesde(c.updated_at) >= DIAS_PARADO;
}

function PaginaCandidaturas() {
  const { user, carregando } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!carregando && !user) void navigate({ to: "/auth" });
  }, [carregando, user, navigate]);

  if (carregando || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <Quadro />;
}

function Quadro() {
  const listar = useServerFn(listarCandidaturas);
  const criar = useServerFn(criarCandidatura);
  const atualizar = useServerFn(atualizarCandidatura);
  const excluir = useServerFn(excluirCandidatura);
  const importaveis = useServerFn(vagasParaImportar);
  const qc = useQueryClient();

  const { data: candidaturas = [], isLoading } = useQuery({
    queryKey: ["candidaturas"],
    queryFn: () => listar(),
  });

  const { data: vagas = [] } = useQuery({
    queryKey: ["candidaturas-importaveis"],
    queryFn: () => importaveis(),
  });

  const invalidar = () => {
    void qc.invalidateQueries({ queryKey: ["candidaturas"] });
    void qc.invalidateQueries({ queryKey: ["candidaturas-importaveis"] });
  };

  const mCriar = useMutation({
    mutationFn: criarCandidaturaWrapper,
    onSuccess: () => {
      invalidar();
      toast.success("Candidatura adicionada.");
    },
    onError: () => toast.error("Não foi possível adicionar."),
  });

  async function criarCandidaturaWrapper(dados: Parameters<typeof criar>[0]["data"]) {
    return criar({ data: dados });
  }

  const mMover = useMutation({
    mutationFn: (v: { id: string; status: StatusCandidatura }) =>
      atualizar({ data: { id: v.id, status: v.status } }),
    onSuccess: () => invalidar(),
    onError: () => toast.error("Não foi possível mover o cartão."),
  });

  const mSalvar = useMutation({
    mutationFn: (v: { id: string; notas: string; proximoPassoEm: string | null }) =>
      atualizar({ data: v }),
    onSuccess: () => {
      invalidar();
      toast.success("Cartão atualizado.");
    },
    onError: () => toast.error("Não foi possível salvar."),
  });

  const mExcluir = useMutation({
    mutationFn: (id: string) => excluir({ data: { id } }),
    onSuccess: () => {
      invalidar();
      toast.success("Candidatura removida.");
    },
  });

  const [arrastando, setArrastando] = useState<string | null>(null);
  const [detalhe, setDetalhe] = useState<Candidatura | null>(null);

  const porStatus = useMemo(() => {
    const mapa = Object.fromEntries(
      STATUS_CANDIDATURA.map((s) => [s, [] as Candidatura[]]),
    ) as Record<StatusCandidatura, Candidatura[]>;
    for (const c of candidaturas) (mapa[c.status] ?? mapa.interessado).push(c);
    return mapa;
  }, [candidaturas]);

  const atrasadas = candidaturas.filter(parado).length;

  return (
    <AppShell titulo="Candidaturas" descricao="Acompanhe cada vaga até a resposta">
      <header className="text-deep-foreground" style={{ background: "var(--gradient-deep)" }}>
        <div className="mx-auto max-w-7xl px-5 py-8">
          <h1 className="flex items-center gap-2 font-display text-2xl font-bold sm:text-3xl">
            <KanbanSquare className="size-6" />
            Candidaturas
          </h1>
          <p className="mt-2 max-w-2xl text-sm opacity-80">
            Cada vaga do envio até a resposta. Arraste os cartões entre as colunas e anote o que
            combinou com o recrutador.
          </p>
          {atrasadas > 0 ? (
            <p className="mt-2 flex items-center gap-1.5 text-xs opacity-90">
              <AlertCircle className="size-3.5" />
              {atrasadas} candidatura{atrasadas > 1 ? "s" : ""} sem novidade há {DIAS_PARADO} dias
              ou mais — vale um follow-up.
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <NovaCandidaturaDialog
              vagas={vagas}
              onCriar={(d) => mCriar.mutate(d)}
              salvando={mCriar.isPending}
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-8">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-7">
            {STATUS_CANDIDATURA.map((status) => (
              <div
                key={status}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (arrastando) mMover.mutate({ id: arrastando, status });
                  setArrastando(null);
                }}
                className="flex min-h-40 flex-col gap-2 rounded-xl border bg-secondary/30 p-2"
              >
                <p className="px-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  {ROTULOS[status]}{" "}
                  <span className="text-foreground">{porStatus[status].length}</span>
                </p>
                {porStatus[status].map((c) => (
                  <button
                    key={c.id}
                    draggable
                    onDragStart={() => setArrastando(c.id)}
                    onClick={() => setDetalhe(c)}
                    className="cursor-grab rounded-lg border bg-card p-2.5 text-left transition-shadow hover:shadow-md active:cursor-grabbing"
                  >
                    <p className="line-clamp-2 text-sm font-medium">{c.titulo}</p>
                    {c.empresa ? (
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <Building2 className="size-3" />
                        <span className="truncate">{c.empresa}</span>
                      </p>
                    ) : null}
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {c.compatibilidade > 0 ? (
                        <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[11px] text-primary">
                          {c.compatibilidade}%
                        </span>
                      ) : null}
                      {c.fonte ? (
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
                          {c.fonte}
                        </span>
                      ) : null}
                      {parado(c) ? (
                        <span className="rounded bg-destructive/15 px-1.5 py-0.5 text-[11px] text-destructive">
                          {diasDesde(c.updated_at)}d parado
                        </span>
                      ) : null}
                      {c.notas ? (
                        <MessageSquareText className="size-3 text-muted-foreground" />
                      ) : null}
                    </div>
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}

        {!isLoading && candidaturas.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Nenhuma candidatura ainda. Adicione manualmente ou importe uma vaga do radar.
          </p>
        ) : null}
      </main>

      <DetalheDialog
        candidatura={detalhe}
        aoFechar={() => setDetalhe(null)}
        aoSalvar={(v) => {
          mSalvar.mutate(v);
          setDetalhe(null);
        }}
        aoExcluir={(id) => {
          mExcluir.mutate(id);
          setDetalhe(null);
        }}
        salvando={mSalvar.isPending}
      />

      <Rodape />
    </AppShell>
  );
}

function NovaCandidaturaDialog({
  vagas,
  onCriar,
  salvando,
}: {
  vagas: Awaited<ReturnType<typeof vagasParaImportar>>;
  onCriar: (dados: {
    titulo: string;
    empresa: string;
    link: string;
    fonte: string;
    local: string;
    requisitos: string;
    compatibilidade: number;
    vagaId: string | null;
  }) => void;
  salvando: boolean;
}) {
  const [aberto, setAberto] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [link, setLink] = useState("");

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-4" />
          Nova candidatura
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display">Adicionar candidatura</DialogTitle>
          <DialogDescription>
            Importe uma vaga do radar ou cadastre manualmente uma vaga que você encontrou por fora.
          </DialogDescription>
        </DialogHeader>

        {vagas.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
              Do seu radar
            </p>
            <div className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
              {vagas.map((v) => (
                <div
                  key={v.vagaId}
                  className="flex items-center justify-between gap-2 rounded-md border p-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{v.titulo}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {v.empresa || "—"} · {v.fonte} · {v.compatibilidade}%
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={salvando}
                    onClick={() => {
                      onCriar({
                        titulo: v.titulo,
                        empresa: v.empresa,
                        link: v.link,
                        fonte: v.fonte,
                        local: v.local,
                        requisitos: v.descricao,
                        compatibilidade: v.compatibilidade,
                        vagaId: v.vagaId,
                      });
                      setAberto(false);
                    }}
                  >
                    Adicionar
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="space-y-3 border-t pt-4">
          <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            Manual
          </p>
          <div className="space-y-2">
            <Label htmlFor="cand-titulo">Cargo</Label>
            <Input id="cand-titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cand-empresa">Empresa</Label>
              <Input
                id="cand-empresa"
                value={empresa}
                onChange={(e) => setEmpresa(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cand-link">Link da vaga</Label>
              <Input id="cand-link" value={link} onChange={(e) => setLink(e.target.value)} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            disabled={!titulo.trim() || salvando}
            onClick={() => {
              onCriar({
                titulo,
                empresa,
                link,
                fonte: "manual",
                local: "",
                requisitos: "",
                compatibilidade: 0,
                vagaId: null,
              });
              setTitulo("");
              setEmpresa("");
              setLink("");
              setAberto(false);
            }}
          >
            {salvando ? <Loader2 className="size-4 animate-spin" /> : null}
            Adicionar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DetalheDialog({
  candidatura,
  aoFechar,
  aoSalvar,
  aoExcluir,
  salvando,
}: {
  candidatura: Candidatura | null;
  aoFechar: () => void;
  aoSalvar: (v: { id: string; notas: string; proximoPassoEm: string | null }) => void;
  aoExcluir: (id: string) => void;
  salvando: boolean;
}) {
  const [notas, setNotas] = useState("");
  const [data, setData] = useState("");

  useEffect(() => {
    setNotas(candidatura?.notas ?? "");
    setData(candidatura?.proximo_passo_em ? candidatura.proximo_passo_em.slice(0, 10) : "");
  }, [candidatura]);

  if (!candidatura) return null;

  return (
    <Dialog open onOpenChange={(v) => !v && aoFechar()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">{candidatura.titulo}</DialogTitle>
          <DialogDescription>
            {candidatura.empresa || "Empresa não informada"}
            {candidatura.local ? ` · ${candidatura.local}` : ""} · {ROTULOS[candidatura.status]}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {candidatura.link ? (
            <Button variant="outline" size="sm" onClick={() => abrirLinkExterno(candidatura.link)}>
              <ExternalLink className="size-4" />
              Abrir vaga original
            </Button>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="cand-notas">Anotações</Label>
            <Textarea
              id="cand-notas"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Nome do recrutador, o que foi combinado, pretensão informada…"
              className="min-h-32"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cand-data">Próximo passo em</Label>
            <Input
              id="cand-data"
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
            />
          </div>

          <Button asChild variant="secondary" size="sm">
            <Link to="/entrevista/$id" params={{ id: candidatura.id }}>
              <Sparkles className="size-4" />
              Preparar entrevista para esta vaga
            </Link>
          </Button>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="ghost"
            className="text-destructive"
            onClick={() => aoExcluir(candidatura.id)}
          >
            <Trash2 className="size-4" />
            Excluir
          </Button>
          <Button
            disabled={salvando}
            onClick={() =>
              aoSalvar({
                id: candidatura.id,
                notas,
                proximoPassoEm: data ? new Date(`${data}T12:00:00`).toISOString() : null,
              })
            }
          >
            {salvando ? <Loader2 className="size-4 animate-spin" /> : null}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

## `src/routes/conquistas.tsx`

```tsx
import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/app-shell";
import { ConquistasPanel } from "@/components/conquistas-panel";
import { Rodape } from "@/components/rodape";
import { useDadosApp } from "@/lib/use-dados";

export const Route = createFileRoute("/conquistas")({
  head: () => ({
    meta: [
      { title: "Banco de conquistas STAR para entrevistas | Eu Passo" },
      {
        name: "description",
        content:
          "Transforme sua experiência em conquistas no formato STAR e tenha respostas prontas para entrevistas e para o currículo.",
      },
      { property: "og:title", content: "Banco de conquistas STAR | Eu Passo" },
      {
        property: "og:description",
        content:
          "Situação, Tarefa, Ação e Resultado: conquistas geradas do seu currículo para usar em entrevistas.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ConquistasPage,
});

function ConquistasPage() {
  const { curriculo } = useDadosApp();

  return (
    <AppShell titulo="Conquistas" descricao="Banco de histórias STAR">
      <main className="mx-auto max-w-6xl space-y-5 px-4 py-5 sm:px-5 sm:py-6">
        <div>
          <h1 className="font-display text-lg font-semibold sm:text-xl">Banco de conquistas</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Suas histórias em formato STAR, prontas para entrevistas e para o currículo.
          </p>
        </div>

        <ConquistasPanel curriculo={curriculo} />

        <Rodape />
      </main>
    </AppShell>
  );
}
```

## `src/routes/demo.tsx`

```tsx
import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Radar } from "lucide-react";

import { CurriculoPanel } from "@/components/curriculo-panel";
import { Button } from "@/components/ui/button";
import { ANALISE_EXEMPLO } from "@/lib/analise-exemplo";
import type { AtsAnalysis } from "@/lib/ats.schemas";
import { CURRICULO_EXEMPLO } from "@/lib/curriculo-exemplo";
import type { EntradaHistorico } from "@/components/historico-analises";

const TITULO = "Demonstração: análise ATS de um currículo real";
const DESCRICAO =
  "Veja como a análise ATS funciona usando um currículo de exemplo já preenchido — nota, travas de triagem, palavras-chave ausentes e reescritas, sem enviar seus dados.";

export const Route = createFileRoute("/demo")({
  head: () => ({
    meta: [
      { title: `${TITULO} | Eu passo` },
      { name: "description", content: DESCRICAO },
      { property: "og:title", content: TITULO },
      { property: "og:description", content: DESCRICAO },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://eupasso.lovable.app/demo" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://eupasso.lovable.app/demo" }],
  }),
  component: Demo,
});

function Demo() {
  const [texto, setTexto] = useState(CURRICULO_EXEMPLO);
  const [analise, setAnalise] = useState<AtsAnalysis | null>(ANALISE_EXEMPLO);
  const [historico, setHistorico] = useState<EntradaHistorico[]>([
    {
      id: "demo-1",
      criadaEm: new Date().toISOString(),
      score: ANALISE_EXEMPLO.score,
      resumo: ANALISE_EXEMPLO.resumo,
      problemas: ANALISE_EXEMPLO.problemasAts.length,
    },
  ]);

  return (
    <div className="min-h-screen bg-background">
      <header className="text-deep-foreground" style={{ background: "var(--gradient-deep)" }}>
        <div className="mx-auto max-w-6xl px-5 py-8 sm:py-12">
          <div className="flex items-center justify-between gap-4">
            <Link
              to="/"
              className="flex items-center gap-2 text-xs tracking-[0.22em] uppercase opacity-70"
            >
              <Radar className="size-4" />
              Eu Passo
            </Link>
            <Button asChild variant="secondary" size="sm">
              <Link to="/">
                <ArrowLeft className="size-4" />
                Usar com meu currículo
              </Link>
            </Button>
          </div>
          <h1 className="mt-4 max-w-2xl font-display text-3xl leading-tight font-bold sm:text-4xl">
            Demonstração pública: teste sem enviar seus dados
          </h1>
          <p className="mt-3 max-w-2xl text-sm opacity-80 sm:text-base">
            Esta página já vem com um currículo fictício e a análise pronta. Explore as abas, os
            destaques no texto e as reescritas — e, se quiser, clique em{" "}
            <strong>Analisar para ATS</strong> para rodar a análise de verdade neste exemplo. Nada
            aqui é salvo na sua conta.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8 sm:py-10">
        <CurriculoPanel
          texto={texto}
          setTexto={setTexto}
          analise={analise}
          setAnalise={setAnalise}
          historico={historico}
          setHistorico={setHistorico}
        />
        <div className="mt-10 rounded-lg border bg-secondary/30 p-5 text-center">
          <p className="font-display text-lg font-semibold">Pronto para o seu currículo?</p>
          <p className="mt-1 text-sm text-muted-foreground">
            A análise real leva menos de um minuto e aponta exatamente o que corrigir antes de se
            candidatar.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link to="/">Analisar meu currículo</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/guia-ats">Ler o guia ATS</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
```

## `src/routes/entrevista.$id.tsx`

```tsx
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, FileText, Loader2, Lock, MessagesSquare, Sparkles, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Rodape } from "@/components/rodape";
import { ScoreRing } from "@/components/score-ring";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import {
  avaliarResposta,
  carregarPreparo,
  gerarRoteiroEntrevista,
  type FeedbackResposta,
  type RoteiroEntrevista,
} from "@/lib/entrevista.functions";
import { exportarPdf } from "@/lib/exportar-curriculo";

export const Route = createFileRoute("/entrevista/$id")({
  head: () => ({
    meta: [
      { title: "Preparação para entrevista com IA | Eu Passo" },
      {
        name: "description",
        content:
          "Roteiro de entrevista provável para a vaga, respostas em formato STAR baseadas no seu currículo e treino com feedback da IA.",
      },
      { property: "og:title", content: "Preparação para entrevista — Eu Passo" },
      {
        property: "og:description",
        content: "Perguntas prováveis, respostas STAR e treino com feedback da IA.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PaginaEntrevista,
});

const TIPO: Record<string, string> = {
  tecnica: "Técnica",
  comportamental: "Comportamental",
  lacuna: "Lacuna",
  cultura: "Cultura",
};

function PaginaEntrevista() {
  const { id } = Route.useParams();
  const { user, carregando } = useAuth();
  const navigate = useNavigate();
  const buscar = useServerFn(carregarPreparo);
  const gerar = useServerFn(gerarRoteiroEntrevista);
  const qc = useQueryClient();

  useEffect(() => {
    if (!carregando && !user) void navigate({ to: "/auth" });
  }, [carregando, user, navigate]);

  const { data, isLoading } = useQuery({
    queryKey: ["preparo", id],
    queryFn: () => buscar({ data: { candidaturaId: id } }),
    enabled: !!user,
  });

  const mGerar = useMutation({
    mutationFn: () => gerar({ data: { candidaturaId: id } }),
    onSuccess: (r) => {
      if ("error" in r) {
        toast.error(r.error);
        return;
      }
      void qc.invalidateQueries({ queryKey: ["preparo", id] });
      toast.success("Roteiro pronto.");
    },
    onError: () => toast.error("Não foi possível gerar o roteiro agora."),
  });

  const roteiro = data?.roteiro ?? null;

  function baixarPdf() {
    if (!roteiro || !data) return;
    const linhas = [
      `Preparação de entrevista — ${data.candidatura.titulo}`,
      data.candidatura.empresa ? `Empresa: ${data.candidatura.empresa}` : "",
      "",
      roteiro.resumoDaVaga,
      "",
      "PONTOS FORTES",
      ...roteiro.pontosFortes.map((p) => `- ${p}`),
      "",
      "PERGUNTAS PROVÁVEIS",
      ...roteiro.perguntas.flatMap((p) => [
        `\n[${TIPO[p.tipo] ?? p.tipo}] ${p.pergunta}`,
        `Por que vem: ${p.porQueVemAqui}`,
        `S: ${p.respostaStar.situacao}`,
        `T: ${p.respostaStar.tarefa}`,
        `A: ${p.respostaStar.acao}`,
        `R: ${p.respostaStar.resultado}`,
      ]),
      "",
      "PERGUNTAS PARA VOCÊ FAZER",
      ...roteiro.perguntasParaFazer.map((p) => `- ${p}`),
      "",
      "PRETENSÃO SALARIAL",
      roteiro.salario.faixaSugerida,
      roteiro.salario.comoResponder,
      "",
      "CONSELHO FINAL",
      roteiro.conselhoFinal,
    ].join("\n");

    const nome = `entrevista-${data.candidatura.titulo}`
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .slice(0, 70);
    exportarPdf(linhas, `${nome}.pdf`);
    toast.success("PDF gerado.");
  }

  if (carregando || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-5 text-center">
        <p className="text-sm text-muted-foreground">Candidatura não encontrada.</p>
        <Button asChild variant="outline">
          <Link to="/candidaturas">Voltar ao quadro</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="text-deep-foreground" style={{ background: "var(--gradient-deep)" }}>
        <div className="mx-auto max-w-5xl px-5 py-8">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-deep-foreground hover:bg-white/10"
          >
            <Link to="/candidaturas">
              <ArrowLeft className="size-4" />
              Voltar ao quadro
            </Link>
          </Button>
          <h1 className="mt-4 flex items-center gap-2 font-display text-2xl font-bold sm:text-3xl">
            <MessagesSquare className="size-6" />
            Preparação para entrevista
          </h1>
          <p className="mt-2 text-sm opacity-80">
            {data.candidatura.titulo}
            {data.candidatura.empresa ? ` · ${data.candidatura.empresa}` : ""}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" onClick={() => mGerar.mutate()} disabled={mGerar.isPending}>
              {mGerar.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Sparkles className="size-4" />
              )}
              {roteiro ? "Gerar novamente" : "Gerar roteiro"}
            </Button>
            {roteiro ? (
              <Button size="sm" variant="secondary" onClick={baixarPdf}>
                <FileText className="size-4" />
                Baixar PDF
              </Button>
            ) : null}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-8">
        {data.bloqueado ? (
          <Card className="mb-4 border-primary/40">
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Lock className="size-4 text-primary" />A preparação para entrevista faz parte do Eu
                Passo Pro.
              </p>
              <Button asChild size="sm">
                <Link to="/planos">Ver planos</Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {roteiro ? (
          <Roteiro roteiro={roteiro} cargo={data.candidatura.titulo} bloqueado={data.bloqueado} />
        ) : (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Clique em “Gerar roteiro” para receber as perguntas prováveis desta vaga com respostas
            baseadas no seu currículo.
          </p>
        )}
      </main>

      <Rodape />
    </div>
  );
}

function Roteiro({
  roteiro,
  cargo,
  bloqueado,
}: {
  roteiro: RoteiroEntrevista;
  cargo: string;
  bloqueado: boolean;
}) {
  return (
    <Tabs defaultValue="perguntas">
      <TabsList className="mb-4">
        <TabsTrigger value="perguntas">Perguntas ({roteiro.perguntas.length})</TabsTrigger>
        <TabsTrigger value="riscos">Lacunas ({roteiro.riscos.length})</TabsTrigger>
        <TabsTrigger value="fechamento">Fechamento</TabsTrigger>
      </TabsList>

      <TabsContent value="perguntas" className="space-y-3">
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">
            {roteiro.resumoDaVaga}
            {roteiro.pontosFortes.length ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {roteiro.pontosFortes.map((p) => (
                  <span
                    key={p}
                    className="rounded-full bg-primary/12 px-2.5 py-1 text-xs text-primary"
                  >
                    {p}
                  </span>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>

        {roteiro.perguntas.map((p) => (
          <PerguntaCard key={p.pergunta} p={p} cargo={cargo} bloqueado={bloqueado} />
        ))}
      </TabsContent>

      <TabsContent value="riscos" className="space-y-3">
        {roteiro.riscos.map((r) => (
          <Card key={r.lacuna}>
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-base">{r.lacuna}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">{r.comoResponder}</CardContent>
          </Card>
        ))}
      </TabsContent>

      <TabsContent value="fechamento" className="space-y-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-base">Perguntas para você fazer</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
              {roteiro.perguntasParaFazer.map((q) => (
                <li key={q}>{q}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 font-display text-base">
              <Wallet className="size-4 text-primary" />
              Pretensão salarial
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">{roteiro.salario.faixaSugerida}</p>
            <p>{roteiro.salario.comoResponder}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-base">Conselho final</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {roteiro.conselhoFinal}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

function PerguntaCard({
  p,
  cargo,
  bloqueado,
}: {
  p: RoteiroEntrevista["perguntas"][number];
  cargo: string;
  bloqueado: boolean;
}) {
  const avaliar = useServerFn(avaliarResposta);
  const [treino, setTreino] = useState(false);
  const [resposta, setResposta] = useState("");
  const [feedback, setFeedback] = useState<FeedbackResposta | null>(null);
  const [avaliando, setAvaliando] = useState(false);

  async function enviar() {
    setAvaliando(true);
    try {
      const r = await avaliar({ data: { pergunta: p.pergunta, resposta, cargo } });
      if ("error" in r) {
        toast.error(r.error);
        return;
      }
      setFeedback(r);
    } catch {
      toast.error("Não foi possível avaliar agora.");
    } finally {
      setAvaliando(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="font-display text-base leading-snug">{p.pergunta}</CardTitle>
          <span className="shrink-0 rounded bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
            {TIPO[p.tipo] ?? p.tipo}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p className="text-muted-foreground">{p.porQueVemAqui}</p>
        <div className="grid gap-2 rounded-lg border bg-secondary/30 p-3 sm:grid-cols-2">
          <Bloco titulo="Situação" texto={p.respostaStar.situacao} />
          <Bloco titulo="Tarefa" texto={p.respostaStar.tarefa} />
          <Bloco titulo="Ação" texto={p.respostaStar.acao} />
          <Bloco titulo="Resultado" texto={p.respostaStar.resultado} />
        </div>

        {!treino ? (
          <Button size="sm" variant="outline" onClick={() => setTreino(true)} disabled={bloqueado}>
            Treinar minha resposta
          </Button>
        ) : (
          <div className="space-y-2">
            <Textarea
              value={resposta}
              onChange={(e) => setResposta(e.target.value)}
              placeholder="Escreva a resposta com suas palavras…"
              className="min-h-28"
            />
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={() => setTreino(false)}>
                Fechar
              </Button>
              <Button
                size="sm"
                disabled={resposta.trim().length < 20 || avaliando}
                onClick={() => void enviar()}
              >
                {avaliando ? <Loader2 className="size-4 animate-spin" /> : null}
                Avaliar resposta
              </Button>
            </div>

            {feedback ? (
              <div className="space-y-3 rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <ScoreRing valor={feedback.nota} tamanho={64} />
                  <p className="text-xs text-muted-foreground">Nota da sua resposta</p>
                </div>
                {feedback.pontosBons.length ? (
                  <div>
                    <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                      Funcionou
                    </p>
                    <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                      {feedback.pontosBons.map((b) => (
                        <li key={b}>{b}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {feedback.ajustes.length ? (
                  <div>
                    <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                      Ajuste
                    </p>
                    <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                      {feedback.ajustes.map((a) => (
                        <li key={a}>{a}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                <div>
                  <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                    Versão melhorada
                  </p>
                  <p className="mt-1 text-sm">{feedback.versaoMelhorada}</p>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Bloco({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
        {titulo}
      </p>
      <p className="mt-0.5 text-sm">{texto}</p>
    </div>
  );
}
```

## `src/routes/extensao.tsx`

```tsx
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Check, Chrome, Copy, Loader2, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { ExtensaoCard } from "@/components/extensao-card";
import { Rodape } from "@/components/rodape";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import {
  criarConexaoExtensao,
  listarConexoesExtensao,
  revogarConexaoExtensao,
  type ConexaoExtensao,
} from "@/lib/extensao.functions";

export const Route = createFileRoute("/extensao")({
  head: () => ({
    meta: [
      { title: "Extensão do navegador — conecte sua conta | Eu Passo" },
      {
        name: "description",
        content:
          "Conecte a extensão do Eu Passo à sua conta e analise qualquer vaga aberta no navegador usando o currículo já salvo, sem colar nada.",
      },
      { property: "og:title", content: "Extensão do navegador — Eu Passo" },
      {
        property: "og:description",
        content:
          "Conecte a extensão à sua conta e analise vagas no LinkedIn, Gupy, Indeed e outros com um clique.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Pagina,
});

function Pagina() {
  const { user, carregando } = useAuth();
  const listar = useServerFn(listarConexoesExtensao);
  const criar = useServerFn(criarConexaoExtensao);
  const revogar = useServerFn(revogarConexaoExtensao);

  const [conexoes, setConexoes] = useState<ConexaoExtensao[]>([]);
  const [token, setToken] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const recarregar = useCallback(async () => {
    if (!user) return;
    try {
      setConexoes(await listar({}));
    } catch {
      /* silencioso */
    }
  }, [listar, user]);

  useEffect(() => {
    void recarregar();
  }, [recarregar]);

  async function gerar() {
    setOcupado(true);
    try {
      const { token: novo } = await criar({ data: { dispositivo: "Extensão do navegador" } });
      setToken(novo);
      await recarregar();
      toast.success("Código gerado. Cole na extensão.");
    } catch {
      toast.error("Não foi possível gerar o código.");
    } finally {
      setOcupado(false);
    }
  }

  async function remover(id: string) {
    try {
      await revogar({ data: { id } });
      await recarregar();
      toast.success("Conexão revogada.");
    } catch {
      toast.error("Não foi possível revogar.");
    }
  }

  function copiar() {
    void navigator.clipboard.writeText(token).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    });
  }

  return (
    <AppShell titulo="Extensão" descricao="Analise vagas direto no navegador">
      <main className="mx-auto max-w-4xl space-y-6 px-5 py-8">
        <Card className="shadow-[var(--shadow-panel)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-base">
              <Chrome className="size-4" />
              Conectar a extensão à sua conta
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Com a conta conectada, a extensão usa o currículo já salvo no Eu Passo — você não
              precisa mais colar o texto — e pode salvar a vaga direto nas suas candidaturas.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {carregando ? (
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            ) : !user ? (
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>Entre na sua conta para gerar o código de conexão.</p>
                <Button asChild size="sm">
                  <Link to="/auth">Entrar / criar conta</Link>
                </Button>
              </div>
            ) : (
              <>
                <Button onClick={() => void gerar()} disabled={ocupado} className="gap-2">
                  {ocupado ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Plus className="size-4" />
                  )}
                  Gerar código de conexão
                </Button>

                {token ? (
                  <div className="rounded-lg border border-border bg-muted/40 p-3">
                    <p className="text-xs text-muted-foreground">
                      Copie e cole na extensão. Este código aparece só uma vez.
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <code className="min-w-0 flex-1 truncate rounded bg-background px-2 py-1.5 text-xs">
                        {token}
                      </code>
                      <Button size="sm" variant="secondary" onClick={copiar} className="gap-1.5">
                        {copiado ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                        {copiado ? "Copiado" : "Copiar"}
                      </Button>
                    </div>
                  </div>
                ) : null}

                <div className="space-y-2">
                  <p className="text-sm font-medium">Conexões ativas</p>
                  {conexoes.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhuma conexão ativa ainda.</p>
                  ) : (
                    <ul className="divide-y divide-border rounded-lg border border-border">
                      {conexoes.map((c) => (
                        <li key={c.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                          <span className="min-w-0 flex-1 truncate">{c.dispositivo}</span>
                          <span className="text-xs text-muted-foreground">
                            {c.ultimo_uso_em
                              ? `usada em ${new Date(c.ultimo_uso_em).toLocaleDateString("pt-BR")}`
                              : "nunca usada"}
                          </span>
                          <Button
                            size="icon"
                            variant="ghost"
                            aria-label="Revogar conexão"
                            onClick={() => void remover(c.id)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <ExtensaoCard />
      </main>
      <Rodape />
    </AppShell>
  );
}
```

## `src/routes/game.tsx`

```tsx
import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/app-shell";
import { GamePanel } from "@/components/game-panel";
import { Rodape } from "@/components/rodape";

export const Route = createFileRoute("/game")({
  head: () => ({
    meta: [
      { title: "Quest — treine currículo, entrevista e LinkedIn | Eu Passo" },
      {
        name: "description",
        content:
          "Jogo com perguntas objetivas e desafios escritos sobre currículo, ATS, entrevistas e LinkedIn. Errou? A IA te ensina na hora.",
      },
      { property: "og:title", content: "Quest | Eu Passo" },
      {
        property: "og:description",
        content:
          "Rodadas rápidas com pontuação, dicas e resposta modelo para você aprender a conquistar a vaga.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GamePage,
});

function GamePage() {
  return (
    <AppShell titulo="Quest" descricao="Aprenda jogando sobre carreira e seleção">
      <main className="mx-auto max-w-6xl space-y-5 px-4 py-5 sm:px-5 sm:py-6">
        <div>
          <h1 className="font-display text-lg font-semibold sm:text-xl">Quest</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Perguntas objetivas e desafios escritos. Quando você não souber, a gente ensina.
          </p>
        </div>

        <GamePanel />

        <Rodape />
      </main>
    </AppShell>
  );
}
```

## `src/routes/guia-ats.tsx`

```tsx
import { AppShell } from "@/components/app-shell";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TITULO = "Currículo ATS: guia completo com exemplos prontos (2026)";
const DESCRICAO =
  "Como montar um currículo aprovado por sistemas ATS: formatação, palavras-chave, seções obrigatórias, erros que travam a triagem e amostras de currículo antes e depois.";
const URL = "https://eupasso.lovable.app/guia-ats";

const FAQ = [
  {
    p: "O que é um sistema ATS?",
    r: "ATS (Applicant Tracking System) é o software que empresas usam para receber, ler e ranquear currículos. Ele converte o arquivo em texto, extrai seções como experiência e formação e compara o conteúdo com a descrição da vaga antes de qualquer pessoa ver o documento.",
  },
  {
    p: "Qual o melhor formato de arquivo para currículo ATS?",
    r: "PDF gerado a partir de um editor de texto (não digitalizado) ou DOCX. Evite currículos exportados como imagem, pois o ATS não consegue extrair o texto.",
  },
  {
    p: "Currículo em duas colunas passa no ATS?",
    r: "Frequentemente não. Muitos parsers leem o documento da esquerda para a direita e embaralham o conteúdo das colunas. Uma coluna única é a opção segura.",
  },
  {
    p: "Quantas palavras-chave devo incluir?",
    r: "Use os termos exatos que aparecem na descrição da vaga, distribuídos naturalmente em resumo, experiência e competências. Repetir a mesma palavra dezenas de vezes não aumenta a nota e prejudica a leitura humana.",
  },
  {
    p: "Currículo pode ter foto?",
    r: "No Brasil não é obrigatório e, em ATS, a foto costuma ser ignorada ou atrapalhar a extração do cabeçalho. Prefira deixar de fora.",
  },
];

const CHECKLIST = [
  ["Uma coluna, sem tabelas, caixas de texto ou imagens", true],
  ["Fontes comuns (Arial, Calibri, Helvetica) entre 10 e 12pt", true],
  ["Títulos de seção padrão: Resumo, Experiência, Formação, Competências", true],
  ["Datas no formato MM/AAAA em todas as experiências", true],
  ["Bullets com verbo de ação + resultado numérico", true],
  [
    "Palavras-chave da vaga escritas por extenso e por sigla (ex.: BI e Business Intelligence)",
    true,
  ],
  ["Cabeçalho com contato dentro do corpo do documento, não no header do Word", true],
  ["Gráficos de barra para nível de idioma ou habilidade", false],
  ["Ícones no lugar de texto para telefone e e-mail", false],
  ["Currículo digitalizado ou exportado como imagem", false],
  ["Seção OBJETIVO genérica no topo", false],
] as const;

const ANTES = `OBJETIVO
Trabalhar com dados em uma empresa inovadora.

EXPERIÊNCIA
Analista de Dados Jr. — Varejo Alfa (2022 - atual)
- Responsável por dashboards no Power BI
- Ajudou na criação de relatórios mensais
- Fez consultas em SQL`;

const DEPOIS = `RESUMO PROFISSIONAL
Analista de Dados com 3 anos de experiência em Power BI, SQL e automação
de relatórios para áreas comerciais no varejo.

EXPERIÊNCIA PROFISSIONAL
Analista de Dados Jr. — Varejo Alfa | 03/2022 - atual
- Construí 12 dashboards em Power BI (DAX) usados semanalmente pela diretoria,
  reduzindo em 6h/semana a consolidação manual
- Automatizei a rotina de extração diária em SQL sobre base de 4M+ registros
- Padronizei 20 KPIs comerciais junto a marketing e logística

COMPETÊNCIAS TÉCNICAS
Power BI (DAX), SQL, ETL, modelagem de dados, Excel avançado, Python (básico)`;

export const Route = createFileRoute("/guia-ats")({
  head: () => ({
    meta: [
      { title: TITULO },
      { name: "description", content: DESCRICAO },
      { property: "og:title", content: TITULO },
      { property: "og:description", content: DESCRICAO },
      { property: "og:type", content: "article" },
      { property: "og:url", content: URL },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Article",
              headline: TITULO,
              description: DESCRICAO,
              inLanguage: "pt-BR",
              mainEntityOfPage: URL,
            },
            {
              "@type": "FAQPage",
              mainEntity: FAQ.map((f) => ({
                "@type": "Question",
                name: f.p,
                acceptedAnswer: { "@type": "Answer", text: f.r },
              })),
            },
          ],
        }),
      },
    ],
  }),
  component: Guia,
});

function Guia() {
  return (
    <AppShell titulo="Guia ATS" descricao="Como passar pelos robôs de triagem">
      <header className="text-deep-foreground" style={{ background: "var(--gradient-deep)" }}>
        <div className="mx-auto max-w-3xl px-5 py-10 sm:py-14">
          <h1 className="font-display text-3xl leading-tight font-bold sm:text-4xl">
            Currículo ATS: guia completo com exemplos prontos
          </h1>
          <p className="mt-3 text-sm opacity-80 sm:text-base">
            Tudo o que faz um currículo ser lido (ou descartado) pelos robôs de triagem —
            formatação, palavras-chave, seções e amostras de antes e depois que você pode copiar.
          </p>
          <Button asChild className="mt-6" variant="secondary">
            <Link to="/demo">
              Ver a análise em uma demonstração
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-12 px-5 py-10 sm:py-14">
        <section>
          <h2 className="font-display text-2xl font-semibold">Como o ATS lê o seu currículo</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Antes de chegar a um recrutador, o arquivo passa por três etapas:{" "}
            <strong>extração</strong> (o texto é retirado do PDF ou DOCX), <strong>parsing</strong>{" "}
            (o sistema tenta identificar cabeçalho, experiência, formação e competências) e{" "}
            <strong>ranqueamento</strong> (o conteúdo é comparado com a descrição da vaga). Qualquer
            elemento visual que atrapalhe a etapa 1 ou 2 — colunas, tabelas, ícones, texto dentro de
            imagem — faz o currículo chegar incompleto na etapa 3, mesmo que você tenha a
            experiência certa.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-semibold">Checklist ATS</h2>
          <div className="mt-4 grid gap-2">
            {CHECKLIST.map(([item, bom]) => (
              <div
                key={item}
                className="flex items-start gap-2 rounded-md border bg-card p-3 text-sm"
              >
                {bom ? (
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                ) : (
                  <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
                )}
                <span className={bom ? "" : "text-muted-foreground"}>{item}</span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-display text-2xl font-semibold">Amostra: antes e depois</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            O mesmo profissional, dois currículos. O da direita ganha em palavras-chave, verbos de
            ação e resultados numéricos — os três sinais que mais pesam na triagem.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Card className="border-destructive/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-destructive">Antes — trava no ATS</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="overflow-x-auto font-mono text-[11px] leading-relaxed whitespace-pre-wrap">
                  {ANTES}
                </pre>
              </CardContent>
            </Card>
            <Card className="border-primary/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-primary">Depois — pronto para triagem</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="overflow-x-auto font-mono text-[11px] leading-relaxed whitespace-pre-wrap">
                  {DEPOIS}
                </pre>
              </CardContent>
            </Card>
          </div>
        </section>

        <section>
          <h2 className="font-display text-2xl font-semibold">
            Estrutura recomendada, seção por seção
          </h2>
          <ol className="mt-4 space-y-3 text-sm leading-relaxed">
            <li>
              <strong>1. Cabeçalho</strong> — nome, cidade/estado, telefone, e-mail e LinkedIn em
              texto simples, dentro do corpo do documento.
            </li>
            <li>
              <strong>2. Resumo profissional</strong> — 3 linhas com cargo-alvo, tempo de
              experiência e principais ferramentas. Substitui o antigo "Objetivo".
            </li>
            <li>
              <strong>3. Experiência</strong> — cargo, empresa, MM/AAAA e 3 a 5 bullets no formato
              verbo de ação + o que fez + resultado numérico.
            </li>
            <li>
              <strong>4. Competências técnicas</strong> — só o que é técnico e verificável, com os
              termos exatos da vaga.
            </li>
            <li>
              <strong>5. Formação e certificações</strong> — curso, instituição e período;
              certificações relevantes com o nome oficial.
            </li>
            <li>
              <strong>6. Projetos</strong> (opcional, essencial para quem está começando) — o que
              construiu, com qual stack e qual resultado.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="font-display text-2xl font-semibold">Palavras-chave: como escolher</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Junte de 3 a 5 anúncios da vaga que você quer e marque os termos que se repetem. Inclua
            sigla e forma por extenso na primeira menção (ex.: "Business Intelligence (BI)"), use o
            vocabulário do setor no lugar do vocabulário interno da sua empresa e coloque as
            palavras mais importantes no resumo e nos primeiros bullets — é onde o ranqueamento dá
            mais peso.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-semibold">Perguntas frequentes</h2>
          <div className="mt-4 space-y-4">
            {FAQ.map((f) => (
              <div key={f.p}>
                <h3 className="text-sm font-semibold">{f.p}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{f.r}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border bg-secondary/30 p-6 text-center">
          <p className="font-display text-lg font-semibold">
            Descubra em 1 minuto o que trava o seu currículo
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Nota ATS, travas de triagem, palavras-chave ausentes e reescritas prontas.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link to="/">Analisar meu currículo</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/demo">Ver demonstração</Link>
            </Button>
          </div>
        </section>
      </main>
    </AppShell>
  );
}
```

## `src/routes/ia.tsx`

```tsx
import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowLeft, Bot, Eye, ShieldCheck } from "lucide-react";

import { Rodape } from "@/components/rodape";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/ia")({
  head: () => ({
    meta: [
      { title: "Como o Eu Passo usa inteligência artificial" },
      {
        name: "description",
        content:
          "O que é gerado por IA no Eu Passo, quais são os limites conhecidos e por que revisar cada documento antes de enviar ao recrutador.",
      },
      { property: "og:title", content: "Como o Eu Passo usa inteligência artificial" },
      {
        property: "og:description",
        content:
          "Transparência sobre o que a IA gera, seus limites e o que continua sob sua decisão.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://eupasso.lovable.app/ia" }],
  }),
  component: PaginaIa,
});

const blocos = [
  {
    icone: Bot,
    titulo: "O que a IA gera",
    itens: [
      "Nota ATS do currículo e lista de problemas de formatação e conteúdo.",
      "Compatibilidade entre o currículo e cada vaga, com lacunas e palavras-chave faltantes.",
      "Currículo revisado, currículo sob medida por vaga e carta de apresentação.",
      "Análise do perfil do LinkedIn e da conta Gupy.",
      "Roteiro de preparação para entrevista e feedback das respostas de treino.",
    ],
  },
  {
    icone: AlertTriangle,
    titulo: "Limites conhecidos",
    itens: [
      "A nota é uma estimativa: cada empresa configura o próprio ATS de um jeito.",
      "Modelos podem interpretar mal trechos ambíguos ou muito abreviados.",
      "A cobertura de vagas depende do que os portais publicam abertamente.",
      "Vagas encerradas podem aparecer até a próxima revalidação.",
    ],
  },
  {
    icone: ShieldCheck,
    titulo: "O que nunca fazemos",
    itens: [
      "Inventar experiências, formações ou resultados que não estão no seu material.",
      "Candidatar você automaticamente a qualquer vaga.",
      "Enviar seus dados a recrutadores ou anunciantes.",
    ],
  },
  {
    icone: Eye,
    titulo: "Sua parte",
    itens: [
      "Leia o documento gerado antes de enviar — sempre.",
      "Confira números, datas e nomes de empresas.",
      "Ajuste o tom para o seu jeito de escrever: recrutador percebe texto genérico.",
    ],
  },
];

function PaginaIa() {
  return (
    <div className="min-h-screen bg-background">
      <header className="text-deep-foreground" style={{ background: "var(--gradient-deep)" }}>
        <div className="mx-auto max-w-4xl px-5 py-10">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-deep-foreground hover:bg-white/10"
          >
            <Link to="/">
              <ArrowLeft className="size-4" />
              Voltar
            </Link>
          </Button>
          <h1 className="mt-4 font-display text-3xl font-bold">
            Como usamos inteligência artificial
          </h1>
          <p className="mt-2 max-w-2xl text-sm opacity-80">
            Transparência total: o que a máquina faz, onde ela erra e o que continua sendo sua
            decisão.
          </p>
        </div>
      </header>

      <main className="mx-auto grid max-w-4xl gap-4 px-5 py-10 sm:grid-cols-2">
        {blocos.map((b) => (
          <Card key={b.titulo}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 font-display text-base">
                <b.icone className="size-4 text-primary" />
                {b.titulo}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
                {b.itens.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </main>

      <Rodape />
    </div>
  );
}
```

## `src/routes/index.tsx`

```tsx
import { AppShell } from "@/components/app-shell";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Briefcase,
  Cloud,
  FileText,
  GraduationCap,
  Linkedin,
  PlayCircle,
  Radar,
  Target,
} from "lucide-react";
import { PainelHoje } from "@/components/painel-hoje";
import { ComparadorVagas } from "@/components/comparador-vagas";
import { CursosPanel } from "@/components/cursos-panel";



import { useLocalState } from "@/lib/use-local-state";

import { Rodape } from "@/components/rodape";

import { CurriculoPanel } from "@/components/curriculo-panel";
import { LinkedinPanel } from "@/components/linkedin-panel";
import { GupyPanel } from "@/components/gupy-panel";
import type { PerfilLinkedin } from "@/lib/linkedin.functions";
import type { PerfilGupy } from "@/lib/gupy.functions";
import { Button } from "@/components/ui/button";

import { VagasPanel } from "@/components/vagas-panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDadosApp } from "@/lib/use-dados";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Eu passo — Currículo aprovado no ATS e vagas rastreadas" },
      {
        name: "description",
        content:
          "Analise seu currículo para sistemas ATS, corrija o que trava a triagem automática e meça a compatibilidade com cada vaga.",
      },
      { property: "og:title", content: "Eu passo — Currículo aprovado no ATS e vagas rastreadas" },
      {
        property: "og:description",
        content:
          "Analise seu currículo para sistemas ATS, corrija o que trava a triagem automática e meça a compatibilidade com cada vaga.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://eupasso.lovable.app/" },
    ],
    links: [{ rel: "canonical", href: "https://eupasso.lovable.app/" }],
  }),
  component: Index,
});

function Index() {
  const {
    curriculo,
    setCurriculo,
    analise,
    setAnalise,
    historico,
    setHistorico,
    vagas,
    setVagas,
    sincronizando,
    naNuvem,
  } = useDadosApp();
  const [perfilLinkedin, setPerfilLinkedin] = useLocalState<PerfilLinkedin | null>(
    "eupasso:perfil-linkedin",
    null,
  );
  const [perfilGupy, setPerfilGupy] = useLocalState<PerfilGupy | null>("eupasso:perfil-gupy", null);

  return (
    <AppShell
      titulo="Painel do candidato"
      descricao="Currículo, vagas, LinkedIn e Gupy em um só lugar"
    >
      <header className="border-b border-border bg-card">
        <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-5 py-4 sm:flex sm:justify-between">
          <div className="min-w-0">
            <h1 className="truncate font-display text-lg font-semibold sm:text-xl">
              Passe pelos robôs de triagem
            </h1>
            <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
              {sincronizando ? <Cloud className="size-3.5 shrink-0 animate-pulse" /> : null}
              {sincronizando
                ? "Sincronizando…"
                : naNuvem
                  ? "Salvo na sua conta e sincronizado."
                  : "Dados apenas neste navegador."}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Button asChild size="sm">
              <Link to="/radar">
                <Radar className="size-4" />
                <span className="max-sm:sr-only">Radar de vagas</span>
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to="/demo">
                <PlayCircle className="size-4" />
                <span className="max-sm:sr-only">Demonstração</span>
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-5 px-4 py-5 sm:px-5 sm:py-6">
        <PainelHoje analise={analise} vagas={vagas} />

        <Tabs defaultValue="curriculo">
          <TabsList className="mb-4 flex max-w-full overflow-x-auto">
            <TabsTrigger value="curriculo" className="gap-2">
              <FileText className="size-4 shrink-0" />
              Currículo
            </TabsTrigger>
            <TabsTrigger value="vagas" className="gap-2">
              <Target className="size-4 shrink-0" />
              <span className="max-sm:sr-only">Rastreio de </span>Vagas
              {vagas.length > 0 ? (
                <span className="numeros ml-1 rounded-full bg-primary/12 px-1.5 text-xs text-primary">
                  {vagas.length}
                </span>
              ) : null}
            </TabsTrigger>
            <TabsTrigger value="cursos" className="gap-2">
              <GraduationCap className="size-4 shrink-0" />
              Cursos
            </TabsTrigger>


            <TabsTrigger value="linkedin" className="gap-2">
              <Linkedin className="size-4 shrink-0" />
              LinkedIn
              {perfilLinkedin ? (
                <span className="numeros ml-1 rounded-full bg-primary/12 px-1.5 text-xs text-primary">
                  {perfilLinkedin.nota}
                </span>
              ) : null}
            </TabsTrigger>
            <TabsTrigger value="gupy" className="gap-2">
              <Briefcase className="size-4 shrink-0" />
              Gupy
              {perfilGupy ? (
                <span className="numeros ml-1 rounded-full bg-primary/12 px-1.5 text-xs text-primary">
                  {perfilGupy.nota}
                </span>
              ) : null}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="curriculo">
            <CurriculoPanel
              texto={curriculo}
              setTexto={setCurriculo}
              analise={analise}
              setAnalise={setAnalise}
              historico={historico}
              setHistorico={setHistorico}
            />
          </TabsContent>

          <TabsContent value="vagas" className="space-y-4">
            <ComparadorVagas vagas={vagas} />
            <VagasPanel curriculo={curriculo} vagas={vagas} setVagas={setVagas} />
          </TabsContent>

          <TabsContent value="cursos">
            <CursosPanel curriculo={curriculo} setCurriculo={setCurriculo} />
          </TabsContent>




          <TabsContent value="linkedin">
            <LinkedinPanel perfil={perfilLinkedin} setPerfil={setPerfilLinkedin} />
          </TabsContent>

          <TabsContent value="gupy">
            <GupyPanel perfil={perfilGupy} setPerfil={setPerfilGupy} />
          </TabsContent>
        </Tabs>
      </main>

      <Rodape />
    </AppShell>
  );
}
```

## `src/routes/perfil.tsx`

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, CreditCard, Mail, UserRound } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { CentralDados } from "@/components/central-dados";
import { PaymentTestModeBanner } from "@/components/payment-test-mode-banner";
import { PlanosPanel } from "@/components/planos-panel";
import { Rodape } from "@/components/rodape";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth";
import { useAssinatura } from "@/lib/use-assinatura";

export const Route = createFileRoute("/perfil")({
  head: () => ({
    meta: [
      { title: "Meu perfil — conta, plano e dados | Eu Passo" },
      {
        name: "description",
        content:
          "Veja os dados da sua conta no Eu Passo, tempo de uso, situação da assinatura, forma de pagamento e controles de privacidade.",
      },
      { property: "og:title", content: "Meu perfil — conta e plano | Eu Passo" },
      {
        property: "og:description",
        content:
          "Conta, assinatura, forma de pagamento e controle dos seus dados em um só lugar.",
      },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PerfilPage,
});

function dataBr(valor?: string | null) {
  if (!valor) return "—";
  return new Date(valor).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

const ROTULO_STATUS: Record<string, string> = {
  active: "Ativa",
  trialing: "Em teste",
  past_due: "Pagamento pendente",
  canceled: "Cancelada",
};

function PerfilPage() {
  const { user } = useAuth();
  const { assinatura, ativa, carregando } = useAssinatura();

  const criadoEm = user?.created_at ?? null;
  const diasDeUso = criadoEm
    ? Math.max(
        1,
        Math.floor((Date.now() - new Date(criadoEm).getTime()) / 86_400_000) + 1,
      )
    : 0;

  return (
    <AppShell titulo="Meu perfil" descricao="Conta, assinatura e dados">
      <PaymentTestModeBanner />
      <main className="mx-auto max-w-5xl space-y-5 px-4 py-5 sm:px-5 sm:py-6">
        <div>
          <h1 className="font-display text-lg font-semibold sm:text-xl">Meu perfil</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Tudo sobre a sua conta: acesso, tempo de uso, plano e privacidade.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-start gap-3 py-4">
              <Mail className="mt-0.5 size-4 shrink-0 text-primary" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{user?.email ?? "—"}</p>
                <p className="text-xs text-muted-foreground">E-mail de acesso</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-start gap-3 py-4">
              <CalendarDays className="mt-0.5 size-4 shrink-0 text-primary" />
              <div>
                <p className="font-display text-lg font-semibold tabular-nums">{diasDeUso}</p>
                <p className="text-xs text-muted-foreground">
                  dias de uso · desde {dataBr(criadoEm)}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-start gap-3 py-4">
              <CreditCard className="mt-0.5 size-4 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-medium">
                  {carregando
                    ? "Verificando…"
                    : ativa
                      ? "Eu Passo Pro"
                      : "Plano gratuito"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {assinatura
                    ? `${ROTULO_STATUS[assinatura.status] ?? assinatura.status}${
                        assinatura.current_period_end
                          ? ` · ${assinatura.cancel_at_period_end ? "encerra" : "renova"} em ${dataBr(assinatura.current_period_end)}`
                          : ""
                      }`
                    : "Sem assinatura ativa"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="conta">
          <TabsList className="mb-4 flex max-w-full overflow-x-auto">
            <TabsTrigger value="conta" className="gap-2">
              <UserRound className="size-4 shrink-0" />
              Conta e dados
            </TabsTrigger>
            <TabsTrigger value="plano" className="gap-2">
              <CreditCard className="size-4 shrink-0" />
              Plano e pagamento
            </TabsTrigger>
          </TabsList>

          <TabsContent value="conta" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="font-display text-base">Dados da conta</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">E-mail</p>
                  <p className="break-all">{user?.email ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Conta criada em</p>
                  <p>{dataBr(criadoEm)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Último acesso</p>
                  <p>{dataBr(user?.last_sign_in_at ?? null)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Forma de entrada</p>
                  <p className="capitalize">{user?.app_metadata?.provider ?? "e-mail"}</p>
                </div>
              </CardContent>
            </Card>

            <CentralDados />
          </TabsContent>

          <TabsContent value="plano">
            <PlanosPanel />
          </TabsContent>
        </Tabs>

        <Rodape />
      </main>
    </AppShell>
  );
}
```

## `src/routes/planos.tsx`

```tsx
import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/app-shell";
import { PaymentTestModeBanner } from "@/components/payment-test-mode-banner";
import { PlanosPanel } from "@/components/planos-panel";

export const Route = createFileRoute("/planos")({
  head: () => ({
    meta: [
      { title: "Planos do Eu Passo — Radar de vagas com IA a partir de R$ 10" },
      {
        name: "description",
        content:
          "Assine o Eu Passo Pro e receba, todos os dias, as vagas mais compatíveis com o seu currículo nas principais plataformas do Brasil.",
      },
      { property: "og:title", content: "Planos do Eu Passo — Radar de vagas com IA" },
      {
        property: "og:description",
        content:
          "Radar automático de vagas compatíveis com o seu currículo. Mensal, trimestral, semestral ou anual.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://eupasso.lovable.app/planos" }],
  }),
  component: Planos,
});

function Planos() {
  return (
    <AppShell titulo="Planos" descricao="Assinatura Eu Passo">
      <PaymentTestModeBanner />
      <header className="text-deep-foreground" style={{ background: "var(--gradient-deep)" }}>
        <div className="mx-auto max-w-5xl px-5 py-10">
          <div className="max-w-2xl">
            <h1 className="font-display text-2xl leading-tight sm:text-3xl">
              Um recrutador de IA procurando vagas para você todos os dias
            </h1>
            <p className="mt-3 text-sm leading-relaxed opacity-85">
              O radar varre as plataformas confiáveis, compara cada anúncio com o seu currículo e
              mostra só o que realmente vale a sua candidatura. Você continua se aplicando — nós
              tiramos o garimpo do caminho.
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-5 sm:py-10">
        <PlanosPanel />
      </main>
    </AppShell>
  );
}
```

## `src/routes/privacidade.tsx`

```tsx
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { Rodape } from "@/components/rodape";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Política de privacidade (LGPD) — Eu Passo" },
      {
        name: "description",
        content:
          "Como o Eu Passo trata seus dados: quais informações coletamos, por quanto tempo guardamos e como exportar ou excluir tudo.",
      },
      { property: "og:title", content: "Política de privacidade — Eu Passo" },
      {
        property: "og:description",
        content: "Tratamento de dados, base legal, retenção e seus direitos como titular (LGPD).",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://eupasso.lovable.app/privacidade" }],
  }),
  component: Privacidade,
});

function Privacidade() {
  return (
    <div className="min-h-screen bg-background">
      <header className="text-deep-foreground" style={{ background: "var(--gradient-deep)" }}>
        <div className="mx-auto max-w-3xl px-5 py-10">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-deep-foreground hover:bg-white/10"
          >
            <Link to="/">
              <ArrowLeft className="size-4" />
              Voltar
            </Link>
          </Button>
          <h1 className="mt-4 font-display text-3xl font-bold">Política de privacidade</h1>
          <p className="mt-2 text-sm opacity-80">
            Escrita conforme a Lei Geral de Proteção de Dados (Lei 13.709/2018).
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-8 px-5 py-10 text-sm leading-relaxed text-muted-foreground">
        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold text-foreground">
            Quais dados tratamos
          </h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>Cadastro: e-mail, nome e cargo desejado.</li>
            <li>
              Conteúdo enviado por você: texto do currículo, PDFs do LinkedIn e da conta Gupy.
            </li>
            <li>Preferências de busca: cargos, senioridade, localidade, modelo de trabalho.</li>
            <li>Uso do produto: vagas analisadas, candidaturas acompanhadas, notas geradas.</li>
            <li>
              Assinatura: status, plano e período — o pagamento é processado pelo provedor, que
              guarda os dados do cartão. Nós não armazenamos dados de cartão.
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold text-foreground">Para que usamos</h2>
          <p>
            Exclusivamente para prestar o serviço: analisar seu currículo, buscar e pontuar vagas,
            gerar documentos e alertas. Não vendemos, alugamos nem compartilhamos seus dados com
            recrutadores ou anunciantes.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold text-foreground">Base legal</h2>
          <p>
            Execução de contrato (art. 7º, V) para os recursos que você solicita, e consentimento
            (art. 7º, I) para o envio de alertas por e-mail, que pode ser desativado a qualquer
            momento nas preferências do radar.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold text-foreground">
            Inteligência artificial
          </h2>
          <p>
            Os textos que você envia são processados por modelos de IA de terceiros para gerar as
            análises. O conteúdo é usado apenas para produzir a resposta solicitada. Recomendamos
            não incluir dados sensíveis (CPF, RG, dados de saúde, biometria) no currículo enviado.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold text-foreground">
            Compartilhamento anônimo
          </h2>
          <p>
            Links de análise compartilhável são públicos e anônimos: removemos nome, e-mail e
            telefone antes de publicar. Só existem se você criar o link.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold text-foreground">Retenção</h2>
          <p>
            Guardamos seus dados enquanto a conta existir. Vagas do radar seguem a janela de
            postagem configurada (7 a 60 dias) e são arquivadas depois disso. Ao excluir a conta,
            tudo é apagado de forma definitiva.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold text-foreground">Seus direitos</h2>
          <p>
            Você pode acessar, corrigir, exportar e excluir seus dados diretamente no aplicativo:
            abra <strong className="text-foreground">Seu perfil</strong> e use a seção{" "}
            <strong className="text-foreground">Meus dados</strong> para baixar tudo em JSON ou
            excluir a conta.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold text-foreground">Segurança</h2>
          <p>
            Os dados ficam isolados por conta no banco, com regras de acesso por usuário. Somente
            você enxerga o seu conteúdo.
          </p>
        </section>
      </main>

      <Rodape />
    </div>
  );
}
```

## `src/routes/progresso.tsx`

```tsx
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, TrendingUp } from "lucide-react";
import { useEffect } from "react";

import { Rodape } from "@/components/rodape";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { carregarProgresso, type Progresso } from "@/lib/progresso.functions";

export const Route = createFileRoute("/progresso")({
  head: () => ({
    meta: [
      { title: "Progresso — evolução do currículo e das candidaturas | Eu Passo" },
      {
        name: "description",
        content:
          "Acompanhe a evolução da sua nota ATS, a compatibilidade média das vagas e o funil de candidaturas até a oferta.",
      },
      { property: "og:title", content: "Progresso — Eu Passo" },
      {
        property: "og:description",
        content: "Nota ATS ao longo do tempo, compatibilidade média e funil de candidaturas.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://eupasso.lovable.app/progresso" }],
  }),
  component: PaginaProgresso,
});

const ROTULO_FUNIL: Record<string, string> = {
  enviada: "Enviadas",
  triagem: "Triagem",
  entrevista: "Entrevista",
  teste: "Teste / case",
  oferta: "Oferta",
  recusado: "Recusadas",
};

function PaginaProgresso() {
  const { user, carregando } = useAuth();
  const navigate = useNavigate();
  const buscar = useServerFn(carregarProgresso);

  useEffect(() => {
    if (!carregando && !user) void navigate({ to: "/auth" });
  }, [carregando, user, navigate]);

  const { data, isLoading } = useQuery({
    queryKey: ["progresso"],
    queryFn: () => buscar(),
    enabled: !!user,
  });

  return (
    <AppShell titulo="Progresso" descricao="Métricas do seu processo de busca">
      <header className="text-deep-foreground" style={{ background: "var(--gradient-deep)" }}>
        <div className="mx-auto max-w-5xl px-5 py-8">
          <h1 className="flex items-center gap-2 font-display text-2xl font-bold sm:text-3xl">
            <TrendingUp className="size-6" />
            Seu progresso
          </h1>
          <p className="mt-2 max-w-2xl text-sm opacity-80">
            O que mudou desde a primeira análise: nota do currículo, qualidade das vagas e resposta
            do mercado.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-4 px-5 py-8">
        {isLoading || !data ? (
          <div className="flex justify-center py-16">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ConteudoProgresso p={data} />
        )}
      </main>

      <Rodape />
    </AppShell>
  );
}

function ConteudoProgresso({ p }: { p: Progresso }) {
  const ganho =
    p.scoreAtual !== null && p.scoreInicial !== null ? p.scoreAtual - p.scoreInicial : null;
  const maxFunil = Math.max(1, ...p.funil.map((f) => f.total));

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metrica
          rotulo="Nota ATS atual"
          valor={p.scoreAtual !== null ? `${p.scoreAtual}` : "—"}
          detalhe={
            ganho !== null
              ? `${ganho >= 0 ? "+" : ""}${ganho} desde a primeira análise`
              : "Rode uma análise"
          }
        />
        <Metrica
          rotulo="Vagas analisadas"
          valor={`${p.vagasAnalisadas}`}
          detalhe={`${p.semana.vagasNovas} nos últimos 7 dias`}
        />
        <Metrica
          rotulo="Compatibilidade média"
          valor={`${p.compatibilidadeMedia}%`}
          detalhe={`melhor ${p.melhorCompatibilidade}% · pior ${p.piorCompatibilidade}%`}
        />
        <Metrica
          rotulo="Taxa de entrevista"
          valor={`${p.taxaEntrevista}%`}
          detalhe={`${p.totalCandidaturas} candidatura(s) no quadro`}
        />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-base">Evolução da nota ATS</CardTitle>
        </CardHeader>
        <CardContent>
          {p.evolucao.length < 2 ? (
            <p className="text-sm text-muted-foreground">
              Faça pelo menos duas análises do currículo para ver a curva de evolução.
            </p>
          ) : (
            <Grafico pontos={p.evolucao} />
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-base">Funil de candidaturas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {p.funil.map((f) => (
              <div key={f.status}>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{ROTULO_FUNIL[f.status]}</span>
                  <span className="font-medium">{f.total}</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-secondary">
                  <div
                    className="h-2 rounded-full bg-primary"
                    style={{ width: `${(f.total / maxFunil) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-base">
              Palavras-chave que mais faltam no seu currículo
            </CardTitle>
          </CardHeader>
          <CardContent>
            {p.palavrasFaltando.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nada a destacar ainda — analise algumas vagas para descobrir os termos recorrentes.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {p.palavrasFaltando.map((t) => (
                  <span
                    key={t.termo}
                    className="rounded-full border border-realce/30 bg-realce/10 px-2.5 py-1 text-xs text-foreground"
                  >
                    {t.termo}
                    <span className="ml-1 text-muted-foreground">{t.vezes}×</span>
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-base">Resumo da semana</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Nos últimos 7 dias: <strong className="text-foreground">{p.semana.vagasNovas}</strong>{" "}
          vaga(s) nova(s) no radar e{" "}
          <strong className="text-foreground">{p.semana.candidaturasNovas}</strong> candidatura(s)
          adicionada(s). Você tem{" "}
          <strong className="text-foreground">{p.semana.entrevistas}</strong> processo(s) em fase de
          entrevista ou adiante.
        </CardContent>
      </Card>
    </>
  );
}

function Metrica({ rotulo, valor, detalhe }: { rotulo: string; valor: string; detalhe: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs tracking-wide text-muted-foreground uppercase">{rotulo}</p>
        <p className="mt-1 font-display text-3xl font-bold">{valor}</p>
        <p className="mt-1 text-xs text-muted-foreground">{detalhe}</p>
      </CardContent>
    </Card>
  );
}

function Grafico({ pontos }: { pontos: { data: string; score: number }[] }) {
  const largura = 600;
  const altura = 160;
  const passo = largura / Math.max(1, pontos.length - 1);
  const coords = pontos.map((p, i) => ({
    x: i * passo,
    y: altura - (Math.max(0, Math.min(100, p.score)) / 100) * altura,
    ...p,
  }));
  const linha = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x},${c.y}`).join(" ");
  const area = `${linha} L${largura},${altura} L0,${altura} Z`;

  return (
    <div>
      <svg
        viewBox={`0 0 ${largura} ${altura}`}
        className="h-40 w-full"
        role="img"
        aria-label="Evolução da nota ATS"
      >
        <path d={area} fill="var(--primary)" opacity="0.12" />
        <path
          d={linha}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {coords.map((c) => (
          <circle key={c.data} cx={c.x} cy={c.y} r="4" fill="var(--primary)" />
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-xs text-muted-foreground">
        <span>
          {new Date(pontos[0]!.data).toLocaleDateString("pt-BR")} · {pontos[0]!.score}
        </span>
        <span>
          {new Date(pontos[pontos.length - 1]!.data).toLocaleDateString("pt-BR")} ·{" "}
          {pontos[pontos.length - 1]!.score}
        </span>
      </div>
    </div>
  );
}
```

## `src/routes/radar.tsx`

```tsx
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/app-shell";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ExternalLink, Loader2, Radar as RadarIcon, Eraser, Save, Sparkles } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { HistoricoVagas } from "@/components/historico-vagas";
import { RecomendacoesVagaDialog } from "@/components/recomendacoes-vaga-dialog";
import { ScoreRing } from "@/components/score-ring";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { abrirLinkExterno } from "@/lib/abrir-link";
import { useAuth } from "@/lib/auth";

import {
  atualizarStatusVaga,
  carregarPreferencias,
  limparPreferencias,
  listarVagasRadar,
  registrarAberturaVaga,
  rodarRadar,
  salvarPreferencias,
  type Preferencias,
  type VagaRadar,
} from "@/lib/radar.functions";
import { CONTRATOS, JANELAS_DIAS, JANELA_PADRAO } from "@/lib/radar.schemas";
import { useAssinatura } from "@/lib/use-assinatura";

export const Route = createFileRoute("/radar")({
  head: () => ({
    meta: [
      { title: "Radar de vagas — Eu Passo" },
      {
        name: "description",
        content:
          "Seu recrutador de IA busca vagas nas principais plataformas e ordena tudo pela compatibilidade com o seu currículo.",
      },
      { property: "og:title", content: "Radar de vagas — Eu Passo" },
      {
        property: "og:description",
        content: "Vagas compatíveis com o seu currículo, encontradas automaticamente.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RadarPagina,
});

const MODELOS = ["remoto", "híbrido", "presencial"];
const SENIORIDADES = ["qualquer", "estágio", "júnior", "pleno", "sênior", "especialista"];

const PREFS_VAZIAS: Preferencias = {
  cargos: [],
  senioridade: "qualquer",
  cidade: "",
  estado: "",
  modelos: [],
  contratos: [],
  salarioMinimo: null,
  palavrasEvitar: [],
  ativo: true,
  alertaFrequencia: "nenhum",
  janelaDias: JANELA_PADRAO,
};

function RadarPagina() {
  const { user, carregando: carregandoAuth } = useAuth();
  const { temAcessoA, carregando: carregandoAssinatura } = useAssinatura();
  const ativa = temAcessoA("radar");
  const navigate = useNavigate();

  const carregarPrefs = useServerFn(carregarPreferencias);
  const salvarPrefs = useServerFn(salvarPreferencias);
  const listar = useServerFn(listarVagasRadar);
  const rodar = useServerFn(rodarRadar);
  const mudarStatus = useServerFn(atualizarStatusVaga);
  const limparPrefs = useServerFn(limparPreferencias);
  const registrarAbertura = useServerFn(registrarAberturaVaga);

  const [prefs, setPrefs] = useState<Preferencias>(PREFS_VAZIAS);
  const [cargosTexto, setCargosTexto] = useState("");
  const [evitarTexto, setEvitarTexto] = useState("");
  const [vagas, setVagas] = useState<VagaRadar[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [fonteFiltro, setFonteFiltro] = useState<string>("todas");
  const [limpando, setLimpando] = useState(false);
  const [ordenacao, setOrdenacao] = useState<
    "compatibilidade_desc" | "compatibilidade_asc" | "recentes" | "antigas"
  >("compatibilidade_desc");
  const soRemoto = prefs.modelos.length === 1 && prefs.modelos[0] === "remoto";

  const fontes = Array.from(
    vagas.reduce((mapa, v) => {
      const nome = v.fonte || "Outros";
      mapa.set(nome, (mapa.get(nome) ?? 0) + 1);
      return mapa;
    }, new Map<string, number>()),
  ).sort((a, b) => b[1] - a[1]);

  const vagasVisiveis =
    fonteFiltro === "todas" ? vagas : vagas.filter((v) => (v.fonte || "Outros") === fonteFiltro);

  const recarregarVagas = useCallback(async () => {
    try {
      setVagas(await listar({ data: { ordenacao } }));
    } catch {
      /* sem vagas ainda */
    }
  }, [listar, ordenacao]);

  useEffect(() => {
    if (carregandoAuth) return;
    if (!user) {
      void navigate({ to: "/auth" });
      return;
    }
    void (async () => {
      try {
        const p = await carregarPrefs({});
        setPrefs(p);
        setCargosTexto(p.cargos.join(", "));
        setEvitarTexto(p.palavrasEvitar.join(", "));
      } catch {
        /* usa padrão */
      }
      await recarregarVagas();
    })();
  }, [user, carregandoAuth, carregarPrefs, navigate, recarregarVagas]);

  function paraLista(texto: string) {
    return texto
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }

  async function salvar() {
    setSalvando(true);
    try {
      const atual: Preferencias = {
        ...prefs,
        cargos: paraLista(cargosTexto),
        palavrasEvitar: paraLista(evitarTexto),
      };
      const resultado = await salvarPrefs({ data: atual });
      setPrefs(atual);
      if (resultado.limpou > 0) {
        await recarregarVagas();
        toast.success(
          `Preferências salvas. Limpamos ${resultado.limpou} vaga(s) dos cargos antigos — rode o radar de novo.`,
        );
        return;
      }
      toast.success("Preferências salvas.");
    } catch {
      toast.error("Não foi possível salvar as preferências.");
    } finally {
      setSalvando(false);
    }
  }

  async function limpar() {
    setLimpando(true);
    try {
      const resultado = await limparPrefs({});
      setPrefs(PREFS_VAZIAS);
      setCargosTexto("");
      setEvitarTexto("");
      setFonteFiltro("todas");
      await recarregarVagas();
      toast.success(
        resultado.limpou > 0
          ? `Preferências zeradas e ${resultado.limpou} vaga(s) removida(s) do radar.`
          : "Preferências zeradas.",
      );
    } catch {
      toast.error("Não foi possível limpar as preferências.");
    } finally {
      setLimpando(false);
    }
  }

  async function buscar() {
    if (!ativa) {
      toast.info("O radar automático é exclusivo para assinantes.");
      void navigate({ to: "/planos" });
      return;
    }
    setBuscando(true);
    try {
      const resultado = await rodar({});
      if ("error" in resultado) {
        toast.error(resultado.error);
        return;
      }
      await recarregarVagas();
      toast.success(
        resultado.novas > 0
          ? `${resultado.novas} nova(s) vaga(s) compatível(is) encontrada(s).`
          : "Nenhuma vaga nova por agora. Tente novamente mais tarde.",
      );
    } catch {
      toast.error("O radar falhou nesta rodada. Tente novamente em alguns minutos.");
    } finally {
      setBuscando(false);
    }
  }

  async function descartar(id: string) {
    setVagas((atual) => atual.filter((v) => v.id !== id));
    try {
      await mudarStatus({ data: { id, status: "descartada" } });
    } catch {
      toast.error("Não foi possível descartar a vaga.");
    }
  }

  return (
    <AppShell
      titulo="Radar de vagas"
      descricao="Busca automática com IA nas principais plataformas"
    >
      <header className="text-deep-foreground" style={{ background: "var(--gradient-deep)" }}>
        <div className="mx-auto max-w-6xl px-5 py-7">
          <h1 className="font-display text-2xl sm:text-3xl">
            Vagas que combinam com o seu currículo
          </h1>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-5 py-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <div className="space-y-6">
          {!ativa && !carregandoAssinatura && (
            <Card className="border-primary/40 bg-primary/5">
              <CardContent className="space-y-3 py-5">
                <p className="flex items-center gap-2 font-display text-base font-semibold">
                  <Sparkles className="size-4 text-primary" /> Radar disponível no plano Pro
                </p>
                <p className="text-sm text-muted-foreground">
                  A busca automática nas plataformas de vagas é exclusiva para assinantes. A partir
                  de R$ 10 por mês.
                </p>
                <Button onClick={() => void navigate({ to: "/planos" })}>Ver planos</Button>
              </CardContent>
            </Card>
          )}

          <Card className="h-fit shadow-[var(--shadow-panel)]">
            <CardHeader>
              <CardTitle className="font-display text-lg">Suas preferências</CardTitle>
              <p className="text-sm text-muted-foreground">
                Quanto mais específico, melhor a qualidade das vagas encontradas.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cargos">Cargos desejados (separe por vírgula)</Label>
                <Input
                  id="cargos"
                  value={cargosTexto}
                  onChange={(e) => setCargosTexto(e.target.value)}
                  placeholder="Analista de Dados, Engenheiro de Dados"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="senioridade">Senioridade</Label>
                <select
                  id="senioridade"
                  value={prefs.senioridade}
                  onChange={(e) => setPrefs({ ...prefs, senioridade: e.target.value })}
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                >
                  {SENIORIDADES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>Modelos de trabalho</Label>
                <div className="flex flex-wrap gap-2">
                  {MODELOS.map((m) => {
                    const marcado = prefs.modelos.includes(m);
                    return (
                      <Button
                        key={m}
                        type="button"
                        size="sm"
                        variant={marcado ? "default" : "secondary"}
                        onClick={() => {
                          const modelos = marcado
                            ? prefs.modelos.filter((x) => x !== m)
                            : [...prefs.modelos, m];
                          const apenasRemoto = modelos.length === 1 && modelos[0] === "remoto";
                          setPrefs({
                            ...prefs,
                            modelos,
                            ...(apenasRemoto ? { cidade: "", estado: "" } : {}),
                          });
                        }}
                      >
                        {m}
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tipo de contrato</Label>
                <div className="flex flex-wrap gap-2">
                  {CONTRATOS.map((c) => {
                    const marcado = prefs.contratos.includes(c);
                    return (
                      <Button
                        key={c}
                        type="button"
                        size="sm"
                        variant={marcado ? "default" : "secondary"}
                        onClick={() =>
                          setPrefs({
                            ...prefs,
                            contratos: marcado
                              ? prefs.contratos.filter((x) => x !== c)
                              : [...prefs.contratos, c],
                          })
                        }
                      >
                        {c}
                      </Button>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  Sem seleção, buscamos qualquer tipo de contrato.
                </p>
              </div>

              {soRemoto ? (
                <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                  Como você escolheu apenas vagas remotas, não é preciso informar cidade e estado —
                  buscamos em todo o Brasil.
                </p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="cidade">Cidade</Label>
                    <Input
                      id="cidade"
                      value={prefs.cidade}
                      onChange={(e) => setPrefs({ ...prefs, cidade: e.target.value })}
                      placeholder="São Paulo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estado">Estado</Label>
                    <Input
                      id="estado"
                      value={prefs.estado}
                      onChange={(e) => setPrefs({ ...prefs, estado: e.target.value })}
                      placeholder="SP"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="evitar">Palavras a evitar (separe por vírgula)</Label>
                <Input
                  id="evitar"
                  value={evitarTexto}
                  onChange={(e) => setEvitarTexto(e.target.value)}
                  placeholder="comissionado, porta a porta"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="janela">Janela de postagem</Label>
                <select
                  id="janela"
                  value={prefs.janelaDias}
                  onChange={(e) => setPrefs({ ...prefs, janelaDias: Number(e.target.value) })}
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                >
                  {JANELAS_DIAS.map((d) => (
                    <option key={d} value={d}>
                      Últimos {d} dias
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  Anúncios publicados fora dessa janela saem do radar automaticamente.
                </p>
              </div>

              <div className="space-y-2 rounded-lg border border-primary/30 bg-primary/5 p-3">
                <Label htmlFor="alertas">Alertas de novas vagas</Label>
                <select
                  id="alertas"
                  value={prefs.alertaFrequencia}
                  onChange={(e) =>
                    setPrefs({
                      ...prefs,
                      alertaFrequencia: e.target.value as Preferencias["alertaFrequencia"],
                    })
                  }
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                >
                  <option value="nenhum">Desligados</option>
                  <option value="diario">Diários</option>
                  <option value="semanal">Semanais</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  Rodamos o radar automaticamente e avisamos no sino do app quando aparecerem vagas
                  compatíveis.
                </p>
              </div>

              <Button
                className="w-full"
                variant="secondary"
                onClick={() => void salvar()}
                disabled={salvando}
              >
                {salvando ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                Salvar preferências
              </Button>

              <Button
                className="w-full"
                variant="ghost"
                onClick={() => void limpar()}
                disabled={limpando || salvando}
              >
                {limpando ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Eraser className="size-4" />
                )}
                Limpar preferências
              </Button>

              <Button
                className="w-full"
                variant="default"
                onClick={() => void buscar()}
                disabled={buscando || carregandoAssinatura}
              >
                {buscando ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Sparkles className="size-4" />
                )}
                {buscando ? "Procurando vagas…" : "Rodar radar agora"}
              </Button>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="radar" className="space-y-4">
          <TabsList>
            <TabsTrigger value="radar">Radar ({vagas.length})</TabsTrigger>
            <TabsTrigger value="historico">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="radar" className="space-y-4">
            {fontes.length > 1 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                  Onde estão
                </span>
                <Button
                  size="sm"
                  variant={fonteFiltro === "todas" ? "default" : "secondary"}
                  onClick={() => setFonteFiltro("todas")}
                >
                  Todas ({vagas.length})
                </Button>
                {fontes.map(([nome, total]) => (
                  <Button
                    key={nome}
                    size="sm"
                    variant={fonteFiltro === nome ? "default" : "secondary"}
                    onClick={() => setFonteFiltro(nome)}
                  >
                    {nome} ({total})
                  </Button>
                ))}
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                Ordenar por
              </span>
              <select
                value={ordenacao}
                onChange={(e) => {
                  const nova = e.target.value as typeof ordenacao;
                  setOrdenacao(nova);
                  void recarregarVagas();
                }}
                className="h-8 rounded-md border border-input bg-transparent px-2 text-sm"
              >
                <option value="compatibilidade_desc">Maior compatibilidade</option>
                <option value="compatibilidade_asc">Menor compatibilidade</option>
                <option value="recentes">Mais recentes</option>
                <option value="antigas">Mais antigas</option>
              </select>
            </div>
            {vagasVisiveis.length === 0 ? (
              <Card className="flex min-h-80 items-center justify-center border-dashed shadow-none">
                <CardContent className="max-w-sm py-12 text-center">
                  <RadarIcon className="mx-auto size-6 text-muted-foreground" />
                  <p className="mt-3 font-display text-base font-semibold">
                    {vagas.length > 0 ? "Nada nesta plataforma" : "Nenhuma vaga no radar ainda"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {vagas.length > 0
                      ? "Nenhuma vaga desta plataforma no momento. Escolha outra fonte acima."
                      : "Salve suas preferências e rode o radar para receber as vagas mais compatíveis com o seu currículo."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              vagasVisiveis.map((vaga) => (
                <Card key={vaga.id} className="shadow-[var(--shadow-panel)]">
                  <CardContent className="flex flex-col gap-5 py-6 sm:flex-row">
                    <ScoreRing valor={vaga.compatibilidade} tamanho={96} legenda="Match" />
                    <div className="min-w-0 flex-1 space-y-3">
                      <div>
                        <p className="font-display text-base font-semibold">{vaga.titulo}</p>
                        <p className="text-sm text-muted-foreground">
                          {[vaga.empresa, vaga.local, vaga.modelo].filter(Boolean).join(" · ") ||
                            vaga.fonte}
                        </p>
                      </div>
                      <p className="text-sm leading-relaxed">{vaga.motivo}</p>
                      {vaga.lacunas.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                            O que pode pesar contra
                          </p>
                          <ul className="mt-1 list-disc space-y-1 pl-5">
                            {vaga.lacunas.map((l) => (
                              <li key={l} className="text-sm text-muted-foreground">
                                {l}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            abrirLinkExterno(vaga.link);
                            void registrarAbertura({ data: { id: vaga.id } }).catch(() => {});
                          }}
                        >
                          Abrir vaga <ExternalLink className="size-3" />
                        </Button>

                        <RecomendacoesVagaDialog
                          vagaId={vaga.id}
                          titulo={vaga.titulo}
                          compatibilidade={vaga.compatibilidade}
                        />
                        <span className="text-xs text-muted-foreground">via {vaga.fonte}</span>
                        <Button size="sm" variant="ghost" onClick={() => void descartar(vaga.id)}>
                          Descartar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="historico">
            <HistoricoVagas />
          </TabsContent>
        </Tabs>
      </main>
    </AppShell>
  );
}
```

## `src/routes/termos.tsx`

```tsx
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { Rodape } from "@/components/rodape";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/termos")({
  head: () => ({
    meta: [
      { title: "Termos de uso — Eu Passo" },
      {
        name: "description",
        content:
          "Condições de uso do Eu Passo: assinatura, uso da IA, responsabilidades do usuário e cancelamento.",
      },
      { property: "og:title", content: "Termos de uso — Eu Passo" },
      {
        property: "og:description",
        content: "Condições de uso, assinatura, uso da IA e cancelamento do Eu Passo.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://eupasso.lovable.app/termos" }],
  }),
  component: Termos,
});

function Termos() {
  return (
    <div className="min-h-screen bg-background">
      <header className="text-deep-foreground" style={{ background: "var(--gradient-deep)" }}>
        <div className="mx-auto max-w-3xl px-5 py-10">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-deep-foreground hover:bg-white/10"
          >
            <Link to="/">
              <ArrowLeft className="size-4" />
              Voltar
            </Link>
          </Button>
          <h1 className="mt-4 font-display text-3xl font-bold">Termos de uso</h1>
          <p className="mt-2 text-sm opacity-80">Última atualização: agosto de 2026.</p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-8 px-5 py-10 text-sm leading-relaxed text-muted-foreground">
        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold text-foreground">
            1. O que é o Eu Passo
          </h2>
          <p>
            O Eu Passo é uma ferramenta de apoio à busca de emprego. Ele analisa currículos e perfis
            profissionais para sistemas de triagem automatizada (ATS), calcula compatibilidade com
            vagas, gera versões otimizadas de currículo e cartas, e reúne vagas publicadas
            publicamente em portais de emprego.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold text-foreground">2. Uso da conta</h2>
          <p>
            Você é responsável pelas informações que insere e por manter suas credenciais seguras. É
            proibido enviar dados de terceiros sem autorização, conteúdo ilegal ou tentar burlar os
            limites técnicos da plataforma.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold text-foreground">
            3. Conteúdo gerado por IA
          </h2>
          <p>
            Notas, recomendações, currículos e cartas são gerados por modelos de inteligência
            artificial e podem conter imprecisões. Nenhum resultado é garantia de aprovação,
            entrevista ou contratação. Revise todo material antes de enviá-lo a um recrutador. Veja
            os detalhes em{" "}
            <Link to="/ia" className="text-primary underline">
              como usamos IA
            </Link>
            .
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold text-foreground">
            4. Vagas e candidaturas
          </h2>
          <p>
            As vagas exibidas vêm de fontes públicas e podem estar desatualizadas ou encerradas. O
            Eu Passo nunca se candidata por você: a candidatura acontece sempre no site original da
            vaga, sob sua decisão.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold text-foreground">
            5. Assinatura e cancelamento
          </h2>
          <p>
            Os recursos Pro (radar de vagas com IA, analisador de LinkedIn, analisador de conta Gupy
            e preparação para entrevista) exigem assinatura ativa. A cobrança é recorrente conforme
            o plano escolhido e pode ser cancelada a qualquer momento, mantendo o acesso até o fim
            do período já pago. Consulte os valores em{" "}
            <Link to="/planos" className="text-primary underline">
              planos
            </Link>
            .
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold text-foreground">
            6. Limitação de responsabilidade
          </h2>
          <p>
            O serviço é fornecido no estado em que se encontra. Não nos responsabilizamos por
            decisões de recrutamento, perda de oportunidades ou indisponibilidade temporária de
            fontes externas de vagas.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold text-foreground">7. Encerramento</h2>
          <p>
            Você pode excluir sua conta e todos os seus dados a qualquer momento, pela central de
            dados dentro do seu perfil. A exclusão é definitiva.
          </p>
        </section>
      </main>

      <Rodape />
    </div>
  );
}
```

## `src/routes/trilha.tsx`

```tsx
import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/app-shell";
import { RoadmapPanel } from "@/components/roadmap-panel";
import { Rodape } from "@/components/rodape";
import { useDadosApp } from "@/lib/use-dados";

export const Route = createFileRoute("/trilha")({
  head: () => ({
    meta: [
      { title: "Trilha de conhecimentos — plano de estudos por ritmo | Eu Passo" },
      {
        name: "description",
        content:
          "Monte sua trilha de estudos a partir do currículo e das lacunas das vagas, registre horas e acompanhe o gráfico de evolução.",
      },
      { property: "og:title", content: "Trilha de conhecimentos | Eu Passo" },
      {
        property: "og:description",
        content:
          "Plano de estudos gerado por IA com base no seu ritmo semanal, registro de horas e evolução acumulada.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TrilhaPage,
});

function TrilhaPage() {
  const { curriculo, analise, vagas } = useDadosApp();

  return (
    <AppShell titulo="Trilha" descricao="Plano de estudos e evolução">
      <main className="mx-auto max-w-6xl space-y-5 px-4 py-5 sm:px-5 sm:py-6">
        <div>
          <h1 className="font-display text-lg font-semibold sm:text-xl">
            Trilha de conhecimentos
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            O que estudar, em qual ordem e quanto isso cabe na sua semana.
          </p>
        </div>

        <RoadmapPanel curriculo={curriculo} analise={analise} vagas={vagas} />

        <Rodape />
      </main>
    </AppShell>
  );
}
```
