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
