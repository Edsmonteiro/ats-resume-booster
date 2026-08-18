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

