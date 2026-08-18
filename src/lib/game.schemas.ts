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
