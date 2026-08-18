/** Padrões que indicam que um anúncio já não aceita candidaturas. */
const PADROES = [
  "não aceita mais candidatura",
  "nao aceita mais candidatura",
  "não está mais aceitando candidatura",
  "nao esta mais aceitando candidatura",
  "no longer accepting application",
  "candidaturas encerradas",
  "inscrições encerradas",
  "inscricoes encerradas",
  "vaga encerrada",
  "vaga expirada",
  "vaga finalizada",
  "processo seletivo encerrado",
  "processo encerrado",
  "esta vaga não está mais disponível",
  "esta vaga nao esta mais disponivel",
  "vaga não disponível",
  "vaga nao disponivel",
  "this job is no longer available",
  "job posting expired",
  "applications are closed",
  "not accepting applications",
  "no longer accepting applications",
  "candidatura encerrada",
  "vaga fechada",
  "vaga preenchida",
  "vaga pausada",
  "vaga suspensa",
  "esta vaga expirou",
  "anúncio expirado",
  "anuncio expirado",
  "processo seletivo finalizado",
  "seleção encerrada",
  "selecao encerrada",
  "recebimento de currículos encerrado",
  "recebimento de curriculos encerrado",
];

/** True quando o texto do anúncio indica que a vaga já foi fechada. */
export function vagaEncerrada(...textos: (string | undefined | null)[]): boolean {
  const alvo = textos
    .filter(Boolean)
    .join(" \n ")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return PADROES.some((p) =>
    alvo.includes(p.normalize("NFD").replace(/[\u0300-\u036f]/g, "")),
  );
}
