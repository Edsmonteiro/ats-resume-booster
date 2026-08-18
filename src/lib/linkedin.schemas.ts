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
