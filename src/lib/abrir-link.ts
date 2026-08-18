import { toast } from "sonner";

/**
 * Abre um link externo sempre no topo do navegador. Dentro do preview (iframe),
 * alguns sites como o LinkedIn recusam o carregamento (ERR_BLOCKED_BY_RESPONSE),
 * então caímos para copiar o endereço.
 */
export function abrirLinkExterno(url: string) {
  try {
    const janela = window.open(url, "_blank", "noopener,noreferrer");
    if (janela) {
      janela.opener = null;
      return;
    }
  } catch {
    /* segue para o fallback */
  }

  void navigator.clipboard
    ?.writeText(url)
    .then(() =>
      toast.info("Não foi possível abrir a vaga aqui. O link foi copiado — cole em uma nova aba."),
    )
    .catch(() => toast.error("Não foi possível abrir a vaga. Copie o link manualmente."));
}
