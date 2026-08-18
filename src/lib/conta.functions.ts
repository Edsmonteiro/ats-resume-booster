import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Exporta tudo que o usuário tem guardado na conta, em JSON. */
export const exportarMeusDados = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const uid = context.userId;
    const sb = context.supabase;

    const [perfil, dados, preferencias, vagas, candidaturas, preparos, notificacoes, assinaturas] =
      await Promise.all([
        sb.from("perfis").select("*").eq("id", uid).maybeSingle(),
        sb.from("dados_usuario").select("*").eq("user_id", uid).maybeSingle(),
        sb.from("preferencias_busca").select("*").eq("user_id", uid).maybeSingle(),
        sb.from("vagas_usuario").select("*").eq("user_id", uid),
        sb.from("candidaturas").select("*").eq("user_id", uid),
        sb.from("preparos_entrevista").select("*").eq("user_id", uid),
        sb.from("notificacoes").select("*").eq("user_id", uid),
        sb.from("subscriptions").select("*").eq("user_id", uid),
      ]);

    return {
      exportadoEm: new Date().toISOString(),
      perfil: perfil.data ?? null,
      dados: dados.data ?? null,
      preferenciasBusca: preferencias.data ?? null,
      vagasRadar: vagas.data ?? [],
      candidaturas: candidaturas.data ?? [],
      preparosEntrevista: preparos.data ?? [],
      notificacoes: notificacoes.data ?? [],
      assinaturas: assinaturas.data ?? [],
    };
  });

/** Apaga definitivamente os dados do usuário e a própria conta de acesso. */
export const excluirMinhaConta = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((entrada: { confirmacao: string }) => {
    if (entrada?.confirmacao?.trim().toUpperCase() !== "EXCLUIR") {
      throw new Error("Confirmação inválida.");
    }
    return entrada;
  })
  .handler(async ({ context }) => {
    const uid = context.userId;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    await supabaseAdmin.from("preparos_entrevista").delete().eq("user_id", uid);
    await supabaseAdmin.from("candidaturas").delete().eq("user_id", uid);
    await supabaseAdmin.from("vagas_usuario").delete().eq("user_id", uid);
    await supabaseAdmin.from("notificacoes").delete().eq("user_id", uid);
    await supabaseAdmin.from("preferencias_busca").delete().eq("user_id", uid);
    await supabaseAdmin.from("dados_usuario").delete().eq("user_id", uid);
    await supabaseAdmin.from("perfis").delete().eq("id", uid);

    const { error } = await supabaseAdmin.auth.admin.deleteUser(uid);
    if (error) throw new Error(error.message);

    return { ok: true };
  });
