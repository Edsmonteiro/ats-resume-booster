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
