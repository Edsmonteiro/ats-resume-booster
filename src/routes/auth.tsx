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
