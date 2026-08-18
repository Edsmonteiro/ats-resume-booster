import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type Paleta = "navy" | "roxo" | "sepia" | "floresta" | "noite";
export type Modo = "claro" | "escuro" | "sistema";

export const PALETAS: { id: Paleta; nome: string; descricao: string; amostra: string[] }[] = [
  {
    id: "navy",
    nome: "Confiança navy",
    descricao: "Sóbrio e profissional (padrão)",
    amostra: ["oklch(0.38 0.085 252)", "oklch(0.55 0.095 245)"],
  },
  {
    id: "roxo",
    nome: "Roxo elétrico",
    descricao: "Identidade original do Eu Passo",
    amostra: ["oklch(0.55 0.24 292)", "oklch(0.75 0.16 55)"],
  },
  {
    id: "sepia",
    nome: "Sépia acolhedor",
    descricao: "Tons quentes de papel e âmbar",
    amostra: ["oklch(0.58 0.13 60)", "oklch(0.62 0.14 30)"],
  },
  {
    id: "floresta",
    nome: "Floresta calma",
    descricao: "Verde profundo, leitura tranquila",
    amostra: ["oklch(0.5 0.11 165)", "oklch(0.68 0.13 85)"],
  },
  {
    id: "noite",
    nome: "Noite azul",
    descricao: "Azul sóbrio e concentrado",
    amostra: ["oklch(0.52 0.15 255)", "oklch(0.7 0.13 200)"],
  },
];

export const MODOS: { id: Modo; nome: string }[] = [
  { id: "claro", nome: "Claro" },
  { id: "escuro", nome: "Escuro" },
  { id: "sistema", nome: "Sistema" },
];

const CHAVE_PALETA = "eupasso:paleta";
const CHAVE_MODO = "eupasso:modo";

type Ctx = {
  paleta: Paleta;
  modo: Modo;
  escuroAtivo: boolean;
  setPaleta: (p: Paleta) => void;
  setModo: (m: Modo) => void;
};

const TemaContext = createContext<Ctx | null>(null);

function prefereEscuro() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function aplicar(paleta: Paleta, modo: Modo) {
  if (typeof document === "undefined") return false;
  const raiz = document.documentElement;
  const escuro = modo === "escuro" || (modo === "sistema" && prefereEscuro());
  raiz.dataset["tema"] = paleta;
  raiz.classList.toggle("dark", escuro);
  raiz.style.colorScheme = escuro ? "dark" : "light";
  return escuro;
}

export function TemaProvider({ children }: { children: ReactNode }) {
  const [paleta, setPaletaEstado] = useState<Paleta>("navy");
  const [modo, setModoEstado] = useState<Modo>("sistema");
  const [escuroAtivo, setEscuroAtivo] = useState(false);

  useEffect(() => {
    let p: Paleta = "navy";
    let m: Modo = "sistema";
    try {
      const pSalva = window.localStorage.getItem(CHAVE_PALETA) as Paleta | null;
      const mSalvo = window.localStorage.getItem(CHAVE_MODO) as Modo | null;
      if (pSalva && PALETAS.some((x) => x.id === pSalva)) p = pSalva;
      if (mSalvo && MODOS.some((x) => x.id === mSalvo)) m = mSalvo;
    } catch {
      /* armazenamento indisponível */
    }
    setPaletaEstado(p);
    setModoEstado(m);
    setEscuroAtivo(aplicar(p, m));
  }, []);

  useEffect(() => {
    if (modo !== "sistema") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const ouvir = () => setEscuroAtivo(aplicar(paleta, "sistema"));
    mq.addEventListener("change", ouvir);
    return () => mq.removeEventListener("change", ouvir);
  }, [modo, paleta]);

  const setPaleta = useCallback(
    (p: Paleta) => {
      setPaletaEstado(p);
      setEscuroAtivo(aplicar(p, modo));
      try {
        window.localStorage.setItem(CHAVE_PALETA, p);
      } catch {
        /* ignora */
      }
    },
    [modo],
  );

  const setModo = useCallback(
    (m: Modo) => {
      setModoEstado(m);
      setEscuroAtivo(aplicar(paleta, m));
      try {
        window.localStorage.setItem(CHAVE_MODO, m);
      } catch {
        /* ignora */
      }
    },
    [paleta],
  );

  return (
    <TemaContext.Provider value={{ paleta, modo, escuroAtivo, setPaleta, setModo }}>
      {children}
    </TemaContext.Provider>
  );
}

export function useTema() {
  const ctx = useContext(TemaContext);
  if (!ctx) throw new Error("useTema precisa estar dentro de TemaProvider");
  return ctx;
}

export const SCRIPT_TEMA = `(function(){try{var p=localStorage.getItem('${CHAVE_PALETA}')||'navy';var m=localStorage.getItem('${CHAVE_MODO}')||'sistema';var d=m==='escuro'||(m==='sistema'&&window.matchMedia('(prefers-color-scheme: dark)').matches);var r=document.documentElement;r.dataset.tema=p;if(d)r.classList.add('dark');r.style.colorScheme=d?'dark':'light';}catch(e){}})();`;
