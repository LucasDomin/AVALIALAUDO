import type { DadosAvaliacao, ResultadoAvaliacao } from "./calculo";
import { dataHoraBR, moedaBR, numeroBR } from "./formatacao";

export type LinhaTabelaRelatorio = string[];

export type TabelaRelatorio = {
  titulo: string;
  cabecalho: string[];
  linhas: LinhaTabelaRelatorio[];
};

export type BlocoTextoRelatorio = {
  titulo: string;
  paragrafos: string[];
};

export type UsuarioRelatorio = {
  nome: string;
  email: string;
  celular: string;
};

export type RelatorioAvaliacao = {
  titulo: string;
  subtitulo: string;
  geradoEm: string;
  responsavel: UsuarioRelatorio;
  avaliando: {
    descricao: string;
    area: string;
  };
  textosFixos: BlocoTextoRelatorio[];
  tabelas: TabelaRelatorio[];
  calculosDetalhados: string[];
  resultadoFinal: string[];
  observacoes: string[];
};

export function gerarRelatorio(dados: DadosAvaliacao, resultado: ResultadoAvaliacao, usuario: UsuarioRelatorio): RelatorioAvaliacao {
  const geradoEm = new Date().toISOString();

  return {
    titulo: "AVALIAÇÃO DE IMÓVEL POR COMPARAÇÃO DIRETA",
    subtitulo: "Tratamento por fatores conforme NBR 14653 e verificação pelo Critério de Chauvenet",
    geradoEm,
    responsavel: usuario,
    avaliando: {
      descricao: dados.avaliando.descricao,
      area: `${numeroBR(dados.avaliando.area)} m²`,
    },
    textosFixos: [
      {
        titulo: "1. FINALIDADE E CRITÉRIO TÉCNICO",
        paragrafos: [
          "O presente documento apresenta avaliação de imóvel pelo método comparativo direto de dados de mercado, com tratamento por fatores, conforme diretrizes da ABNT NBR 14653.",
          "O procedimento considera imóveis comparativos de mercado e aplica fatores de homogeneização para oferta, localização e topografia, de modo a aproximar as amostras às condições do imóvel avaliando.",
        ],
      },
      {
        titulo: "2. TRATAMENTO POR FATORES",
        paragrafos: [
          "Para cada imóvel comparativo, o valor unitário é obtido pela divisão do valor de mercado pela área informada. Em seguida, o valor unitário é multiplicado pelos fatores F1, F2 e F3.",
          "Fórmula aplicada: Vh = (Valor / Área) x F1 x F2 x F3, em que Vh corresponde ao valor homogeneizado por metro quadrado.",
        ],
      },
      {
        titulo: "3. CRITÉRIO DE CHAUVENET",
        paragrafos: [
          "Após a homogeneização, calcula-se a média e o desvio padrão amostral. Para cada amostra, calcula-se d = |Xi - X| / S e compara-se o resultado ao valor crítico de Chauvenet.",
          "Amostras com d superior ao valor crítico são excluídas do tratamento estatístico final. As amostras mantidas compõem a base para intervalo de confiança, campo de arbítrio e valor final.",
        ],
      },
    ],
    tabelas: [
      {
        titulo: "TABELA DE HOMOGENEIZAÇÃO",
        cabecalho: ["Imóvel", "Área", "Valor", "R$/m²", "F1", "F2", "F3", "Vh"],
        linhas: resultado.amostras.map((amostra) => [
          amostra.descricao,
          `${numeroBR(amostra.area)} m²`,
          moedaBR(amostra.valor),
          moedaBR(amostra.valorM2),
          numeroBR(amostra.f1, 3),
          numeroBR(amostra.f2, 3),
          numeroBR(amostra.f3, 3),
          moedaBR(amostra.valorHomogeneizado),
        ]),
      },
      {
        titulo: "VERIFICAÇÃO PELO CRITÉRIO DE CHAUVENET",
        cabecalho: ["Imóvel", "Xi", "d", "VC", "Situação"],
        linhas: resultado.chauvenet.map((amostra) => [
          amostra.descricao,
          moedaBR(amostra.valorHomogeneizado),
          numeroBR(amostra.d, 4),
          numeroBR(resultado.valorCriticoChauvenet, 4),
          amostra.mantida ? "MANTIDA" : "EXCLUÍDA",
        ]),
      },
    ],
    calculosDetalhados: [
      `Média inicial: ${moedaBR(resultado.estatisticaInicial.media)}`,
      `Desvio padrão inicial: ${moedaBR(resultado.estatisticaInicial.desvioPadrao)}`,
      `Quantidade inicial de amostras: ${resultado.estatisticaInicial.n}`,
      `Valor crítico de Chauvenet: ${numeroBR(resultado.valorCriticoChauvenet, 4)}`,
      `Média final: ${moedaBR(resultado.estatisticaFinal.media)}`,
      `Desvio padrão final: ${moedaBR(resultado.estatisticaFinal.desvioPadrao)}`,
      `Quantidade final de amostras: ${resultado.estatisticaFinal.n}`,
      `Intervalo de confiança de 80%: ${moedaBR(resultado.intervalo80.limiteInferior)} a ${moedaBR(resultado.intervalo80.limiteSuperior)}`,
      `Campo de arbítrio de 10%: ${moedaBR(resultado.campoArbitrio.minimo)} a ${moedaBR(resultado.campoArbitrio.maximo)}`,
    ],
    resultadoFinal: [
      `Valor unitário adotado: ${moedaBR(resultado.valorUnitarioAdotado)} por m²`,
      `Área do imóvel avaliando: ${numeroBR(dados.avaliando.area)} m²`,
      `Valor final da avaliação: ${moedaBR(resultado.valorFinal)}`,
    ],
    observacoes: resultado.observacoes,
  };
}

export function nomeArquivoRelatorio(relatorio: RelatorioAvaliacao, extensao: "pdf" | "docx") {
  const data = dataHoraBR(relatorio.geradoEm).replace(/\D/g, "").slice(0, 8);
  return `avaliacao-imovel-${data}.${extensao}`;
}