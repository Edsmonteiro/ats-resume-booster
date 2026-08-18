const GATEWAY = "https://connector-gateway.lovable.dev/firecrawl/v2";

export const SYSTEM_PERFIL =
  "Você é um headhunter brasileiro sênior, com anos de experiência caçando talentos pelo LinkedIn Recruiter. " +
  "Analise perfis do LinkedIn sempre em português do Brasil, com franqueza profissional e sem elogios vazios. " +
  "Avalie quatro frentes: (1) HEADER — foto, capa, headline, localização, seção 'Sobre', URL personalizada e destaques; " +
  "(2) VISUAL — organização, legibilidade, uso de seções, banners, mídias, excesso de emojis, texto em bloco; " +
  "(3) EXPERIÊNCIAS PROFISSIONAIS — clareza de escopo, verbos de ação, resultados com métricas, lacunas de datas, descrições vazias; " +
  "(4) VISIBILIDADE — como recrutadores encontram esse perfil na busca do Recruiter: palavras-chave, competências, " +
  "recomendações, atividade, 'Open to work', títulos pesquisáveis. " +
  "Use APENAS informações presentes no perfil enviado; nunca invente empresas, cargos, datas ou números. " +
  "Reescritas devem manter os fatos originais. Cite trechos reais ao apontar problemas. " +
  "Na 'conselhoDoHunter', fale em primeira pessoa como quem avalia esse perfil numa triagem real e diga o que faria a diferença.";

export async function lerPerfilPublico(url: string): Promise<string> {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const firecrawlKey = process.env["FIRECRAWL_API_KEY"];
  if (!lovableKey || !firecrawlKey) throw new Error("Leitura de perfis indisponível no momento.");

  const resposta = await fetch(`${GATEWAY}/scrape`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": firecrawlKey,
    },
    body: JSON.stringify({ url, formats: ["markdown"], onlyMainContent: true, waitFor: 2500 }),
  });

  if (!resposta.ok) {
    const corpo = await resposta.text();
    console.error(`Firecrawl perfil falhou [${resposta.status}]: ${corpo}`);
    throw new Error(
      "Não consegui abrir esse perfil — o LinkedIn costuma bloquear leitores externos. Exporte o PDF do seu perfil (Mais > Salvar como PDF) e envie o arquivo.",
    );
  }

  const json = (await resposta.json()) as {
    markdown?: string;
    data?: { markdown?: string };
  };
  const markdown = (json.markdown ?? json.data?.markdown ?? "").trim();

  if (markdown.length < 200 || /entrar|sign in|join linkedin/i.test(markdown.slice(0, 300))) {
    throw new Error(
      "O LinkedIn devolveu uma página de login em vez do perfil. Exporte o PDF do seu perfil (Mais > Salvar como PDF) e envie o arquivo.",
    );
  }

  return markdown.slice(0, 24000);
}
