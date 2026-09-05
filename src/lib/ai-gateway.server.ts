import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

/**
 * Provider OpenAI direto. Mantemos a camada compatível para não acoplar as funções de
 * produto a um gateway externo e permitir trocar o modelo por variável de ambiente.
 */
export function createOpenAiProvider(apiKey: string) {
  return createOpenAICompatible({
    name: "openai",
    baseURL: "https://api.openai.com/v1",
    headers: { Authorization: `Bearer ${apiKey}` },
    includeUsage: true,
    supportsStructuredOutputs: true,
  });
}
