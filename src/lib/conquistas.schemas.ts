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
