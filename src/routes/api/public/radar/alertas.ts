import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/radar/alertas")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const chave = request.headers.get("apikey");
        const aceitas = [
          process.env["SUPABASE_ANON_KEY"],
          process.env["SUPABASE_PUBLISHABLE_KEY"],
        ].filter(Boolean);
        if (!chave || !aceitas.includes(chave)) {
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
        const ambiente = (process.env["STRIPE_LIVE_API_KEY"] ? "live" : "sandbox") as
          | "live"
          | "sandbox";

        // Revalida o histórico de todo mundo, mesmo sem alerta ligado: vagas
        // encerradas ou fora da janela saem automaticamente.
        const { data: todos } = await supabaseAdmin
          .from("preferencias_busca")
          .select("user_id, janela_dias")
          .limit(500);

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
            console.error("Falha ao revalidar histórico", linha.user_id, erro);
          }
        }

        const { data: assinantes } = await supabaseAdmin
          .from("preferencias_busca")
          .select("user_id, alerta_frequencia, ultimo_alerta_em")
          .neq("alerta_frequencia", "nenhum")
          .eq("ativo", true)
          .limit(50);

        let processados = 0;
        let comNovidade = 0;

        for (const linha of assinantes ?? []) {
          const intervaloMs = linha.alerta_frequencia === "semanal" ? 7 * 864e5 : 864e5;
          const ultimo = linha.ultimo_alerta_em ? new Date(linha.ultimo_alerta_em).getTime() : 0;
          if (agora - ultimo < intervaloMs - 36e5) continue;

          const { data: temAcesso } = await supabaseAdmin.rpc("has_active_subscription", {
            user_uuid: linha.user_id,
            check_env: ambiente,
          });
          if (!temAcesso) continue;

          try {
            const resultado = await executarRadar(supabaseAdmin, linha.user_id);
            if (!("error" in resultado)) {
              await registrarNotificacaoRadar(supabaseAdmin, linha.user_id, resultado);
              if (resultado.novas > 0) comNovidade += 1;
            }
          } catch (erro) {
            console.error("Falha no alerta do radar", linha.user_id, erro);
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
