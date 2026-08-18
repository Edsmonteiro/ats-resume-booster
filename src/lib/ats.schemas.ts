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
