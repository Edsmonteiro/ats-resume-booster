import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { contaDaExtensao, corsExtensao, jsonExtensao } from "@/lib/extensao-api.server";

const entrada = z.object({
  destino: z.enum(["candidatura"]).default("candidatura"),
  cargo: z.string().min(1).max(200),
  empresa: z.string().max(200).optional().default(""),
  link: z.string().max(2000).optional().default(""),
  fonte: z.string().max(60).optional().default(""),
  local: z.string().max(160).optional().default(""),
  requisitos: z.string().max(15000).optional().default(""),
  compatibilidade: z.number().min(0).max(100).optional().default(0),
});

export const Route = createFileRoute("/api/public/extensao/salvar")({
  server: {
    handlers: {
      OPTIONS: () => new Response(null, { headers: corsExtensao }),
      POST: async ({ request }) => {
        const conta = await contaDaExtensao(request);
        if (!conta) return jsonExtensao({ erro: "Conexão inválida ou revogada." }, 401);

        let dados: z.infer<typeof entrada>;
        try {
          dados = entrada.parse(await request.json());
        } catch {
          return jsonExtensao({ erro: "Dados inválidos." }, 400);
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { error } = await supabaseAdmin.from("candidaturas").insert({
          user_id: conta.userId,
          titulo: dados.cargo.trim().slice(0, 200),
          empresa: dados.empresa.trim(),
          link: dados.link.trim(),
          fonte: dados.fonte.trim() || "extensao",
          local: dados.local.trim(),
          requisitos: dados.requisitos,
          compatibilidade: Math.round(dados.compatibilidade),
          status: "interessado",
        });

        if (error) return jsonExtensao({ erro: "Não foi possível salvar agora." }, 502);
        return jsonExtensao({ ok: true });
      },
    },
  },
});
