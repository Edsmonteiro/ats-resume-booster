import { SYSTEM_REVISAO } from "./ats.server";

export const SYSTEM_CURSO =
  SYSTEM_REVISAO +
  " NESTA TAREFA o objetivo é registrar um curso recém-concluído: insira-o na seção correta " +
  "(CERTIFICAÇÕES quando for curso livre/certificado, FORMAÇÃO quando for graduação ou pós), criando a seção " +
  "se ela não existir, no formato 'Nome do curso — Instituição | carga horária | conclusão MM/AAAA'. " +
  "Quando os temas do curso forem verdadeiros para o candidato, reforce COMPETÊNCIAS e, se fizer sentido, " +
  "uma frase do RESUMO com os termos do curso. Mantenha todo o restante do currículo intacto: não remova, " +
  "reordene nem reescreva experiências existentes.";

export function promptCurso(dados: {
  curriculo: string;
  nome: string;
  instituicao?: string;
  cargaHoraria?: string;
  concluidoEm?: string;
  link?: string;
  aprendizados?: string;
}) {
  return `CURSO CONCLUÍDO
Nome: ${dados.nome}
Instituição: ${dados.instituicao || "não informada"}
Carga horária: ${dados.cargaHoraria || "não informada"}
Conclusão: ${dados.concluidoEm || "não informada"}
Certificado: ${dados.link || "não informado"}
O que aprendeu na prática: ${dados.aprendizados || "não informado"}

CURRÍCULO ATUAL:
---
${dados.curriculo}
---

Devolva o currículo completo já atualizado com este curso, liste em "mudancas" cada alteração feita e em "observacoes" o que o candidato ainda precisa confirmar.`;
}
