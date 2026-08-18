import { createFileRoute } from "@tanstack/react-router";

import { contaDaExtensao, corsExtensao, curriculoDaConta, jsonExtensao } from "@/lib/extensao-api.server";

export const Route = createFileRoute("/api/public/extensao/perfil")({
  server: {
    handlers: {
      OPTIONS: () => new Response(null, { headers: corsExtensao }),
      GET: async ({ request }) => {
        const conta = await contaDaExtensao(request);
        if (!conta) return jsonExtensao({ erro: "Conexão inválida ou revogada." }, 401);

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const curriculo = await curriculoDaConta(conta.userId);
        const { data: perfil } = await supabaseAdmin
          .from("perfis")
          .select("nome, cargo_desejado")
          .eq("id", conta.userId)
          .maybeSingle();

        return jsonExtensao({
          conectado: true,
          nome: perfil?.nome ?? "",
          cargoDesejado: perfil?.cargo_desejado ?? "",
          temCurriculo: curriculo.length >= 50,
          tamanhoCurriculo: curriculo.length,
          previaCurriculo: curriculo.slice(0, 180),
        });
      },
    },
  },
});
