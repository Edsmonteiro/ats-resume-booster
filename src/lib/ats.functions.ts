import { createServerFn } from "@tanstack/react-start";
import { generateObject } from "ai";

import {
  analisarCurriculoInput,
  analisarVagaInput,
  atsSchema,
  cartaSchema,
  curriculoRevisadoSchema,
  gerarCartaInput,
  gerarCurriculoRevisadoInput,
  matchSchema,
} from "./ats.schemas";
import {
  limitarCarta,
  modelo,
  promptCarta,
  providerOptions,
  SYSTEM_ATS,
  SYSTEM_CARTA,
  SYSTEM_MATCH,
  SYSTEM_REVISAO,
} from "./ats.server";
import { consumirRecursoOpcional } from "./plano.server";

export type { AtsAnalysis, CartaApresentacao, CurriculoRevisado, JobMatch } from "./ats.schemas";

export const analisarCurriculo = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => analisarCurriculoInput.parse(input))
  .handler(async ({ data }) => {
    const bloqueio = await consumirRecursoOpcional("ats");
    if (bloqueio) throw new Error(bloqueio.error);

    const { object } = await generateObject({
      model: modelo(),
      schema: atsSchema,
      providerOptions,
      system: SYSTEM_ATS,
      prompt: `Analise o currículo abaixo para compatibilidade com ATS.\n\n---\n${data.texto}\n---`,
    });
    return object;
  });

export const analisarVaga = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => analisarVagaInput.parse(input))
  .handler(async ({ data }) => {
    const bloqueio = await consumirRecursoOpcional("vaga");
    if (bloqueio) throw new Error(bloqueio.error);

    const { object } = await generateObject({
      model: modelo(),
      schema: matchSchema,
      providerOptions,
      system: SYSTEM_MATCH,
      prompt: `VAGA\nCargo: ${data.cargo}\nEmpresa: ${data.empresa || "não informada"}\nLink: ${data.link || "não informado"}\nRequisitos e descrição:\n${data.requisitos}\n\nCURRÍCULO DO CANDIDATO:\n${data.curriculo}\n\nCalcule a compatibilidade de 0 a 100 e detalhe o que falta.`,
    });
    return object;
  });

export const gerarCarta = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => gerarCartaInput.parse(input))
  .handler(async ({ data }) => {
    const bloqueio = await consumirRecursoOpcional("carta");
    if (bloqueio) throw new Error(bloqueio.error);

    const { object } = await generateObject({
      model: modelo(),
      schema: cartaSchema,
      providerOptions,
      system: SYSTEM_CARTA,
      prompt: promptCarta({
        cargo: data.cargo,
        empresa: data.empresa,
        requisitos: data.requisitos,
        curriculo: data.curriculo,
        tom: data.tom,
      }),
    });
    return { ...object, carta: limitarCarta(object.carta) };
  });

export const gerarCurriculoRevisado = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => gerarCurriculoRevisadoInput.parse(input))
  .handler(async ({ data }) => {
    const bloqueio = await consumirRecursoOpcional("curriculo_revisado");
    if (bloqueio) throw new Error(bloqueio.error);

    const { object } = await generateObject({
      model: modelo(),
      schema: curriculoRevisadoSchema,
      providerOptions,
      system: SYSTEM_REVISAO,
      prompt: `Reescreva o currículo abaixo APLICANDO OBRIGATORIAMENTE todas as melhorias indicadas. Antes de responder, confira item por item se cada palavra-chave, reescrita e ajuste da lista aparece no texto final; o que não puder ser aplicado por não ser verdadeiro deve ir para "observacoes".\n\nMELHORIAS A APLICAR:\n${data.orientacoes || "Aplique as melhores práticas de ATS."}\n\nCURRÍCULO ORIGINAL:\n---\n${data.curriculo}\n---`,
    });
    return object;
  });
