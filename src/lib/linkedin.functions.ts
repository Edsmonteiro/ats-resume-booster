import { createServerFn } from "@tanstack/react-start";
import { generateObject } from "ai";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

import { modelo, providerOptions } from "./ats.server";
import { analisarPerfilInput, perfilLinkedinSchema, type PerfilLinkedin } from "./linkedin.schemas";
import { lerPerfilPublico, SYSTEM_PERFIL } from "./linkedin.server";
import { consumirRecurso } from "./plano.server";

export type { PerfilLinkedin } from "./linkedin.schemas";

export const analisarPerfilLinkedin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => analisarPerfilInput.parse(input))
  .handler(async ({ data, context }): Promise<PerfilLinkedin | { error: string }> => {
    const bloqueio = await consumirRecurso(context.userId, "linkedin");
    if (bloqueio) return bloqueio;

    const conteudo =
      data.texto.trim().length >= 80 ? data.texto.trim() : await lerPerfilPublico(data.url.trim());

    const { object } = await generateObject({
      model: modelo(),
      schema: perfilLinkedinSchema,
      providerOptions,
      system: SYSTEM_PERFIL,
      prompt: `Área/objetivo de carreira informado: ${data.area || "não informado"}.\nOrigem: ${
        data.texto.trim().length >= 80 ? "PDF exportado do perfil" : `perfil público (${data.url})`
      }\n\nCONTEÚDO DO PERFIL DO LINKEDIN:\n---\n${conteudo.slice(0, 24000)}\n---\n\nDê a nota geral de 0 a 100, notas por área (header, visual, experiencias, visibilidade) e orientações específicas como um headhunter daria.`,
    });

    return object;
  });
