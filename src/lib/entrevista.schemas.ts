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
