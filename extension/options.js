const $ = (id) => document.getElementById(id);
const CHAVE = "seletoresPorDominio";

const CAMPOS = [
  { id: "secoes", rotulo: "Seções (responsabilidades / requisitos)", dica: "Ex.: [data-testid=\"job-responsibilities\"]" },
  { id: "descricao", rotulo: "Contêiner da descrição completa", dica: "Usado quando as seções não são encontradas." },
  { id: "cargo", rotulo: "Cargo", dica: "Ex.: h1.job-title" },
  { id: "empresa", rotulo: "Empresa", dica: "Ex.: .company-name" },
  { id: "expandir", rotulo: "Botões de \"ver mais\" a clicar", dica: "Ex.: button.show-more" },
];

let regras = [];

const paraLista = (txt) =>
  (txt || "")
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);

const paraTexto = (arr) => (arr || []).join("\n");

function render() {
  const lista = $("lista");
  lista.innerHTML = "";

  if (!regras.length) {
    lista.innerHTML = '<div class="card vazio">Nenhuma regra ainda. Clique em “Adicionar domínio”.</div>';
    return;
  }

  regras.forEach((regra, i) => {
    const card = document.createElement("div");
    card.className = "card";

    const topo = document.createElement("div");
    topo.className = "row";
    topo.innerHTML = `
      <div class="top" style="flex:1">
        <input type="text" data-campo="dominio" placeholder="gupy.io" value="${(regra.dominio || "").replace(/"/g, "&quot;")}" />
        <label style="margin:0;display:flex;align-items:center;gap:6px;text-transform:none;letter-spacing:0;font-size:12px;color:#10312f">
          <input type="checkbox" data-campo="ativo" ${regra.ativo === false ? "" : "checked"} /> ativa
        </label>
      </div>`;
    const remover = document.createElement("button");
    remover.className = "del";
    remover.textContent = "Remover";
    remover.onclick = () => {
      regras.splice(i, 1);
      render();
    };
    topo.appendChild(remover);
    card.appendChild(topo);

    for (const campo of CAMPOS) {
      const l = document.createElement("label");
      l.textContent = campo.rotulo;
      const ta = document.createElement("textarea");
      ta.dataset.campo = campo.id;
      ta.value = paraTexto(regra[campo.id]);
      const h = document.createElement("div");
      h.className = "hint";
      h.textContent = campo.dica;
      card.append(l, ta, h);
    }

    card.addEventListener("input", () => coletar());
    card.addEventListener("change", () => coletar());
    card.dataset.indice = String(i);
    lista.appendChild(card);
  });
}

function coletar() {
  document.querySelectorAll("#lista .card[data-indice]").forEach((card) => {
    const i = Number(card.dataset.indice);
    const regra = regras[i];
    if (!regra) return;
    regra.dominio = card.querySelector('[data-campo="dominio"]').value.trim();
    regra.ativo = card.querySelector('[data-campo="ativo"]').checked;
    for (const campo of CAMPOS) {
      regra[campo.id] = paraLista(card.querySelector(`[data-campo="${campo.id}"]`).value);
    }
  });
}

function aviso(msg) {
  $("aviso").textContent = msg;
  setTimeout(() => ($("aviso").textContent = ""), 2500);
}

$("novo").onclick = () => {
  coletar();
  regras.push({ dominio: "", ativo: true, secoes: [], descricao: [], cargo: [], empresa: [], expandir: [] });
  render();
};

$("salvar").onclick = () => {
  coletar();
  const limpas = regras.filter((r) => r.dominio);
  chrome.storage.local.set({ [CHAVE]: limpas }, () => {
    regras = limpas;
    render();
    aviso("Regras salvas. Reabra o popup para usá-las.");
  });
};

$("exportar").onclick = () => {
  coletar();
  const blob = new Blob([JSON.stringify(regras, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "cv-radar-seletores.json";
  a.click();
  URL.revokeObjectURL(a.href);
};

$("importar").onclick = () => $("arquivo").click();
$("arquivo").onchange = async (e) => {
  const arquivo = e.target.files?.[0];
  if (!arquivo) return;
  try {
    const dados = JSON.parse(await arquivo.text());
    if (!Array.isArray(dados)) throw new Error("formato");
    regras = dados;
    render();
    aviso("Importado. Clique em Salvar para aplicar.");
  } catch {
    aviso("Arquivo inválido.");
  }
  e.target.value = "";
};

chrome.storage.local.get([CHAVE], (dados) => {
  regras = Array.isArray(dados[CHAVE]) ? dados[CHAVE] : [];
  render();
});
