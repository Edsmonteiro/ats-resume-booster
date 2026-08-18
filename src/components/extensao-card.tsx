import { Chrome, Download } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const passos = [
  "Descompacte o arquivo baixado.",
  "Abra chrome://extensions no Chrome, Edge, Brave ou Opera.",
  "Ative o Modo do desenvolvedor no canto superior direito.",
  "Clique em Carregar sem compactação e escolha a pasta descompactada.",
  "Abra uma vaga no LinkedIn, clique no ícone da extensão e cole seu currículo uma vez.",
];

export function ExtensaoCard() {
  function baixar() {
    fetch("/cv-radar-extensao.zip")
      .then((res) => {
        if (!res.ok) throw new Error(`Download falhou: ${res.status}`);
        return res.blob();
      })
      .then((blob) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "cv-radar-extensao.zip";
        a.click();
        URL.revokeObjectURL(a.href);
      })
      .catch((e) => toast.error(e.message));
  }

  return (
    <Card className="shadow-[var(--shadow-panel)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display text-base">
          <Chrome className="size-4" />
          Extensão para vagas no navegador
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Com a vaga aberta (LinkedIn, Gupy, Indeed e outros sites), a extensão lê o anúncio e mostra na hora sua
          compatibilidade, as lacunas e uma carta de apresentação — o clique em candidatar-se continua sendo seu. Se
          algum site bloquear a leitura, dá para colar a descrição direto na extensão. Versão 1.1: se você já tinha a
          extensão instalada, baixe de novo e recarregue em <code>chrome://extensions</code>.
        </p>

      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={baixar} className="gap-2">
          <Download className="size-4" />
          Baixar extensão (.zip)
        </Button>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
          {passos.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
