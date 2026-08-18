import { createLovableAiGatewayProvider } from "./ai-gateway.server";
import { LIMITE_CARTA } from "./ats.schemas";

export const MODEL = "openai/gpt-5.6-sol";
export const providerOptions = { lovable: { reasoningEffort: "none" } } as const;

export function modelo() {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("Configuração de IA ausente.");
  return createLovableAiGatewayProvider(key)(MODEL);
}

export const SYSTEM_ATS =
  "Você é um especialista brasileiro em recrutamento e em sistemas ATS (Applicant Tracking Systems). " +
  "Avalie currículos com rigor e objetividade, sempre em português do Brasil. " +
  "Aponte problemas concretos de leitura por robôs: formatação, colunas, tabelas, gráficos, cabeçalhos, " +
  "títulos de seção não padronizados, falta de palavras-chave, datas ambíguas, verbos fracos e falta de métricas. " +
  "Seja específico e cite trechos reais do currículo. Nada de conselhos genéricos.";

export const SYSTEM_MATCH =
  "Você é um recrutador técnico brasileiro que mede compatibilidade entre currículo e vaga como um ATS faria. " +
  "Responda sempre em português do Brasil. Baseie a nota em evidências do currículo, sem inventar experiências. " +
  "Requisitos obrigatórios não atendidos pesam mais que desejáveis.";

export { LIMITE_CARTA };

export const SYSTEM_CARTA =
  "Você escreve cartas de apresentação em português do Brasil para candidaturas. " +
  "Use apenas fatos presentes no currículo — nunca invente experiências, empresas, números ou formações. " +
  `REGRA OBRIGATÓRIA DE TAMANHO: o campo "carta" deve ter no MÁXIMO ${LIMITE_CARTA} caracteres (contando espaços), ` +
  "o equivalente a cerca de 160 a 190 palavras, em 3 parágrafos curtos. Conte os caracteres antes de responder e " +
  "reescreva mais enxuto se passar do limite. Nada de clichês vazios, rodeios ou repetição do currículo inteiro: " +
  "conecte as experiências reais aos requisitos da vaga e inclua naturalmente as palavras-chave da descrição. " +
  "Não use saudação genérica com nome inventado; use 'Prezada equipe de recrutamento' quando não houver nome. " +
  "Não assine com nome inventado nem inclua endereço, data ou cabeçalho de carta formal.";

/** Garante o limite de caracteres mesmo quando o modelo passa do pedido. */
export function limitarCarta(texto: string): string {
  const limpo = texto.trim();
  if (limpo.length <= LIMITE_CARTA) return limpo;
  const cortado = limpo.slice(0, LIMITE_CARTA);
  const fim = Math.max(
    cortado.lastIndexOf("."),
    cortado.lastIndexOf("!"),
    cortado.lastIndexOf("?"),
  );
  return (fim > LIMITE_CARTA * 0.6 ? cortado.slice(0, fim + 1) : cortado).trim();
}

export type TomCarta = "formal" | "equilibrado" | "direto";

/** Prompt único usado por todas as telas que geram carta de apresentação. */
export function promptCarta(dados: {
  cargo: string;
  empresa?: string;
  requisitos: string;
  curriculo: string;
  tom?: TomCarta;
}) {
  return `Tom desejado: ${dados.tom ?? "equilibrado"}.

VAGA
Cargo: ${dados.cargo}
Empresa: ${dados.empresa || "não informada"}
Requisitos e descrição:
${dados.requisitos}

CURRÍCULO DO CANDIDATO:
${dados.curriculo}

Escreva a carta de apresentação respeitando o limite de ${LIMITE_CARTA} caracteres e liste em "observacoes" o que o candidato deve personalizar antes de enviar.`;
}

export const SYSTEM_REVISAO =
  "Você reescreve currículos em português do Brasil para máxima compatibilidade com sistemas ATS. " +
  "Não invente empresas, cargos, datas, números ou formações que não existam no original. " +
  "Porém, APLICAR AS MELHORIAS INDICADAS É OBRIGATÓRIO: cada palavra-chave, reescrita e ajuste listado nas " +
  "orientações deve aparecer no currículo final, integrado de forma verdadeira ao contexto real do candidato " +
  "(no RESUMO, nas COMPETÊNCIAS ou nos bullets da experiência onde aquilo realmente ocorreu). " +
  "Reescreva frases fracas usando exatamente a linguagem sugerida quando ela descrever o que o candidato já fez. " +
  "Só deixe de incluir um termo se ele for factualmente falso para este candidato — nesse caso liste-o em " +
  "'observacoes' explicando por que ficou de fora. Nunca ignore uma orientação em silêncio. " +
  "Entregue texto puro em uma coluna, sem tabelas, colunas, gráficos ou caracteres decorativos. " +
  "Use títulos de seção padronizados em MAIÚSCULAS (RESUMO, EXPERIÊNCIA PROFISSIONAL, FORMAÇÃO, COMPETÊNCIAS, IDIOMAS, CERTIFICAÇÕES) " +
  "quando houver conteúdo para elas. Datas no formato MM/AAAA. Bullets começando com '- ' e verbo de ação forte, " +
  "priorizando resultados e métricas já existentes no original. " +
  "Em 'mudancas', liste item a item cada orientação aplicada e onde ela foi inserida; em 'observacoes', o que o " +
  "candidato precisa preencher, confirmar ou o que não pôde ser aplicado.";
