function limpar(v: string) {
  return v
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Tenta identificar o nome do candidato na primeira linha do currículo. */
export function nomeDoCandidato(curriculo: string): string {
  const linha = curriculo
    .split(/\r?\n/)
    .map((l) => l.trim())
    .find((l) => l.length > 0);
  if (!linha) return "";
  const texto = linha.replace(/^[#*\-•\s]+/, "").trim();
  if (texto.length > 60 || /[0-9@|/]/.test(texto)) return "";
  const palavras = texto.split(/\s+/);
  if (palavras.length < 2 || palavras.length > 6) return "";
  if (!/^[A-Za-zÀ-ÿ'.\s]+$/.test(texto)) return "";
  return texto;
}

/** curriculo-nome-do-candidato-vaga.ext (partes vazias são omitidas) */
export function nomeArquivoCurriculo(
  curriculo: string,
  vaga: string,
  extensao: string,
  prefixo = "curriculo",
) {
  const partes = [prefixo, limpar(nomeDoCandidato(curriculo)), limpar(vaga).slice(0, 40)].filter(
    Boolean,
  );
  return `${partes.join("-")}.${extensao}`;
}

/** Garante que o documento identifique o candidato e a vaga logo no topo. */
export function comIdentificacao(curriculo: string, vaga: string, empresa = "") {
  const texto = curriculo.trim();
  if (!vaga.trim()) return texto;
  const alvo = `Vaga: ${vaga.trim()}${empresa.trim() ? ` — ${empresa.trim()}` : ""}`;
  if (texto.toLowerCase().includes(alvo.toLowerCase())) return texto;
  const linhas = texto.split(/\r?\n/);
  const nome = nomeDoCandidato(texto);
  if (nome) {
    linhas.splice(1, 0, alvo);
    return linhas.join("\n");
  }
  return `${alvo}\n\n${texto}`;
}
