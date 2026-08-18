const BASE = "https://eupasso.lovable.app";
const API = `${BASE}/api/public/vaga-match`;
const API_PERFIL = `${BASE}/api/public/extensao/perfil`;
const API_SALVAR = `${BASE}/api/public/extensao/salvar`;

const $ = (id) => document.getElementById(id);

let conta = null; // { nome, temCurriculo, ... } quando conectada
let ultimaVaga = null;
let ultimoMatch = null;

chrome.storage.local.get(["curriculo"], ({ curriculo }) => {
  if (curriculo) $("cv").value = curriculo;
});

$("salvar").addEventListener("click", () => {
  chrome.storage.local.set({ curriculo: $("cv").value.trim() }, () => {
    $("salvar").textContent = "Salvo!";
    setTimeout(() => ($("salvar").textContent = "Salvar currículo"), 1500);
  });
});

// ---------------------------------------------------------------- conta

async function pegarToken() {
  const { extensaoToken } = await chrome.storage.local.get(["extensaoToken"]);
  return extensaoToken || "";
}

function pintarConta() {
  const texto = $("contaTexto");
  const botao = $("contaBotao");
  botao.style.display = "inline-block";

  if (conta) {
    const nome = conta.nome || "conta conectada";
    texto.innerHTML = conta.temCurriculo
      ? `<b>${nome}</b> — currículo da conta em uso`
      : `<b>${nome}</b> — sem currículo salvo na conta`;
    botao.textContent = "Desconectar";
    botao.onclick = async () => {
      await chrome.storage.local.remove(["extensaoToken"]);
      conta = null;
      pintarConta();
    };
    $("loginBox").open = false;
    $("cvBox").open = false;
  } else {
    texto.textContent = "Conta não conectada — usando currículo local.";
    botao.textContent = "Conectar";
    botao.onclick = () => {
      $("loginBox").open = true;
      $("token").focus();
    };
  }
}

async function carregarConta() {
  const token = await pegarToken();
  if (!token) {
    conta = null;
    pintarConta();
    chrome.storage.local.get(["curriculo"], ({ curriculo }) => {
      if (!curriculo) $("cvBox").open = true;
    });
    return;
  }
  try {
    const resp = await fetch(API_PERFIL, { headers: { authorization: `Bearer ${token}` } });
    conta = resp.ok ? await resp.json() : null;
    if (!resp.ok) await chrome.storage.local.remove(["extensaoToken"]);
  } catch {
    conta = null;
  }
  pintarConta();
}

$("conectar").addEventListener("click", async () => {
  const token = $("token").value.trim();
  if (!token) return;
  const botao = $("conectar");
  botao.disabled = true;
  botao.textContent = "Conectando…";
  try {
    const resp = await fetch(API_PERFIL, { headers: { authorization: `Bearer ${token}` } });
    if (!resp.ok) throw new Error("Código inválido ou revogado.");
    conta = await resp.json();
    await chrome.storage.local.set({ extensaoToken: token });
    $("token").value = "";
    $("erro").textContent = "";
    pintarConta();
  } catch (e) {
    $("erro").textContent = e.message || "Não foi possível conectar.";
  } finally {
    botao.disabled = false;
    botao.textContent = "Conectar conta";
  }
});

void carregarConta();

// ---------------------------------------------------------------- leitura

async function lerVagaNaPagina(personalizados) {
  const espera = (ms) => new Promise((r) => setTimeout(r, ms));
  const limpar = (t) => (t || "").replace(/\u00a0/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  const texto = (el) => limpar(el?.innerText);

  const primeiro = (seletores) => {
    for (const sel of seletores) {
      for (const el of document.querySelectorAll(sel)) {
        const t = texto(el);
        if (t) return t;
      }
    }
    return "";
  };

  const host = location.hostname.replace(/^www\./, "");

  // 0. Dados estruturados (schema.org JobPosting): a fonte mais confiável quando existe.
  const lerJsonLd = () => {
    const achados = [];
    const empurrar = (no) => {
      if (!no || typeof no !== "object") return;
      if (Array.isArray(no)) return no.forEach(empurrar);
      const tipo = no["@type"];
      const tipos = Array.isArray(tipo) ? tipo : [tipo];
      if (tipos.includes("JobPosting")) achados.push(no);
      if (no["@graph"]) empurrar(no["@graph"]);
    };
    for (const s of document.querySelectorAll('script[type="application/ld+json"]')) {
      try {
        empurrar(JSON.parse(s.textContent || "{}"));
      } catch {
        /* ignora json inválido */
      }
    }
    const jp = achados[0];
    if (!jp) return null;

    const div = document.createElement("div");
    div.innerHTML = String(jp.description || "");
    const descricao = limpar(div.innerText);

    const local = []
      .concat(jp.jobLocation || [])
      .map((l) => {
        const a = l?.address || l;
        return [a?.addressLocality, a?.addressRegion].filter(Boolean).join(", ");
      })
      .filter(Boolean)
      .join(" · ");

    const salarioBruto = jp.baseSalary?.value;
    const salario = salarioBruto
      ? [salarioBruto.value, salarioBruto.minValue && `${salarioBruto.minValue}–${salarioBruto.maxValue ?? ""}`]
          .filter(Boolean)
          .join(" ")
          .trim()
      : "";

    return {
      cargo: String(jp.title || "").trim(),
      empresa: String(jp.hiringOrganization?.name || "").trim(),
      descricao,
      local: jp.jobLocationType === "TELECOMMUTE" ? local || "Remoto" : local,
      remoto: jp.jobLocationType === "TELECOMMUTE",
      salario: salario ? `${salario} ${jp.baseSalary?.currency || ""}`.trim() : "",
      contrato: []
        .concat(jp.employmentType || [])
        .filter(Boolean)
        .join(", "),
      publicada: jp.datePosted || "",
    };
  };

  // 1. Adaptadores por domínio: seletores conhecidos de cada ATS/portal.
  const ADAPTADORES = [
    {
      dominio: /(^|\.)linkedin\.com$/,
      expandir: [".jobs-description__footer-button", ".show-more-less-html__button--more"],
      secoes: [],
      descricao: [
        "#job-details",
        ".jobs-description__content",
        ".jobs-description-content__text",
        ".jobs-box__html-content",
        ".show-more-less-html__markup",
        '[class*="jobs-description"]',
        ".description__text",
      ],
      cargo: [
        ".job-details-jobs-unified-top-card__job-title",
        ".jobs-unified-top-card__job-title",
        ".top-card-layout__title",
        '[class*="top-card"] h1',
      ],
      empresa: [
        ".job-details-jobs-unified-top-card__company-name",
        ".jobs-unified-top-card__company-name",
        ".topcard__org-name-link",
        '[class*="company-name"] a',
        '[class*="company-name"]',
      ],
      local: [
        ".job-details-jobs-unified-top-card__primary-description-container",
        ".jobs-unified-top-card__bullet",
        ".topcard__flavor--bullet",
      ],
    },
    {
      dominio: /(^|\.)gupy\.io$/,
      secoes: [
        '[data-testid="text-section-JobDescription-text"]',
        '[data-testid="text-section-JobResponsibilities-text"]',
        '[data-testid="text-section-JobPrerequisites-text"]',
        '[class*="job-description"] [class*="section"]',
      ],
      descricao: ['[data-testid="job-body"]', "main section", "main"],
      cargo: ['[data-testid="job-title"]', "main h1", "h1"],
      empresa: ['[data-testid="job-company"]', '[class*="company"]'],
      local: ['[data-testid="job-location"]', '[class*="location"]'],
    },
    {
      dominio: /(^|\.)indeed\.com(\.br)?$/,
      secoes: [],
      descricao: ["#jobDescriptionText", '[class*="jobsearch-JobComponent-description"]'],
      cargo: ['[data-testid="jobsearch-JobInfoHeader-title"]', "h1"],
      empresa: ['[data-testid="inlineHeader-companyName"]', '[data-testid="company-name"]'],
      local: ['[data-testid="inlineHeader-companyLocation"]', '[data-testid="job-location"]'],
    },
    {
      dominio: /(^|\.)vagas\.com\.br$/,
      secoes: [".job-description__text", ".job-requirements", ".job-tab-content section"],
      descricao: [".job-tab-content", "#anuncio", "main"],
      cargo: [".job-shortdescription__title", "h1"],
      empresa: [".job-shortdescription__company", '[class*="company"]'],
      local: [".job-location", '[class*="local"]'],
    },
    {
      dominio: /(^|\.)catho\.com\.br$/,
      secoes: ['[class*="descricao"]', '[class*="requisitos"]'],
      descricao: ['[class*="job-description"]', "main"],
      cargo: ["h1"],
      empresa: ['[class*="company"]', '[class*="empresa"]'],
      local: ['[class*="local"]'],
    },
    {
      dominio: /(^|\.)infojobs\.com\.br$/,
      secoes: ['[class*="descricao"]', '[class*="requisito"]'],
      descricao: [".card-body", "main"],
      cargo: ["h1"],
      empresa: ['[class*="company"]', '[class*="empresa"]'],
      local: ['[class*="local"]'],
    },
    {
      dominio: /(^|\.)(greenhouse\.io|boards\.greenhouse\.io|job-boards\.greenhouse\.io)$/,
      secoes: ["#content .section", "#content"],
      descricao: ["#content", ".job__description", "main"],
      cargo: [".app-title", ".job__title h1", "h1"],
      empresa: [".company-name", '[class*="company"]'],
      local: [".location", '[class*="location"]'],
    },
    {
      dominio: /(^|\.)lever\.co$/,
      secoes: [".section-wrapper .section", '[data-qa="job-description"]', ".posting-requirements"],
      descricao: [".content", ".posting-page", "main"],
      cargo: [".posting-headline h2", "h2", "h1"],
      empresa: [".main-header-logo img", '[class*="company"]'],
      local: [".posting-categories .location", '[class*="location"]'],
    },
    {
      dominio: /(^|\.)(myworkdayjobs\.com|wd1\.myworkdaysite\.com|wd3\.myworkdaysite\.com)$/,
      secoes: ['[data-automation-id="jobPostingDescription"]'],
      descricao: ['[data-automation-id="jobPostingDescription"]', "main"],
      cargo: ['[data-automation-id="jobPostingHeader"]', "h1", "h2"],
      empresa: ['[data-automation-id="company"]'],
      local: ['[data-automation-id="locations"]', '[data-automation-id="location"]'],
    },
    {
      dominio: /(^|\.)(ashbyhq\.com|jobs\.ashbyhq\.com|smartrecruiters\.com|jobvite\.com|breezy\.hr|workable\.com|recruitee\.com|teamtailor\.com|bamboohr\.com)$/,
      secoes: ['[class*="description"] section', '[class*="Description"]'],
      descricao: ['[class*="description"]', "main", "article"],
      cargo: ["h1", "h2"],
      empresa: ['[class*="company"]', '[class*="organization"]'],
      local: ['[class*="location"]'],
    },
    {
      dominio: /(^|\.)(solides\.jobs|jobs\.solides\.com|abler\.com\.br|inhire\.app|kenoby\.com|quickin\.io|recrutei\.com\.br|pandape\.com(\.br)?|trabalhabrasil\.com\.br|99jobs\.com|programathor\.com\.br|remotar\.com\.br|revelo\.com\.br|glassdoor\.com(\.br)?)$/,
      secoes: ['[class*="descricao"]', '[class*="requisito"]', '[class*="atribui"]', "main section"],
      descricao: ['[class*="job"]', "main", "article"],
      cargo: ["h1", "h2"],
      empresa: ['[class*="company"]', '[class*="empresa"]'],
      local: ['[class*="local"]', '[class*="location"]'],
    },
  ];

  const casa = (padrao) => {
    const p = String(padrao || "").trim().toLowerCase().replace(/^www\./, "");
    if (!p) return false;
    if (p === "*") return true;
    return host === p || host.endsWith("." + p) || host.includes(p);
  };

  const custom = (personalizados || []).find((c) => c.ativo !== false && casa(c.dominio));
  const embutido = ADAPTADORES.find((a) => a.dominio.test(host)) || null;

  const adaptador =
    custom || embutido
      ? {
          expandir: [...(custom?.expandir || []), ...(embutido?.expandir || [])],
          secoes: [...(custom?.secoes || []), ...(embutido?.secoes || [])],
          descricao: [...(custom?.descricao || []), ...(embutido?.descricao || [])],
          cargo: [...(custom?.cargo || []), ...(embutido?.cargo || [])],
          empresa: [...(custom?.empresa || []), ...(embutido?.empresa || [])],
          local: [...(custom?.local || []), ...(embutido?.local || [])],
        }
      : null;

  // 2. Abre o "ver mais", que em vários portais esconde quase todo o texto.
  const expandir = [
    ...(adaptador?.expandir || []),
    'button[aria-label*="mais" i]',
    'button[aria-label*="more" i]',
    'button[class*="show-more" i]',
    'button[class*="ver-mais" i]',
  ];
  for (const sel of expandir) {
    for (const b of document.querySelectorAll(sel)) {
      try {
        if (
          b.offsetParent !== null &&
          /mais|more/i.test(b.innerText + " " + (b.getAttribute("aria-label") || ""))
        ) {
          b.click();
        }
      } catch {
        /* ignora */
      }
    }
  }

  // 3. Recorte por cabeçalhos: funciona em qualquer site, inclusive nos não mapeados.
  const RE_RESP = /^\s*(responsabilidades?(\s+e\s+atribui[çc][õo]es)?|atribui[çc][õo]es|atividades( a serem)?( desenvolvidas)?|o que voc[êe] (vai|ir[áa]) fazer|principais entregas|sobre a (vaga|posi[çc][ãa]o)|responsibilities|what you.ll do)\s*:?\s*$/i;
  const RE_REQ = /^\s*(requisitos?( e qualifica[çc][õo]es)?|qualifica[çc][õo]es|pr[ée]-requisitos?|o que (esperamos|buscamos|precisamos)|voc[êe] precisa ter|perfil desejado|requirements|qualifications)\s*:?\s*$/i;
  const RE_FIM = /^\s*(benef[íi]cios?|informa[çc][õo]es adicionais|etapas do processo|sobre a empresa|nossa cultura|diferenciais|local de trabalho|hor[áa]rio|sal[áa]rio|candidatar|inscreva|compartilhar|denunciar|vagas? (semelhantes|similares|recomendadas))\b/i;

  const recortarSecoes = (bruto) => {
    const linhas = (bruto || "").split("\n").map((l) => l.trim());
    const blocos = [];
    let atual = null;
    for (const linha of linhas) {
      const cabecalho = linha.length <= 90 && (RE_RESP.test(linha) || RE_REQ.test(linha));
      if (cabecalho) {
        if (atual) blocos.push(atual);
        atual = { titulo: linha.replace(/:$/, ""), corpo: [] };
        continue;
      }
      if (!atual) continue;
      if (linha.length <= 90 && RE_FIM.test(linha)) {
        blocos.push(atual);
        atual = null;
        continue;
      }
      atual.corpo.push(linha);
    }
    if (atual) blocos.push(atual);

    return blocos
      .map((b) => `${b.titulo}\n${limpar(b.corpo.join("\n"))}`)
      .filter((b) => b.split("\n").slice(1).join("\n").trim().length >= 40)
      .join("\n\n");
  };

  const secoesDoDominio = () => {
    if (!adaptador?.secoes?.length) return "";
    const partes = [];
    const vistos = new Set();
    for (const sel of adaptador.secoes) {
      for (const el of document.querySelectorAll(sel)) {
        const t = texto(el);
        if (t.length < 60 || vistos.has(t)) continue;
        if (partes.some((p) => p.includes(t))) continue;
        vistos.add(t);
        partes.push(t);
      }
    }
    const bruto = partes.join("\n\n");
    return recortarSecoes(bruto) || bruto;
  };

  const containerDoDominio = () => {
    if (!adaptador?.descricao?.length) return "";
    const bruto = primeiro(adaptador.descricao);
    return recortarSecoes(bruto) || bruto;
  };

  let estruturado = null;
  let descricao = "";
  for (let tentativa = 0; tentativa < 12; tentativa++) {
    estruturado = estruturado || lerJsonLd();
    descricao =
      secoesDoDominio() ||
      recortarSecoes(texto(document.body)) ||
      containerDoDominio() ||
      (estruturado?.descricao || "");
    if (descricao.length >= 200) break;
    await espera(300);
  }

  if ((estruturado?.descricao || "").length > descricao.length) descricao = estruturado.descricao;

  if (descricao.length < 200) {
    const alternativa = primeiro([
      ...(adaptador?.descricao || []),
      "#job-details",
      "#jobDescriptionText",
      '[data-testid*="description" i]',
      '[class*="job-description" i]',
      '[class*="jobs-description"]',
      '[class*="job-section" i]',
      '[id*="jobDescription" i]',
      "article",
    ]);
    if (alternativa.length > descricao.length) descricao = alternativa;
  }

  if (descricao.length < 200) {
    let melhor = "";
    const candidatos = document.querySelectorAll("main div, main section, article, section");
    for (const el of candidatos) {
      if (el.querySelector("nav, header, form")) continue;
      const t = texto(el);
      if (t.length > melhor.length && t.length < 30000) melhor = t;
    }
    if (melhor.length > descricao.length) descricao = melhor;
  }

  const cargo =
    estruturado?.cargo ||
    primeiro([...(adaptador?.cargo || []), "main h1", "h1", "h2"]).split("\n")[0] ||
    document.title.replace(/\s*[|·-]\s*(LinkedIn|Gupy|Indeed|Vagas).*$/i, "").trim();

  const empresa =
    estruturado?.empresa ||
    primeiro([
      ...(adaptador?.empresa || []),
      '[class*="company-name"] a',
      '[class*="company-name"]',
      '[class*="empresa"]',
    ]).split("\n")[0];

  const local =
    estruturado?.local || primeiro([...(adaptador?.local || []), '[class*="location"]']).split("\n")[0];

  // Detalhes extras lidos do texto quando não vieram estruturados.
  const corpo = `${cargo}\n${descricao}`;
  const acha = (re) => (corpo.match(re) || [])[0] || "";
  const salario =
    estruturado?.salario ||
    acha(/R\$\s?\d{1,3}(\.\d{3})*(,\d{2})?(\s?(a|até|-|–)\s?R\$\s?\d{1,3}(\.\d{3})*(,\d{2})?)?/i);
  const remoto =
    estruturado?.remoto || /\b(remoto|home\s?office|100%\s?remoto|anywhere|remote)\b/i.test(corpo);
  const hibrido = /\bh[íi]brid[oa]\b|\bhybrid\b/i.test(corpo);
  const contratoTexto = /\bPJ\b|pessoa jur[íi]dica/i.test(corpo)
    ? "PJ"
    : /\bCLT\b/i.test(corpo)
      ? "CLT"
      : /cooperad|\bcooperativa\b/i.test(corpo)
        ? "Cooperado"
        : /est[áa]gio|estagi[áa]rio/i.test(corpo)
          ? "Estágio"
          : "";

  return {
    cargo: (cargo || "").slice(0, 200),
    empresa: (empresa || "").slice(0, 200),
    requisitos: descricao.slice(0, 15000),
    local: (local || "").slice(0, 160),
    salario: (salario || "").slice(0, 80),
    modelo: remoto ? "Remoto" : hibrido ? "Híbrido" : "",
    contrato: estruturado?.contrato || contratoTexto,
    publicada: estruturado?.publicada || "",
    url: location.href,
    estruturada: Boolean(estruturado),
  };
}

// ---------------------------------------------------------------- render

function bloco(titulo, itens) {
  if (!itens || !itens.length) return "";
  return `<div class="card"><p class="lab">${titulo}</p><ul>${itens
    .map((i) => `<li>${typeof i === "string" ? i : `<b>${i.requisito}</b> — ${i.acao}`}</li>`)
    .join("")}</ul></div>`;
}

function chips(vaga) {
  const itens = [vaga.local, vaga.modelo, vaga.contrato, vaga.salario].filter(Boolean);
  if (!itens.length) return "";
  return `<div class="chips">${itens.map((i) => `<span class="chip">${i}</span>`).join("")}</div>`;
}

function fonteDaUrl(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "").split(".")[0];
  } catch {
    return "extensao";
  }
}

function montarBotaoSalvar() {
  if (!conta || !ultimaVaga) return;
  const botao = document.createElement("button");
  botao.className = "sec";
  botao.textContent = "Salvar nas minhas candidaturas";
  botao.onclick = async () => {
    botao.disabled = true;
    botao.textContent = "Salvando…";
    try {
      const token = await pegarToken();
      const resp = await fetch(API_SALVAR, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({
          destino: "candidatura",
          cargo: ultimaVaga.cargo || "Vaga",
          empresa: ultimaVaga.empresa || "",
          link: ultimaVaga.url || "",
          fonte: fonteDaUrl(ultimaVaga.url || ""),
          local: [ultimaVaga.local, ultimaVaga.modelo].filter(Boolean).join(" · "),
          requisitos: ultimaVaga.requisitos || "",
          compatibilidade: ultimoMatch?.compatibilidade ?? 0,
        }),
      });
      if (!resp.ok) throw new Error("Não foi possível salvar.");
      botao.textContent = "Salva nas candidaturas ✓";
    } catch (e) {
      botao.disabled = false;
      botao.textContent = "Tentar salvar de novo";
      $("erro").textContent = e.message;
    }
  };
  $("saida").appendChild(botao);
}

// ---------------------------------------------------------------- análise

$("analisar").addEventListener("click", async () => {
  const erro = $("erro");
  const saida = $("saida");
  erro.textContent = "";
  saida.innerHTML = "";

  const curriculo = $("cv").value.trim();
  if (!conta && curriculo.length < 50) {
    $("cvBox").open = true;
    erro.textContent = "Conecte sua conta Eu Passo ou cole e salve seu currículo aqui.";
    return;
  }
  if (curriculo) chrome.storage.local.set({ curriculo });

  const manual = $("manual").value.trim();
  const botao = $("analisar");
  let vaga = null;

  if (manual.length >= 120) {
    vaga = { cargo: "", empresa: "", requisitos: manual.slice(0, 15000), url: "" };
  } else {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id || !/^https?:/.test(tab.url || "")) {
      erro.textContent = "Abra a página da vaga nesta aba ou cole a descrição manualmente.";
      return;
    }

    botao.disabled = true;
    botao.textContent = "Lendo a vaga…";

    try {
      const { seletoresPorDominio } = await chrome.storage.local.get(["seletoresPorDominio"]);
      const resultados = await chrome.scripting.executeScript({
        target: { tabId: tab.id, allFrames: true },
        func: lerVagaNaPagina,
        args: [Array.isArray(seletoresPorDominio) ? seletoresPorDominio : []],
      });
      vaga = resultados
        .map((r) => r?.result)
        .filter(Boolean)
        .sort((a, b) => (b.requisitos?.length || 0) - (a.requisitos?.length || 0))[0];
    } catch {
      vaga = null;
    }

    if (!vaga || (vaga.requisitos || "").length < 120) {
      $("manualBox").open = true;
      erro.textContent =
        "Não consegui ler a descrição. Abra a vaga inteira, clique em “ver mais” na descrição e tente de novo — ou cole o texto no campo abaixo.";
      botao.disabled = false;
      botao.textContent = "Analisar esta vaga";
      return;
    }
  }

  ultimaVaga = vaga;
  botao.disabled = true;
  botao.textContent = "Analisando…";

  try {
    const token = await pegarToken();
    const resp = await fetch(API, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        curriculo: curriculo.slice(0, 30000),
        cargo: vaga.cargo || "Vaga",
        empresa: vaga.empresa,
        requisitos: vaga.requisitos,
        comCarta: $("comCarta").checked,
      }),
    });

    const dados = await resp.json();
    if (!resp.ok) throw new Error(dados.erro || "Falha na análise.");

    const m = dados.match;
    ultimoMatch = m;
    saida.innerHTML =
      `<div class="card"><p class="lab">${vaga.cargo || "Vaga"}${vaga.empresa ? " · " + vaga.empresa : ""}</p>` +
      `<div class="score">${m.compatibilidade}%</div><div style="font-size:12px">${m.veredito}</div>` +
      chips(vaga) +
      `</div>` +
      bloco("Requisitos atendidos", m.requisitosAtendidos) +
      bloco("Lacunas", m.lacunas) +
      bloco("Palavras-chave para incluir", m.palavrasChaveParaIncluir) +
      bloco("Ajustes no currículo", m.ajustesNoCurriculo);

    if (dados.carta) {
      const box = document.createElement("div");
      box.className = "card";
      box.innerHTML = `<p class="lab">Carta de apresentação</p><textarea style="min-height:150px">${dados.carta.carta}</textarea>`;
      const copiar = document.createElement("button");
      copiar.className = "sec";
      copiar.textContent = "Copiar carta";
      copiar.onclick = () => {
        navigator.clipboard.writeText(box.querySelector("textarea").value);
        copiar.textContent = "Copiado!";
      };
      box.appendChild(copiar);
      saida.appendChild(box);
    }

    montarBotaoSalvar();
  } catch (e) {
    erro.textContent = e.message || "Não foi possível analisar agora.";
  } finally {
    botao.disabled = false;
    botao.textContent = "Analisar esta vaga";
  }
});

$("config").addEventListener("click", () => {
  if (chrome.runtime.openOptionsPage) chrome.runtime.openOptionsPage();
  else window.open(chrome.runtime.getURL("options.html"));
});
