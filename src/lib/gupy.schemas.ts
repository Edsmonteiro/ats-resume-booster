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
