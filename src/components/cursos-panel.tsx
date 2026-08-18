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
