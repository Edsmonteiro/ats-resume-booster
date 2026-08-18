import { AlignmentType, Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import { jsPDF } from "jspdf";

type Bloco = { tipo: "titulo" | "secao" | "bullet" | "texto"; texto: string };

export function estruturar(texto: string): Bloco[] {
  const linhas = texto.split(/\r?\n/);
  const blocos: Bloco[] = [];
  let primeiraLinha = true;

  for (const bruta of linhas) {
    const linha = bruta.trim();
    if (!linha) continue;
    const semMarcador = linha.replace(/^[-•*]\s+/, "");
    const ehSecao =
      linha.length <= 60 && linha === linha.toUpperCase() && /[A-ZÀ-Ú]/.test(linha) && !/^[-•*]/.test(linha);

    if (primeiraLinha) {
      blocos.push({ tipo: "titulo", texto: semMarcador });
      primeiraLinha = false;
      continue;
    }
    if (ehSecao) blocos.push({ tipo: "secao", texto: linha });
    else if (/^[-•*]\s+/.test(linha)) blocos.push({ tipo: "bullet", texto: semMarcador });
    else blocos.push({ tipo: "texto", texto: linha });
  }
  return blocos;
}

function baixar(blob: Blob, nome: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportarDocx(texto: string, nomeArquivo = "curriculo-ats.docx") {
  const blocos = estruturar(texto);

  const doc = new Document({
    numbering: {
      config: [
        {
          reference: "cv-bullets",
          levels: [
            {
              level: 0,
              format: "bullet" as never,
              text: "•",
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 360, hanging: 240 } } },
            },
          ],
        },
      ],
    },
    styles: {
      default: { document: { run: { font: "Arial", size: 21 } } },
      paragraphStyles: [
        {
          id: "Heading1",
          name: "Heading 1",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { size: 28, bold: true, font: "Arial" },
          paragraph: { spacing: { before: 0, after: 120 }, outlineLevel: 0 },
        },
        {
          id: "Heading2",
          name: "Heading 2",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { size: 23, bold: true, font: "Arial" },
          paragraph: { spacing: { before: 240, after: 100 }, outlineLevel: 1 },
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 },
          },
        },
        children: blocos.map((b) => {
          if (b.tipo === "titulo")
            return new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(b.texto)] });
          if (b.tipo === "secao")
            return new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(b.texto)] });
          if (b.tipo === "bullet")
            return new Paragraph({
              numbering: { reference: "cv-bullets", level: 0 },
              spacing: { after: 60 },
              children: [new TextRun(b.texto)],
            });
          return new Paragraph({ spacing: { after: 100 }, children: [new TextRun(b.texto)] });
        }),
      },
    ],
  });

  baixar(await Packer.toBlob(doc), nomeArquivo);
}

export function exportarPdf(texto: string, nomeArquivo = "curriculo-ats.pdf") {
  const blocos = estruturar(texto);
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const margem = 54;
  const largura = doc.internal.pageSize.getWidth() - margem * 2;
  const alturaPagina = doc.internal.pageSize.getHeight();
  let y = margem;

  const quebrar = (altura: number) => {
    if (y + altura > alturaPagina - margem) {
      doc.addPage();
      y = margem;
    }
  };

  for (const b of blocos) {
    if (b.tipo === "titulo") {
      doc.setFont("helvetica", "bold").setFontSize(16);
      const linhas = doc.splitTextToSize(b.texto, largura) as string[];
      quebrar(linhas.length * 19);
      doc.text(linhas, margem, y + 14);
      y += linhas.length * 19 + 6;
    } else if (b.tipo === "secao") {
      doc.setFont("helvetica", "bold").setFontSize(11.5);
      quebrar(30);
      y += 12;
      doc.text(b.texto, margem, y + 11);
      y += 16;
      doc.setDrawColor(190).line(margem, y, margem + largura, y);
      y += 8;
    } else {
      doc.setFont("helvetica", "normal").setFontSize(10);
      const recuo = b.tipo === "bullet" ? 14 : 0;
      const linhas = doc.splitTextToSize(b.texto, largura - recuo) as string[];
      quebrar(linhas.length * 13 + 4);
      if (b.tipo === "bullet") doc.text("•", margem, y + 10);
      doc.text(linhas, margem + recuo, y + 10);
      y += linhas.length * 13 + 4;
    }
  }

  doc.save(nomeArquivo);
}
