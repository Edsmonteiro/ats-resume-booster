const REGRAS: Array<[RegExp, string]> = [
  [/[\w.+-]+@[\w-]+\.[\w.-]+/g, "[e-mail]"],
  [/https?:\/\/\S+/gi, "[link]"],
  [/\b(?:linkedin\.com|github\.com)\/\S+/gi, "[link]"],
  [/\(?\d{2}\)?\s?9?\d{4}[-\s.]?\d{4}/g, "[telefone]"],
  [/\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g, "[documento]"],
  [/\b\d{6,}\b/g, "[número]"],
];

/** Remove dados pessoais diretos de um texto antes de torná-lo público. */
export function anonimizarTexto(texto: string): string {
  return REGRAS.reduce((acc, [re, sub]) => acc.replace(re, sub), texto ?? "");
}

export function anonimizarLista(itens: string[]): string[] {
  return (itens ?? []).map(anonimizarTexto);
}
