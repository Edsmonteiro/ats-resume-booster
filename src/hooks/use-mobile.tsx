import * as React from "react";

const MOBILE_BREAKPOINT = 768;

/** Formato de tela: "compacto" (celular) ou "amplo" (tablet/desktop). */
export type Formato = "compacto" | "amplo";

function calcular(): Formato {
  if (typeof window === "undefined") return "amplo";
  const estreito = window.innerWidth < MOBILE_BREAKPOINT;
  const toque = window.matchMedia("(pointer: coarse)").matches;
  // Telas estreitas sempre são compactas; telas médias com toque também.
  return estreito || (toque && window.innerWidth < 1024) ? "compacto" : "amplo";
}

/**
 * Fonte única de formato da interface. Durante a hidratação retorna
 * `pronto: false` para evitar piscar o layout errado.
 */
export function useFormato() {
  const [formato, setFormato] = React.useState<Formato>("amplo");
  const [pronto, setPronto] = React.useState(false);

  React.useEffect(() => {
    const atualizar = () => setFormato(calcular());
    atualizar();
    setPronto(true);
    window.addEventListener("resize", atualizar);
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    mql.addEventListener("change", atualizar);
    return () => {
      window.removeEventListener("resize", atualizar);
      mql.removeEventListener("change", atualizar);
    };
  }, []);

  return { formato, pronto, compacto: formato === "compacto" };
}

export function useIsMobile() {
  return useFormato().compacto;
}
