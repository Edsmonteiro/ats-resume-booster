# Back-end — server functions, helpers e rotas de API

## `src/lib/assinatura-simulada.functions.ts`

```ts
import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

import { MESES_POR_PRICE } from "./plano";

type Resultado = { ok: true } | { error: string };

export const ativarAssinaturaSimulada = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { priceId: string }) => {
    if (!MESES_POR_PRICE[data.priceId]) throw new Error("Plano inválido");
    return data;
  })
  .handler(async ({ data, context }): Promise<Resultado> => {
    const meses = MESES_POR_PRICE[data.priceId] ?? 1;

    const inicio = new Date();
    const fim = new Date(inicio);
    fim.setMonth(fim.getMonth() + meses);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await supabaseAdmin.from("subscriptions").upsert(
      {
        user_id: context.userId,
        stripe_subscription_id: `sim_${context.userId}`,
        stripe_customer_id: `sim_${context.userId}`,
        product_id: "simulado",
        price_id: data.priceId,
        status: "active",
        current_period_start: inicio.toISOString(),
        current_period_end: fim.toISOString(),
        cancel_at_period_end: false,
        environment: "sandbox",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "stripe_subscription_id" },
    );

    if (error) return { error: "Não foi possível ativar o plano simulado." };
    return { ok: true };
  });

export const cancelarAssinaturaSimulada = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Resultado> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await supabaseAdmin
      .from("subscriptions")
      .update({
        status: "canceled",
        current_period_end: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_subscription_id", `sim_${context.userId}`);

    if (error) return { error: "Não foi possível cancelar o plano simulado." };
    return { ok: true };
  });
```

## `src/lib/ats.functions.ts`

```ts
import { createServerFn } from "@tanstack/react-start";
import { generateObject } from "ai";

import {
  analisarCurriculoInput,
  analisarVagaInput,
  atsSchema,
  cartaSchema,
  curriculoRevisadoSchema,
  gerarCartaInput,
  gerarCurriculoRevisadoInput,
  matchSchema,
} from "./ats.schemas";
import {
  limitarCarta,
  modelo,
  promptCarta,
  providerOptions,
  SYSTEM_ATS,
  SYSTEM_CARTA,
  SYSTEM_MATCH,
  SYSTEM_REVISAO,
} from "./ats.server";
import { consumirRecursoOpcional } from "./plano.server";

export type { AtsAnalysis, CartaApresentacao, CurriculoRevisado, JobMatch } from "./ats.schemas";

export const analisarCurriculo = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => analisarCurriculoInput.parse(input))
  .handler(async ({ data }) => {
    const bloqueio = await consumirRecursoOpcional("ats");
    if (bloqueio) throw new Error(bloqueio.error);

    const { object } = await generateObject({
      model: modelo(),
      schema: atsSchema,
      providerOptions,
      system: SYSTEM_ATS,
      prompt: `Analise o currículo abaixo para compatibilidade com ATS.\n\n---\n${data.texto}\n---`,
    });
    return object;
  });

export const analisarVaga = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => analisarVagaInput.parse(input))
  .handler(async ({ data }) => {
    const bloqueio = await consumirRecursoOpcional("vaga");
    if (bloqueio) throw new Error(bloqueio.error);

    const { object } = await generateObject({
      model: modelo(),
      schema: matchSchema,
      providerOptions,
      system: SYSTEM_MATCH,
      prompt: `VAGA\nCargo: ${data.cargo}\nEmpresa: ${data.empresa || "não informada"}\nLink: ${data.link || "não informado"}\nRequisitos e descrição:\n${data.requisitos}\n\nCURRÍCULO DO CANDIDATO:\n${data.curriculo}\n\nCalcule a compatibilidade de 0 a 100 e detalhe o que falta.`,
    });
    return object;
  });

export const gerarCarta = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => gerarCartaInput.parse(input))
  .handler(async ({ data }) => {
    const bloqueio = await consumirRecursoOpcional("carta");
    if (bloqueio) throw new Error(bloqueio.error);

    const { object } = await generateObject({
      model: modelo(),
      schema: cartaSchema,
      providerOptions,
      system: SYSTEM_CARTA,
      prompt: promptCarta({
        cargo: data.cargo,
        empresa: data.empresa,
        requisitos: data.requisitos,
        curriculo: data.curriculo,
        tom: data.tom,
      }),
    });
    return { ...object, carta: limitarCarta(object.carta) };
  });

export const gerarCurriculoRevisado = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => gerarCurriculoRevisadoInput.parse(input))
  .handler(async ({ data }) => {
    const bloqueio = await consumirRecursoOpcional("curriculo_revisado");
    if (bloqueio) throw new Error(bloqueio.error);

    const { object } = await generateObject({
      model: modelo(),
      schema: curriculoRevisadoSchema,
      providerOptions,
      system: SYSTEM_REVISAO,
      prompt: `Reescreva o currículo abaixo APLICANDO OBRIGATORIAMENTE todas as melhorias indicadas. Antes de responder, confira item por item se cada palavra-chave, reescrita e ajuste da lista aparece no texto final; o que não puder ser aplicado por não ser verdadeiro deve ir para "observacoes".\n\nMELHORIAS A APLICAR:\n${data.orientacoes || "Aplique as melhores práticas de ATS."}\n\nCURRÍCULO ORIGINAL:\n---\n${data.curriculo}\n---`,
    });
    return object;
  });
```

## `src/lib/candidaturas.functions.ts`

```ts
import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const STATUS_CANDIDATURA = [
  "interessado",
  "enviada",
  "triagem",
  "entrevista",
  "teste",
  "oferta",
  "recusado",
] as const;

export type StatusCandidatura = (typeof STATUS_CANDIDATURA)[number];

export type Candidatura = {
  id: string;
  vaga_id: string | null;
  titulo: string;
  empresa: string;
  link: string;
  fonte: string;
  local: string;
  requisitos: string;
  compatibilidade: number;
  status: StatusCandidatura;
  notas: string;
  enviada_em: string | null;
  proximo_passo_em: string | null;
  updated_at: string;
  created_at: string;
};

const COLUNAS = "id, vaga_id, titulo, empresa, link, fonte, local, requisitos, compatibilidade, status, notas, enviada_em, proximo_passo_em, updated_at, created_at";

export const listarCandidaturas = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("candidaturas")
      .select(COLUNAS)
      .eq("user_id", context.userId)
      .order("updated_at", { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []) as Candidatura[];
  });

export type NovaCandidatura = {
  titulo: string;
  empresa?: string;
  link?: string;
  fonte?: string;
  local?: string;
  requisitos?: string;
  compatibilidade?: number;
  status?: StatusCandidatura;
  vagaId?: string | null;
};

export const criarCandidatura = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((entrada: NovaCandidatura) => {
    if (!entrada?.titulo?.trim()) throw new Error("Informe o cargo.");
    return entrada;
  })
  .handler(async ({ data, context }) => {
    const { data: criada, error } = await context.supabase
      .from("candidaturas")
      .insert({
        user_id: context.userId,
        vaga_id: data.vagaId ?? null,
        titulo: data.titulo.trim().slice(0, 200),
        empresa: (data.empresa ?? "").trim().slice(0, 200),
        link: (data.link ?? "").trim().slice(0, 2000),
        fonte: (data.fonte ?? "").trim().slice(0, 60),
        local: (data.local ?? "").trim().slice(0, 160),
        requisitos: (data.requisitos ?? "").slice(0, 15000),
        compatibilidade: Math.max(0, Math.min(100, Math.round(data.compatibilidade ?? 0))),
        status: data.status ?? "interessado",
        enviada_em: data.status === "enviada" ? new Date().toISOString() : null,
      })
      .select(COLUNAS)
      .single();

    if (error) throw new Error(error.message);
    return criada as Candidatura;
  });

export type AtualizacaoCandidatura = {
  id: string;
  status?: StatusCandidatura;
  notas?: string;
  proximoPassoEm?: string | null;
};

export const atualizarCandidatura = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((entrada: AtualizacaoCandidatura) => {
    if (!entrada?.id) throw new Error("Candidatura inválida.");
    return entrada;
  })
  .handler(async ({ data, context }) => {
    const patch: {
      status?: StatusCandidatura;
      enviada_em?: string;
      notas?: string;
      proximo_passo_em?: string | null;
    } = {};

    if (data.status) {
      patch["status"] = data.status;
      if (data.status === "enviada") patch["enviada_em"] = new Date().toISOString();
    }
    if (typeof data.notas === "string") patch["notas"] = data.notas.slice(0, 5000);
    if (data.proximoPassoEm !== undefined) patch["proximo_passo_em"] = data.proximoPassoEm;

    const { data: atualizada, error } = await context.supabase
      .from("candidaturas")
      .update(patch)
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .select(COLUNAS)
      .single();

    if (error) throw new Error(error.message);
    return atualizada as Candidatura;
  });

export const excluirCandidatura = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((entrada: { id: string }) => entrada)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("candidaturas")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export type VagaImportavel = {
  vagaId: string;
  titulo: string;
  empresa: string;
  link: string;
  fonte: string;
  local: string;
  compatibilidade: number;
  descricao: string;
};

/** Vagas do radar que ainda não viraram candidatura. */
export const vagasParaImportar = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("vagas_usuario")
      .select(
        "vaga_id, compatibilidade, vagas_encontradas!inner(id, titulo, empresa, link, fonte, local, descricao)",
      )
      .eq("user_id", context.userId)
      .is("removida_em", null)
      .order("compatibilidade", { ascending: false })
      .limit(60);

    if (error) throw new Error(error.message);

    const { data: existentes } = await context.supabase
      .from("candidaturas")
      .select("vaga_id")
      .eq("user_id", context.userId);
    const jaTem = new Set((existentes ?? []).map((c) => c.vaga_id).filter(Boolean));

    return (data ?? [])
      .filter((linha) => !jaTem.has(linha.vaga_id))
      .map((linha) => {
        const v = linha.vagas_encontradas as unknown as {
          titulo: string;
          empresa: string;
          link: string;
          fonte: string;
          local: string;
          descricao: string;
        };
        return {
          vagaId: linha.vaga_id,
          titulo: v.titulo,
          empresa: v.empresa ?? "",
          link: v.link ?? "",
          fonte: v.fonte ?? "",
          local: v.local ?? "",
          descricao: (v.descricao ?? "").slice(0, 8000),
          compatibilidade: linha.compatibilidade ?? 0,
        } as VagaImportavel;
      });
  });
```

## `src/lib/compartilhar.functions.ts`

```ts
import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import { anonimizarLista, anonimizarTexto } from "@/lib/anonimizar";
import type { Database } from "@/integrations/supabase/types";

const compartilharInput = z.object({
  score: z.number().min(0).max(100),
  scoreAntes: z.number().min(0).max(100).nullable().optional(),
  resumo: z.string().max(2000).default(""),
  cargoDesejado: z.string().max(200).default(""),
  pontosFortes: z.array(z.string().max(400)).max(12).default([]),
  problemasAts: z
    .array(
      z.object({
        titulo: z.string().max(300),
        gravidade: z.enum(["alta", "media", "baixa"]),
        explicacao: z.string().max(1200),
        comoCorrigir: z.string().max(1200),
      }),
    )
    .max(20)
    .default([]),
  palavrasChaveFaltando: z.array(z.string().max(120)).max(40).default([]),
  secoes: z
    .array(z.object({ nome: z.string().max(120), status: z.enum(["ok", "melhorar", "ausente"]), nota: z.string().max(600) }))
    .max(20)
    .default([]),
  reescritas: z.array(z.object({ original: z.string().max(800), sugerida: z.string().max(800) })).max(12).default([]),
});

export type AnalisePublica = {
  id: string;
  score: number;
  scoreAntes: number | null;
  resumo: string;
  cargoDesejado: string;
  criadaEm: string;
  pontosFortes: string[];
  problemasAts: Array<{ titulo: string; gravidade: "alta" | "media" | "baixa"; explicacao: string; comoCorrigir: string }>;
  palavrasChaveFaltando: string[];
  secoes: Array<{ nome: string; status: "ok" | "melhorar" | "ausente"; nota: string }>;
  reescritas: Array<{ original: string; sugerida: string }>;
};

function clientePublico() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export const criarLinkAnalise = createServerFn({ method: "POST" })
  .inputValidator((entrada: unknown) => compartilharInput.parse(entrada))
  .handler(async ({ data }) => {
    const dados = {
      pontosFortes: anonimizarLista(data.pontosFortes),
      problemasAts: data.problemasAts.map((p) => ({
        ...p,
        titulo: anonimizarTexto(p.titulo),
        explicacao: anonimizarTexto(p.explicacao),
        comoCorrigir: anonimizarTexto(p.comoCorrigir),
      })),
      palavrasChaveFaltando: anonimizarLista(data.palavrasChaveFaltando),
      secoes: data.secoes.map((s) => ({ ...s, nota: anonimizarTexto(s.nota) })),
      reescritas: data.reescritas.map((r) => ({
        original: anonimizarTexto(r.original),
        sugerida: anonimizarTexto(r.sugerida),
      })),
    };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: linha, error } = await supabaseAdmin
      .from("analises_publicas")
      .insert({
        score: Math.round(data.score),
        score_antes: typeof data.scoreAntes === "number" ? Math.round(data.scoreAntes) : null,
        resumo: anonimizarTexto(data.resumo),
        cargo_desejado: anonimizarTexto(data.cargoDesejado),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        dados: dados as any,
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);
    return { id: linha.id as string };
  });

export const carregarAnalisePublica = createServerFn({ method: "GET" })
  .inputValidator((entrada: unknown) => z.object({ id: z.string().uuid() }).parse(entrada))
  .handler(async ({ data }): Promise<AnalisePublica | null> => {
    const { data: linha, error } = await clientePublico()
      .from("analises_publicas")
      .select("id, score, score_antes, resumo, cargo_desejado, dados, created_at")
      .eq("id", data.id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!linha) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const d = (linha.dados ?? {}) as any;
    return {
      id: linha.id,
      score: linha.score,
      scoreAntes: linha.score_antes,
      resumo: linha.resumo,
      cargoDesejado: linha.cargo_desejado,
      criadaEm: linha.created_at,
      pontosFortes: Array.isArray(d.pontosFortes) ? d.pontosFortes : [],
      problemasAts: Array.isArray(d.problemasAts) ? d.problemasAts : [],
      palavrasChaveFaltando: Array.isArray(d.palavrasChaveFaltando) ? d.palavrasChaveFaltando : [],
      secoes: Array.isArray(d.secoes) ? d.secoes : [],
      reescritas: Array.isArray(d.reescritas) ? d.reescritas : [],
    };
  });
```

## `src/lib/conquistas.functions.ts`

```ts
import { createServerFn } from "@tanstack/react-start";
import { generateObject } from "ai";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

import { modelo, providerOptions } from "./ats.server";
import {
  salvarConquistaInput,
  sugerirConquistasInput,
  sugestoesConquistasSchema,
  type Conquista,
  type ConquistaSugerida,
} from "./conquistas.schemas";
import { SYSTEM_CONQUISTAS } from "./conquistas.server";

export type { Conquista, ConquistaSugerida } from "./conquistas.schemas";

const COLUNAS = "id, titulo, situacao, tarefa, acao, resultado, tags, created_at";

export const listarConquistas = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Conquista[]> => {
    const { data, error } = await context.supabase
      .from("conquistas")
      .select(COLUNAS)
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []) as Conquista[];
  });

export const salvarConquista = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => salvarConquistaInput.parse(input))
  .handler(async ({ data, context }): Promise<Conquista> => {
    const registro = {
      user_id: context.userId,
      titulo: data.titulo,
      situacao: data.situacao,
      tarefa: data.tarefa,
      acao: data.acao,
      resultado: data.resultado,
      tags: data.tags,
    };

    const consulta = data.id
      ? context.supabase
          .from("conquistas")
          .update(registro)
          .eq("id", data.id)
          .eq("user_id", context.userId)
          .select(COLUNAS)
          .single()
      : context.supabase.from("conquistas").insert(registro).select(COLUNAS).single();

    const { data: linha, error } = await consulta;
    if (error) throw new Error(error.message);
    return linha as Conquista;
  });

export const excluirConquista = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((entrada: { id: string }) => entrada)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("conquistas")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const sugerirConquistas = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => sugerirConquistasInput.parse(input))
  .handler(async ({ data }): Promise<ConquistaSugerida[]> => {
    const { object } = await generateObject({
      model: modelo(),
      schema: sugestoesConquistasSchema,
      providerOptions,
      system: SYSTEM_CONQUISTAS,
      prompt: `Extraia conquistas STAR do currículo abaixo.\n\n---\n${data.curriculo}\n---`,
    });
    return object.conquistas;
  });
```

## `src/lib/conta.functions.ts`

```ts
import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Exporta tudo que o usuário tem guardado na conta, em JSON. */
export const exportarMeusDados = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const uid = context.userId;
    const sb = context.supabase;

    const [perfil, dados, preferencias, vagas, candidaturas, preparos, notificacoes, assinaturas] =
      await Promise.all([
        sb.from("perfis").select("*").eq("id", uid).maybeSingle(),
        sb.from("dados_usuario").select("*").eq("user_id", uid).maybeSingle(),
        sb.from("preferencias_busca").select("*").eq("user_id", uid).maybeSingle(),
        sb.from("vagas_usuario").select("*").eq("user_id", uid),
        sb.from("candidaturas").select("*").eq("user_id", uid),
        sb.from("preparos_entrevista").select("*").eq("user_id", uid),
        sb.from("notificacoes").select("*").eq("user_id", uid),
        sb.from("subscriptions").select("*").eq("user_id", uid),
      ]);

    return {
      exportadoEm: new Date().toISOString(),
      perfil: perfil.data ?? null,
      dados: dados.data ?? null,
      preferenciasBusca: preferencias.data ?? null,
      vagasRadar: vagas.data ?? [],
      candidaturas: candidaturas.data ?? [],
      preparosEntrevista: preparos.data ?? [],
      notificacoes: notificacoes.data ?? [],
      assinaturas: assinaturas.data ?? [],
    };
  });

/** Apaga definitivamente os dados do usuário e a própria conta de acesso. */
export const excluirMinhaConta = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((entrada: { confirmacao: string }) => {
    if (entrada?.confirmacao?.trim().toUpperCase() !== "EXCLUIR") {
      throw new Error("Confirmação inválida.");
    }
    return entrada;
  })
  .handler(async ({ context }) => {
    const uid = context.userId;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    await supabaseAdmin.from("preparos_entrevista").delete().eq("user_id", uid);
    await supabaseAdmin.from("candidaturas").delete().eq("user_id", uid);
    await supabaseAdmin.from("vagas_usuario").delete().eq("user_id", uid);
    await supabaseAdmin.from("notificacoes").delete().eq("user_id", uid);
    await supabaseAdmin.from("preferencias_busca").delete().eq("user_id", uid);
    await supabaseAdmin.from("dados_usuario").delete().eq("user_id", uid);
    await supabaseAdmin.from("perfis").delete().eq("id", uid);

    const { error } = await supabaseAdmin.auth.admin.deleteUser(uid);
    if (error) throw new Error(error.message);

    return { ok: true };
  });
```

## `src/lib/cursos.functions.ts`

```ts
import { createServerFn } from "@tanstack/react-start";
import { generateObject } from "ai";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

import { checarRecurso } from "./plano.server";

import { modelo, providerOptions } from "./ats.server";
import {
  aplicarCursoInput,
  curriculoComCursoSchema,
  salvarCursoInput,
  type CurriculoComCurso,
  type Curso,
} from "./cursos.schemas";
import { promptCurso, SYSTEM_CURSO } from "./cursos.server";

export type { Curso, CurriculoComCurso } from "./cursos.schemas";

const COLUNAS =
  "id, nome, instituicao, carga_horaria, concluido_em, link, aprendizados, aplicado_em_curriculo, created_at";

export const listarCursos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Curso[]> => {
    const { data, error } = await context.supabase
      .from("cursos")
      .select(COLUNAS)
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []) as Curso[];
  });

export const salvarCurso = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => salvarCursoInput.parse(input))
  .handler(async ({ data, context }): Promise<Curso> => {
    const registro = {
      user_id: context.userId,
      nome: data.nome,
      instituicao: data.instituicao,
      carga_horaria: data.carga_horaria,
      concluido_em: data.concluido_em,
      link: data.link,
      aprendizados: data.aprendizados,
    };

    const consulta = data.id
      ? context.supabase
          .from("cursos")
          .update(registro)
          .eq("id", data.id)
          .eq("user_id", context.userId)
          .select(COLUNAS)
          .single()
      : context.supabase.from("cursos").insert(registro).select(COLUNAS).single();

    const { data: linha, error } = await consulta;
    if (error) throw new Error(error.message);
    return linha as Curso;
  });

export const marcarCursoAplicado = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((entrada: { id: string }) => entrada)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("cursos")
      .update({ aplicado_em_curriculo: true })
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const excluirCurso = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((entrada: { id: string }) => entrada)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("cursos")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const aplicarCursoNoCurriculo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => aplicarCursoInput.parse(input))
  .handler(async ({ data, context }): Promise<CurriculoComCurso> => {
    const bloqueio = await checarRecurso(context.userId, "cursos");
    if (bloqueio) throw new Error(bloqueio.error);

    const { object } = await generateObject({
      model: modelo(),
      schema: curriculoComCursoSchema,
      providerOptions,
      system: SYSTEM_CURSO,
      prompt: promptCurso({
        curriculo: data.curriculo,
        nome: data.curso.nome,
        instituicao: data.curso.instituicao,
        cargaHoraria: data.curso.carga_horaria,
        concluidoEm: data.curso.concluido_em,
        link: data.curso.link,
        aprendizados: data.curso.aprendizados,
      }),
    });
    return object;
  });
```

## `src/lib/dados.functions.ts`

```ts
import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Json } from "@/integrations/supabase/types";

export type DadosUsuario = {
  curriculo: string;
  analise: Json | null;
  historico: Json[];
  vagas: Json[];
};

export const carregarDados = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("dados_usuario")
      .select("curriculo, analise, historico, vagas")
      .eq("user_id", context.userId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return null;

    return {
      curriculo: data.curriculo ?? "",
      analise: data.analise ?? null,
      historico: Array.isArray(data.historico) ? data.historico : [],
      vagas: Array.isArray(data.vagas) ? data.vagas : [],
    } as DadosUsuario;
  });

export const salvarDados = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((entrada: DadosUsuario) => entrada)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("dados_usuario").upsert(
      {
        user_id: context.userId,
        curriculo: typeof data.curriculo === "string" ? data.curriculo.slice(0, 200_000) : "",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        analise: (data.analise ?? null) as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        historico: (Array.isArray(data.historico) ? data.historico.slice(0, 20) : []) as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vagas: (Array.isArray(data.vagas) ? data.vagas.slice(0, 200) : []) as any,
      },
      { onConflict: "user_id" },
    );

    if (error) throw new Error(error.message);
    return { ok: true };
  });

export type Perfil = { nome: string; cargoDesejado: string };

export const carregarPerfil = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("perfis")
      .select("nome, cargo_desejado")
      .eq("id", context.userId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return { nome: data?.nome ?? "", cargoDesejado: data?.cargo_desejado ?? "" } as Perfil;
  });

export const salvarPerfil = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((entrada: Perfil) => entrada)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("perfis").upsert(
      {
        id: context.userId,
        nome: (data.nome ?? "").slice(0, 120),
        cargo_desejado: (data.cargoDesejado ?? "").slice(0, 120),
      },
      { onConflict: "id" },
    );

    if (error) throw new Error(error.message);
    return { ok: true };
  });
```

## `src/lib/entrevista.functions.ts`

```ts
import { createServerFn } from "@tanstack/react-start";
import { generateObject } from "ai";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

import { modelo, providerOptions } from "./ats.server";
import {
  feedbackRespostaSchema,
  roteiroEntrevistaSchema,
  type FeedbackResposta,
  type RoteiroEntrevista,
} from "./entrevista.schemas";
import { SYSTEM_FEEDBACK, SYSTEM_ROTEIRO } from "./entrevista.server";
import { checarRecurso } from "./plano.server";

export type { FeedbackResposta, RoteiroEntrevista } from "./entrevista.schemas";

async function temPro(userId: string) {
  return (await checarRecurso(userId, "entrevista")) === null;
}

export type PreparoEntrevista = {
  candidatura: {
    id: string;
    titulo: string;
    empresa: string;
    requisitos: string;
    compatibilidade: number;
    link: string;
  };
  roteiro: RoteiroEntrevista | null;
  bloqueado: boolean;
};

export const carregarPreparo = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((entrada: { candidaturaId: string }) => entrada)
  .handler(async ({ data, context }): Promise<PreparoEntrevista | null> => {
    const { data: cand, error } = await context.supabase
      .from("candidaturas")
      .select("id, titulo, empresa, requisitos, compatibilidade, link")
      .eq("id", data.candidaturaId)
      .eq("user_id", context.userId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!cand) return null;

    const { data: preparo } = await context.supabase
      .from("preparos_entrevista")
      .select("roteiro")
      .eq("candidatura_id", cand.id)
      .eq("user_id", context.userId)
      .maybeSingle();

    const roteiro = preparo?.roteiro
      ? (roteiroEntrevistaSchema.safeParse(preparo.roteiro).data ?? null)
      : null;

    return { candidatura: cand, roteiro, bloqueado: !(await temPro(context.userId)) };
  });

export const gerarRoteiroEntrevista = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((entrada: unknown) =>
    z.object({ candidaturaId: z.string().uuid() }).parse(entrada),
  )
  .handler(async ({ data, context }): Promise<RoteiroEntrevista | { error: string }> => {
    if (!(await temPro(context.userId))) {
      return { error: "Assine o Eu Passo Pro para preparar entrevistas com IA." };
    }

    const { data: cand } = await context.supabase
      .from("candidaturas")
      .select("id, vaga_id, titulo, empresa, requisitos, compatibilidade")
      .eq("id", data.candidaturaId)
      .eq("user_id", context.userId)
      .maybeSingle();

    if (!cand) return { error: "Candidatura não encontrada." };

    let requisitos = cand.requisitos ?? "";
    if (requisitos.trim().length < 40 && cand.vaga_id) {
      const { data: vaga } = await context.supabase
        .from("vagas_encontradas")
        .select("descricao")
        .eq("id", cand.vaga_id)
        .maybeSingle();
      requisitos = vaga?.descricao ?? requisitos;
    }

    const { data: dados } = await context.supabase
      .from("dados_usuario")
      .select("curriculo")
      .eq("user_id", context.userId)
      .maybeSingle();

    const curriculo = (dados?.curriculo ?? "").trim();
    if (curriculo.length < 80) {
      return { error: "Salve seu currículo na aba Currículo antes de preparar a entrevista." };
    }

    const { object } = await generateObject({
      model: modelo(),
      schema: roteiroEntrevistaSchema,
      providerOptions,
      system: SYSTEM_ROTEIRO,
      prompt: `VAGA\nCargo: ${cand.titulo}\nEmpresa: ${cand.empresa || "não informada"}\nCompatibilidade calculada: ${cand.compatibilidade}%\nRequisitos e descrição:\n${requisitos.slice(0, 12000) || "não informados — use o cargo como referência"}\n\nCURRÍCULO DO CANDIDATO:\n${curriculo.slice(0, 20000)}\n\nMonte de 8 a 12 perguntas prováveis, com respostas STAR baseadas apenas neste currículo.`,
    });

    await context.supabase.from("preparos_entrevista").insert({
      user_id: context.userId,
      candidatura_id: cand.id,
      vaga_id: cand.vaga_id,
      titulo: cand.titulo,
      empresa: cand.empresa ?? "",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      roteiro: object as any,
    });

    return object;
  });

export const avaliarResposta = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((entrada: unknown) =>
    z
      .object({
        pergunta: z.string().min(5).max(1000),
        resposta: z.string().min(20).max(6000),
        cargo: z.string().max(200).default(""),
      })
      .parse(entrada),
  )
  .handler(async ({ data, context }): Promise<FeedbackResposta | { error: string }> => {
    if (!(await temPro(context.userId))) {
      return { error: "Assine o Eu Passo Pro para treinar respostas com IA." };
    }

    const { object } = await generateObject({
      model: modelo(),
      schema: feedbackRespostaSchema,
      providerOptions,
      system: SYSTEM_FEEDBACK,
      prompt: `Cargo em disputa: ${data.cargo || "não informado"}\n\nPERGUNTA:\n${data.pergunta}\n\nRESPOSTA DO CANDIDATO:\n${data.resposta}\n\nAvalie e reescreva melhor, mantendo os fatos.`,
    });

    return object;
  });
```

## `src/lib/extensao.functions.ts`

```ts
import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ConexaoExtensao = {
  id: string;
  dispositivo: string;
  ultimo_uso_em: string | null;
  created_at: string;
};

export const listarConexoesExtensao = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("extensao_tokens")
      .select("id, dispositivo, ultimo_uso_em, created_at")
      .eq("user_id", context.userId)
      .eq("revogado", false)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []) as ConexaoExtensao[];
  });

export const criarConexaoExtensao = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((entrada: { dispositivo?: string } | undefined) => entrada ?? {})
  .handler(async ({ data, context }) => {
    const { gerarToken, hashToken } = await import("@/lib/extensao.server");
    const token = gerarToken();
    const hash = await hashToken(token);

    const { error } = await context.supabase.from("extensao_tokens").insert({
      user_id: context.userId,
      token_hash: hash,
      dispositivo: (data.dispositivo ?? "Extensão do navegador").trim().slice(0, 80),
    });

    if (error) throw new Error(error.message);
    return { token };
  });

export const revogarConexaoExtensao = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((entrada: { id: string }) => {
    if (!entrada?.id) throw new Error("Conexão inválida.");
    return entrada;
  })
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("extensao_tokens")
      .update({ revogado: true })
      .eq("id", data.id)
      .eq("user_id", context.userId);

    if (error) throw new Error(error.message);
    return { ok: true };
  });
```

## `src/lib/game.functions.ts`

```ts
import { createServerFn } from "@tanstack/react-start";
import { generateObject } from "ai";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

import { modelo, providerOptions } from "./ats.server";
import {
  avaliacaoSchema,
  avaliarRespostaInput,
  gerarPerguntaInput,
  mapaSchema,
  perguntaSchema,
  type Avaliacao,
  type MapaQuest,
  type Pergunta,
} from "./game.schemas";
import { SYSTEM_GAME_AVALIACAO, SYSTEM_GAME_MAPA, SYSTEM_GAME_PERGUNTA } from "./game.server";
import { checarRecurso } from "./plano.server";

export const gerarMapaQuest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MapaQuest> => {
    const bloqueio = await checarRecurso(context.userId, "quest");
    if (bloqueio) throw new Error(bloqueio.error);

    const { data } = await context.supabase
      .from("dados_usuario")
      .select("curriculo")
      .eq("user_id", context.userId)
      .maybeSingle();

    const curriculo = (data?.curriculo ?? "").trim();
    if (curriculo.length < 40) {
      throw new Error(
        "Adicione seu currículo na análise para montarmos o mapa com as suas ferramentas.",
      );
    }

    const { object } = await generateObject({
      model: modelo(),
      providerOptions,
      schema: mapaSchema,
      system: SYSTEM_GAME_MAPA,
      prompt: `Currículo do candidato:\n${curriculo.slice(0, 12_000)}`,
    });

    return object;
  });

export const gerarPergunta = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => gerarPerguntaInput.parse(input))
  .handler(async ({ data, context }): Promise<Pergunta> => {
    const bloqueio = await checarRecurso(context.userId, "quest");
    if (bloqueio) throw new Error(bloqueio.error);

    const tipo: "objetiva" | "subjetiva" = Math.random() < 0.65 ? "objetiva" : "subjetiva";

    const { object } = await generateObject({
      model: modelo(),
      providerOptions,
      schema: perguntaSchema,
      system: SYSTEM_GAME_PERGUNTA,
      prompt:
        `Tema/ferramenta: ${data.tema}\nFoco da fase: ${data.foco}\nNível: ${data.nivel}\n` +
        `Tipo obrigatório: ${tipo}\nSemente de aleatoriedade: ${Math.random().toString(36).slice(2)}\n` +
        (data.evitar.length
          ? `Não repita nem reformule estas perguntas já usadas:\n- ${data.evitar.join("\n- ")}`
          : "Primeira pergunta da fase."),
    });

    return {
      ...object,
      tipo,
      alternativas: tipo === "objetiva" ? object.alternativas.slice(0, 4) : [],
      indiceCorreto: tipo === "objetiva" ? (object.indiceCorreto ?? 0) : null,
    };
  });

export const avaliarResposta = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => avaliarRespostaInput.parse(input))
  .handler(async ({ data }): Promise<Avaliacao> => {
    const { object } = await generateObject({
      model: modelo(),
      providerOptions,
      schema: avaliacaoSchema,
      system: SYSTEM_GAME_AVALIACAO,
      prompt: `Tema: ${data.tema}\nPergunta: ${data.enunciado}\nResposta do candidato: ${data.resposta}`,
    });
    return object;
  });
```

## `src/lib/gupy.functions.ts`

```ts
import { createServerFn } from "@tanstack/react-start";
import { generateObject } from "ai";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

import { modelo, providerOptions } from "./ats.server";
import { analisarGupyInput, perfilGupySchema, type PerfilGupy } from "./gupy.schemas";
import { SYSTEM_GUPY } from "./gupy.server";
import { consumirRecurso } from "./plano.server";

export type { PerfilGupy } from "./gupy.schemas";

export const analisarPerfilGupy = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => analisarGupyInput.parse(input))
  .handler(async ({ data, context }): Promise<PerfilGupy | { error: string }> => {
    const bloqueio = await consumirRecurso(context.userId, "gupy");
    if (bloqueio) return bloqueio;

    const { object } = await generateObject({
      model: modelo(),
      schema: perfilGupySchema,
      providerOptions,
      system: SYSTEM_GUPY,
      prompt: `Cargo/área alvo informado: ${data.area || "não informado"}.\n\nCONTEÚDO DO CURRÍCULO EXPORTADO DA GUPY:\n---\n${data.texto
        .trim()
        .slice(
          0,
          24000,
        )}\n---\n\nDê a nota geral de 0 a 100, notas por área (dados_pessoais, formacao, experiencias, conquistas, triagem) e orientações específicas para subir no ranqueamento da Gupy.`,
    });

    return object;
  });
```

## `src/lib/linkedin.functions.ts`

```ts
import { createServerFn } from "@tanstack/react-start";
import { generateObject } from "ai";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

import { modelo, providerOptions } from "./ats.server";
import { analisarPerfilInput, perfilLinkedinSchema, type PerfilLinkedin } from "./linkedin.schemas";
import { lerPerfilPublico, SYSTEM_PERFIL } from "./linkedin.server";
import { consumirRecurso } from "./plano.server";

export type { PerfilLinkedin } from "./linkedin.schemas";

export const analisarPerfilLinkedin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => analisarPerfilInput.parse(input))
  .handler(async ({ data, context }): Promise<PerfilLinkedin | { error: string }> => {
    const bloqueio = await consumirRecurso(context.userId, "linkedin");
    if (bloqueio) return bloqueio;

    const conteudo =
      data.texto.trim().length >= 80 ? data.texto.trim() : await lerPerfilPublico(data.url.trim());

    const { object } = await generateObject({
      model: modelo(),
      schema: perfilLinkedinSchema,
      providerOptions,
      system: SYSTEM_PERFIL,
      prompt: `Área/objetivo de carreira informado: ${data.area || "não informado"}.\nOrigem: ${
        data.texto.trim().length >= 80 ? "PDF exportado do perfil" : `perfil público (${data.url})`
      }\n\nCONTEÚDO DO PERFIL DO LINKEDIN:\n---\n${conteudo.slice(0, 24000)}\n---\n\nDê a nota geral de 0 a 100, notas por área (header, visual, experiencias, visibilidade) e orientações específicas como um headhunter daria.`,
    });

    return object;
  });
```

## `src/lib/payments.functions.ts`

```ts
import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createStripeClient, getStripeErrorMessage, type StripeEnv } from "@/lib/stripe.server";

type CheckoutSessionResult = { clientSecret: string } | { error: string };
type PortalSessionResult = { url: string } | { error: string };

async function resolveOrCreateCustomer(
  stripe: ReturnType<typeof createStripeClient>,
  options: { email?: string; userId?: string },
): Promise<string> {
  if (options.userId && !/^[a-zA-Z0-9_-]+$/.test(options.userId)) {
    throw new Error("Invalid userId");
  }
  if (options.userId) {
    const found = await stripe.customers.search({
      query: `metadata['userId']:'${options.userId}'`,
      limit: 1,
    });
    if (found.data.length && found.data[0]) return found.data[0].id;
  }
  if (options.email) {
    const existing = await stripe.customers.list({ email: options.email, limit: 1 });
    const customer = existing.data[0];
    if (customer) {
      if (options.userId && customer.metadata?.["userId"] !== options.userId) {
        await stripe.customers.update(customer.id, {
          metadata: { ...customer.metadata, userId: options.userId },
        });
      }
      return customer.id;
    }
  }
  const created = await stripe.customers.create({
    ...(options.email && { email: options.email }),
    ...(options.userId && { metadata: { userId: options.userId } }),
  });
  return created.id;
}

export const criarCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { priceId: string; returnUrl: string; environment: StripeEnv }) => {
    if (!/^[a-zA-Z0-9_-]+$/.test(data.priceId)) throw new Error("Invalid priceId");
    return data;
  })
  .handler(async ({ data, context }): Promise<CheckoutSessionResult> => {
    try {
      const stripe = createStripeClient(data.environment);
      const {
        data: { user },
      } = await context.supabase.auth.getUser();

      const prices = await stripe.prices.list({ lookup_keys: [data.priceId] });
      const stripePrice = prices.data[0];
      if (!stripePrice) throw new Error("Plano não encontrado");
      const isRecurring = stripePrice.type === "recurring";

      const customerId = await resolveOrCreateCustomer(stripe, {
        ...(user?.email ? { email: user.email } : {}),
        userId: context.userId,
      });


      let productDescription: string | undefined;
      if (!isRecurring) {
        const productId =
          typeof stripePrice.product === "string" ? stripePrice.product : (stripePrice.product as { id: string }).id;
        const product = await stripe.products.retrieve(productId);
        productDescription = "name" in product ? product.name : undefined;
      }

      const session = await stripe.checkout.sessions.create({
        line_items: [{ price: stripePrice.id, quantity: 1 }],
        mode: isRecurring ? "subscription" : "payment",
        ui_mode: "embedded_page",
        return_url: data.returnUrl,
        customer: customerId,
        automatic_tax: { enabled: true },
        ...(!isRecurring && productDescription
          ? { payment_intent_data: { description: productDescription } }
          : {}),

        metadata: { userId: context.userId, priceId: data.priceId },
        ...(isRecurring && {
          subscription_data: { metadata: { userId: context.userId } },
        }),
      });

      return { clientSecret: session.client_secret ?? "" };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });

export const criarPortal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { returnUrl?: string; environment: StripeEnv }) => data)
  .handler(async ({ data, context }): Promise<PortalSessionResult> => {
    const { data: sub } = await context.supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", context.userId)
      .eq("environment", data.environment)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!sub?.stripe_customer_id) return { error: "Nenhuma assinatura encontrada." };

    try {
      const stripe = createStripeClient(data.environment);
      const portal = await stripe.billingPortal.sessions.create({
        customer: sub.stripe_customer_id,
        ...(data.returnUrl && { return_url: data.returnUrl }),
      });
      return { url: portal.url };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });
```

## `src/lib/progresso.functions.ts`

```ts
import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type PontoEvolucao = { data: string; score: number };

export type Progresso = {
  evolucao: PontoEvolucao[];
  scoreAtual: number | null;
  scoreInicial: number | null;
  vagasAnalisadas: number;
  compatibilidadeMedia: number;
  melhorCompatibilidade: number;
  piorCompatibilidade: number;
  funil: { status: string; total: number }[];
  totalCandidaturas: number;
  taxaEntrevista: number;
  palavrasFaltando: { termo: string; vezes: number }[];
  semana: { vagasNovas: number; candidaturasNovas: number; entrevistas: number };
};

type ItemHistorico = { criadaEm?: string; score?: number };

export const carregarProgresso = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Progresso> => {
    const uid = context.userId;
    const sb = context.supabase;

    const [dados, vagas, candidaturas] = await Promise.all([
      sb.from("dados_usuario").select("historico").eq("user_id", uid).maybeSingle(),
      sb
        .from("vagas_usuario")
        .select("compatibilidade, lacunas, created_at, removida_em")
        .eq("user_id", uid),
      sb.from("candidaturas").select("status, created_at").eq("user_id", uid),
    ]);

    const historico = (Array.isArray(dados.data?.historico) ? dados.data.historico : []) as ItemHistorico[];
    const evolucao = historico
      .filter((h) => typeof h?.score === "number" && h?.criadaEm)
      .map((h) => ({ data: String(h.criadaEm), score: Math.round(Number(h.score)) }))
      .sort((a, b) => a.data.localeCompare(b.data));

    const listaVagas = vagas.data ?? [];
    const notas = listaVagas.map((v) => v.compatibilidade ?? 0).filter((n) => n > 0);
    const media = notas.length ? Math.round(notas.reduce((a, b) => a + b, 0) / notas.length) : 0;

    const contagem = new Map<string, number>();
    for (const v of listaVagas) {
      const lacunas = Array.isArray(v.lacunas) ? v.lacunas : [];
      for (const l of lacunas) {
        const termo = typeof l === "string" ? l : ((l as { termo?: string })?.termo ?? "");
        const limpo = termo.trim().toLowerCase();
        if (limpo.length < 2 || limpo.length > 40) continue;
        contagem.set(limpo, (contagem.get(limpo) ?? 0) + 1);
      }
    }
    const palavrasFaltando = [...contagem.entries()]
      .map(([termo, vezes]) => ({ termo, vezes }))
      .sort((a, b) => b.vezes - a.vezes)
      .slice(0, 12);

    const lista = candidaturas.data ?? [];
    const porStatus = new Map<string, number>();
    for (const c of lista) porStatus.set(c.status, (porStatus.get(c.status) ?? 0) + 1);
    const funil = ["enviada", "triagem", "entrevista", "teste", "oferta", "recusado"].map((s) => ({
      status: s,
      total: porStatus.get(s) ?? 0,
    }));

    const enviadasTotal = lista.filter((c) => c.status !== "interessado").length;
    const entrevistasTotal = lista.filter((c) =>
      ["entrevista", "teste", "oferta"].includes(c.status),
    ).length;

    const seteDias = Date.now() - 7 * 86_400_000;
    const semana = {
      vagasNovas: listaVagas.filter((v) => new Date(v.created_at).getTime() >= seteDias).length,
      candidaturasNovas: lista.filter((c) => new Date(c.created_at).getTime() >= seteDias).length,
      entrevistas: entrevistasTotal,
    };

    return {
      evolucao,
      scoreAtual: evolucao.length ? evolucao[evolucao.length - 1]!.score : null,
      scoreInicial: evolucao.length ? evolucao[0]!.score : null,
      vagasAnalisadas: listaVagas.length,
      compatibilidadeMedia: media,
      melhorCompatibilidade: notas.length ? Math.max(...notas) : 0,
      piorCompatibilidade: notas.length ? Math.min(...notas) : 0,
      funil,
      totalCandidaturas: lista.length,
      taxaEntrevista: enviadasTotal ? Math.round((entrevistasTotal / enviadasTotal) * 100) : 0,
      palavrasFaltando,
      semana,
    };
  });
```

## `src/lib/radar.functions.ts`

```ts
import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

import type { CartaApresentacao, CurriculoRevisado } from "./ats.schemas";
import { consumirRecurso } from "./plano.server";
import { JANELA_PADRAO, type FrequenciaAlerta, type RecomendacoesVaga } from "./radar.schemas";

export type { CartaApresentacao, CurriculoRevisado } from "./ats.schemas";
export type { RecomendacoesVaga } from "./radar.schemas";

export type Preferencias = {
  cargos: string[];
  senioridade: string;
  cidade: string;
  estado: string;
  modelos: string[];
  contratos: string[];
  salarioMinimo: number | null;
  palavrasEvitar: string[];
  ativo: boolean;
  alertaFrequencia: FrequenciaAlerta;
  janelaDias: number;
};

export type VagaRadar = {
  id: string;
  titulo: string;
  empresa: string;
  local: string;
  modelo: string;
  link: string;
  fonte: string;
  descricao: string;
  compatibilidade: number;
  motivo: string;
  lacunas: string[];
  status: string;
  criadaEm: string;
  publicadaEm: string | null;
  motivoRemocao: string | null;
  removidaEm: string | null;
};

const PREFERENCIAS_PADRAO: Preferencias = {
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

export const carregarPreferencias = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Preferencias> => {
    const { data } = await context.supabase
      .from("preferencias_busca")
      .select("*")
      .eq("user_id", context.userId)
      .maybeSingle();

    if (!data) return PREFERENCIAS_PADRAO;
    return {
      cargos: data.cargos ?? [],
      senioridade: data.senioridade ?? "qualquer",
      cidade: data.cidade ?? "",
      estado: data.estado ?? "",
      modelos: data.modelos ?? [],
      contratos: data.contratos ?? [],
      salarioMinimo: data.salario_minimo ?? null,
      palavrasEvitar: data.palavras_evitar ?? [],
      ativo: data.ativo ?? true,
      alertaFrequencia: (data.alerta_frequencia ?? "nenhum") as FrequenciaAlerta,
      janelaDias: data.janela_dias ?? JANELA_PADRAO,
    };
  });

export const salvarPreferencias = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((entrada: Preferencias) => entrada)
  .handler(async ({ data, context }): Promise<{ ok: true; limpou: number }> => {
    const cargos = data.cargos.slice(0, 5).map((c) => c.slice(0, 80));

    const { data: anterior } = await context.supabase
      .from("preferencias_busca")
      .select("cargos")
      .eq("user_id", context.userId)
      .maybeSingle();

    const normalizar = (lista: string[]) =>
      [...lista.map((c) => c.trim().toLowerCase())].sort().join("|");
    const cargosMudaram = !!anterior && normalizar(anterior.cargos ?? []) !== normalizar(cargos);

    const { error } = await context.supabase.from("preferencias_busca").upsert(
      {
        user_id: context.userId,
        cargos,
        senioridade: data.senioridade.slice(0, 40),
        cidade: data.cidade.slice(0, 80),
        estado: data.estado.slice(0, 40),
        modelos: data.modelos.slice(0, 3),
        contratos: data.contratos.slice(0, 3),
        salario_minimo: data.salarioMinimo,
        palavras_evitar: data.palavrasEvitar.slice(0, 20).map((p) => p.slice(0, 60)),
        ativo: data.ativo,
        alerta_frequencia: data.alertaFrequencia,
        janela_dias: [7, 15, 30, 60].includes(data.janelaDias) ? data.janelaDias : JANELA_PADRAO,
      },
      { onConflict: "user_id" },
    );
    if (error) throw new Error(error.message);

    let limpou = 0;
    if (cargosMudaram) {
      // Só saem do radar as vagas que não combinam com os NOVOS cargos.
      const semAcento = (t: string) =>
        t
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");
      const termos = Array.from(
        new Set(
          cargos.flatMap((c) =>
            semAcento(c)
              .split(/[^a-z0-9]+/)
              .filter((t) => t.length > 3),
          ),
        ),
      );

      const { data: ativas } = await context.supabase
        .from("vagas_usuario")
        .select("id, vagas_encontradas(titulo)")
        .eq("user_id", context.userId)
        .in("status", ["nova", "vista"])
        .limit(300);

      const alvos = (ativas ?? [])
        .filter((linha) => {
          if (!termos.length) return true;
          const titulo = semAcento(linha.vagas_encontradas?.titulo ?? "");
          return !termos.some((t) => titulo.includes(t));
        })
        .map((linha) => linha.id);

      if (alvos.length) {
        const { data: arquivadas } = await context.supabase
          .from("vagas_usuario")
          .update({ status: "baixa" })
          .eq("user_id", context.userId)
          .in("id", alvos)
          .select("id");
        limpou = arquivadas?.length ?? 0;
      }
    }

    return { ok: true, limpou };
  });

export const listarVagasRadar = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (entrada: {
      ordenacao?: "compatibilidade_desc" | "compatibilidade_asc" | "recentes" | "antigas";
    }) => entrada,
  )
  .handler(async ({ data, context }): Promise<VagaRadar[]> => {
    const ordenacao = data.ordenacao ?? "compatibilidade_desc";

    const { data: linhas, error } = await context.supabase
      .from("vagas_usuario")
      .select(
        "id, compatibilidade, motivo, lacunas, status, created_at, motivo_remocao, removida_em, vagas_encontradas(titulo, empresa, local, modelo, link, fonte, descricao, publicada_em)",
      )
      .eq("user_id", context.userId)
      .not("status", "in", "(descartada,baixa,removida)")
      .order("created_at", { ascending: false })
      .limit(120);

    if (error) throw new Error(error.message);

    const { data: prefs } = await context.supabase
      .from("preferencias_busca")
      .select("janela_dias, cargos")
      .eq("user_id", context.userId)
      .maybeSingle();
    const janelaDias = prefs?.janela_dias ?? 30;
    const limite = Date.now() - janelaDias * 86_400_000;

    // Só entram no radar vagas cujo título combina com os cargos desejados
    // (todos os termos de ao menos um cargo).
    const semAcento = (t: string) =>
      t
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
    const cargos = prefs?.cargos ?? [];
    const gruposCargo = cargos
      .map((c: string) =>
        semAcento(c)
          .split(/[^a-z0-9]+/)
          .filter((t) => t.length > 3),
      )
      .filter((g: string[]) => g.length > 0);

    const resultado = (linhas ?? [])
      .map((linha) => {
        const vaga = linha.vagas_encontradas;
        return {
          id: linha.id,
          titulo: vaga?.titulo ?? "Vaga",
          empresa: vaga?.empresa ?? "",
          local: vaga?.local ?? "",
          modelo: vaga?.modelo ?? "",
          link: vaga?.link ?? "",
          fonte: vaga?.fonte ?? "",
          descricao: (vaga?.descricao ?? "").slice(0, 1200),
          compatibilidade: linha.compatibilidade,
          motivo: linha.motivo,
          lacunas: Array.isArray(linha.lacunas) ? (linha.lacunas as string[]) : [],
          status: linha.status,
          criadaEm: linha.created_at,
          publicadaEm: vaga?.publicada_em ?? null,
          motivoRemocao: linha.motivo_remocao ?? null,
          removidaEm: linha.removida_em ?? null,
        };
      })
      // Só vagas dentro da janela escolhida, mais recentes primeiro.
      .filter((v) => new Date(v.publicadaEm ?? v.criadaEm).getTime() >= limite)
      .filter((v) => {
        if (!gruposCargo.length) return true;
        const titulo = semAcento(v.titulo);
        return gruposCargo.some((grupo: string[]) => grupo.every((t) => titulo.includes(t)));
      });

    switch (ordenacao) {
      case "compatibilidade_asc":
        resultado.sort((a, b) => a.compatibilidade - b.compatibilidade);
        break;
      case "recentes":
        resultado.sort(
          (a, b) =>
            new Date(b.publicadaEm ?? b.criadaEm).getTime() -
            new Date(a.publicadaEm ?? a.criadaEm).getTime(),
        );
        break;
      case "antigas":
        resultado.sort(
          (a, b) =>
            new Date(a.publicadaEm ?? a.criadaEm).getTime() -
            new Date(b.publicadaEm ?? b.criadaEm).getTime(),
        );
        break;
      case "compatibilidade_desc":
      default:
        resultado.sort((a, b) => b.compatibilidade - a.compatibilidade);
        break;
    }

    return resultado.slice(0, 60);
  });

/** Apaga de vez as vagas já marcadas como removidas (encerradas / fora da janela). */
export const limparVagasEncerradas = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ removidas: number }> => {
    const { revalidarVagasUsuario } = await import("./revalidacao.server");
    const { data: prefs } = await context.supabase
      .from("preferencias_busca")
      .select("janela_dias")
      .eq("user_id", context.userId)
      .maybeSingle();

    await revalidarVagasUsuario(context.supabase, context.userId, prefs?.janela_dias ?? 30);

    const { data: apagadas, error } = await context.supabase
      .from("vagas_usuario")
      .delete()
      .eq("user_id", context.userId)
      .eq("status", "removida")
      .select("id");
    if (error) throw new Error(error.message);
    return { removidas: apagadas?.length ?? 0 };
  });

/** Reprocessa todo o histórico com a lógica atual de encerradas e janela de dias. */
export const revalidarHistorico = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(
    async ({
      context,
    }): Promise<{ encerradas: number; foraDaJanela: number; analisadas: number }> => {
      const { revalidarVagasUsuario } = await import("./revalidacao.server");
      const { data: prefs } = await context.supabase
        .from("preferencias_busca")
        .select("janela_dias")
        .eq("user_id", context.userId)
        .maybeSingle();

      return revalidarVagasUsuario(context.supabase, context.userId, prefs?.janela_dias ?? 30);
    },
  );

export const atualizarStatusVaga = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (entrada: { id: string; status: "nova" | "vista" | "salva" | "descartada" | "baixa" }) =>
      entrada,
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("vagas_usuario")
      .update({ status: data.status })
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Zera as preferências e tira todas as vagas do radar (elas ficam no histórico). */
export const limparPreferencias = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ ok: true; limpou: number }> => {
    const { error } = await context.supabase.from("preferencias_busca").upsert(
      {
        user_id: context.userId,
        cargos: [],
        senioridade: "qualquer",
        cidade: "",
        estado: "",
        modelos: [],
        contratos: [],
        salario_minimo: null,
        palavras_evitar: [],
        ativo: true,
        alerta_frequencia: "nenhum",
        janela_dias: JANELA_PADRAO,
      },
      { onConflict: "user_id" },
    );
    if (error) throw new Error(error.message);

    const { data: arquivadas } = await context.supabase
      .from("vagas_usuario")
      .update({ status: "baixa" })
      .eq("user_id", context.userId)
      .in("status", ["nova", "vista", "salva"])
      .select("id");

    return { ok: true, limpou: arquivadas?.length ?? 0 };
  });

export const rodarRadar = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(
    async ({ context }): Promise<{ novas: number; avaliadas: number } | { error: string }> => {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { executarRadar, registrarNotificacaoRadar } = await import("./radar-run.server");

      const bloqueio = await consumirRecurso(context.userId, "radar");
      if (bloqueio) return bloqueio;

      const resultado = await executarRadar(supabaseAdmin, context.userId);
      if ("error" in resultado) return resultado;

      await registrarNotificacaoRadar(supabaseAdmin, context.userId, resultado);
      return { novas: resultado.novas, avaliadas: resultado.avaliadas };
    },
  );

export type VagaHistorico = VagaRadar & { temRecomendacoes: boolean; abertaEm: string | null };

/** Marca que o usuário abriu o anúncio — é o que faz a vaga entrar no histórico. */
export const registrarAberturaVaga = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((entrada: { id: string }) => entrada)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("vagas_usuario")
      .update({ aberta_em: new Date().toISOString() })
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .is("aberta_em", null);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Histórico: apenas as vagas em que o usuário clicou em "Abrir vaga". */
export const listarHistoricoRadar = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<VagaHistorico[]> => {
    const { data, error } = await context.supabase
      .from("vagas_usuario")
      .select(
        "id, compatibilidade, motivo, lacunas, status, created_at, motivo_remocao, removida_em, aberta_em, recomendacoes, vagas_encontradas(titulo, empresa, local, modelo, link, fonte, descricao, publicada_em)",
      )
      .eq("user_id", context.userId)
      .not("aberta_em", "is", null)
      .order("aberta_em", { ascending: false })
      .limit(200);

    if (error) throw new Error(error.message);

    return (data ?? []).map((linha) => {
      const vaga = linha.vagas_encontradas;
      return {
        id: linha.id,
        titulo: vaga?.titulo ?? "Vaga",
        empresa: vaga?.empresa ?? "",
        local: vaga?.local ?? "",
        modelo: vaga?.modelo ?? "",
        link: vaga?.link ?? "",
        fonte: vaga?.fonte ?? "",
        descricao: (vaga?.descricao ?? "").slice(0, 1200),
        compatibilidade: linha.compatibilidade,
        motivo: linha.motivo,
        lacunas: Array.isArray(linha.lacunas) ? (linha.lacunas as string[]) : [],
        status: linha.status,
        criadaEm: linha.created_at,
        publicadaEm: vaga?.publicada_em ?? null,
        motivoRemocao: linha.motivo_remocao ?? null,
        removidaEm: linha.removida_em ?? null,
        temRecomendacoes: linha.recomendacoes != null,
        abertaEm: linha.aberta_em ?? null,
      };
    });
  });

export const gerarRecomendacoesVaga = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((entrada: { id: string; refazer?: boolean }) => entrada)
  .handler(
    async ({
      data,
      context,
    }): Promise<{ recomendacoes: RecomendacoesVaga } | { error: string }> => {
      const { data: linha, error } = await context.supabase
        .from("vagas_usuario")
        .select(
          "id, compatibilidade, lacunas, recomendacoes, vagas_encontradas(titulo, empresa, descricao)",
        )
        .eq("id", data.id)
        .eq("user_id", context.userId)
        .maybeSingle();

      if (error || !linha) return { error: "Vaga não encontrada no seu radar." };

      if (!data.refazer && linha.recomendacoes)
        return { recomendacoes: linha.recomendacoes as unknown as RecomendacoesVaga };

      const { data: dados } = await context.supabase
        .from("dados_usuario")
        .select("curriculo")
        .eq("user_id", context.userId)
        .maybeSingle();

      const curriculo = dados?.curriculo ?? "";
      if (curriculo.trim().length < 50)
        return { error: "Cadastre seu currículo para receber recomendações." };

      const { gerarRecomendacoes } = await import("./radar.server");

      let recomendacoes: RecomendacoesVaga;
      try {
        recomendacoes = await gerarRecomendacoes(curriculo, {
          titulo: linha.vagas_encontradas?.titulo ?? "Vaga",
          empresa: linha.vagas_encontradas?.empresa ?? "",
          descricao: linha.vagas_encontradas?.descricao ?? "",
          compatibilidade: linha.compatibilidade,
          lacunas: Array.isArray(linha.lacunas) ? (linha.lacunas as string[]) : [],
        });
      } catch (erro) {
        console.error("Falha ao gerar recomendações", erro);
        return { error: "Não foi possível gerar as recomendações agora. Tente novamente." };
      }

      await context.supabase
        .from("vagas_usuario")
        .update({ recomendacoes: JSON.parse(JSON.stringify(recomendacoes)) })
        .eq("id", linha.id)
        .eq("user_id", context.userId);

      return { recomendacoes };
    },
  );

export type Notificacao = {
  id: string;
  titulo: string;
  mensagem: string;
  lida: boolean;
  criadaEm: string;
};

export const listarNotificacoes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Notificacao[]> => {
    const { data, error } = await context.supabase
      .from("notificacoes")
      .select("id, titulo, mensagem, lida, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) throw new Error(error.message);
    return (data ?? []).map((n) => ({
      id: n.id,
      titulo: n.titulo,
      mensagem: n.mensagem,
      lida: n.lida,
      criadaEm: n.created_at,
    }));
  });

export const marcarNotificacoesLidas = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase
      .from("notificacoes")
      .update({ lida: true })
      .eq("user_id", context.userId)
      .eq("lida", false);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export type CurriculoVagaResultado = {
  curriculo: CurriculoRevisado;
  carta: CartaApresentacao | null;
};

export const gerarCurriculoVaga = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((entrada: { id: string; comCarta?: boolean }) => entrada)
  .handler(async ({ data, context }): Promise<CurriculoVagaResultado | { error: string }> => {
    const { data: linha, error } = await context.supabase
      .from("vagas_usuario")
      .select(
        "id, compatibilidade, lacunas, recomendacoes, vagas_encontradas(titulo, empresa, descricao)",
      )
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .maybeSingle();

    if (error || !linha) return { error: "Vaga não encontrada no seu radar." };

    const { data: dados } = await context.supabase
      .from("dados_usuario")
      .select("curriculo")
      .eq("user_id", context.userId)
      .maybeSingle();

    const curriculo = dados?.curriculo ?? "";
    if (curriculo.trim().length < 50)
      return { error: "Cadastre seu currículo para gerar a versão sob medida." };

    const { gerarCurriculoParaVaga, gerarRecomendacoes } = await import("./radar.server");

    const vaga = {
      titulo: linha.vagas_encontradas?.titulo ?? "Vaga",
      empresa: linha.vagas_encontradas?.empresa ?? "",
      descricao: linha.vagas_encontradas?.descricao ?? "",
      compatibilidade: linha.compatibilidade,
      lacunas: Array.isArray(linha.lacunas) ? (linha.lacunas as string[]) : [],
    };

    try {
      let recomendacoes = (linha.recomendacoes as unknown as RecomendacoesVaga | null) ?? null;
      if (!recomendacoes) {
        try {
          recomendacoes = await gerarRecomendacoes(curriculo, vaga);
          await context.supabase
            .from("vagas_usuario")
            .update({ recomendacoes: JSON.parse(JSON.stringify(recomendacoes)) })
            .eq("id", data.id)
            .eq("user_id", context.userId);
        } catch (erro) {
          console.error("Falha ao gerar recomendações antes do currículo", erro);
        }
      }

      return await gerarCurriculoParaVaga(curriculo, vaga, data.comCarta === true, recomendacoes);
    } catch (erro) {
      console.error("Falha ao gerar currículo da vaga", erro);
      return { error: "Não foi possível gerar o currículo agora. Tente novamente." };
    }
  });

export const gerarCartaVaga = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (entrada: { id: string; curriculo?: string; tom?: "formal" | "equilibrado" | "direto" }) =>
      entrada,
  )
  .handler(async ({ data, context }): Promise<{ carta: CartaApresentacao } | { error: string }> => {
    const { data: linha, error } = await context.supabase
      .from("vagas_usuario")
      .select("id, vagas_encontradas(titulo, empresa, descricao)")
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .maybeSingle();

    if (error || !linha) return { error: "Vaga não encontrada no seu radar." };

    let base = (data.curriculo ?? "").trim();
    if (base.length < 50) {
      const { data: dados } = await context.supabase
        .from("dados_usuario")
        .select("curriculo")
        .eq("user_id", context.userId)
        .maybeSingle();
      base = (dados?.curriculo ?? "").trim();
    }
    if (base.length < 50) return { error: "Cadastre seu currículo para gerar a carta." };

    const { gerarCartaParaVaga } = await import("./radar.server");
    try {
      const carta = await gerarCartaParaVaga(
        base.slice(0, 16000),
        {
          titulo: linha.vagas_encontradas?.titulo ?? "Vaga",
          empresa: linha.vagas_encontradas?.empresa ?? "",
          descricao: linha.vagas_encontradas?.descricao ?? "",
        },
        data.tom ?? "equilibrado",
      );
      return { carta };
    } catch (erro) {
      console.error("Falha ao gerar carta da vaga", erro);
      return { error: "Não foi possível gerar a carta agora. Tente novamente." };
    }
  });

/** Vagas retiradas do radar nos últimos dias, com o motivo da remoção. */
export const listarVagasRemovidas = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(
    async ({
      context,
    }): Promise<
      { id: string; titulo: string; fonte: string; motivoRemocao: string; removidaEm: string }[]
    > => {
      const { data, error } = await context.supabase
        .from("vagas_usuario")
        .select("id, motivo_remocao, removida_em, vagas_encontradas(titulo, fonte)")
        .eq("user_id", context.userId)
        .eq("status", "removida")
        .order("removida_em", { ascending: false })
        .limit(20);

      if (error) throw new Error(error.message);
      return (data ?? []).map((linha) => ({
        id: linha.id,
        titulo: linha.vagas_encontradas?.titulo ?? "Vaga",
        fonte: linha.vagas_encontradas?.fonte ?? "",
        motivoRemocao: linha.motivo_remocao ?? "Removida do radar",
        removidaEm: linha.removida_em ?? new Date().toISOString(),
      }));
    },
  );
```

## `src/lib/roadmap.functions.ts`

```ts
import { createServerFn } from "@tanstack/react-start";
import { generateObject } from "ai";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

import { modelo, providerOptions } from "./ats.server";
import {
  atualizarItemInput,
  concluirPorTermoInput,
  gerarTrilhaInput,
  registrarHorasInput,
  ritmoInput,
  trilhaSchema,
  type ItemRoadmap,
  type RitmoEstudo,
  type SessaoEstudo,
} from "./roadmap.schemas";
import { checarRecurso } from "./plano.server";
import { SYSTEM_ROADMAP } from "./roadmap.server";

export type { ItemRoadmap, RitmoEstudo, SessaoEstudo } from "./roadmap.schemas";
export type { CursoGratuito } from "./cursos-gratuitos.server";

const COLUNAS =
  "id, habilidade, nivel, porque, como_comprovar, esforco, horas_estimadas, horas_feitas, concluido_em, prioridade, status, created_at";

export const listarRoadmap = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ItemRoadmap[]> => {
    const { data, error } = await context.supabase
      .from("roadmap_itens")
      .select(COLUNAS)
      .eq("user_id", context.userId)
      .order("created_at", { ascending: true });

    if (error) throw new Error(error.message);
    return (data ?? []) as ItemRoadmap[];
  });

export const carregarRitmo = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<RitmoEstudo> => {
    const { data, error } = await context.supabase
      .from("roadmap_ritmo")
      .select("horas_dia, dias_semana")
      .eq("user_id", context.userId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return {
      horas_dia: Number(data?.horas_dia ?? 1),
      dias_semana: Number(data?.dias_semana ?? 5),
    };
  });

export const salvarRitmo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ritmoInput.parse(input))
  .handler(async ({ data, context }): Promise<RitmoEstudo> => {
    const { error } = await context.supabase
      .from("roadmap_ritmo")
      .upsert({ user_id: context.userId, ...data }, { onConflict: "user_id" });
    if (error) throw new Error(error.message);
    return data;
  });

export const listarSessoes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SessaoEstudo[]> => {
    const { data, error } = await context.supabase
      .from("roadmap_sessoes")
      .select("dia, horas")
      .eq("user_id", context.userId)
      .order("dia", { ascending: true });

    if (error) throw new Error(error.message);

    const porDia = new Map<string, number>();
    for (const linha of data ?? []) {
      const dia = String(linha.dia);
      porDia.set(dia, (porDia.get(dia) ?? 0) + Number(linha.horas ?? 0));
    }
    return [...porDia.entries()].map(([dia, horas]) => ({ dia, horas }));
  });

export const registrarHoras = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => registrarHorasInput.parse(input))
  .handler(async ({ data, context }): Promise<ItemRoadmap> => {
    const { data: item, error: erroItem } = await context.supabase
      .from("roadmap_itens")
      .select("horas_feitas, horas_estimadas, status")
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .single();

    if (erroItem) throw new Error(erroItem.message);

    const feitas = Number(item.horas_feitas ?? 0) + data.horas;
    const estimadas = Number(item.horas_estimadas ?? 0);
    const concluiu = estimadas > 0 && feitas >= estimadas;

    const { error: erroSessao } = await context.supabase.from("roadmap_sessoes").insert({
      user_id: context.userId,
      item_id: data.id,
      horas: data.horas,
    });
    if (erroSessao) throw new Error(erroSessao.message);

    const { data: linha, error } = await context.supabase
      .from("roadmap_itens")
      .update({
        horas_feitas: feitas,
        status: concluiu ? "concluido" : "estudando",
        concluido_em: concluiu ? new Date().toISOString() : null,
      })
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .select(COLUNAS)
      .single();

    if (error) throw new Error(error.message);
    return linha as ItemRoadmap;
  });

export const buscarCursosDaHabilidade = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((entrada: { habilidade: string }) => ({
    habilidade: String(entrada.habilidade).slice(0, 200),
  }))
  .handler(async ({ data, context }) => {
    const bloqueio = await checarRecurso(context.userId, "roadmap");
    if (bloqueio) throw new Error(bloqueio.error);

    const { buscarCursosGratuitos } = await import("./cursos-gratuitos.server");
    return buscarCursosGratuitos(data.habilidade);
  });

export const gerarTrilha = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => gerarTrilhaInput.parse(input))
  .handler(async ({ data, context }): Promise<ItemRoadmap[]> => {
    const bloqueio = await checarRecurso(context.userId, "roadmap");
    if (bloqueio) throw new Error(bloqueio.error);

    const horasSemana = Math.round(data.horasDia * data.diasSemana * 10) / 10;
    const { object } = await generateObject({
      model: modelo(),
      schema: trilhaSchema,
      providerOptions,
      system: SYSTEM_ROADMAP,
      prompt: `Cargo desejado: ${data.cargo || "não informado"}
Ritmo de estudo disponível: ${data.horasDia} h por dia, ${data.diasSemana} dias por semana (${horasSemana} h por semana)
Lacunas já identificadas: ${data.lacunas.length ? data.lacunas.join("; ") : "nenhuma informada"}

CURRÍCULO:
---
${data.curriculo}
---

Monte a trilha de conhecimentos dentro desse ritmo.`,
    });

    await context.supabase.from("roadmap_itens").delete().eq("user_id", context.userId);
    await context.supabase.from("roadmap_sessoes").delete().eq("user_id", context.userId);

    const registros = object.itens.map((i) => ({
      user_id: context.userId,
      habilidade: i.habilidade,
      nivel: i.nivel,
      porque: i.porque,
      como_comprovar: i.comoComprovar,
      esforco: i.esforco,
      horas_estimadas: i.horasEstimadas,
      prioridade: i.prioridade,
    }));

    const { data: linhas, error } = await context.supabase
      .from("roadmap_itens")
      .insert(registros)
      .select(COLUNAS);



    if (error) throw new Error(error.message);
    return (linhas ?? []) as ItemRoadmap[];
  });

export const atualizarItemRoadmap = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => atualizarItemInput.parse(input))
  .handler(async ({ data, context }): Promise<ItemRoadmap> => {
    const { data: linha, error } = await context.supabase
      .from("roadmap_itens")
      .update({
        status: data.status,
        concluido_em: data.status === "concluido" ? new Date().toISOString() : null,
      })
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .select(COLUNAS)
      .single();


    if (error) throw new Error(error.message);
    return linha as ItemRoadmap;
  });

export const excluirItemRoadmap = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((entrada: { id: string }) => entrada)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("roadmap_itens")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Marca itens da trilha como concluídos quando um curso cobre aquela habilidade. */
export const concluirItensPorTexto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => concluirPorTermoInput.parse(input))
  .handler(async ({ data, context }): Promise<number> => {
    const { data: itens, error } = await context.supabase
      .from("roadmap_itens")
      .select("id, habilidade, status")
      .eq("user_id", context.userId)
      .neq("status", "concluido");

    if (error) throw new Error(error.message);

    const texto = data.texto.toLowerCase();
    const alvos = (itens ?? [])
      .filter((i) => {
        const termo = String(i.habilidade).toLowerCase().trim();
        return termo.length >= 3 && texto.includes(termo);
      })
      .map((i) => i.id);

    if (!alvos.length) return 0;

    const { error: erroUpdate } = await context.supabase
      .from("roadmap_itens")
      .update({ status: "concluido", concluido_em: new Date().toISOString() })
      .in("id", alvos)
      .eq("user_id", context.userId);

    if (erroUpdate) throw new Error(erroUpdate.message);
    return alvos.length;
  });
```

## `src/lib/ai-gateway.server.ts`

```ts
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export function createLovableAiGatewayProvider(apiKey: string) {
  return createOpenAICompatible({
    name: "lovable",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    headers: { "Lovable-API-Key": apiKey },
    includeUsage: true,
    supportsStructuredOutputs: true,
  });
}
```

## `src/lib/ats.server.ts`

```ts
import { createLovableAiGatewayProvider } from "./ai-gateway.server";
import { LIMITE_CARTA } from "./ats.schemas";

export const MODEL = "openai/gpt-5.6-sol";
export const providerOptions = { lovable: { reasoningEffort: "none" } } as const;

export function modelo() {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("Configuração de IA ausente.");
  return createLovableAiGatewayProvider(key)(MODEL);
}

export const SYSTEM_ATS =
  "Você é um especialista brasileiro em recrutamento e em sistemas ATS (Applicant Tracking Systems). " +
  "Avalie currículos com rigor e objetividade, sempre em português do Brasil. " +
  "Aponte problemas concretos de leitura por robôs: formatação, colunas, tabelas, gráficos, cabeçalhos, " +
  "títulos de seção não padronizados, falta de palavras-chave, datas ambíguas, verbos fracos e falta de métricas. " +
  "Seja específico e cite trechos reais do currículo. Nada de conselhos genéricos.";

export const SYSTEM_MATCH =
  "Você é um recrutador técnico brasileiro que mede compatibilidade entre currículo e vaga como um ATS faria. " +
  "Responda sempre em português do Brasil. Baseie a nota em evidências do currículo, sem inventar experiências. " +
  "Requisitos obrigatórios não atendidos pesam mais que desejáveis.";

export { LIMITE_CARTA };

export const SYSTEM_CARTA =
  "Você escreve cartas de apresentação em português do Brasil para candidaturas. " +
  "Use apenas fatos presentes no currículo — nunca invente experiências, empresas, números ou formações. " +
  `REGRA OBRIGATÓRIA DE TAMANHO: o campo "carta" deve ter no MÁXIMO ${LIMITE_CARTA} caracteres (contando espaços), ` +
  "o equivalente a cerca de 160 a 190 palavras, em 3 parágrafos curtos. Conte os caracteres antes de responder e " +
  "reescreva mais enxuto se passar do limite. Nada de clichês vazios, rodeios ou repetição do currículo inteiro: " +
  "conecte as experiências reais aos requisitos da vaga e inclua naturalmente as palavras-chave da descrição. " +
  "Não use saudação genérica com nome inventado; use 'Prezada equipe de recrutamento' quando não houver nome. " +
  "Não assine com nome inventado nem inclua endereço, data ou cabeçalho de carta formal.";

/** Garante o limite de caracteres mesmo quando o modelo passa do pedido. */
export function limitarCarta(texto: string): string {
  const limpo = texto.trim();
  if (limpo.length <= LIMITE_CARTA) return limpo;
  const cortado = limpo.slice(0, LIMITE_CARTA);
  const fim = Math.max(
    cortado.lastIndexOf("."),
    cortado.lastIndexOf("!"),
    cortado.lastIndexOf("?"),
  );
  return (fim > LIMITE_CARTA * 0.6 ? cortado.slice(0, fim + 1) : cortado).trim();
}

export type TomCarta = "formal" | "equilibrado" | "direto";

/** Prompt único usado por todas as telas que geram carta de apresentação. */
export function promptCarta(dados: {
  cargo: string;
  empresa?: string;
  requisitos: string;
  curriculo: string;
  tom?: TomCarta;
}) {
  return `Tom desejado: ${dados.tom ?? "equilibrado"}.

VAGA
Cargo: ${dados.cargo}
Empresa: ${dados.empresa || "não informada"}
Requisitos e descrição:
${dados.requisitos}

CURRÍCULO DO CANDIDATO:
${dados.curriculo}

Escreva a carta de apresentação respeitando o limite de ${LIMITE_CARTA} caracteres e liste em "observacoes" o que o candidato deve personalizar antes de enviar.`;
}

export const SYSTEM_REVISAO =
  "Você reescreve currículos em português do Brasil para máxima compatibilidade com sistemas ATS. " +
  "Não invente empresas, cargos, datas, números ou formações que não existam no original. " +
  "Porém, APLICAR AS MELHORIAS INDICADAS É OBRIGATÓRIO: cada palavra-chave, reescrita e ajuste listado nas " +
  "orientações deve aparecer no currículo final, integrado de forma verdadeira ao contexto real do candidato " +
  "(no RESUMO, nas COMPETÊNCIAS ou nos bullets da experiência onde aquilo realmente ocorreu). " +
  "Reescreva frases fracas usando exatamente a linguagem sugerida quando ela descrever o que o candidato já fez. " +
  "Só deixe de incluir um termo se ele for factualmente falso para este candidato — nesse caso liste-o em " +
  "'observacoes' explicando por que ficou de fora. Nunca ignore uma orientação em silêncio. " +
  "Entregue texto puro em uma coluna, sem tabelas, colunas, gráficos ou caracteres decorativos. " +
  "Use títulos de seção padronizados em MAIÚSCULAS (RESUMO, EXPERIÊNCIA PROFISSIONAL, FORMAÇÃO, COMPETÊNCIAS, IDIOMAS, CERTIFICAÇÕES) " +
  "quando houver conteúdo para elas. Datas no formato MM/AAAA. Bullets começando com '- ' e verbo de ação forte, " +
  "priorizando resultados e métricas já existentes no original. " +
  "Em 'mudancas', liste item a item cada orientação aplicada e onde ela foi inserida; em 'observacoes', o que o " +
  "candidato precisa preencher, confirmar ou o que não pôde ser aplicado.";
```

## `src/lib/conquistas.server.ts`

```ts
export const SYSTEM_CONQUISTAS =
  "Você é um headhunter brasileiro que ajuda candidatos a transformar a experiência do currículo em " +
  "conquistas no formato STAR (Situação, Tarefa, Ação, Resultado). Responda sempre em português do Brasil. " +
  "Use APENAS fatos presentes no currículo enviado — nunca invente empresas, números, clientes ou resultados. " +
  "Quando o currículo não trouxer um número, descreva o resultado de forma qualitativa e marque no campo " +
  "'resultado' o que o candidato precisa quantificar, entre colchetes (ex.: '[confirmar o percentual]'). " +
  "Gere de 4 a 8 conquistas, cada uma com título curto (até 8 palavras), texto objetivo em cada campo " +
  "e etiquetas com as competências envolvidas (ex.: 'liderança', 'SQL', 'negociação').";
```

## `src/lib/cursos-gratuitos.server.ts`

```ts
const GATEWAY = "https://connector-gateway.lovable.dev/firecrawl/v2";

export type CursoGratuito = {
  titulo: string;
  url: string;
  plataforma: string;
  descricao: string;
};

const PLATAFORMAS: { dominio: string; nome: string }[] = [
  { dominio: "youtube.com", nome: "YouTube" },
  { dominio: "coursera.org", nome: "Coursera" },
  { dominio: "edx.org", nome: "edX" },
  { dominio: "fundacaobradesco.org.br", nome: "Fundação Bradesco" },
  { dominio: "escolavirtual.gov.br", nome: "Escola Virtual Gov" },
  { dominio: "sebrae.com.br", nome: "Sebrae" },
  { dominio: "freecodecamp.org", nome: "freeCodeCamp" },
  { dominio: "learn.microsoft.com", nome: "Microsoft Learn" },
  { dominio: "cursa.app", nome: "Cursa" },
  { dominio: "udemy.com", nome: "Udemy" },
  { dominio: "alura.com.br", nome: "Alura" },
  { dominio: "dio.me", nome: "DIO" },
];

function plataformaDe(url: string): string {
  const achada = PLATAFORMAS.find((p) => url.includes(p.dominio));
  if (achada) return achada.nome;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Web";
  }
}

type ItemBusca = { url?: string; title?: string; description?: string };

/** Busca cursos gratuitos on-line para uma habilidade usando a busca web conectada. */
export async function buscarCursosGratuitos(
  habilidade: string,
  limite = 8,
): Promise<CursoGratuito[]> {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const firecrawlKey = process.env["FIRECRAWL_API_KEY"];
  if (!lovableKey || !firecrawlKey) throw new Error("Busca de cursos indisponível no momento.");

  const consultas = [
    `curso gratuito online de ${habilidade} com certificado`,
    `${habilidade} curso grátis em português`,
  ];

  async function rodar(query: string): Promise<ItemBusca[]> {
    try {
      const resposta = await fetch(`${GATEWAY}/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${lovableKey}`,
          "X-Connection-Api-Key": firecrawlKey as string,
        },
        body: JSON.stringify({ query, limit: limite, lang: "pt", country: "br" }),
      });

      if (!resposta.ok) {
        console.error(`Firecrawl cursos falhou [${resposta.status}]: ${await resposta.text()}`);
        return [];
      }

      const json = (await resposta.json()) as {
        data?: ItemBusca[] | { web?: ItemBusca[] };
        web?: ItemBusca[];
      };
      return Array.isArray(json.data) ? json.data : (json.data?.web ?? json.web ?? []);
    } catch (erro) {
      console.error(`Erro ao buscar cursos de "${habilidade}"`, erro);
      return [];
    }
  }

  const resultados = await Promise.all(consultas.map(rodar));
  const vistos = new Set<string>();
  const cursos: CursoGratuito[] = [];

  for (const item of resultados.flat()) {
    const url = item.url ?? "";
    if (!url || vistos.has(url)) continue;
    vistos.add(url);
    cursos.push({
      titulo: (item.title ?? url).slice(0, 160),
      url,
      plataforma: plataformaDe(url),
      descricao: (item.description ?? "").slice(0, 240),
    });
    if (cursos.length >= limite) break;
  }

  return cursos;
}
```

## `src/lib/cursos.server.ts`

```ts
import { SYSTEM_REVISAO } from "./ats.server";

export const SYSTEM_CURSO =
  SYSTEM_REVISAO +
  " NESTA TAREFA o objetivo é registrar um curso recém-concluído: insira-o na seção correta " +
  "(CERTIFICAÇÕES quando for curso livre/certificado, FORMAÇÃO quando for graduação ou pós), criando a seção " +
  "se ela não existir, no formato 'Nome do curso — Instituição | carga horária | conclusão MM/AAAA'. " +
  "Quando os temas do curso forem verdadeiros para o candidato, reforce COMPETÊNCIAS e, se fizer sentido, " +
  "uma frase do RESUMO com os termos do curso. Mantenha todo o restante do currículo intacto: não remova, " +
  "reordene nem reescreva experiências existentes.";

export function promptCurso(dados: {
  curriculo: string;
  nome: string;
  instituicao?: string;
  cargaHoraria?: string;
  concluidoEm?: string;
  link?: string;
  aprendizados?: string;
}) {
  return `CURSO CONCLUÍDO
Nome: ${dados.nome}
Instituição: ${dados.instituicao || "não informada"}
Carga horária: ${dados.cargaHoraria || "não informada"}
Conclusão: ${dados.concluidoEm || "não informada"}
Certificado: ${dados.link || "não informado"}
O que aprendeu na prática: ${dados.aprendizados || "não informado"}

CURRÍCULO ATUAL:
---
${dados.curriculo}
---

Devolva o currículo completo já atualizado com este curso, liste em "mudancas" cada alteração feita e em "observacoes" o que o candidato ainda precisa confirmar.`;
}
```

## `src/lib/entrevista.server.ts`

```ts
export const SYSTEM_ROTEIRO =
  "Você é um headhunter brasileiro sênior que prepara candidatos para entrevistas reais. " +
  "Escreva sempre em português do Brasil, direto e sem clichês de coach. " +
  "Monte o roteiro provável da entrevista para a vaga informada, considerando o currículo do candidato. " +
  "Inclua perguntas técnicas do escopo da vaga, comportamentais e, obrigatoriamente, perguntas sobre as lacunas " +
  "entre o currículo e os requisitos — é onde o candidato costuma travar. " +
  "As respostas em formato STAR devem usar APENAS experiências, empresas, números e ferramentas que existem no currículo enviado. " +
  "Nunca invente fatos: quando faltar informação para uma resposta forte, escreva o esqueleto indicando entre colchetes o que o candidato precisa preencher. " +
  "Em 'salario', use referências de mercado brasileiro para o cargo e senioridade, deixando claro que é estimativa.";

export const SYSTEM_FEEDBACK =
  "Você é um entrevistador experiente avaliando a resposta de um candidato em uma simulação. " +
  "Responda em português do Brasil. Dê uma nota de 0 a 100 considerando clareza, estrutura STAR, evidência de resultado e aderência à pergunta. " +
  "Seja específico nos ajustes: aponte o trecho e o que fazer. " +
  "Na versão melhorada, mantenha os fatos que o candidato trouxe — não invente números nem empresas.";
```

## `src/lib/extensao-api.server.ts`

```ts
import { hashToken, tokenDoHeader } from "@/lib/extensao.server";

export const corsExtensao = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, authorization",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

export function jsonExtensao(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsExtensao, "content-type": "application/json" },
  });
}

export type ContaExtensao = {
  userId: string;
  tokenId: string;
};

/**
 * Valida o token da extensão enviado em Authorization: Bearer.
 * Devolve null quando não há token ou ele é inválido/revogado.
 */
export async function contaDaExtensao(request: Request): Promise<ContaExtensao | null> {
  const token = tokenDoHeader(request);
  if (!token) return null;

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const hash = await hashToken(token);

  const { data, error } = await supabaseAdmin
    .from("extensao_tokens")
    .select("id, user_id, revogado")
    .eq("token_hash", hash)
    .maybeSingle();

  if (error || !data || data.revogado) return null;

  void supabaseAdmin
    .from("extensao_tokens")
    .update({ ultimo_uso_em: new Date().toISOString() })
    .eq("id", data.id)
    .then(() => undefined);

  return { userId: data.user_id, tokenId: data.id };
}

/** Currículo salvo na conta do usuário, usado pela extensão conectada. */
export async function curriculoDaConta(userId: string): Promise<string> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("dados_usuario")
    .select("curriculo")
    .eq("user_id", userId)
    .maybeSingle();

  return (data?.curriculo ?? "").trim();
}
```

## `src/lib/extensao.server.ts`

```ts
/** Helpers server-only para os tokens da extensão do navegador. */

export function gerarToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function hashToken(token: string): Promise<string> {
  const dados = new TextEncoder().encode(`eupasso:${token}`);
  const digest = await crypto.subtle.digest("SHA-256", dados);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Lê o token do header Authorization: Bearer <token>. */
export function tokenDoHeader(request: Request): string | null {
  const bruto = request.headers.get("authorization") ?? "";
  const match = /^Bearer\s+([A-Za-z0-9._-]+)$/i.exec(bruto.trim());
  return match?.[1] ?? null;
}
```

## `src/lib/game.server.ts`

```ts
export const SYSTEM_GAME_MAPA =
  "Você é um headhunter brasileiro que monta trilhas de aprendizado. Responda sempre em português do Brasil. " +
  "A partir do currículo recebido, identifique de 3 a 6 conhecimentos distintos que a pessoa realmente usa " +
  "(ex.: Excel, SQL, Power BI, Python, CRM, gestão de estoque) e monte UMA TRILHA SEPARADA para cada um. " +
  "Cada trilha tem: 'ferramenta' (o conhecimento), 'resumo' com 1 frase sobre o que a trilha cobre e " +
  "'fases' com 10 a 16 fases ordenadas do mais básico ao mais avançado daquele conhecimento. " +
  "Cada fase tem 'ferramenta' (a mesma da trilha), 'titulo' curto e motivador, 'nivel' (iniciante, " +
  "intermediario ou avancado) e 'foco' com 1 frase dizendo o que será cobrado. " +
  "Distribua os níveis: as primeiras fases iniciantes, as do meio intermediárias e as finais avançadas, " +
  "sem repetir o mesmo foco. Nunca misture conhecimentos diferentes na mesma trilha. " +
  "Se o currículo for vago, use os conhecimentos mais prováveis da área citada.";

export const SYSTEM_GAME_PERGUNTA =
  "Você é um examinador técnico brasileiro que cria perguntas de um jogo de conhecimento. Responda sempre em " +
  "português do Brasil. Crie UMA pergunta prática, realista e curta sobre a ferramenta/tema pedido, no nível " +
  "indicado, sorteando livremente o subtópico dentro do tema (não siga sempre o mesmo ângulo). " +
  "Para perguntas objetivas, gere exatamente 4 alternativas plausíveis, sendo apenas uma correta, e informe o " +
  "índice dela (0 a 3). Para perguntas subjetivas, deixe 'alternativas' vazio e 'indiceCorreto' nulo, e peça uma " +
  "resposta curta e concreta (ex.: escrever a fórmula, descrever o passo a passo). " +
  "O campo 'explicacao' ensina o raciocínio correto em 2 a 4 frases, com exemplo concreto. " +
  "O campo 'dica' é uma pista curta que não entrega a resposta. Nada de pegadinha ou teoria vaga.";

export const SYSTEM_GAME_AVALIACAO =
  "Você é um examinador técnico brasileiro avaliando a resposta de um candidato em um jogo educativo. " +
  "Responda sempre em português do Brasil, com tom encorajador e direto. " +
  "Dê 'pontos' de 0 a 100 conforme a qualidade da resposta e marque 'acertou' como verdadeiro apenas a " +
  "partir de 70 pontos. Em 'feedback', diga em 1 a 3 frases o que ficou bom e o que faltou. " +
  "Em 'licao', ensine a regra prática por trás da resposta ideal. " +
  "Em 'exemplo', escreva uma resposta modelo curta. " +
  "Nunca invente dados do candidato: use [colchetes] quando faltar informação.";
```

## `src/lib/gupy.server.ts`

```ts
export const SYSTEM_GUPY =
  "Você é um headhunter brasileiro sênior, especialista na plataforma Gupy e no seu algoritmo de ranqueamento (GAIA). " +
  "Você recebe o conteúdo do currículo exportado da conta Gupy do candidato (dados pessoais, grau de instrução, " +
  "experiência profissional com atividades, conquistas, idiomas e redes sociais). " +
  "Responda sempre em português do Brasil, com franqueza profissional e sem elogios vazios. " +
  "Avalie cinco frentes: (1) DADOS PESSOAIS — completude, contato, localização, LinkedIn, dados sensíveis expostos " +
  "desnecessariamente (por exemplo CPF ou endereço completo); (2) FORMAÇÃO — clareza de curso, instituição, datas e " +
  "cursos livres relevantes; (3) EXPERIÊNCIAS — escopo, verbos de ação, resultados com métricas, lacunas de datas, " +
  "descrições genéricas ou muito curtas; (4) CONQUISTAS/IDIOMAS/CERTIFICAÇÕES — aproveitamento dos campos extras da Gupy; " +
  "(5) TRIAGEM — como esse perfil se comporta no ranqueamento automático da Gupy: palavras-chave do cargo alvo, " +
  "aderência entre cargo desejado e histórico, campos vazios que derrubam a pontuação, tempo de casa, senioridade. " +
  "Use APENAS informações presentes no conteúdo enviado; nunca invente empresas, cargos, datas ou números. " +
  "As reescritas devem manter os fatos originais e caber nos campos da Gupy. Cite trechos reais ao apontar problemas. " +
  "Em 'conselhoDoHunter', fale em primeira pessoa como quem avalia esse candidato numa triagem real da Gupy.";
```

## `src/lib/linkedin.server.ts`

```ts
const GATEWAY = "https://connector-gateway.lovable.dev/firecrawl/v2";

export const SYSTEM_PERFIL =
  "Você é um headhunter brasileiro sênior, com anos de experiência caçando talentos pelo LinkedIn Recruiter. " +
  "Analise perfis do LinkedIn sempre em português do Brasil, com franqueza profissional e sem elogios vazios. " +
  "Avalie quatro frentes: (1) HEADER — foto, capa, headline, localização, seção 'Sobre', URL personalizada e destaques; " +
  "(2) VISUAL — organização, legibilidade, uso de seções, banners, mídias, excesso de emojis, texto em bloco; " +
  "(3) EXPERIÊNCIAS PROFISSIONAIS — clareza de escopo, verbos de ação, resultados com métricas, lacunas de datas, descrições vazias; " +
  "(4) VISIBILIDADE — como recrutadores encontram esse perfil na busca do Recruiter: palavras-chave, competências, " +
  "recomendações, atividade, 'Open to work', títulos pesquisáveis. " +
  "Use APENAS informações presentes no perfil enviado; nunca invente empresas, cargos, datas ou números. " +
  "Reescritas devem manter os fatos originais. Cite trechos reais ao apontar problemas. " +
  "Na 'conselhoDoHunter', fale em primeira pessoa como quem avalia esse perfil numa triagem real e diga o que faria a diferença.";

export async function lerPerfilPublico(url: string): Promise<string> {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const firecrawlKey = process.env["FIRECRAWL_API_KEY"];
  if (!lovableKey || !firecrawlKey) throw new Error("Leitura de perfis indisponível no momento.");

  const resposta = await fetch(`${GATEWAY}/scrape`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": firecrawlKey,
    },
    body: JSON.stringify({ url, formats: ["markdown"], onlyMainContent: true, waitFor: 2500 }),
  });

  if (!resposta.ok) {
    const corpo = await resposta.text();
    console.error(`Firecrawl perfil falhou [${resposta.status}]: ${corpo}`);
    throw new Error(
      "Não consegui abrir esse perfil — o LinkedIn costuma bloquear leitores externos. Exporte o PDF do seu perfil (Mais > Salvar como PDF) e envie o arquivo.",
    );
  }

  const json = (await resposta.json()) as {
    markdown?: string;
    data?: { markdown?: string };
  };
  const markdown = (json.markdown ?? json.data?.markdown ?? "").trim();

  if (markdown.length < 200 || /entrar|sign in|join linkedin/i.test(markdown.slice(0, 300))) {
    throw new Error(
      "O LinkedIn devolveu uma página de login em vez do perfil. Exporte o PDF do seu perfil (Mais > Salvar como PDF) e envie o arquivo.",
    );
  }

  return markdown.slice(0, 24000);
}
```

## `src/lib/plano.server.ts`

```ts
import { getRequest } from "@tanstack/react-start/server";

import { limiteDe, planoNecessario, ROTULO_TIER, tierDoPrice, type Recurso, type Tier } from "./plano";

export function ambientePagamento(): "live" | "sandbox" {
  return process.env["STRIPE_LIVE_API_KEY"] ? "live" : "sandbox";
}

/** Tier atual do usuário, lido da assinatura vigente. */
export async function tierDoUsuario(userId: string): Promise<Tier> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("subscriptions")
    .select("price_id, status, current_period_end")
    .eq("user_id", userId)
    .eq("environment", ambientePagamento())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return "gratis";
  const fim = data.current_period_end ? new Date(data.current_period_end) : null;
  const noPrazo = !fim || fim > new Date();
  const ativa =
    (["active", "trialing", "past_due"].includes(data.status) && noPrazo) ||
    (data.status === "canceled" && !!fim && fim > new Date());
  if (!ativa) return "gratis";
  return tierDoPrice(data.price_id);
}

function mensagemBloqueio(recurso: Recurso): string {
  const necessario = planoNecessario(recurso);
  return `Este recurso faz parte do plano ${ROTULO_TIER[necessario]}. Faça o upgrade no seu perfil para liberar.`;
}

function mensagemLimite(tier: Tier): string {
  return tier === "gratis"
    ? "Você atingiu o limite mensal do plano Grátis. Assine o Essencial para continuar usando sem limite."
    : "Você atingiu o limite mensal deste recurso no seu plano. Faça o upgrade para o Pro para uso ilimitado.";
}

/**
 * Verifica acesso e consome uma unidade da cota mensal.
 * Retorna null quando pode seguir, ou { error } quando bloqueado.
 */
export async function consumirRecurso(
  userId: string,
  recurso: Recurso,
): Promise<{ error: string } | null> {
  const tier = await tierDoUsuario(userId);
  const limite = limiteDe(tier, recurso);
  if (limite === 0) return { error: mensagemBloqueio(recurso) };
  if (limite < 0) return null;

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.rpc("consumir_cota", {
    _user_id: userId,
    _recurso: recurso,
    _limite: limite,
  });
  if (error) return null; // nunca bloqueia por falha de contagem
  if (data === false) return { error: mensagemLimite(tier) };
  return null;
}

/** Só checa o acesso, sem consumir cota. */
export async function checarRecurso(
  userId: string,
  recurso: Recurso,
): Promise<{ error: string } | null> {
  const tier = await tierDoUsuario(userId);
  if (limiteDe(tier, recurso) === 0) return { error: mensagemBloqueio(recurso) };
  return null;
}

/** Id do usuário quando a requisição traz um bearer válido; null para visitante. */
export async function usuarioOpcional(): Promise<string | null> {
  try {
    const request = getRequest();
    const header = request?.headers?.get("authorization");
    if (!header?.startsWith("Bearer ")) return null;
    const token = header.slice(7);
    if (token.split(".").length !== 3) return null;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.auth.getUser(token);
    return data?.user?.id ?? null;
  } catch {
    return null;
  }
}

/** Cota para funções públicas: visitante segue livre, usuário logado respeita o plano. */
export async function consumirRecursoOpcional(recurso: Recurso): Promise<{ error: string } | null> {
  const userId = await usuarioOpcional();
  if (!userId) return null;
  return consumirRecurso(userId, recurso);
}
```

## `src/lib/radar-run.server.ts`

```ts
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";

export type ResultadoRadar = { novas: number; avaliadas: number; titulos: string[] };

/**
 * Roda uma varredura completa do radar para um usuário: lê preferências e
 * currículo, busca anúncios reais, avalia com IA e grava o resultado.
 * Usado tanto pelo botão "Rodar radar agora" quanto pelo job de alertas.
 */
export const JANELA_DIAS = 30;

/** Marca como removidas as vagas encerradas/fora da janela, com motivo claro. */
export async function limparVagasEncerradas(
  admin: SupabaseClient<Database>,
  userId: string,
  janelaDias = JANELA_DIAS,
): Promise<number> {
  const { revalidarVagasUsuario } = await import("./revalidacao.server");
  const resultado = await revalidarVagasUsuario(admin, userId, janelaDias);
  return resultado.encerradas + resultado.foraDaJanela;
}

export async function executarRadar(
  admin: SupabaseClient<Database>,
  userId: string,
): Promise<ResultadoRadar | { error: string }> {
  const { avaliarVaga, buscarVagas, montarConsultas } = await import("./radar.server");
  const { vagaEncerrada } = await import("./vaga-encerrada");

  const { data: prefsRow } = await admin
    .from("preferencias_busca")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  const janelaDias = prefsRow?.janela_dias ?? JANELA_DIAS;
  await limparVagasEncerradas(admin, userId, janelaDias);

  const cargos = prefsRow?.cargos ?? [];
  if (!cargos.length) return { error: "Cadastre ao menos um cargo desejado nas preferências." };

  const { data: dados } = await admin
    .from("dados_usuario")
    .select("curriculo")
    .eq("user_id", userId)
    .maybeSingle();

  const curriculo = dados?.curriculo ?? "";
  if (curriculo.trim().length < 50)
    return { error: "Cadastre seu currículo antes de ativar o radar." };

  const prefs = {
    cargos,
    cidade: prefsRow?.cidade ?? "",
    estado: prefsRow?.estado ?? "",
    modelos: prefsRow?.modelos ?? [],
    contratos: prefsRow?.contratos ?? [],
    senioridade: prefsRow?.senioridade ?? "qualquer",
  };

  const evitar = (prefsRow?.palavras_evitar ?? []).map((p: string) => p.toLowerCase());

  let brutas;
  try {
    brutas = await buscarVagas(montarConsultas(prefs), 10, janelaDias);
  } catch (erro) {
    console.error(erro);
    return { error: "Não foi possível buscar vagas agora. Tente novamente em alguns minutos." };
  }

  const semAcento = (t: string) =>
    t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  // Cada cargo desejado vira um conjunto de termos: o título precisa conter TODOS
  // os termos de ao menos um cargo (ex.: "analista" + "dados").
  const gruposCargo = cargos
    .map((c: string) =>
      semAcento(c)
        .split(/[^a-z0-9]+/)
        .filter((t) => t.length > 3),
    )
    .filter((g: string[]) => g.length > 0);

  // Pontua o quanto o título casa com os cargos desejados: casamento total vale
  // mais, mas aceitamos casamento parcial forte para não perder vagas boas.
  const pontuarTitulo = (titulo: string) => {
    if (!gruposCargo.length) return 1;
    let melhor = 0;
    for (const grupo of gruposCargo) {
      const acertos = grupo.filter((t) => titulo.includes(t)).length;
      melhor = Math.max(melhor, acertos / grupo.length);
    }
    return melhor;
  };

  const candidatas = brutas
    .filter((v) => !evitar.some((p) => `${v.titulo} ${v.descricao}`.toLowerCase().includes(p)))
    .map((v) => ({ vaga: v, pontos: pontuarTitulo(semAcento(v.titulo)) }))
    .filter((c) => c.pontos >= 0.5)
    .sort((a, b) => b.pontos - a.pontos);

  const filtradas = candidatas.slice(0, 40).map((c) => c.vaga);

  const resumoPrefs = `Cargos: ${prefs.cargos.join(", ")}. Senioridade: ${prefs.senioridade}. Local: ${[prefs.cidade, prefs.estado].filter(Boolean).join("/") || "indiferente"}. Modelos aceitos: ${prefs.modelos.join(", ") || "indiferente"}. Tipos de contrato aceitos: ${prefs.contratos.join(", ") || "indiferente"}.`;

  let novas = 0;
  let avaliadas = 0;
  const titulos: string[] = [];

  // Avalia em paralelo (lotes) para conseguir cobrir muito mais anúncios por rodada.
  const paraAvaliar = filtradas.filter((v) => !vagaEncerrada(v.titulo, v.descricao));
  const avaliacoes: { bruta: (typeof filtradas)[number]; avaliacao: NonNullable<Awaited<ReturnType<typeof avaliarVaga>>> }[] = [];
  const LOTE_IA = 5;
  for (let i = 0; i < paraAvaliar.length; i += LOTE_IA) {
    const lote = paraAvaliar.slice(i, i + LOTE_IA);
    const resultados = await Promise.all(
      lote.map(async (bruta) => ({ bruta, avaliacao: await avaliarVaga(curriculo, resumoPrefs, bruta) })),
    );
    for (const r of resultados) {
      if (!r.avaliacao || !r.avaliacao.relevante || !r.avaliacao.aceitandoCandidaturas) continue;
      avaliacoes.push({ bruta: r.bruta, avaliacao: r.avaliacao });
    }
  }

  for (const { bruta, avaliacao } of avaliacoes) {


    // Só entram anúncios publicados dentro da janela escolhida pelo usuário.
    const dataPublicacao = avaliacao.publicadaEm ? new Date(avaliacao.publicadaEm) : null;
    const publicadaEm =
      dataPublicacao && !Number.isNaN(dataPublicacao.getTime()) ? dataPublicacao : null;
    const dias = publicadaEm
      ? Math.floor((Date.now() - publicadaEm.getTime()) / 86_400_000)
      : avaliacao.diasDesdePublicacao;
    if (dias > janelaDias) continue;

    avaliadas += 1;

    const noRadar = avaliacao.compatibilidade >= 40;

    const { data: vagaSalva, error: erroVaga } = await admin
      .from("vagas_encontradas")
      .upsert(
        {
          chave: bruta.chave,
          titulo: bruta.titulo,
          empresa: avaliacao.empresa,
          local: avaliacao.local,
          modelo: avaliacao.modelo,
          descricao: bruta.descricao.slice(0, 8000),
          link: bruta.link,
          fonte: bruta.fonte,
          publicada_em: publicadaEm
            ? publicadaEm.toISOString()
            : dias >= 0
              ? new Date(Date.now() - dias * 86_400_000).toISOString()
              : new Date().toISOString(),
        },
        { onConflict: "chave" },
      )
      .select("id")
      .single();

    if (erroVaga || !vagaSalva) continue;

    const { data: existente } = await admin
      .from("vagas_usuario")
      .select("id, status")
      .eq("user_id", userId)
      .eq("vaga_id", vagaSalva.id)
      .maybeSingle();

    if (existente) {
      // Reativa vagas que ficaram arquivadas mas voltaram a ser compatíveis.
      const podeReativar = ["baixa", "removida"].includes(existente.status);
      if (!podeReativar) continue;
      if (!noRadar) continue;
      const { error: erroUpd } = await admin
        .from("vagas_usuario")
        .update({
          compatibilidade: Math.round(avaliacao.compatibilidade),
          motivo: avaliacao.motivo,
          lacunas: avaliacao.lacunas,
          status: "nova",
          motivo_remocao: null,
          removida_em: null,
        })
        .eq("id", existente.id);
      if (erroUpd) continue;
    } else {
      const { error: erroLink } = await admin.from("vagas_usuario").insert({
        user_id: userId,
        vaga_id: vagaSalva.id,
        compatibilidade: Math.round(avaliacao.compatibilidade),
        motivo: avaliacao.motivo,
        lacunas: avaliacao.lacunas,
        status: noRadar ? "nova" : "baixa",
      });
      if (erroLink) continue;
    }

    if (noRadar) {
      novas += 1;
      if (titulos.length < 5) titulos.push(bruta.titulo);
    }
  }

  return { novas, avaliadas, titulos };
}

export async function registrarNotificacaoRadar(
  admin: SupabaseClient<Database>,
  userId: string,
  resultado: ResultadoRadar,
) {
  if (resultado.novas <= 0) return;
  await admin.from("notificacoes").insert({
    user_id: userId,
    titulo: `${resultado.novas} nova${resultado.novas > 1 ? "s" : ""} vaga${resultado.novas > 1 ? "s" : ""} no seu radar`,
    mensagem: resultado.titulos.join(" · ").slice(0, 400),
    tipo: "radar",
    dados: { novas: resultado.novas, avaliadas: resultado.avaliadas },
  });
}
```

## `src/lib/radar.server.ts`

```ts
import { generateObject } from "ai";
import { z } from "zod";

import { modelo, providerOptions } from "./ats.server";
import { recomendacoesVagaSchema } from "./radar.schemas";
import { vagaEncerrada } from "./vaga-encerrada";

const GATEWAY = "https://connector-gateway.lovable.dev/firecrawl/v2";

export const FONTES = [
  { dominio: "gupy.io", nome: "Gupy" },
  { dominio: "br.indeed.com", nome: "Indeed" },
  { dominio: "linkedin.com/jobs", nome: "LinkedIn" },
  { dominio: "vagas.com.br", nome: "Vagas.com" },
  { dominio: "infojobs.com.br", nome: "InfoJobs" },
  { dominio: "catho.com.br", nome: "Catho" },
];

export type VagaBruta = {
  chave: string;
  titulo: string;
  empresa: string;
  local: string;
  descricao: string;
  link: string;
  fonte: string;
};

function fonteDoLink(link: string): string {
  const encontrada = FONTES.find((f) => link.includes(f.dominio.split("/")[0] ?? f.dominio));
  return encontrada?.nome ?? new URL(link).hostname.replace("www.", "");
}

export function montarConsultas(prefs: {
  cargos: string[];
  cidade: string;
  estado: string;
  modelos: string[];
  contratos?: string[];
  senioridade: string;
}): string[] {
  const local = [prefs.cidade, prefs.estado].filter(Boolean).join(" ");
  const remoto = prefs.modelos.includes("remoto");
  const senioridade =
    prefs.senioridade && prefs.senioridade !== "qualquer" ? prefs.senioridade : "";
  const lugar = remoto ? "remoto" : local;
  // Só entra na busca quando o usuário escolheu exatamente um tipo de contrato;
  // com vários, o termo restringiria demais os resultados.
  const contrato = (prefs.contratos ?? []).length === 1 ? (prefs.contratos ?? [])[0] : "";

  const consultas: string[] = [];

  for (const cargo of prefs.cargos.slice(0, 5)) {
    // Uma consulta dedicada por plataforma amplia muito o volume de resultados,
    // porque o buscador não precisa dividir as vagas entre todos os domínios.
    for (const fonte of FONTES) {
      consultas.push(
        ["vaga", cargo, senioridade, contrato, lugar, `site:${fonte.dominio}`]
          .filter(Boolean)
          .join(" "),
      );
    }
    // Consultas abertas capturam ATSs menores (Solides, Kenoby, Workday etc.).
    consultas.push(["vaga", cargo, senioridade, lugar, "candidatar-se"].filter(Boolean).join(" "));
    if (!remoto && local)
      consultas.push(["vaga", cargo, senioridade, "remoto"].filter(Boolean).join(" "));
  }

  return [...new Set(consultas)];
}

type ItemBusca = { url?: string; title?: string; description?: string; markdown?: string };

function janelaParaTbs(janelaDias: number): string {
  if (janelaDias <= 7) return "qdr:w";
  if (janelaDias <= 31) return "qdr:m";
  return "qdr:y";
}

export async function buscarVagas(
  consultas: string[],
  limitePorConsulta = 10,
  janelaDias = 30,
): Promise<VagaBruta[]> {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const firecrawlKey = process.env["FIRECRAWL_API_KEY"];
  if (!lovableKey || !firecrawlKey) throw new Error("Busca de vagas indisponível no momento.");

  const tbs = janelaParaTbs(janelaDias);
  const auth = `Bearer ${lovableKey}`;
  const connKey: string = firecrawlKey;

  async function rodar(query: string): Promise<ItemBusca[]> {
    try {
      const resposta = await fetch(`${GATEWAY}/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: auth,
          "X-Connection-Api-Key": connKey,
        },
        body: JSON.stringify({
          query,
          limit: limitePorConsulta,
          lang: "pt",
          country: "br",
          tbs,
          scrapeOptions: { formats: ["markdown"], onlyMainContent: true },
        }),
      });

      if (!resposta.ok) {
        console.error(
          `Firecrawl falhou [${resposta.status}] em "${query}": ${await resposta.text()}`,
        );
        return [];
      }

      const json = (await resposta.json()) as {
        data?: ItemBusca[] | { web?: ItemBusca[] };
        web?: ItemBusca[];
      };
      return Array.isArray(json.data) ? json.data : (json.data?.web ?? json.web ?? []);
    } catch (erro) {
      console.error(`Erro na consulta "${query}"`, erro);
      return [];
    }
  }

  // Executa em lotes paralelos: mais volume sem estourar o rate limit do provedor.
  const LOTE = 4;
  const encontradas = new Map<string, VagaBruta>();
  let houveResposta = false;

  for (let i = 0; i < consultas.length; i += LOTE) {
    const lote = consultas.slice(i, i + LOTE);
    const resultados = await Promise.all(lote.map(rodar));

    for (const itens of resultados) {
      if (itens.length) houveResposta = true;
      for (const item of itens) {
        if (!item.url) continue;
        // Descarta anúncios que já não recebem candidaturas.
        if (vagaEncerrada(item.title, item.description, item.markdown)) continue;
        const chave = item.url.split("?")[0] ?? item.url;
        if (encontradas.has(chave)) continue;
        encontradas.set(chave, {
          chave,
          titulo: (item.title ?? "Vaga").slice(0, 200),
          empresa: "",
          local: "",
          descricao: (item.markdown ?? item.description ?? "").slice(0, 12000),
          link: item.url,
          fonte: fonteDoLink(item.url),
        });
      }
    }
  }

  if (!houveResposta && !encontradas.size)
    throw new Error("Nenhuma consulta de busca retornou resultados.");

  return [...encontradas.values()];
}

const avaliacaoSchema = z.object({
  compatibilidade: z.number().min(0).max(100),
  empresa: z.string(),
  local: z.string(),
  modelo: z.string(),
  motivo: z.string(),
  lacunas: z.array(z.string()),
  relevante: z.boolean(),
  aceitandoCandidaturas: z.boolean(),
  publicadaEm: z.string(),
  diasDesdePublicacao: z.number(),
});

export type Avaliacao = z.infer<typeof avaliacaoSchema>;

const SYSTEM_RADAR =
  "Você é um recrutador brasileiro que avalia se uma vaga real encontrada na internet combina com o currículo de um candidato. " +
  "Responda em português do Brasil. Baseie a nota apenas em evidências do currículo, sem inventar experiências. " +
  "Em 'empresa', 'local' e 'modelo' (remoto, híbrido ou presencial), extraia o que estiver na página; use string vazia se não houver. " +
  "Marque 'relevante' como falso quando o conteúdo não for realmente um anúncio de vaga ou não tiver relação com o perfil buscado. " +
  "Marque 'aceitandoCandidaturas' como falso sempre que a página indicar que a vaga está encerrada, expirada, pausada, preenchida, que não aceita mais candidaturas ou que o processo seletivo terminou. Na dúvida, marque falso. " +
  "Em 'publicadaEm', informe a data de publicação do anúncio no formato AAAA-MM-DD quando a página trouxer a data; use string vazia se não houver. " +
  "Em 'diasDesdePublicacao', estime há quantos dias a vaga foi publicada (use -1 se não for possível estimar).";

export async function avaliarVaga(
  curriculo: string,
  preferencias: string,
  vaga: VagaBruta,
): Promise<Avaliacao | null> {
  try {
    const { object } = await generateObject({
      model: modelo(),
      schema: avaliacaoSchema,
      providerOptions,
      system: SYSTEM_RADAR,
      prompt: `Data de hoje: ${new Date().toISOString().slice(0, 10)}.\n\nPREFERÊNCIAS DO CANDIDATO:\n${preferencias}\n\nANÚNCIO ENCONTRADO (${vaga.fonte})\nTítulo: ${vaga.titulo}\nLink: ${vaga.link}\nConteúdo:\n${vaga.descricao.slice(0, 8000)}\n\nCURRÍCULO:\n${curriculo.slice(0, 12000)}\n\nAvalie a compatibilidade de 0 a 100.`,
    });
    return object;
  } catch (erro) {
    console.error("Falha ao avaliar vaga", vaga.link, erro);
    return null;
  }
}

const SYSTEM_RECOMENDACOES =
  "Você é um consultor brasileiro de currículos que prepara um candidato para UMA vaga específica. " +
  "Responda em português do Brasil. Use apenas fatos que já existem no currículo — nunca invente experiências, " +
  "empresas, ferramentas, números ou formações. " +
  "Em 'palavrasChave', liste termos da vaga que faltam ou aparecem fracos no currículo, dizendo em que seção usar " +
  "e um exemplo de frase realista baseada na trajetória real do candidato. " +
  "Em 'trechos', copie literalmente frases que já existem no currículo em 'original' e reescreva em 'sugerido' " +
  "incorporando a linguagem da vaga, com verbo de ação e métrica quando o currículo já tiver o dado. " +
  "Em 'ganhoEstimado', informe o novo percentual de match esperado se todas as recomendações forem aplicadas.";

export async function gerarRecomendacoes(
  curriculo: string,
  vaga: {
    titulo: string;
    empresa: string;
    descricao: string;
    compatibilidade: number;
    lacunas: string[];
  },
) {
  const { object } = await generateObject({
    model: modelo(),
    schema: recomendacoesVagaSchema,
    providerOptions,
    system: SYSTEM_RECOMENDACOES,
    prompt: `VAGA\nCargo: ${vaga.titulo}\nEmpresa: ${vaga.empresa || "não informada"}\nMatch atual do candidato: ${vaga.compatibilidade}%\nLacunas já detectadas: ${vaga.lacunas.join("; ") || "nenhuma"}\nDescrição da vaga:\n${vaga.descricao.slice(0, 8000)}\n\nCURRÍCULO ATUAL:\n---\n${curriculo.slice(0, 14000)}\n---\n\nGere recomendações específicas de palavras-chave e reescritas de trechos para aumentar o match nesta vaga.`,
  });
  return object;
}

export async function gerarCurriculoParaVaga(
  curriculo: string,
  vaga: {
    titulo: string;
    empresa: string;
    descricao: string;
    compatibilidade: number;
    lacunas: string[];
  },
  comCarta: boolean,
  recomendacoes?: {
    palavrasChave: { termo: string; importancia: string; ondeUsar: string; exemplo: string }[];
    trechos: { original: string; sugerido: string; motivo: string }[];
    acoesRapidas: string[];
  } | null,
) {
  const { curriculoRevisadoSchema } = await import("./ats.schemas");
  const { SYSTEM_REVISAO } = await import("./ats.server");

  const blocos: string[] = [];
  if (recomendacoes?.palavrasChave?.length)
    blocos.push(
      "PALAVRAS-CHAVE OBRIGATÓRIAS (incluir cada uma):\n" +
        recomendacoes.palavrasChave
          .map(
            (p) => `- ${p.termo} (${p.importancia}) → usar em ${p.ondeUsar}. Exemplo: ${p.exemplo}`,
          )
          .join("\n"),
    );
  if (recomendacoes?.trechos?.length)
    blocos.push(
      "REESCRITAS OBRIGATÓRIAS (substituir o original pela versão sugerida):\n" +
        recomendacoes.trechos
          .map((t) => `- "${t.original}" → "${t.sugerido}" (${t.motivo})`)
          .join("\n"),
    );
  if (recomendacoes?.acoesRapidas?.length)
    blocos.push("AÇÕES RÁPIDAS A APLICAR:\n- " + recomendacoes.acoesRapidas.join("\n- "));

  const melhorias = blocos.join("\n\n").slice(0, 8000);

  const contexto = `VAGA ALVO\nCargo: ${vaga.titulo}\nEmpresa: ${vaga.empresa || "não informada"}\nMatch atual: ${vaga.compatibilidade}%\nLacunas detectadas: ${vaga.lacunas.join("; ") || "nenhuma"}\nDescrição da vaga:\n${vaga.descricao.slice(0, 8000)}${
    melhorias ? `\n\nMELHORIAS A APLICAR NESTA VERSÃO:\n${melhorias}` : ""
  }`;

  const { object: revisado } = await generateObject({
    model: modelo(),
    schema: curriculoRevisadoSchema,
    providerOptions,
    system:
      SYSTEM_REVISAO +
      " Adapte o currículo especificamente para a vaga informada: reordene as experiências e competências " +
      "mais relevantes para o cargo, use a linguagem e as palavras-chave do anúncio e destaque o que atende aos requisitos.",
    prompt: `${contexto}\n\nCURRÍCULO ORIGINAL:\n---\n${curriculo.slice(0, 14000)}\n---\n\nGere a versão do currículo sob medida para esta vaga aplicando OBRIGATORIAMENTE cada item da lista de melhorias. Antes de responder, confira termo a termo se todos aparecem no texto final; registre em "mudancas" onde cada um foi inserido e em "observacoes" o que não pôde ser aplicado por não ser verdadeiro.`,
  });

  if (!comCarta) return { curriculo: revisado, carta: null };

  const carta = await gerarCartaParaVaga(revisado.curriculo, {
    titulo: vaga.titulo,
    empresa: vaga.empresa,
    descricao: vaga.descricao,
  });

  return { curriculo: revisado, carta };
}

/** Gera apenas a carta de apresentação para uma vaga, a partir do currículo já montado. */
export async function gerarCartaParaVaga(
  curriculo: string,
  vaga: { titulo: string; empresa: string; descricao: string },
  tom: "formal" | "equilibrado" | "direto" = "equilibrado",
) {
  const { cartaSchema } = await import("./ats.schemas");
  const { limitarCarta, promptCarta, SYSTEM_CARTA } = await import("./ats.server");

  const { object } = await generateObject({
    model: modelo(),
    schema: cartaSchema,
    providerOptions,
    system: SYSTEM_CARTA,
    prompt: promptCarta({
      cargo: vaga.titulo,
      empresa: vaga.empresa,
      requisitos: vaga.descricao.slice(0, 8000),
      curriculo: curriculo.slice(0, 14000),
      tom,
    }),
  });
  return { ...object, carta: limitarCarta(object.carta) };
}
```

## `src/lib/revalidacao.server.ts`

```ts
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";

export type ResultadoRevalidacao = {
  encerradas: number;
  foraDaJanela: number;
  analisadas: number;
};

/**
 * Revalida as vagas de um usuário com a lógica atual: marca como "removida"
 * tudo que já não aceita candidaturas ou que saiu da janela de postagem,
 * registrando o motivo claro da remoção.
 */
export async function revalidarVagasUsuario(
  admin: SupabaseClient<Database>,
  userId: string,
  janelaDias: number,
): Promise<ResultadoRevalidacao> {
  const { vagaEncerrada } = await import("./vaga-encerrada");

  const { data } = await admin
    .from("vagas_usuario")
    .select("id, status, created_at, vagas_encontradas(titulo, descricao, publicada_em)")
    .eq("user_id", userId)
    .neq("status", "removida")
    .limit(500);

  const linhas = data ?? [];
  const limite = Date.now() - janelaDias * 86_400_000;

  const encerradas: string[] = [];
  const foraDaJanela: string[] = [];

  for (const linha of linhas) {
    const vaga = linha.vagas_encontradas;
    if (vagaEncerrada(vaga?.titulo, vaga?.descricao)) {
      encerradas.push(linha.id);
      continue;
    }
    const referencia = new Date(vaga?.publicada_em ?? linha.created_at).getTime();
    if (Number.isFinite(referencia) && referencia < limite) foraDaJanela.push(linha.id);
  }

  const agora = new Date().toISOString();

  if (encerradas.length)
    await admin
      .from("vagas_usuario")
      .update({
        status: "removida",
        motivo_remocao: "Não aceita mais candidaturas",
        removida_em: agora,
      })
      .in("id", encerradas);

  if (foraDaJanela.length)
    await admin
      .from("vagas_usuario")
      .update({
        status: "removida",
        motivo_remocao: `Fora da janela de ${janelaDias} dias`,
        removida_em: agora,
      })
      .in("id", foraDaJanela);

  return {
    encerradas: encerradas.length,
    foraDaJanela: foraDaJanela.length,
    analisadas: linhas.length,
  };
}

/** Lê a janela de postagem configurada pelo usuário (padrão 30 dias). */
export async function janelaDoUsuario(
  admin: SupabaseClient<Database>,
  userId: string,
): Promise<number> {
  const { data } = await admin
    .from("preferencias_busca")
    .select("janela_dias")
    .eq("user_id", userId)
    .maybeSingle();
  return data?.janela_dias ?? 30;
}
```

## `src/lib/roadmap.server.ts`

```ts
export const SYSTEM_ROADMAP =
  "Você é um mentor de carreira brasileiro que monta trilhas de estudo objetivas para candidatos. " +
  "Responda sempre em português do Brasil. Leia o currículo, considere o cargo desejado e as lacunas " +
  "apontadas e monte uma trilha de 8 a 12 conhecimentos, distribuídos entre três níveis: " +
  "'base' (o que falta agora para o currículo competir), 'proximos' (o que estudar nos próximos 3 meses) e " +
  "'diferencial' (o que diferencia o candidato a médio prazo). " +
  "Cada item deve trazer: a habilidade específica (nada genérico como 'melhorar comunicação'), " +
  "por que ela importa para esse cargo, como comprovar isso no currículo depois de aprender " +
  "(seção e exemplo de bullet), o esforço estimado em texto curto e o campo numérico 'horasEstimadas' " +
  "com o total de horas de estudo daquele item (apenas o número, entre 1 e 400). " +
  "Respeite o ritmo semanal informado: a soma das horas dos itens de 'base' deve caber em cerca de 4 semanas " +
  "de estudo naquele ritmo, os de 'proximos' em cerca de 12 semanas e os de 'diferencial' em até 24 semanas. " +
  "Se o ritmo for baixo, reduza a quantidade de itens e escolha os de maior impacto em vez de encher a trilha. " +
  "Prioridade 'alta' para o que aparece nas lacunas informadas ou é requisito recorrente do cargo. " +
  "Não invente experiências do candidato e não sugira cursos pagos específicos por nome comercial.";
```

## `src/lib/stripe.server.ts`

```ts
import Stripe from "stripe";

const getEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`${key} is not configured`);
  return value;
};

export type StripeEnv = "sandbox" | "live";

const GATEWAY_STRIPE_BASE = "https://connector-gateway.lovable.dev/stripe";

export function getConnectionApiKey(env: StripeEnv): string {
  return env === "sandbox" ? getEnv("STRIPE_SANDBOX_API_KEY") : getEnv("STRIPE_LIVE_API_KEY");
}

export function createStripeClient(env: StripeEnv): Stripe {
  const connectionApiKey = getConnectionApiKey(env);
  const lovableApiKey = getEnv("LOVABLE_API_KEY");

  return new Stripe(connectionApiKey, {
    apiVersion: "2026-03-25.dahlia",
    httpClient: Stripe.createFetchHttpClient((input, init) => {
      const stripeUrl = input instanceof Request ? input.url : input.toString();
      const gatewayUrl = stripeUrl.replace("https://api.stripe.com", GATEWAY_STRIPE_BASE);
      return fetch(gatewayUrl, {
        ...init,
        headers: {
          ...Object.fromEntries(
            new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined)).entries(),
          ),
          "X-Connection-Api-Key": connectionApiKey,
          "Lovable-API-Key": lovableApiKey,
        },
      });
    }),
  });
}

export function getStripeErrorMessage(error: unknown): string {
  if (error && typeof error === "object") {
    const stripeError = error as {
      message?: string;
      type?: string;
      code?: string;
      decline_code?: string;
      param?: string;
      requestId?: string;
      raw?: {
        message?: string;
        type?: string;
        code?: string;
        decline_code?: string;
        param?: string;
        requestId?: string;
      };
    };

    const message = stripeError.raw?.message ?? stripeError.message;
    if (message) {
      const details = [
        stripeError.raw?.type ?? stripeError.type,
        stripeError.raw?.code ?? stripeError.code,
        stripeError.raw?.decline_code ?? stripeError.decline_code,
        stripeError.raw?.param ?? stripeError.param,
        stripeError.raw?.requestId ?? stripeError.requestId,
      ].filter(Boolean);
      return details.length ? `${message} (${details.join(", ")})` : message;
    }
  }

  return "Stripe request failed";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function verifyWebhook(req: Request, env: StripeEnv): Promise<{ type: string; data: { object: any } }> {
  const signature = req.headers.get("stripe-signature");
  const body = await req.text();
  const secret =
    env === "sandbox" ? getEnv("PAYMENTS_SANDBOX_WEBHOOK_SECRET") : getEnv("PAYMENTS_LIVE_WEBHOOK_SECRET");

  if (!signature || !body) {
    throw new Error("Missing signature or body");
  }

  let timestamp: string | undefined;
  const v1Signatures: string[] = [];
  for (const part of signature.split(",")) {
    const [key, value] = part.split("=", 2);
    if (key === "t") timestamp = value;
    if (key === "v1" && value) v1Signatures.push(value);
  }

  if (!timestamp || v1Signatures.length === 0) {
    throw new Error("Invalid signature format");
  }

  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (age > 300) {
    throw new Error("Webhook timestamp too old");
  }

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signed = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${timestamp}.${body}`));
  const expected = Buffer.from(new Uint8Array(signed)).toString("hex");

  if (!v1Signatures.includes(expected)) {
    throw new Error("Invalid webhook signature");
  }

  return JSON.parse(body);
}
```

## `src/lib/ats.schemas.ts`

```ts
import { z } from "zod";

export const atsSchema = z.object({
  score: z.number().min(0).max(100),
  resumo: z.string(),
  pontosFortes: z.array(z.string()),
  problemasAts: z.array(
    z.object({
      titulo: z.string(),
      gravidade: z.enum(["alta", "media", "baixa"]),
      explicacao: z.string(),
      comoCorrigir: z.string(),
    }),
  ),
  palavrasChaveFaltando: z.array(z.string()),
  verbosFracos: z.array(z.string()),
  secoes: z.array(z.object({ nome: z.string(), status: z.enum(["ok", "melhorar", "ausente"]), nota: z.string() })),
  reescritas: z.array(z.object({ original: z.string(), sugerida: z.string() })),
});

export type AtsAnalysis = z.infer<typeof atsSchema>;

export const matchSchema = z.object({
  compatibilidade: z.number().min(0).max(100),
  veredito: z.string(),
  requisitosAtendidos: z.array(z.string()),
  lacunas: z.array(z.object({ requisito: z.string(), gravidade: z.enum(["alta", "media", "baixa"]), acao: z.string() })),
  palavrasChaveParaIncluir: z.array(z.string()),
  ajustesNoCurriculo: z.array(z.string()),
});

export type JobMatch = z.infer<typeof matchSchema>;

/** Limite de caracteres da carta — a Gupy corta a apresentação acima disso. */
export const LIMITE_CARTA = 1200;

export const cartaSchema = z.object({
  assunto: z.string(),
  carta: z.string(),
  observacoes: z.array(z.string()),
});

export type CartaApresentacao = z.infer<typeof cartaSchema>;

export const analisarCurriculoInput = z.object({ texto: z.string().min(50).max(30000) });

export const analisarVagaInput = z.object({
  curriculo: z.string().min(50).max(30000),
  cargo: z.string().min(1).max(200),
  empresa: z.string().max(200).optional().default(""),
  link: z.string().max(500).optional().default(""),
  requisitos: z.string().min(10).max(15000),
});

export const gerarCartaInput = z.object({
  curriculo: z.string().min(50).max(30000),
  cargo: z.string().min(1).max(200),
  empresa: z.string().max(200).optional().default(""),
  requisitos: z.string().min(10).max(15000),
  tom: z.enum(["formal", "equilibrado", "direto"]).optional().default("equilibrado"),
});

export const curriculoRevisadoSchema = z.object({
  curriculo: z.string(),
  mudancas: z.array(z.string()),
  observacoes: z.array(z.string()),
});

export type CurriculoRevisado = z.infer<typeof curriculoRevisadoSchema>;

export const gerarCurriculoRevisadoInput = z.object({
  curriculo: z.string().min(50).max(30000),
  orientacoes: z.string().max(8000).optional().default(""),
});
```

## `src/lib/conquistas.schemas.ts`

```ts
import { z } from "zod";

export const conquistaSchema = z.object({
  titulo: z.string(),
  situacao: z.string(),
  tarefa: z.string(),
  acao: z.string(),
  resultado: z.string(),
  tags: z.array(z.string()),
});

export const sugestoesConquistasSchema = z.object({
  conquistas: z.array(conquistaSchema),
});

export type ConquistaSugerida = z.infer<typeof conquistaSchema>;

export type Conquista = ConquistaSugerida & {
  id: string;
  created_at: string;
};

export const sugerirConquistasInput = z.object({
  curriculo: z.string().min(50).max(30000),
});

export const salvarConquistaInput = z.object({
  id: z.string().uuid().optional(),
  titulo: z.string().min(2).max(200),
  situacao: z.string().max(2000).optional().default(""),
  tarefa: z.string().max(2000).optional().default(""),
  acao: z.string().max(2000).optional().default(""),
  resultado: z.string().max(2000).optional().default(""),
  tags: z.array(z.string().max(60)).max(12).optional().default([]),
});
```

## `src/lib/cursos.schemas.ts`

```ts
import { z } from "zod";

export type Curso = {
  id: string;
  nome: string;
  instituicao: string;
  carga_horaria: string;
  concluido_em: string;
  link: string;
  aprendizados: string;
  aplicado_em_curriculo: boolean;
  created_at: string;
};

export const salvarCursoInput = z.object({
  id: z.string().uuid().optional(),
  nome: z.string().min(2).max(200),
  instituicao: z.string().max(200).optional().default(""),
  carga_horaria: z.string().max(60).optional().default(""),
  concluido_em: z.string().max(40).optional().default(""),
  link: z.string().max(500).optional().default(""),
  aprendizados: z.string().max(2000).optional().default(""),
});

export const curriculoComCursoSchema = z.object({
  curriculo: z.string(),
  mudancas: z.array(z.string()),
  observacoes: z.array(z.string()),
});

export type CurriculoComCurso = z.infer<typeof curriculoComCursoSchema>;

export const aplicarCursoInput = z.object({
  curriculo: z.string().min(50).max(30000),
  curso: salvarCursoInput.omit({ id: true }),
});
```

## `src/lib/entrevista.schemas.ts`

```ts
import { z } from "zod";

export const roteiroEntrevistaSchema = z.object({
  resumoDaVaga: z.string(),
  pontosFortes: z.array(z.string()),
  riscos: z.array(
    z.object({
      lacuna: z.string(),
      comoResponder: z.string(),
    }),
  ),
  perguntas: z.array(
    z.object({
      pergunta: z.string(),
      tipo: z.enum(["tecnica", "comportamental", "lacuna", "cultura"]),
      porQueVemAqui: z.string(),
      respostaStar: z.object({
        situacao: z.string(),
        tarefa: z.string(),
        acao: z.string(),
        resultado: z.string(),
      }),
    }),
  ),
  perguntasParaFazer: z.array(z.string()),
  salario: z.object({
    faixaSugerida: z.string(),
    comoResponder: z.string(),
  }),
  conselhoFinal: z.string(),
});

export type RoteiroEntrevista = z.infer<typeof roteiroEntrevistaSchema>;

export const feedbackRespostaSchema = z.object({
  nota: z.number().min(0).max(100),
  pontosBons: z.array(z.string()),
  ajustes: z.array(z.string()),
  versaoMelhorada: z.string(),
});

export type FeedbackResposta = z.infer<typeof feedbackRespostaSchema>;
```

## `src/lib/game.schemas.ts`

```ts
import { z } from "zod";

export const NIVEIS_GAME = ["iniciante", "intermediario", "avancado"] as const;
export type NivelGame = (typeof NIVEIS_GAME)[number];

export const faseSchema = z.object({
  titulo: z.string(),
  ferramenta: z.string(),
  nivel: z.enum(NIVEIS_GAME),
  foco: z.string(),
});

export type FaseQuest = z.infer<typeof faseSchema>;

export const trilhaSchema = z.object({
  ferramenta: z.string(),
  resumo: z.string(),
  fases: z.array(faseSchema).min(10).max(16),
});

export type TrilhaQuest = z.infer<typeof trilhaSchema>;

export const mapaSchema = z.object({
  trilhas: z.array(trilhaSchema).min(3).max(6),
});

export type MapaQuest = z.infer<typeof mapaSchema>;

export const perguntaSchema = z.object({
  tipo: z.enum(["objetiva", "subjetiva"]),
  enunciado: z.string(),
  alternativas: z.array(z.string()).max(4),
  indiceCorreto: z.number().int().min(0).max(3).nullable(),
  explicacao: z.string(),
  dica: z.string(),
});

export type Pergunta = z.infer<typeof perguntaSchema>;

export const avaliacaoSchema = z.object({
  acertou: z.boolean(),
  pontos: z.number().int().min(0).max(100),
  feedback: z.string(),
  licao: z.string(),
  exemplo: z.string(),
});

export type Avaliacao = z.infer<typeof avaliacaoSchema>;

export const gerarPerguntaInput = z.object({
  tema: z.string().min(2).max(160),
  foco: z.string().max(400).default(""),
  nivel: z.enum(NIVEIS_GAME).default("iniciante"),
  evitar: z.array(z.string().max(300)).max(10).default([]),
});

export const avaliarRespostaInput = z.object({
  tema: z.string().min(2).max(160),
  enunciado: z.string().min(5).max(2000),
  resposta: z.string().min(1).max(3000),
});
```

## `src/lib/gupy.schemas.ts`

```ts
import { z } from "zod";

export const perfilGupySchema = z.object({
  nota: z.number().min(0).max(100),
  nivel: z.enum(["incompleto", "basico", "competitivo", "referencia"]),
  resumo: z.string(),
  notasPorArea: z.array(
    z.object({
      area: z.enum(["dados_pessoais", "formacao", "experiencias", "conquistas", "triagem"]),
      nota: z.number().min(0).max(100),
      diagnostico: z.string(),
    }),
  ),
  camposIncompletos: z.array(
    z.object({
      campo: z.string(),
      gravidade: z.enum(["alta", "media", "baixa"]),
      comoCorrigir: z.string(),
    }),
  ),
  experiencias: z.array(
    z.object({
      cargo: z.string(),
      problema: z.string(),
      reescrita: z.string(),
    }),
  ),
  palavrasChaveFaltando: z.array(z.string()),
  riscosDeTriagem: z.array(z.string()),
  conselhoDoHunter: z.string(),
  proximosPassos: z.array(z.string()),
});

export type PerfilGupy = z.infer<typeof perfilGupySchema>;

export const analisarGupyInput = z.object({
  texto: z.string().min(80, "Envie o PDF exportado da sua conta Gupy.").max(30000),
  area: z.string().max(200).optional().default(""),
});
```

## `src/lib/linkedin.schemas.ts`

```ts
import { z } from "zod";

export const perfilLinkedinSchema = z.object({
  nota: z.number().min(0).max(100),
  nivel: z.enum(["iniciante", "em construcao", "competitivo", "referencia"]),
  resumo: z.string(),
  notasPorArea: z.array(
    z.object({
      area: z.enum(["header", "visual", "experiencias", "visibilidade"]),
      nota: z.number().min(0).max(100),
      diagnostico: z.string(),
    }),
  ),
  header: z.object({
    tituloSugerido: z.string(),
    sobreSugerido: z.string(),
    problemas: z.array(z.string()),
  }),
  visual: z.array(
    z.object({
      item: z.string(),
      gravidade: z.enum(["alta", "media", "baixa"]),
      comoCorrigir: z.string(),
    }),
  ),
  experiencias: z.array(
    z.object({
      cargo: z.string(),
      problema: z.string(),
      reescrita: z.string(),
    }),
  ),
  visibilidade: z.object({
    palavrasChaveFaltando: z.array(z.string()),
    acoes: z.array(z.string()),
  }),
  conselhoDoHunter: z.string(),
  proximosPassos: z.array(z.string()),
});

export type PerfilLinkedin = z.infer<typeof perfilLinkedinSchema>;

export const analisarPerfilInput = z
  .object({
    url: z.string().max(500).optional().default(""),
    texto: z.string().max(30000).optional().default(""),
    area: z.string().max(200).optional().default(""),
  })
  .refine((v) => v.texto.trim().length >= 80 || /linkedin\.com\/in\//i.test(v.url), {
    message: "Informe um link de perfil do LinkedIn ou envie o PDF do perfil.",
  });
```

## `src/lib/radar.schemas.ts`

```ts
import { z } from "zod";

export const recomendacoesVagaSchema = z.object({
  resumo: z.string(),
  ganhoEstimado: z.number().min(0).max(100),
  palavrasChave: z.array(
    z.object({
      termo: z.string(),
      importancia: z.enum(["alta", "media", "baixa"]),
      ondeUsar: z.string(),
      exemplo: z.string(),
    }),
  ),
  trechos: z.array(
    z.object({
      original: z.string(),
      sugerido: z.string(),
      motivo: z.string(),
    }),
  ),
  acoesRapidas: z.array(z.string()),
});

export type RecomendacoesVaga = z.infer<typeof recomendacoesVagaSchema>;

/** Tipos de contrato que o usuário pode buscar no radar. */
export const CONTRATOS = ["CLT", "PJ", "Cooperado"] as const;
export type Contrato = (typeof CONTRATOS)[number];

export const FREQUENCIAS_ALERTA = ["nenhum", "diario", "semanal"] as const;
export type FrequenciaAlerta = (typeof FREQUENCIAS_ALERTA)[number];

/** Janelas de postagem disponíveis (idade máxima do anúncio, em dias). */
export const JANELAS_DIAS = [7, 15, 30, 60] as const;
export type JanelaDias = (typeof JANELAS_DIAS)[number];
export const JANELA_PADRAO: JanelaDias = 30;
```

## `src/lib/roadmap.schemas.ts`

```ts
import { z } from "zod";

export const NIVEIS = ["base", "proximos", "diferencial"] as const;
export const STATUS_ITEM = ["a_fazer", "estudando", "concluido"] as const;

export type NivelRoadmap = (typeof NIVEIS)[number];
export type StatusItem = (typeof STATUS_ITEM)[number];

export const ROTULO_NIVEL: Record<NivelRoadmap, string> = {
  base: "Base agora",
  proximos: "Próximos 3 meses",
  diferencial: "Diferencial",
};

export const ROTULO_STATUS: Record<StatusItem, string> = {
  a_fazer: "A fazer",
  estudando: "Estudando",
  concluido: "Concluído",
};

export const itemRoadmapSchema = z.object({
  habilidade: z.string(),
  nivel: z.enum(NIVEIS),
  porque: z.string(),
  comoComprovar: z.string(),
  esforco: z.string(),
  horasEstimadas: z.number().min(1).max(400),
  prioridade: z.enum(["alta", "media", "baixa"]),
});

export const trilhaSchema = z.object({
  itens: z.array(itemRoadmapSchema),
});

export type ItemSugerido = z.infer<typeof itemRoadmapSchema>;

export type ItemRoadmap = {
  id: string;
  habilidade: string;
  nivel: NivelRoadmap;
  porque: string;
  como_comprovar: string;
  esforco: string;
  horas_estimadas: number;
  horas_feitas: number;
  concluido_em: string | null;
  prioridade: "alta" | "media" | "baixa";
  status: StatusItem;
  created_at: string;
};

export type RitmoEstudo = { horas_dia: number; dias_semana: number };

export type SessaoEstudo = { dia: string; horas: number };

export const ritmoInput = z.object({
  horas_dia: z.number().min(0.25).max(12),
  dias_semana: z.number().int().min(1).max(7),
});

export const gerarTrilhaInput = z.object({
  curriculo: z.string().min(50).max(30000),
  cargo: z.string().max(200).optional().default(""),
  lacunas: z.array(z.string().max(200)).max(40).optional().default([]),
  horasDia: z.number().min(0.25).max(12).optional().default(1),
  diasSemana: z.number().int().min(1).max(7).optional().default(5),
});

export const atualizarItemInput = z.object({
  id: z.string().uuid(),
  status: z.enum(STATUS_ITEM),
});

export const registrarHorasInput = z.object({
  id: z.string().uuid(),
  horas: z.number().min(0.25).max(12),
});

export const concluirPorTermoInput = z.object({
  texto: z.string().min(2).max(3000),
});

/** Horas disponíveis por semana a partir do ritmo declarado. */
export function horasPorSemana(ritmo: RitmoEstudo): number {
  return Math.round(ritmo.horas_dia * ritmo.dias_semana * 10) / 10;
}
```

## `src/lib/plano.ts`

```ts
/** Níveis de plano do Eu Passo. Client-safe: pode ser importado por componentes. */
export type Tier = "gratis" | "essencial" | "pro";

export type Recurso =
  | "ats"
  | "vaga"
  | "carta"
  | "curriculo_revisado"
  | "radar"
  | "linkedin"
  | "curriculo_vaga"
  | "gupy"
  | "entrevista"
  | "quest"
  | "roadmap"
  | "cursos";

/** -1 = ilimitado, 0 = bloqueado no plano. */
export const LIMITES: Record<Tier, Record<Recurso, number>> = {
  gratis: {
    ats: 3,
    vaga: 3,
    carta: 1,
    curriculo_revisado: 1,
    radar: 0,
    linkedin: 0,
    curriculo_vaga: 0,
    gupy: 0,
    entrevista: 0,
    quest: 0,
    roadmap: 0,
    cursos: 0,
  },
  essencial: {
    ats: -1,
    vaga: -1,
    carta: -1,
    curriculo_revisado: -1,
    radar: 8,
    linkedin: 2,
    curriculo_vaga: 10,
    gupy: 0,
    entrevista: 0,
    quest: 0,
    roadmap: 0,
    cursos: 0,
  },
  pro: {
    ats: -1,
    vaga: -1,
    carta: -1,
    curriculo_revisado: -1,
    radar: -1,
    linkedin: -1,
    curriculo_vaga: -1,
    gupy: -1,
    entrevista: -1,
    quest: -1,
    roadmap: -1,
    cursos: -1,
  },
};

export const ROTULO_RECURSO: Record<Recurso, string> = {
  ats: "análises de currículo",
  vaga: "comparações de vaga",
  carta: "cartas de apresentação",
  curriculo_revisado: "currículos revisados",
  radar: "buscas do radar",
  linkedin: "análises do LinkedIn",
  curriculo_vaga: "currículos por vaga",
  gupy: "análises da Gupy",
  entrevista: "preparações de entrevista",
  quest: "trilhas da Quest",
  roadmap: "trilhas de conhecimento",
  cursos: "buscas de cursos",
};

export const ROTULO_TIER: Record<Tier, string> = {
  gratis: "Grátis",
  essencial: "Essencial",
  pro: "Pro",
};

const ORDEM: Tier[] = ["gratis", "essencial", "pro"];

export function limiteDe(tier: Tier, recurso: Recurso): number {
  return LIMITES[tier][recurso];
}

export function liberado(tier: Tier, recurso: Recurso): boolean {
  return limiteDe(tier, recurso) !== 0;
}

/** Menor plano que libera o recurso. */
export function planoNecessario(recurso: Recurso): Tier {
  return ORDEM.find((t) => liberado(t, recurso)) ?? "pro";
}

/** Meses de acesso por priceId. */
export const MESES_POR_PRICE: Record<string, number> = {
  essencial_mensal: 1,
  essencial_trimestral: 3,
  essencial_semestral: 6,
  essencial_anual: 12,
  pro_mensal: 1,
  pro_trimestral: 3,
  pro_semestral: 6,
  pro_anual: 12,
};

export function tierDoPrice(priceId: string | null | undefined): Tier {
  if (!priceId) return "gratis";
  if (priceId.startsWith("essencial_")) return "essencial";
  if (priceId.startsWith("pro_")) return "pro";
  return "gratis";
}
```

## `src/routes/api/public/extensao/perfil.ts`

```ts
import { createFileRoute } from "@tanstack/react-router";

import { contaDaExtensao, corsExtensao, curriculoDaConta, jsonExtensao } from "@/lib/extensao-api.server";

export const Route = createFileRoute("/api/public/extensao/perfil")({
  server: {
    handlers: {
      OPTIONS: () => new Response(null, { headers: corsExtensao }),
      GET: async ({ request }) => {
        const conta = await contaDaExtensao(request);
        if (!conta) return jsonExtensao({ erro: "Conexão inválida ou revogada." }, 401);

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const curriculo = await curriculoDaConta(conta.userId);
        const { data: perfil } = await supabaseAdmin
          .from("perfis")
          .select("nome, cargo_desejado")
          .eq("id", conta.userId)
          .maybeSingle();

        return jsonExtensao({
          conectado: true,
          nome: perfil?.nome ?? "",
          cargoDesejado: perfil?.cargo_desejado ?? "",
          temCurriculo: curriculo.length >= 50,
          tamanhoCurriculo: curriculo.length,
          previaCurriculo: curriculo.slice(0, 180),
        });
      },
    },
  },
});
```

## `src/routes/api/public/extensao/salvar.ts`

```ts
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { contaDaExtensao, corsExtensao, jsonExtensao } from "@/lib/extensao-api.server";

const entrada = z.object({
  destino: z.enum(["candidatura"]).default("candidatura"),
  cargo: z.string().min(1).max(200),
  empresa: z.string().max(200).optional().default(""),
  link: z.string().max(2000).optional().default(""),
  fonte: z.string().max(60).optional().default(""),
  local: z.string().max(160).optional().default(""),
  requisitos: z.string().max(15000).optional().default(""),
  compatibilidade: z.number().min(0).max(100).optional().default(0),
});

export const Route = createFileRoute("/api/public/extensao/salvar")({
  server: {
    handlers: {
      OPTIONS: () => new Response(null, { headers: corsExtensao }),
      POST: async ({ request }) => {
        const conta = await contaDaExtensao(request);
        if (!conta) return jsonExtensao({ erro: "Conexão inválida ou revogada." }, 401);

        let dados: z.infer<typeof entrada>;
        try {
          dados = entrada.parse(await request.json());
        } catch {
          return jsonExtensao({ erro: "Dados inválidos." }, 400);
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { error } = await supabaseAdmin.from("candidaturas").insert({
          user_id: conta.userId,
          titulo: dados.cargo.trim().slice(0, 200),
          empresa: dados.empresa.trim(),
          link: dados.link.trim(),
          fonte: dados.fonte.trim() || "extensao",
          local: dados.local.trim(),
          requisitos: dados.requisitos,
          compatibilidade: Math.round(dados.compatibilidade),
          status: "interessado",
        });

        if (error) return jsonExtensao({ erro: "Não foi possível salvar agora." }, 502);
        return jsonExtensao({ ok: true });
      },
    },
  },
});
```

## `src/routes/api/public/payments/webhook.ts`

```ts
import { createClient } from "@supabase/supabase-js";
import { createFileRoute } from "@tanstack/react-router";

import type { Database } from "@/integrations/supabase/types";
import { verifyWebhook, type StripeEnv } from "@/lib/stripe.server";

let _supabase: ReturnType<typeof createClient<Database>> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient<Database>(
      process.env["SUPABASE_URL"]!,
      process.env["SUPABASE_SERVICE_ROLE_KEY"]!,
    );
  }
  return _supabase;
}

const MESES_POR_PLANO: Record<string, number> = {
  pro_trimestral: 3,
  pro_semestral: 6,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dadosDaAssinatura(subscription: any) {
  const item = subscription.items?.data?.[0];
  const priceId =
    item?.price?.lookup_key || item?.price?.metadata?.lovable_external_id || item?.price?.id;
  const productId = item?.price?.product;
  const periodStart = item?.current_period_start ?? subscription.current_period_start;
  const periodEnd = item?.current_period_end ?? subscription.current_period_end;
  return { priceId, productId, periodStart, periodEnd };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function assinaturaCriada(subscription: any, env: StripeEnv) {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.error("Assinatura sem userId nos metadados");
    return;
  }
  const { priceId, productId, periodStart, periodEnd } = dadosDaAssinatura(subscription);

  await getSupabase()
    .from("subscriptions")
    .upsert(
      {
        user_id: userId,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: subscription.customer,
        product_id: productId ?? "",
        price_id: priceId ?? "",
        status: subscription.status,
        current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
        current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
        cancel_at_period_end: subscription.cancel_at_period_end ?? false,
        environment: env,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "stripe_subscription_id" },
    );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function assinaturaAtualizada(subscription: any, env: StripeEnv) {
  const { priceId, productId, periodStart, periodEnd } = dadosDaAssinatura(subscription);

  await getSupabase()
    .from("subscriptions")
    .update({
      status: subscription.status,
      product_id: productId ?? "",
      price_id: priceId ?? "",
      current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      cancel_at_period_end: subscription.cancel_at_period_end ?? false,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id)
    .eq("environment", env);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function assinaturaCancelada(subscription: any, env: StripeEnv) {
  await getSupabase()
    .from("subscriptions")
    .update({ status: "canceled", updated_at: new Date().toISOString() })
    .eq("stripe_subscription_id", subscription.id)
    .eq("environment", env);
}

// Planos trimestral e semestral são pagamentos únicos que liberam N meses de acesso.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function acessoPorPeriodo(session: any, env: StripeEnv) {
  const userId = session.metadata?.userId;
  const priceId = session.metadata?.priceId;
  const meses = priceId ? MESES_POR_PLANO[priceId] : undefined;
  if (!userId || !meses) return;

  const supabase = getSupabase();
  const { data: atual } = await supabase
    .from("subscriptions")
    .select("current_period_end")
    .eq("user_id", userId)
    .eq("environment", env)
    .order("current_period_end", { ascending: false })
    .limit(1)
    .maybeSingle();

  const fimAtual = atual?.current_period_end ? new Date(atual.current_period_end) : null;
  const inicio = fimAtual && fimAtual > new Date() ? fimAtual : new Date();
  const fim = new Date(inicio);
  fim.setMonth(fim.getMonth() + meses);

  await supabase.from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_subscription_id: session.id,
      stripe_customer_id: session.customer ?? "",
      product_id: "eu_passo_pro",
      price_id: priceId,
      status: "active",
      current_period_start: new Date().toISOString(),
      current_period_end: fim.toISOString(),
      cancel_at_period_end: true,
      environment: env,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "stripe_subscription_id" },
  );
}

async function tratarEvento(req: Request, env: StripeEnv) {
  const event = await verifyWebhook(req, env);

  switch (event.type) {
    case "customer.subscription.created":
      await assinaturaCriada(event.data.object, env);
      break;
    case "customer.subscription.updated":
      await assinaturaAtualizada(event.data.object, env);
      break;
    case "customer.subscription.deleted":
      await assinaturaCancelada(event.data.object, env);
      break;
    case "checkout.session.completed": {
      const session = event.data.object;
      if (session.mode === "payment" && session.payment_status !== "unpaid") {
        await acessoPorPeriodo(session, env);
      }
      break;
    }
    case "checkout.session.async_payment_succeeded":
      if (event.data.object.mode === "payment") await acessoPorPeriodo(event.data.object, env);
      break;
    default:
      console.log("Evento não tratado:", event.type);
  }
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawEnv = new URL(request.url).searchParams.get("env");
        if (rawEnv !== "sandbox" && rawEnv !== "live") {
          console.error("Webhook com env inválido:", rawEnv);
          return Response.json({ received: true, ignored: "invalid env" });
        }
        try {
          await tratarEvento(request, rawEnv);
          return Response.json({ received: true });
        } catch (e) {
          console.error("Webhook error:", e);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});
```

## `src/routes/api/public/radar/alertas.ts`

```ts
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/radar/alertas")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const chave = request.headers.get("apikey");
        const aceitas = [
          process.env["SUPABASE_ANON_KEY"],
          process.env["SUPABASE_PUBLISHABLE_KEY"],
        ].filter(Boolean);
        if (!chave || !aceitas.includes(chave)) {
          return new Response(JSON.stringify({ error: "unauthorized" }), {
            status: 401,
            headers: { "content-type": "application/json" },
          });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { executarRadar, registrarNotificacaoRadar } = await import(
          "@/lib/radar-run.server"
        );
        const { revalidarVagasUsuario } = await import("@/lib/revalidacao.server");

        const agora = Date.now();
        const ambiente = (process.env["STRIPE_LIVE_API_KEY"] ? "live" : "sandbox") as
          | "live"
          | "sandbox";

        // Revalida o histórico de todo mundo, mesmo sem alerta ligado: vagas
        // encerradas ou fora da janela saem automaticamente.
        const { data: todos } = await supabaseAdmin
          .from("preferencias_busca")
          .select("user_id, janela_dias")
          .limit(500);

        let revalidadas = 0;
        for (const linha of todos ?? []) {
          try {
            const r = await revalidarVagasUsuario(
              supabaseAdmin,
              linha.user_id,
              linha.janela_dias ?? 30,
            );
            revalidadas += r.encerradas + r.foraDaJanela;
          } catch (erro) {
            console.error("Falha ao revalidar histórico", linha.user_id, erro);
          }
        }

        const { data: assinantes } = await supabaseAdmin
          .from("preferencias_busca")
          .select("user_id, alerta_frequencia, ultimo_alerta_em")
          .neq("alerta_frequencia", "nenhum")
          .eq("ativo", true)
          .limit(50);

        let processados = 0;
        let comNovidade = 0;

        for (const linha of assinantes ?? []) {
          const intervaloMs = linha.alerta_frequencia === "semanal" ? 7 * 864e5 : 864e5;
          const ultimo = linha.ultimo_alerta_em ? new Date(linha.ultimo_alerta_em).getTime() : 0;
          if (agora - ultimo < intervaloMs - 36e5) continue;

          const { data: temAcesso } = await supabaseAdmin.rpc("has_active_subscription", {
            user_uuid: linha.user_id,
            check_env: ambiente,
          });
          if (!temAcesso) continue;

          try {
            const resultado = await executarRadar(supabaseAdmin, linha.user_id);
            if (!("error" in resultado)) {
              await registrarNotificacaoRadar(supabaseAdmin, linha.user_id, resultado);
              if (resultado.novas > 0) comNovidade += 1;
            }
          } catch (erro) {
            console.error("Falha no alerta do radar", linha.user_id, erro);
          }

          await supabaseAdmin
            .from("preferencias_busca")
            .update({ ultimo_alerta_em: new Date().toISOString() })
            .eq("user_id", linha.user_id);

          processados += 1;
        }

        return new Response(JSON.stringify({ processados, comNovidade, revalidadas }), {
          headers: { "content-type": "application/json" },
        });
      },
    },
  },
});
```

## `src/routes/api/public/vaga-match.ts`

```ts
import { createFileRoute } from "@tanstack/react-router";
import { generateObject } from "ai";
import { z } from "zod";

import { cartaSchema, matchSchema } from "@/lib/ats.schemas";
import {
  limitarCarta,
  modelo,
  promptCarta,
  providerOptions,
  SYSTEM_CARTA,
  SYSTEM_MATCH,
} from "@/lib/ats.server";
import { contaDaExtensao, curriculoDaConta } from "@/lib/extensao-api.server";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const entrada = z.object({
  curriculo: z.string().max(30000).optional().default(""),
  cargo: z.string().min(1).max(200),
  empresa: z.string().max(200).optional().default(""),
  requisitos: z.string().min(10).max(15000),
  comCarta: z.boolean().optional().default(false),
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "content-type": "application/json" },
  });
}

export const Route = createFileRoute("/api/public/vaga-match")({
  server: {
    handlers: {
      OPTIONS: () => new Response(null, { headers: cors }),
      POST: async ({ request }) => {
        let dados: z.infer<typeof entrada>;
        try {
          dados = entrada.parse(await request.json());
        } catch {
          return json({ erro: "Dados inválidos." }, 400);
        }

        // Extensão conectada à conta: usa o currículo salvo no Eu Passo.
        const conta = await contaDaExtensao(request);
        if (conta && dados.curriculo.trim().length < 50) {
          const salvo = await curriculoDaConta(conta.userId);
          if (salvo.length >= 50) dados.curriculo = salvo.slice(0, 30000);
        }

        if (dados.curriculo.trim().length < 50) {
          return json(
            { erro: "Nenhum currículo disponível. Conecte sua conta ou cole o currículo." },
            400,
          );
        }

        try {
          const { object: match } = await generateObject({
            model: modelo(),
            schema: matchSchema,
            providerOptions,
            system: SYSTEM_MATCH,
            prompt: `VAGA\nCargo: ${dados.cargo}\nEmpresa: ${dados.empresa || "não informada"}\nRequisitos e descrição:\n${dados.requisitos}\n\nCURRÍCULO DO CANDIDATO:\n${dados.curriculo}\n\nCalcule a compatibilidade de 0 a 100 e detalhe o que falta.`,
          });

          if (!dados.comCarta) return json({ match });

          const { object: carta } = await generateObject({
            model: modelo(),
            schema: cartaSchema,
            providerOptions,
            system: SYSTEM_CARTA,
            prompt: promptCarta({
              cargo: dados.cargo,
              empresa: dados.empresa,
              requisitos: dados.requisitos,
              curriculo: dados.curriculo,
            }),
          });

          return json({ match, carta: { ...carta, carta: limitarCarta(carta.carta) } });
        } catch (erro) {
          console.error("vaga-match falhou", erro);
          return json({ erro: "Não foi possível analisar agora." }, 502);
        }
      },
    },
  },
});
```

## `src/server.ts`

```ts
import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
```

## `src/start.ts`

```ts
import { createStart, createCsrfMiddleware, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

// Start installs this automatically when src/start.ts is absent; defining the
// file opts out, so re-add it explicitly to keep server functions protected
// from cross-site requests.
const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === "serverFn",
});

export const startInstance = createStart(() => ({
  functionMiddleware: [attachSupabaseAuth],
  requestMiddleware: [errorMiddleware, csrfMiddleware],
}));
```

## `src/router.tsx`

```tsx
import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
```
