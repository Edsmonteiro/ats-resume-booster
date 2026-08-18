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
