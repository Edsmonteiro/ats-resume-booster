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
