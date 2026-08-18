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
