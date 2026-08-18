import { createFileRoute } from "@tanstack/react-router";
import { generateObject } from "ai";
import { z } from "zod";

import { cartaSchema, matchSchema } from "@/lib/ats.schemas";
import {
  limitarCarta,
  modelo,
  promptCarta,
  providerOptions,
  SYSTEM_CARTA,
  SYSTEM_MATCH,
} from "@/lib/ats.server";
import { contaDaExtensao, curriculoDaConta } from "@/lib/extensao-api.server";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const entrada = z.object({
  curriculo: z.string().max(30000).optional().default(""),
  cargo: z.string().min(1).max(200),
  empresa: z.string().max(200).optional().default(""),
  requisitos: z.string().min(10).max(15000),
  comCarta: z.boolean().optional().default(false),
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "content-type": "application/json" },
  });
}

export const Route = createFileRoute("/api/public/vaga-match")({
  server: {
    handlers: {
      OPTIONS: () => new Response(null, { headers: cors }),
      POST: async ({ request }) => {
        let dados: z.infer<typeof entrada>;
        try {
          dados = entrada.parse(await request.json());
        } catch {
          return json({ erro: "Dados inválidos." }, 400);
        }

        // Extensão conectada à conta: usa o currículo salvo no Eu Passo.
        const conta = await contaDaExtensao(request);
        if (conta && dados.curriculo.trim().length < 50) {
          const salvo = await curriculoDaConta(conta.userId);
          if (salvo.length >= 50) dados.curriculo = salvo.slice(0, 30000);
        }

        if (dados.curriculo.trim().length < 50) {
          return json(
            { erro: "Nenhum currículo disponível. Conecte sua conta ou cole o currículo." },
            400,
          );
        }

        try {
          const { object: match } = await generateObject({
            model: modelo(),
            schema: matchSchema,
            providerOptions,
            system: SYSTEM_MATCH,
            prompt: `VAGA\nCargo: ${dados.cargo}\nEmpresa: ${dados.empresa || "não informada"}\nRequisitos e descrição:\n${dados.requisitos}\n\nCURRÍCULO DO CANDIDATO:\n${dados.curriculo}\n\nCalcule a compatibilidade de 0 a 100 e detalhe o que falta.`,
          });

          if (!dados.comCarta) return json({ match });

          const { object: carta } = await generateObject({
            model: modelo(),
            schema: cartaSchema,
            providerOptions,
            system: SYSTEM_CARTA,
            prompt: promptCarta({
              cargo: dados.cargo,
              empresa: dados.empresa,
              requisitos: dados.requisitos,
              curriculo: dados.curriculo,
            }),
          });

          return json({ match, carta: { ...carta, carta: limitarCarta(carta.carta) } });
        } catch (erro) {
          console.error("vaga-match falhou", erro);
          return json({ erro: "Não foi possível analisar agora." }, 502);
        }
      },
    },
  },
});
