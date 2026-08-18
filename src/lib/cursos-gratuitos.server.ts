const GATEWAY = "https://connector-gateway.lovable.dev/firecrawl/v2";

export type CursoGratuito = {
  titulo: string;
  url: string;
  plataforma: string;
  descricao: string;
};

const PLATAFORMAS: { dominio: string; nome: string }[] = [
  { dominio: "youtube.com", nome: "YouTube" },
  { dominio: "coursera.org", nome: "Coursera" },
  { dominio: "edx.org", nome: "edX" },
  { dominio: "fundacaobradesco.org.br", nome: "Fundação Bradesco" },
  { dominio: "escolavirtual.gov.br", nome: "Escola Virtual Gov" },
  { dominio: "sebrae.com.br", nome: "Sebrae" },
  { dominio: "freecodecamp.org", nome: "freeCodeCamp" },
  { dominio: "learn.microsoft.com", nome: "Microsoft Learn" },
  { dominio: "cursa.app", nome: "Cursa" },
  { dominio: "udemy.com", nome: "Udemy" },
  { dominio: "alura.com.br", nome: "Alura" },
  { dominio: "dio.me", nome: "DIO" },
];

function plataformaDe(url: string): string {
  const achada = PLATAFORMAS.find((p) => url.includes(p.dominio));
  if (achada) return achada.nome;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Web";
  }
}

type ItemBusca = { url?: string; title?: string; description?: string };

/** Busca cursos gratuitos on-line para uma habilidade usando a busca web conectada. */
export async function buscarCursosGratuitos(
  habilidade: string,
  limite = 8,
): Promise<CursoGratuito[]> {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const firecrawlKey = process.env["FIRECRAWL_API_KEY"];
  if (!lovableKey || !firecrawlKey) throw new Error("Busca de cursos indisponível no momento.");

  const consultas = [
    `curso gratuito online de ${habilidade} com certificado`,
    `${habilidade} curso grátis em português`,
  ];

  async function rodar(query: string): Promise<ItemBusca[]> {
    try {
      const resposta = await fetch(`${GATEWAY}/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${lovableKey}`,
          "X-Connection-Api-Key": firecrawlKey as string,
        },
        body: JSON.stringify({ query, limit: limite, lang: "pt", country: "br" }),
      });

      if (!resposta.ok) {
        console.error(`Firecrawl cursos falhou [${resposta.status}]: ${await resposta.text()}`);
        return [];
      }

      const json = (await resposta.json()) as {
        data?: ItemBusca[] | { web?: ItemBusca[] };
        web?: ItemBusca[];
      };
      return Array.isArray(json.data) ? json.data : (json.data?.web ?? json.web ?? []);
    } catch (erro) {
      console.error(`Erro ao buscar cursos de "${habilidade}"`, erro);
      return [];
    }
  }

  const resultados = await Promise.all(consultas.map(rodar));
  const vistos = new Set<string>();
  const cursos: CursoGratuito[] = [];

  for (const item of resultados.flat()) {
    const url = item.url ?? "";
    if (!url || vistos.has(url)) continue;
    vistos.add(url);
    cursos.push({
      titulo: (item.title ?? url).slice(0, 160),
      url,
      plataforma: plataformaDe(url),
      descricao: (item.description ?? "").slice(0, 240),
    });
    if (cursos.length >= limite) break;
  }

  return cursos;
}
