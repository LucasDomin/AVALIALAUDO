import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import { jsPDF } from "jspdf";
import type { BlocoTextoRelatorio, RelatorioAvaliacao, TabelaRelatorio } from "../domain/relatorio";
import { dataHoraBR } from "../domain/formatacao";
import { nomeArquivoRelatorio } from "../domain/relatorio";

function baixarBlob(blob: Blob, nomeArquivo: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function textoCelula(texto: string, negrito = false) {
  return new Paragraph({
    children: [new TextRun({ text: texto, bold: negrito, size: 18, font: "Arial" })],
    spacing: { before: 80, after: 80 },
  });
}

function criarTabelaWord(tabela: TabelaRelatorio) {
  const borda = { style: BorderStyle.SINGLE, size: 1, color: "7A7F87" };
  const linhas = [tabela.cabecalho, ...tabela.linhas].map(
    (linha, indice) =>
      new TableRow({
        children: linha.map(
          (valor) =>
            new TableCell({
              children: [textoCelula(valor, indice === 0)],
              borders: { top: borda, bottom: borda, left: borda, right: borda },
              margins: { top: 80, bottom: 80, left: 90, right: 90 },
              width: { size: Math.floor(100 / linha.length), type: WidthType.PERCENTAGE },
            }),
        ),
      }),
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: linhas,
  });
}

function paragrafosBloco(bloco: BlocoTextoRelatorio) {
  return [
    new Paragraph({ text: bloco.titulo, heading: HeadingLevel.HEADING_2, spacing: { before: 280, after: 120 } }),
    ...bloco.paragrafos.map(
      (paragrafo) =>
        new Paragraph({
          children: [new TextRun({ text: paragrafo, size: 22, font: "Arial", color: "333333" })],
          spacing: { after: 160 },
          alignment: AlignmentType.JUSTIFIED,
        }),
    ),
  ];
}

export async function exportarWord(relatorio: RelatorioAvaliacao) {
  const children = [
    new Paragraph({
      children: [new TextRun({ text: relatorio.titulo, bold: true, size: 34, font: "Arial", color: "0F2D4D" })],
      spacing: { after: 140 },
    }),
    new Paragraph({
      children: [new TextRun({ text: relatorio.subtitulo, size: 22, font: "Arial", color: "333333" })],
      spacing: { after: 240 },
    }),
    new Paragraph({ text: `Gerado em: ${dataHoraBR(relatorio.geradoEm)}`, spacing: { after: 80 } }),
    new Paragraph({ text: `Responsável: ${relatorio.responsavel.nome} | ${relatorio.responsavel.email} | ${relatorio.responsavel.celular}`, spacing: { after: 80 } }),
    new Paragraph({ text: `Imóvel avaliando: ${relatorio.avaliando.descricao}`, spacing: { after: 80 } }),
    new Paragraph({ text: `Área do imóvel avaliando: ${relatorio.avaliando.area}`, spacing: { after: 220 } }),
    ...relatorio.textosFixos.flatMap(paragrafosBloco),
    ...relatorio.tabelas.flatMap((tabela) => [
      new Paragraph({ text: tabela.titulo, heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 140 } }),
      criarTabelaWord(tabela),
    ]),
    new Paragraph({ text: "CÁLCULOS DETALHADOS", heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 120 } }),
    ...relatorio.calculosDetalhados.map((linha) => new Paragraph({ text: linha, spacing: { after: 80 } })),
    new Paragraph({ text: "RESULTADO FINAL", heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 120 } }),
    ...relatorio.resultadoFinal.map((linha, indice) =>
      new Paragraph({
        children: [new TextRun({ text: linha, bold: indice === relatorio.resultadoFinal.length - 1, size: indice === relatorio.resultadoFinal.length - 1 ? 26 : 22 })],
        spacing: { after: 80 },
      }),
    ),
    ...(relatorio.observacoes.length
      ? [
          new Paragraph({ text: "OBSERVAÇÕES", heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 120 } }),
          ...relatorio.observacoes.map((linha) => new Paragraph({ text: linha, spacing: { after: 80 } })),
        ]
      : []),
  ];

  const documento = new Document({
    creator: "Sistema de Avaliação Imobiliária",
    description: relatorio.subtitulo,
    title: relatorio.titulo,
    sections: [{ properties: {}, children }],
  });

  const blob = await Packer.toBlob(documento);
  baixarBlob(blob, nomeArquivoRelatorio(relatorio, "docx"));
}

function escreverTextoPdf(doc: jsPDF, texto: string, x: number, y: number, largura: number, tamanho = 10, negrito = false) {
  doc.setFont("helvetica", negrito ? "bold" : "normal");
  doc.setFontSize(tamanho);
  const linhas = doc.splitTextToSize(texto, largura) as string[];
  doc.text(linhas, x, y);
  return y + linhas.length * (tamanho + 4);
}

function garantirEspaco(doc: jsPDF, y: number, altura: number, margem: number) {
  const alturaPagina = doc.internal.pageSize.getHeight();
  if (y + altura <= alturaPagina - margem) return y;

  doc.addPage();
  return margem;
}

function desenharTabelaPdf(doc: jsPDF, tabela: TabelaRelatorio, yInicial: number, margem: number, larguraPagina: number) {
  let y = garantirEspaco(doc, yInicial, 60, margem);
  y = escreverTextoPdf(doc, tabela.titulo, margem, y, larguraPagina, 12, true) + 8;
  const larguraTabela = larguraPagina;
  const larguraColuna = larguraTabela / tabela.cabecalho.length;
  const todasLinhas = [tabela.cabecalho, ...tabela.linhas];

  todasLinhas.forEach((linha, indiceLinha) => {
    const linhasPorCelula = linha.map((valor) => doc.splitTextToSize(valor, larguraColuna - 8) as string[]);
    const alturaLinha = Math.max(...linhasPorCelula.map((linhas) => linhas.length)) * 10 + 10;
    y = garantirEspaco(doc, y, alturaLinha + 8, margem);

    linha.forEach((_, indiceColuna) => {
      const x = margem + indiceColuna * larguraColuna;
      doc.setDrawColor(122, 127, 135);
      doc.rect(x, y, larguraColuna, alturaLinha);
      doc.setFont("helvetica", indiceLinha === 0 ? "bold" : "normal");
      doc.setFontSize(7.5);
      doc.text(linhasPorCelula[indiceColuna], x + 4, y + 10);
    });

    y += alturaLinha;
  });

  return y + 18;
}

export function exportarPdf(relatorio: RelatorioAvaliacao) {
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const margem = 42;
  const larguraPagina = doc.internal.pageSize.getWidth() - margem * 2;
  let y = margem;

  doc.setTextColor(15, 45, 77);
  y = escreverTextoPdf(doc, relatorio.titulo, margem, y, larguraPagina, 18, true) + 4;
  doc.setTextColor(51, 51, 51);
  y = escreverTextoPdf(doc, relatorio.subtitulo, margem, y, larguraPagina, 10) + 12;
  y = escreverTextoPdf(doc, `Gerado em: ${dataHoraBR(relatorio.geradoEm)}`, margem, y, larguraPagina, 9);
  y = escreverTextoPdf(doc, `Responsável: ${relatorio.responsavel.nome} | ${relatorio.responsavel.email} | ${relatorio.responsavel.celular}`, margem, y, larguraPagina, 9);
  y = escreverTextoPdf(doc, `Imóvel avaliando: ${relatorio.avaliando.descricao}`, margem, y, larguraPagina, 9);
  y = escreverTextoPdf(doc, `Área do imóvel avaliando: ${relatorio.avaliando.area}`, margem, y, larguraPagina, 9) + 12;

  relatorio.textosFixos.forEach((bloco) => {
    y = garantirEspaco(doc, y, 90, margem);
    doc.setTextColor(15, 45, 77);
    y = escreverTextoPdf(doc, bloco.titulo, margem, y, larguraPagina, 12, true) + 4;
    doc.setTextColor(51, 51, 51);
    bloco.paragrafos.forEach((paragrafo) => {
      y = escreverTextoPdf(doc, paragrafo, margem, y, larguraPagina, 9) + 6;
    });
  });

  relatorio.tabelas.forEach((tabela) => {
    y = desenharTabelaPdf(doc, tabela, y, margem, larguraPagina);
  });

  y = garantirEspaco(doc, y, 120, margem);
  doc.setTextColor(15, 45, 77);
  y = escreverTextoPdf(doc, "CÁLCULOS DETALHADOS", margem, y, larguraPagina, 12, true) + 4;
  doc.setTextColor(51, 51, 51);
  relatorio.calculosDetalhados.forEach((linha) => {
    y = garantirEspaco(doc, y, 24, margem);
    y = escreverTextoPdf(doc, linha, margem, y, larguraPagina, 9) + 2;
  });

  y = garantirEspaco(doc, y, 90, margem);
  doc.setTextColor(15, 45, 77);
  y = escreverTextoPdf(doc, "RESULTADO FINAL", margem, y, larguraPagina, 12, true) + 4;
  doc.setTextColor(51, 51, 51);
  relatorio.resultadoFinal.forEach((linha, indice) => {
    y = escreverTextoPdf(doc, linha, margem, y, larguraPagina, indice === relatorio.resultadoFinal.length - 1 ? 11 : 9, indice === relatorio.resultadoFinal.length - 1) + 3;
  });

  if (relatorio.observacoes.length) {
    y = garantirEspaco(doc, y, 70, margem);
    doc.setTextColor(15, 45, 77);
    y = escreverTextoPdf(doc, "OBSERVAÇÕES", margem, y, larguraPagina, 12, true) + 4;
    doc.setTextColor(51, 51, 51);
    relatorio.observacoes.forEach((linha) => {
      y = escreverTextoPdf(doc, linha, margem, y, larguraPagina, 9) + 3;
    });
  }

  doc.save(nomeArquivoRelatorio(relatorio, "pdf"));
}