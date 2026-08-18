import { generateObject } from "ai";
import { z } from "zod";

import { modelo, providerOptions } from "./ats.server";
import { recomendacoesVagaSchema } from "./radar.schemas";
import { vagaEncerrada } from "./vaga-encerrada";

const GATEWAY = "https://connector-gateway.lovable.dev/firecrawl/v2";

export const FONTES = [
  { dominio: "gupy.io", nome: "Gupy" },
  { dominio: "br.indeed.com", nome: "Indeed" },
  { dominio: "linkedin.com/jobs", nome: "LinkedIn" },
  { dominio: "vagas.com.br", nome: "Vagas.com" },
  { dominio: "infojobs.com.br", nome: "InfoJobs" },
  { dominio: "catho.com.br", nome: "Catho" },
];

export type VagaBruta = {
  chave: string;
  titulo: string;
  empresa: string;
  local: string;
  descricao: string;
  link: string;
  fonte: string;
};

function fonteDoLink(link: string): string {
  const encontrada = FONTES.find((f) => link.includes(f.dominio.split("/")[0] ?? f.dominio));
  return encontrada?.nome ?? new URL(link).hostname.replace("www.", "");
}

export function montarConsultas(prefs: {
  cargos: string[];
  cidade: string;
  estado: string;
  modelos: string[];
  contratos?: string[];
  senioridade: string;
}): string[] {
  const local = [prefs.cidade, prefs.estado].filter(Boolean).join(" ");
  const remoto = prefs.modelos.includes("remoto");
  const senioridade =
    prefs.senioridade && prefs.senioridade !== "qualquer" ? prefs.senioridade : "";
  const lugar = remoto ? "remoto" : local;
  // Só entra na busca quando o usuário escolheu exatamente um tipo de contrato;
  // com vários, o termo restringiria demais os resultados.
  const contrato = (prefs.contratos ?? []).length === 1 ? (prefs.contratos ?? [])[0] : "";

  const consultas: string[] = [];

  for (const cargo of prefs.cargos.slice(0, 5)) {
    // Uma consulta dedicada por plataforma amplia muito o volume de resultados,
    // porque o buscador não precisa dividir as vagas entre todos os domínios.
    for (const fonte of FONTES) {
      consultas.push(
        ["vaga", cargo, senioridade, contrato, lugar, `site:${fonte.dominio}`]
          .filter(Boolean)
          .join(" "),
      );
    }
    // Consultas abertas capturam ATSs menores (Solides, Kenoby, Workday etc.).
    consultas.push(["vaga", cargo, senioridade, lugar, "candidatar-se"].filter(Boolean).join(" "));
    if (!remoto && local)
      consultas.push(["vaga", cargo, senioridade, "remoto"].filter(Boolean).join(" "));
  }

  return [...new Set(consultas)];
}

type ItemBusca = { url?: string; title?: string; description?: string; markdown?: string };

function janelaParaTbs(janelaDias: number): string {
  if (janelaDias <= 7) return "qdr:w";
  if (janelaDias <= 31) return "qdr:m";
  return "qdr:y";
}

export async function buscarVagas(
  consultas: string[],
  limitePorConsulta = 10,
  janelaDias = 30,
): Promise<VagaBruta[]> {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const firecrawlKey = process.env["FIRECRAWL_API_KEY"];
  if (!lovableKey || !firecrawlKey) throw new Error("Busca de vagas indisponível no momento.");

  const tbs = janelaParaTbs(janelaDias);
  const auth = `Bearer ${lovableKey}`;
  const connKey: string = firecrawlKey;

  async function rodar(query: string): Promise<ItemBusca[]> {
    try {
      const resposta = await fetch(`${GATEWAY}/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: auth,
          "X-Connection-Api-Key": connKey,
        },
        body: JSON.stringify({
          query,
          limit: limitePorConsulta,
          lang: "pt",
          country: "br",
          tbs,
          scrapeOptions: { formats: ["markdown"], onlyMainContent: true },
        }),
      });

      if (!resposta.ok) {
        console.error(
          `Firecrawl falhou [${resposta.status}] em "${query}": ${await resposta.text()}`,
        );
        return [];
      }

      const json = (await resposta.json()) as {
        data?: ItemBusca[] | { web?: ItemBusca[] };
        web?: ItemBusca[];
      };
      return Array.isArray(json.data) ? json.data : (json.data?.web ?? json.web ?? []);
    } catch (erro) {
      console.error(`Erro na consulta "${query}"`, erro);
      return [];
    }
  }

  // Executa em lotes paralelos: mais volume sem estourar o rate limit do provedor.
  const LOTE = 4;
  const encontradas = new Map<string, VagaBruta>();
  let houveResposta = false;

  for (let i = 0; i < consultas.length; i += LOTE) {
    const lote = consultas.slice(i, i + LOTE);
    const resultados = await Promise.all(lote.map(rodar));

    for (const itens of resultados) {
      if (itens.length) houveResposta = true;
      for (const item of itens) {
        if (!item.url) continue;
        // Descarta anúncios que já não recebem candidaturas.
        if (vagaEncerrada(item.title, item.description, item.markdown)) continue;
        const chave = item.url.split("?")[0] ?? item.url;
        if (encontradas.has(chave)) continue;
        encontradas.set(chave, {
          chave,
          titulo: (item.title ?? "Vaga").slice(0, 200),
          empresa: "",
          local: "",
          descricao: (item.markdown ?? item.description ?? "").slice(0, 12000),
          link: item.url,
          fonte: fonteDoLink(item.url),
        });
      }
    }
  }

  if (!houveResposta && !encontradas.size)
    throw new Error("Nenhuma consulta de busca retornou resultados.");

  return [...encontradas.values()];
}

const avaliacaoSchema = z.object({
  compatibilidade: z.number().min(0).max(100),
  empresa: z.string(),
  local: z.string(),
  modelo: z.string(),
  motivo: z.string(),
  lacunas: z.array(z.string()),
  relevante: z.boolean(),
  aceitandoCandidaturas: z.boolean(),
  publicadaEm: z.string(),
  diasDesdePublicacao: z.number(),
});

export type Avaliacao = z.infer<typeof avaliacaoSchema>;

const SYSTEM_RADAR =
  "Você é um recrutador brasileiro que avalia se uma vaga real encontrada na internet combina com o currículo de um candidato. " +
  "Responda em português do Brasil. Baseie a nota apenas em evidências do currículo, sem inventar experiências. " +
  "Em 'empresa', 'local' e 'modelo' (remoto, híbrido ou presencial), extraia o que estiver na página; use string vazia se não houver. " +
  "Marque 'relevante' como falso quando o conteúdo não for realmente um anúncio de vaga ou não tiver relação com o perfil buscado. " +
  "Marque 'aceitandoCandidaturas' como falso sempre que a página indicar que a vaga está encerrada, expirada, pausada, preenchida, que não aceita mais candidaturas ou que o processo seletivo terminou. Na dúvida, marque falso. " +
  "Em 'publicadaEm', informe a data de publicação do anúncio no formato AAAA-MM-DD quando a página trouxer a data; use string vazia se não houver. " +
  "Em 'diasDesdePublicacao', estime há quantos dias a vaga foi publicada (use -1 se não for possível estimar).";

export async function avaliarVaga(
  curriculo: string,
  preferencias: string,
  vaga: VagaBruta,
): Promise<Avaliacao | null> {
  try {
    const { object } = await generateObject({
      model: modelo(),
      schema: avaliacaoSchema,
      providerOptions,
      system: SYSTEM_RADAR,
      prompt: `Data de hoje: ${new Date().toISOString().slice(0, 10)}.\n\nPREFERÊNCIAS DO CANDIDATO:\n${preferencias}\n\nANÚNCIO ENCONTRADO (${vaga.fonte})\nTítulo: ${vaga.titulo}\nLink: ${vaga.link}\nConteúdo:\n${vaga.descricao.slice(0, 8000)}\n\nCURRÍCULO:\n${curriculo.slice(0, 12000)}\n\nAvalie a compatibilidade de 0 a 100.`,
    });
    return object;
  } catch (erro) {
    console.error("Falha ao avaliar vaga", vaga.link, erro);
    return null;
  }
}

const SYSTEM_RECOMENDACOES =
  "Você é um consultor brasileiro de currículos que prepara um candidato para UMA vaga específica. " +
  "Responda em português do Brasil. Use apenas fatos que já existem no currículo — nunca invente experiências, " +
  "empresas, ferramentas, números ou formações. " +
  "Em 'palavrasChave', liste termos da vaga que faltam ou aparecem fracos no currículo, dizendo em que seção usar " +
  "e um exemplo de frase realista baseada na trajetória real do candidato. " +
  "Em 'trechos', copie literalmente frases que já existem no currículo em 'original' e reescreva em 'sugerido' " +
  "incorporando a linguagem da vaga, com verbo de ação e métrica quando o currículo já tiver o dado. " +
  "Em 'ganhoEstimado', informe o novo percentual de match esperado se todas as recomendações forem aplicadas.";

export async function gerarRecomendacoes(
  curriculo: string,
  vaga: {
    titulo: string;
    empresa: string;
    descricao: string;
    compatibilidade: number;
    lacunas: string[];
  },
) {
  const { object } = await generateObject({
    model: modelo(),
    schema: recomendacoesVagaSchema,
    providerOptions,
    system: SYSTEM_RECOMENDACOES,
    prompt: `VAGA\nCargo: ${vaga.titulo}\nEmpresa: ${vaga.empresa || "não informada"}\nMatch atual do candidato: ${vaga.compatibilidade}%\nLacunas já detectadas: ${vaga.lacunas.join("; ") || "nenhuma"}\nDescrição da vaga:\n${vaga.descricao.slice(0, 8000)}\n\nCURRÍCULO ATUAL:\n---\n${curriculo.slice(0, 14000)}\n---\n\nGere recomendações específicas de palavras-chave e reescritas de trechos para aumentar o match nesta vaga.`,
  });
  return object;
}

export async function gerarCurriculoParaVaga(
  curriculo: string,
  vaga: {
    titulo: string;
    empresa: string;
    descricao: string;
    compatibilidade: number;
    lacunas: string[];
  },
  comCarta: boolean,
  recomendacoes?: {
    palavrasChave: { termo: string; importancia: string; ondeUsar: string; exemplo: string }[];
    trechos: { original: string; sugerido: string; motivo: string }[];
    acoesRapidas: string[];
  } | null,
) {
  const { curriculoRevisadoSchema } = await import("./ats.schemas");
  const { SYSTEM_REVISAO } = await import("./ats.server");

  const blocos: string[] = [];
  if (recomendacoes?.palavrasChave?.length)
    blocos.push(
      "PALAVRAS-CHAVE OBRIGATÓRIAS (incluir cada uma):\n" +
        recomendacoes.palavrasChave
          .map(
            (p) => `- ${p.termo} (${p.importancia}) → usar em ${p.ondeUsar}. Exemplo: ${p.exemplo}`,
          )
          .join("\n"),
    );
  if (recomendacoes?.trechos?.length)
    blocos.push(
      "REESCRITAS OBRIGATÓRIAS (substituir o original pela versão sugerida):\n" +
        recomendacoes.trechos
          .map((t) => `- "${t.original}" → "${t.sugerido}" (${t.motivo})`)
          .join("\n"),
    );
  if (recomendacoes?.acoesRapidas?.length)
    blocos.push("AÇÕES RÁPIDAS A APLICAR:\n- " + recomendacoes.acoesRapidas.join("\n- "));

  const melhorias = blocos.join("\n\n").slice(0, 8000);

  const contexto = `VAGA ALVO\nCargo: ${vaga.titulo}\nEmpresa: ${vaga.empresa || "não informada"}\nMatch atual: ${vaga.compatibilidade}%\nLacunas detectadas: ${vaga.lacunas.join("; ") || "nenhuma"}\nDescrição da vaga:\n${vaga.descricao.slice(0, 8000)}${
    melhorias ? `\n\nMELHORIAS A APLICAR NESTA VERSÃO:\n${melhorias}` : ""
  }`;

  const { object: revisado } = await generateObject({
    model: modelo(),
    schema: curriculoRevisadoSchema,
    providerOptions,
    system:
      SYSTEM_REVISAO +
      " Adapte o currículo especificamente para a vaga informada: reordene as experiências e competências " +
      "mais relevantes para o cargo, use a linguagem e as palavras-chave do anúncio e destaque o que atende aos requisitos.",
    prompt: `${contexto}\n\nCURRÍCULO ORIGINAL:\n---\n${curriculo.slice(0, 14000)}\n---\n\nGere a versão do currículo sob medida para esta vaga aplicando OBRIGATORIAMENTE cada item da lista de melhorias. Antes de responder, confira termo a termo se todos aparecem no texto final; registre em "mudancas" onde cada um foi inserido e em "observacoes" o que não pôde ser aplicado por não ser verdadeiro.`,
  });

  if (!comCarta) return { curriculo: revisado, carta: null };

  const carta = await gerarCartaParaVaga(revisado.curriculo, {
    titulo: vaga.titulo,
    empresa: vaga.empresa,
    descricao: vaga.descricao,
  });

  return { curriculo: revisado, carta };
}

/** Gera apenas a carta de apresentação para uma vaga, a partir do currículo já montado. */
export async function gerarCartaParaVaga(
  curriculo: string,
  vaga: { titulo: string; empresa: string; descricao: string },
  tom: "formal" | "equilibrado" | "direto" = "equilibrado",
) {
  const { cartaSchema } = await import("./ats.schemas");
  const { limitarCarta, promptCarta, SYSTEM_CARTA } = await import("./ats.server");

  const { object } = await generateObject({
    model: modelo(),
    schema: cartaSchema,
    providerOptions,
    system: SYSTEM_CARTA,
    prompt: promptCarta({
      cargo: vaga.titulo,
      empresa: vaga.empresa,
      requisitos: vaga.descricao.slice(0, 8000),
      curriculo: curriculo.slice(0, 14000),
      tom,
    }),
  });
  return { ...object, carta: limitarCarta(object.carta) };
}
