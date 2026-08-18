import { useCallback, useEffect, useState } from "react";

export function useLocalState<T>(chave: string, inicial: T) {
  const [valor, setValor] = useState<T>(inicial);
  const [carregado, setCarregado] = useState(false);

  useEffect(() => {
    try {
      const bruto = window.localStorage.getItem(chave);
      if (bruto) setValor(JSON.parse(bruto) as T);
    } catch {
      /* ignora dados corrompidos */
    }
    setCarregado(true);
  }, [chave]);

  const salvar = useCallback(
    (novo: T) => {
      setValor(novo);
      try {
        window.localStorage.setItem(chave, JSON.stringify(novo));
      } catch {
        /* armazenamento indisponível */
      }
    },
    [chave],
  );

  return [valor, salvar, carregado] as const;
}
