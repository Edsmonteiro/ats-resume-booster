import type { AtsAnalysis } from "@/lib/ats.schemas";

/** Análise pré-calculada do currículo de exemplo — usada na demonstração pública, sem chamar a IA. */
export const ANALISE_EXEMPLO: AtsAnalysis = {
  score: 54,
  resumo:
    "O currículo tem experiência relevante em dados, mas usa linguagem genérica, quase não traz resultados numéricos e deixa de fora palavras-chave que os robôs de triagem procuram em vagas de análise de dados.",
  pontosFortes: [
    "Ordem cronológica clara nas experiências",
    "Formação e cursos identificáveis pelo ATS",
    "Ferramentas citadas explicitamente (Power BI, SQL, Excel)",
  ],
  problemasAts: [
    {
      titulo: "Bullets sem resultado mensurável",
      gravidade: "alta",
      explicacao:
        "Frases como 'responsável por dashboards' descrevem tarefa, não impacto. Recrutadores e modelos de ranqueamento priorizam conquistas quantificadas.",
      comoCorrigir: "Reescreva cada bullet no formato: verbo de ação + o que fez + número/resultado.",
    },
    {
      titulo: "Seção OBJETIVO genérica",
      gravidade: "alta",
      explicacao:
        "'Trabalhar com dados em uma empresa inovadora' não contém palavra-chave alguma e ocupa o espaço mais valioso do currículo.",
      comoCorrigir: "Troque por um resumo profissional de 3 linhas com cargo-alvo, anos de experiência e stack.",
    },
    {
      titulo: "Verbos na terceira pessoa e no passivo",
      gravidade: "media",
      explicacao: "'Ajudou', 'auxiliou', 'apoio' enfraquecem a leitura e reduzem a correspondência com descrições de vaga.",
      comoCorrigir: "Use verbos de ação no infinitivo/passado direto: construí, automatizei, reduzi, implementei.",
    },
    {
      titulo: "Sem seção de competências técnicas separada por categoria",
      gravidade: "baixa",
      explicacao: "Misturar 'comunicação' com 'SQL' dilui a densidade de palavras-chave técnicas.",
      comoCorrigir: "Separe em Competências técnicas e Idiomas; deixe comportamentais para a entrevista.",
    },
  ],
  palavrasChaveFaltando: [
    "ETL",
    "modelagem de dados",
    "Python",
    "DAX",
    "data warehouse",
    "KPI",
    "governança de dados",
    "Google BigQuery",
    "storytelling de dados",
    "automação de relatórios",
  ],
  verbosFracos: ["ajudou", "auxiliou", "participou", "fez", "apoio"],
  secoes: [
    { nome: "Cabeçalho de contato", status: "ok", nota: "Nome, cidade, telefone e e-mail em linha única — legível pelo ATS." },
    { nome: "Resumo profissional", status: "melhorar", nota: "Adjetivos genéricos, sem cargo-alvo nem stack." },
    { nome: "Experiência", status: "melhorar", nota: "Datas corretas, mas bullets sem métricas." },
    { nome: "Competências", status: "melhorar", nota: "Mistura técnicas e comportamentais; falta nível de proficiência." },
    { nome: "Formação", status: "ok", nota: "Curso, instituição e período completos." },
    { nome: "Projetos", status: "ausente", nota: "Nenhum projeto prático listado — importante para perfis júnior de dados." },
  ],
  reescritas: [
    {
      original: "Responsável por dashboards no Power BI para a diretoria comercial",
      sugerida:
        "Construí 12 dashboards em Power BI (DAX) usados semanalmente pela diretoria comercial, reduzindo em 6h/semana a consolidação manual de relatórios",
    },
    {
      original: "Fez consultas em SQL para extrair dados do banco",
      sugerida:
        "Desenvolvi consultas SQL sobre base de 4M+ registros e automatizei a rotina de extração diária que alimenta os relatórios de vendas",
    },
    {
      original: "Profissional dinâmica, proativa e com facilidade de trabalhar em equipe.",
      sugerida:
        "Analista de Dados com 3 anos de experiência em Power BI, SQL e automação de relatórios, atuando com times comerciais e de logística no varejo.",
    },
  ],
};
