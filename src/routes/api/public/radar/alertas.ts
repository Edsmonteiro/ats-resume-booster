import { createFileRoute } from "@tanstack/react-router";

import { ambientePagamento } from "@/lib/plano.server";

function autorizado(request: Request): boolean {
  const esperado = process.env["RADAR_CRON_SECRET"];
  if (!esperado) return false;

  const authorization = request.headers.get("authorization");
  return authorization === `Bearer ${esperado}`;
}

export const Route = createFileRoute("/api/public/radar/alertas")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!process.env["RADAR_CRON_SECRET"]) {
          console.error("[Radar] RADAR_CRON_SECRET não configurado.");
          return new Response(JSON.stringify({ error: "service unavailable" }), {
            status: 503,
            headers: { "content-type": "application/json" },
          });
        }

        // Chaves publishable/anon são públicas por definição e não podem autenticar jobs internos.
        if (!autorizado(request)) {
          return new Response(JSON.stringify({ error: "unauthorized" }), {
            status: 401,
            headers: { "content-type": "application/json" },
          });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { executarRadar, registrarNotificacaoRadar } = await import(
          "@/lib/radar-run.server"
        );
        const { revalidarVagasUsuario } = await import("@/lib/revalidacao.server");

        const agora = Date.now();
        const ambiente = ambientePagamento();

        // Revalida o histórico de todo mundo, mesmo sem alerta ligado: vagas
        // encerradas ou fora da janela saem automaticamente.
        const { data: todos, error: erroTodos } = await supabaseAdmin
          .from("preferencias_busca")
          .select("user_id, janela_dias")
          .limit(500);

        if (erroTodos) {
          console.error("[Radar] Falha ao listar preferências para revalidação", erroTodos.message);
          return new Response(JSON.stringify({ error: "internal error" }), {
            status: 500,
            headers: { "content-type": "application/json" },
          });
        }

        let revalidadas = 0;
        for (const linha of todos ?? []) {
          try {
            const r = await revalidarVagasUsuario(
              supabaseAdmin,
              linha.user_id,
              linha.janela_dias ?? 30,
            );
            revalidadas += r.encerradas + r.foraDaJanela;
          } catch (erro) {
            console.error("[Radar] Falha ao revalidar histórico", linha.user_id, erro);
          }
        }

        const { data: assinantes, error: erroAssinantes } = await supabaseAdmin
          .from("preferencias_busca")
          .select("user_id, alerta_frequencia, ultimo_alerta_em")
          .neq("alerta_frequencia", "nenhum")
          .eq("ativo", true)
          .limit(50);

        if (erroAssinantes) {
          console.error("[Radar] Falha ao listar assinantes", erroAssinantes.message);
          return new Response(JSON.stringify({ error: "internal error" }), {
            status: 500,
            headers: { "content-type": "application/json" },
          });
        }

        let processados = 0;
        let comNovidade = 0;

        for (const linha of assinantes ?? []) {
          const intervaloMs = linha.alerta_frequencia === "semanal" ? 7 * 864e5 : 864e5;
          const ultimo = linha.ultimo_alerta_em ? new Date(linha.ultimo_alerta_em).getTime() : 0;
          if (agora - ultimo < intervaloMs - 36e5) continue;

          const { data: temAcesso, error: erroAcesso } = await supabaseAdmin.rpc(
            "has_active_subscription",
            {
              user_uuid: linha.user_id,
              check_env: ambiente,
            },
          );
          if (erroAcesso) {
            console.error("[Radar] Falha ao validar assinatura", linha.user_id, erroAcesso.message);
            continue;
          }
          if (!temAcesso) continue;

          try {
            const resultado = await executarRadar(supabaseAdmin, linha.user_id);
            if (!("error" in resultado)) {
              await registrarNotificacaoRadar(supabaseAdmin, linha.user_id, resultado);
              if (resultado.novas > 0) comNovidade += 1;
            }
          } catch (erro) {
            console.error("[Radar] Falha no alerta", linha.user_id, erro);
          }

          await supabaseAdmin
            .from("preferencias_busca")
            .update({ ultimo_alerta_em: new Date().toISOString() })
            .eq("user_id", linha.user_id);

          processados += 1;
        }

        return new Response(JSON.stringify({ processados, comNovidade, revalidadas }), {
          headers: { "content-type": "application/json" },
        });
      },
    },
  },
});
