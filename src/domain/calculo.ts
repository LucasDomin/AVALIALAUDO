export type ImovelAvaliando = {
  descricao: string;
  area: number;
};

export type ComparativoInput = {
  id: string;
  descricao: string;
  area: number;
  valor: number;
  f1: number;
  f2: number;
  f3: number;
};

export type AmostraHomogeneizada = ComparativoInput & {
  valorM2: number;
  valorHomogeneizado: number;
};

export type AmostraChauvenet = AmostraHomogeneizada & {
  d: number;
  mantida: boolean;
};

export type Estatistica = {
  n: number;
  media: number;
  desvioPadrao: number;
};

export type IntervaloConfianca = {
  tc: number;
  limiteInferior: number;
  limiteSuperior: number;
};

export type CampoArbitrio = {
  minimo: number;
  maximo: number;
};

export type ResultadoAvaliacao = {
  amostras: AmostraHomogeneizada[];
  estatisticaInicial: Estatistica;
  valorCriticoChauvenet: number;
  chauvenet: AmostraChauvenet[];
  amostrasValidas: AmostraHomogeneizada[];
  estatisticaFinal: Estatistica;
  intervalo80: IntervaloConfianca;
  campoArbitrio: CampoArbitrio;
  valorUnitarioAdotado: number;
  valorFinal: number;
  observacoes: string[];
};

export type DadosAvaliacao = {
  avaliando: ImovelAvaliando;
  comparativos: ComparativoInput[];
  valorUnitarioAdotado?: number;
};

const CHAUVENT_TABLE = [
  { n: 3, vc: 1.38 },
  { n: 4, vc: 1.54 },
  { n: 5, vc: 1.65 },
  { n: 6, vc: 1.73 },
  { n: 7, vc: 1.8 },
  { n: 8, vc: 1.86 },
  { n: 9, vc: 1.91 },
  { n: 10, vc: 1.96 },
  { n: 15, vc: 2.13 },
  { n: 20, vc: 2.24 },
  { n: 25, vc: 2.33 },
  { n: 30, vc: 2.39 },
  { n: 50, vc: 2.57 },
  { n: 100, vc: 2.81 },
];

const STUDENT_T_80_TABLE = [
  { df: 1, tc: 3.078 },
  { df: 2, tc: 1.886 },
  { df: 3, tc: 1.638 },
  { df: 4, tc: 1.533 },
  { df: 5, tc: 1.476 },
  { df: 6, tc: 1.44 },
  { df: 7, tc: 1.415 },
  { df: 8, tc: 1.397 },
  { df: 9, tc: 1.383 },
  { df: 10, tc: 1.372 },
  { df: 11, tc: 1.363 },
  { df: 12, tc: 1.356 },
  { df: 13, tc: 1.35 },
  { df: 14, tc: 1.345 },
  { df: 15, tc: 1.341 },
  { df: 16, tc: 1.337 },
  { df: 17, tc: 1.333 },
  { df: 18, tc: 1.33 },
  { df: 19, tc: 1.328 },
  { df: 20, tc: 1.325 },
  { df: 25, tc: 1.316 },
  { df: 30, tc: 1.31 },
  { df: 40, tc: 1.303 },
  { df: 60, tc: 1.296 },
  { df: 120, tc: 1.289 },
];

function interpolar(valor: number, tabela: Array<Record<string, number>>, chave: string, saida: string) {
  if (valor <= tabela[0][chave]) return tabela[0][saida];

  for (let index = 1; index < tabela.length; index += 1) {
    const anterior = tabela[index - 1];
    const atual = tabela[index];

    if (valor === atual[chave]) return atual[saida];

    if (valor < atual[chave]) {
      const proporcao = (valor - anterior[chave]) / (atual[chave] - anterior[chave]);
      return anterior[saida] + proporcao * (atual[saida] - anterior[saida]);
    }
  }

  return tabela[tabela.length - 1][saida];
}

function media(valores: number[]) {
  return valores.reduce((total, valor) => total + valor, 0) / valores.length;
}

function desvioPadraoAmostral(valores: number[], mediaCalculada: number) {
  if (valores.length < 2) return 0;

  const somaQuadrados = valores.reduce((total, valor) => total + (mediaCalculada - valor) ** 2, 0);
  return Math.sqrt(somaQuadrados / (valores.length - 1));
}

function estatistica(valores: number[]): Estatistica {
  const mediaCalculada = media(valores);

  return {
    n: valores.length,
    media: mediaCalculada,
    desvioPadrao: desvioPadraoAmostral(valores, mediaCalculada),
  };
}

export function valorCriticoChauvenet(n: number) {
  return interpolar(n, CHAUVENT_TABLE, "n", "vc");
}

export function valorTC80(grausLiberdade: number) {
  return interpolar(grausLiberdade, STUDENT_T_80_TABLE, "df", "tc");
}

export function calcularAvaliacao(dados: DadosAvaliacao): ResultadoAvaliacao {
  if (!dados.avaliando.descricao.trim()) {
    throw new Error("Informe a descrição do imóvel avaliando.");
  }

  if (!Number.isFinite(dados.avaliando.area) || dados.avaliando.area <= 0) {
    throw new Error("Informe a área do imóvel avaliando com valor maior que zero.");
  }

  const comparativosValidos = dados.comparativos.filter(
    (comparativo) =>
      comparativo.descricao.trim() &&
      comparativo.area > 0 &&
      comparativo.valor > 0 &&
      comparativo.f1 > 0 &&
      comparativo.f2 > 0 &&
      comparativo.f3 > 0,
  );

  if (comparativosValidos.length < 3) {
    throw new Error("Informe pelo menos 3 imóveis comparativos completos.");
  }

  const amostras = comparativosValidos.map((comparativo) => {
    const valorM2 = comparativo.valor / comparativo.area;
    const valorHomogeneizado = valorM2 * comparativo.f1 * comparativo.f2 * comparativo.f3;

    return {
      ...comparativo,
      valorM2,
      valorHomogeneizado,
    };
  });

  const estatisticaInicial = estatistica(amostras.map((amostra) => amostra.valorHomogeneizado));
  const valorCritico = valorCriticoChauvenet(amostras.length);

  const chauvenet = amostras.map((amostra) => {
    const d = estatisticaInicial.desvioPadrao === 0 ? 0 : Math.abs(amostra.valorHomogeneizado - estatisticaInicial.media) / estatisticaInicial.desvioPadrao;

    return {
      ...amostra,
      d,
      mantida: d <= valorCritico,
    };
  });

  const mantidas = chauvenet.filter((amostra) => amostra.mantida);
  const observacoes: string[] = [];
  const amostrasValidas = mantidas.length >= 2 ? mantidas : amostras;

  if (mantidas.length !== amostras.length) {
    observacoes.push("Amostras com desvio superior ao valor crítico de Chauvenet foram excluídas do tratamento estatístico final.");
  }

  if (mantidas.length < 2) {
    observacoes.push("O tratamento por Chauvenet resultou em menos de duas amostras mantidas; por segurança, a estatística final preservou a amostra original.");
  }

  const estatisticaFinal = estatistica(amostrasValidas.map((amostra) => amostra.valorHomogeneizado));
  const grausLiberdade = Math.max(estatisticaFinal.n - 1, 1);
  const tc = valorTC80(grausLiberdade);
  const erro = estatisticaFinal.n > 1 ? (tc * estatisticaFinal.desvioPadrao) / Math.sqrt(estatisticaFinal.n - 1) : 0;
  const intervalo80 = {
    tc,
    limiteInferior: estatisticaFinal.media - erro,
    limiteSuperior: estatisticaFinal.media + erro,
  };

  const campoArbitrio = {
    minimo: estatisticaFinal.media * 0.9,
    maximo: estatisticaFinal.media * 1.1,
  };

  const valorUnitarioAdotado = dados.valorUnitarioAdotado && dados.valorUnitarioAdotado > 0 ? dados.valorUnitarioAdotado : estatisticaFinal.media;

  if (valorUnitarioAdotado < campoArbitrio.minimo || valorUnitarioAdotado > campoArbitrio.maximo) {
    observacoes.push("O valor unitário adotado está fora do campo de arbítrio de 10% calculado sobre a média final.");
  }

  return {
    amostras,
    estatisticaInicial,
    valorCriticoChauvenet: valorCritico,
    chauvenet,
    amostrasValidas,
    estatisticaFinal,
    intervalo80,
    campoArbitrio,
    valorUnitarioAdotado,
    valorFinal: valorUnitarioAdotado * dados.avaliando.area,
    observacoes,
  };
}