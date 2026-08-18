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
