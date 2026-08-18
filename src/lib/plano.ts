/** Níveis de plano do Eu Passo. Client-safe: pode ser importado por componentes. */
export type Tier = "gratis" | "essencial" | "pro";

export type Recurso =
  | "ats"
  | "vaga"
  | "carta"
  | "curriculo_revisado"
  | "radar"
  | "linkedin"
  | "curriculo_vaga"
  | "gupy"
  | "entrevista"
  | "quest"
  | "roadmap"
  | "cursos";

/** -1 = ilimitado, 0 = bloqueado no plano. */
export const LIMITES: Record<Tier, Record<Recurso, number>> = {
  gratis: {
    ats: 3,
    vaga: 3,
    carta: 1,
    curriculo_revisado: 1,
    radar: 0,
    linkedin: 0,
    curriculo_vaga: 0,
    gupy: 0,
    entrevista: 0,
    quest: 0,
    roadmap: 0,
    cursos: 0,
  },
  essencial: {
    ats: -1,
    vaga: -1,
    carta: -1,
    curriculo_revisado: -1,
    radar: 8,
    linkedin: 2,
    curriculo_vaga: 10,
    gupy: 0,
    entrevista: 0,
    quest: 0,
    roadmap: 0,
    cursos: 0,
  },
  pro: {
    ats: -1,
    vaga: -1,
    carta: -1,
    curriculo_revisado: -1,
    radar: -1,
    linkedin: -1,
    curriculo_vaga: -1,
    gupy: -1,
    entrevista: -1,
    quest: -1,
    roadmap: -1,
    cursos: -1,
  },
};

export const ROTULO_RECURSO: Record<Recurso, string> = {
  ats: "análises de currículo",
  vaga: "comparações de vaga",
  carta: "cartas de apresentação",
  curriculo_revisado: "currículos revisados",
  radar: "buscas do radar",
  linkedin: "análises do LinkedIn",
  curriculo_vaga: "currículos por vaga",
  gupy: "análises da Gupy",
  entrevista: "preparações de entrevista",
  quest: "trilhas da Quest",
  roadmap: "trilhas de conhecimento",
  cursos: "buscas de cursos",
};

export const ROTULO_TIER: Record<Tier, string> = {
  gratis: "Grátis",
  essencial: "Essencial",
  pro: "Pro",
};

const ORDEM: Tier[] = ["gratis", "essencial", "pro"];

export function limiteDe(tier: Tier, recurso: Recurso): number {
  return LIMITES[tier][recurso];
}

export function liberado(tier: Tier, recurso: Recurso): boolean {
  return limiteDe(tier, recurso) !== 0;
}

/** Menor plano que libera o recurso. */
export function planoNecessario(recurso: Recurso): Tier {
  return ORDEM.find((t) => liberado(t, recurso)) ?? "pro";
}

/** Meses de acesso por priceId. */
export const MESES_POR_PRICE: Record<string, number> = {
  essencial_mensal: 1,
  essencial_trimestral: 3,
  essencial_semestral: 6,
  essencial_anual: 12,
  pro_mensal: 1,
  pro_trimestral: 3,
  pro_semestral: 6,
  pro_anual: 12,
};

export function tierDoPrice(priceId: string | null | undefined): Tier {
  if (!priceId) return "gratis";
  if (priceId.startsWith("essencial_")) return "essencial";
  if (priceId.startsWith("pro_")) return "pro";
  return "gratis";
}
