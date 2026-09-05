import { createServerFn } from "@tanstack/react-start";
import { generateObject } from "ai";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

import { modelo, providerOptions } from "./ats.server";
import {
  avaliacaoSchema,
  avaliarRespostaInput,
  gerarPerguntaInput,
  mapaSchema,
  perguntaSchema,
  type Avaliacao,
  type MapaQuest,
  type Pergunta,
} from "./game.schemas";
import { SYSTEM_GAME_AVALIACAO, SYSTEM_GAME_MAPA, SYSTEM_GAME_PERGUNTA } from "./game.server";
import { checarRecurso } from "./plano.server";

export const gerarMapaQuest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MapaQuest> => {
    const bloqueio = await checarRecurso(context.userId, "quest");
    if (bloqueio) throw new Error(bloqueio.error);

    const { data } = await context.supabase
      .from("dados_usuario")
      .select("curriculo")
      .eq("user_id", context.userId)
      .maybeSingle();

    const curriculo = (data?.curriculo ?? "").trim();
    if (curriculo.length < 40) {
      throw new Error(
        "Adicione seu currículo na análise para montarmos o mapa com as suas ferramentas.",
      );
    }

    const { object } = await generateObject({
      model: modelo(),
      providerOptions,
      schema: mapaSchema,
      system: SYSTEM_GAME_MAPA,
      prompt: `Currículo do candidato:\n${curriculo.slice(0, 12_000)}`,
    });

    return object;
  });

export const gerarPergunta = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => gerarPerguntaInput.parse(input))
  .handler(async ({ data, context }): Promise<Pergunta> => {
    const bloqueio = await checarRecurso(context.userId, "quest");
    if (bloqueio) throw new Error(bloqueio.error);

    const tipo: "objetiva" | "subjetiva" = Math.random() < 0.65 ? "objetiva" : "subjetiva";

    const { object } = await generateObject({
      model: modelo(),
      providerOptions,
      schema: perguntaSchema,
      system: SYSTEM_GAME_PERGUNTA,
      prompt:
        `Tema/ferramenta: ${data.tema}\nFoco da fase: ${data.foco}\nNível: ${data.nivel}\n` +
        `Tipo obrigatório: ${tipo}\nSemente de aleatoriedade: ${Math.random().toString(36).slice(2)}\n` +
        (data.evitar.length
          ? `Não repita nem reformule estas perguntas já usadas:\n- ${data.evitar.join("\n- ")}`
          : "Primeira pergunta da fase."),
    });

    return {
      ...object,
      tipo,
      alternativas: tipo === "objetiva" ? object.alternativas.slice(0, 4) : [],
      indiceCorreto: tipo === "objetiva" ? (object.indiceCorreto ?? 0) : null,
    };
  });

export const avaliarResposta = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => avaliarRespostaInput.parse(input))
  .handler(async ({ data, context }): Promise<Avaliacao> => {
    const bloqueio = await checarRecurso(context.userId, "quest");
    if (bloqueio) throw new Error(bloqueio.error);

    const { object } = await generateObject({
      model: modelo(),
      providerOptions,
      schema: avaliacaoSchema,
      system: SYSTEM_GAME_AVALIACAO,
      prompt: `Tema: ${data.tema}\nPergunta: ${data.enunciado}\nResposta do candidato: ${data.resposta}`,
    });
    return object;
  });
