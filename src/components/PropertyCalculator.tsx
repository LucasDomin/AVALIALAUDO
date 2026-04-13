import { useState } from 'react';
import jsPDF from 'jspdf';
import { useAuthStore } from '../store/authStore';
import { useCalculationStore } from '../store/calculationStore';
import { Factor, ComparableProperty, TargetProperty } from '../types';
import { Calculator as CalcIcon, Home, Building2, DollarSign, Ruler, CheckCircle, AlertCircle, Download } from 'lucide-react';

export const PropertyCalculator = () => {
  const { user } = useAuthStore();
  const { addCalculation } = useCalculationStore();
  
  const [step, setStep] = useState<'setup' | 'data' | 'result'>('setup');
  const [numComparables, setNumComparables] = useState(3);
  const [numFactors, setNumFactors] = useState(3);
  
  const [factors, setFactors] = useState<Factor[]>([]);
  const [targetProperty, setTargetProperty] = useState<TargetProperty>({
    description: '',
    area: 0,
    factors: [],
  });
  const [comparables, setComparables] = useState<ComparableProperty[]>([]);
  
  const [result, setResult] = useState<{
    estimatedValue: number;
    valuePerSqm: number;
    usedComparables: string[];
    excludedComparables: string[];
    averageValuePerSqm: number;
    medianValuePerSqm: number;
  } | null>(null);

  const initializeFactors = () => {
    const newFactors: Factor[] = [];
    for (let i = 0; i < numFactors; i++) {
      newFactors.push({
        id: `factor-${i}`,
        name: `Fator ${i + 1}`,
        weight: 1,
      });
    }
    setFactors(newFactors);
    
    const targetFactors = newFactors.map(f => ({ factorId: f.id, value: 1 }));
    setTargetProperty(prev => ({ ...prev, factors: targetFactors }));
    
    const newComparables: ComparableProperty[] = [];
    for (let i = 0; i < numComparables; i++) {
      newComparables.push({
        id: `comp-${i}`,
        description: '',
        area: 0,
        value: 0,
        factors: newFactors.map(f => ({ factorId: f.id, value: 1 })),
      });
    }
    setComparables(newComparables);
    
    setStep('data');
  };

  const updateFactorName = (factorId: string, name: string) => {
    setFactors(prev => prev.map(f => 
      f.id === factorId ? { ...f, name } : f
    ));
  };



  const updateComparable = (compId: string, field: string, value: number | string) => {
    setComparables(prev => prev.map(c =>
      c.id === compId ? { ...c, [field]: value } : c
    ));
  };

  const updateComparableFactor = (compId: string, factorId: string, value: number) => {
    setComparables(prev => prev.map(c =>
      c.id === compId
        ? {
            ...c,
            factors: c.factors.map(f =>
              f.factorId === factorId ? { ...f, value: Math.max(0.5, Math.min(1.5, value)) } : f
            ),
          }
        : c
    ));
  };

  const applyChauvenetCriterion = (values: number[]): number[] => {
    if (values.length < 3) return values;
    
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length);
    
    if (stdDev === 0) return values;
    
    const zScores = values.map(v => Math.abs((v - mean) / stdDev));
    const threshold = 1.5;
    
    return values.filter((_, i) => zScores[i] <= threshold);
  };

  const calculateAppraisal = () => {
    if (!user) return;

    const validComparables = comparables.filter(c => c.area > 0 && c.value > 0);
    
    if (validComparables.length === 0) {
      alert('Por favor, preencha pelo menos um imóvel comparável válido');
      return;
    }

    // Calcula valor homogeneizado por m² de cada comparável
    const homogenizedValues = validComparables.map(c => {
      let valuePerSqm = c.value / c.area;
      factors.forEach(f => {
        const factorValue = c.factors.find(cf => cf.factorId === f.id)?.value || 1;
        valuePerSqm *= factorValue;
      });
      return valuePerSqm;
    });
    
    const filteredValues = applyChauvenetCriterion(homogenizedValues);
    
    const excludedComparables = validComparables
      .filter((_, i) => !filteredValues.includes(homogenizedValues[i]))
      .map(c => c.description || c.id);
    
    const usedComparables = validComparables
      .filter((_, i) => filteredValues.includes(homogenizedValues[i]))
      .map(c => c.description || c.id);

    const averageValuePerSqm = filteredValues.reduce((a, b) => a + b, 0) / filteredValues.length;
    const sortedValues = [...filteredValues].sort((a, b) => a - b);
    const medianValuePerSqm = sortedValues.length % 2 === 0
      ? (sortedValues[sortedValues.length / 2 - 1] + sortedValues[sortedValues.length / 2]) / 2
      : sortedValues[Math.floor(sortedValues.length / 2)];

    const estimatedValue = averageValuePerSqm * targetProperty.area;

    const finalResult = {
      estimatedValue: Math.round(estimatedValue),
      valuePerSqm: Math.round(averageValuePerSqm),
      usedComparables,
      excludedComparables,
      averageValuePerSqm: Math.round(averageValuePerSqm),
      medianValuePerSqm: Math.round(medianValuePerSqm),
    };

    setResult(finalResult);

    addCalculation({
      userId: user.id,
      targetProperty,
      comparables: validComparables,
      factors,
      result: finalResult,
    });

    setStep('result');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const resetCalculator = () => {
    setStep('setup');
    setResult(null);
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;
    let yPos = margin;

    const addLine = (text: string, fontSize: number = 12, align: 'left' | 'center' | 'right' = 'left', bold: boolean = false) => {
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      if (align === 'center') {
        doc.text(text, pageWidth / 2, yPos, { align: 'center' });
      } else if (align === 'right') {
        doc.text(text, pageWidth - margin, yPos, { align: 'right' });
      } else {
        doc.text(text, margin, yPos);
      }
      yPos += fontSize * 0.6 + 2;
    };

    const addSection = (title: string) => {
      yPos += 5;
      addLine(title, 14, 'left', true);
      yPos += 3;
    };

    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
      }).format(value);
    };

    const formatNumber = (value: number, decimals: number = 2) => {
      return value.toFixed(decimals).replace('.', ',');
    };

    doc.setFont('helvetica');

    addLine('AVALIALAUDO', 18, 'center', true);
    yPos += 5;
    addLine('Avaliação de Imóvel - Método Comparativo Direto', 14, 'center', true);
    addLine('de Dados de Mercado por Fatores', 12, 'center', true);
    yPos += 10;

    if (result) {
      addLine(`Valor do imóvel avaliando: ${formatCurrency(result.estimatedValue)}`, 14, 'center', true);
      yPos += 15;
    }

    addSection('Imóvel avaliando');
    addLine(targetProperty.description || 'Descrição não informada');
    addLine(`Área: ${formatNumber(targetProperty.area)} m²`);
    yPos += 10;

    addSection('Método empregado:');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const methodText = 'Para a avaliação do imóvel foi utilizado o Método Comparativo Direto de Dados de Mercado, com homogeneização por fatores, conforme descrito na Norma Brasileira NBR-14653 – Partes 1 e 2. Através deste método, o imóvel avaliando é avaliado por comparação direta com imóveis com características semelhantes, dentro do mesmo contexto do avaliando, cujos respectivos valores unitários (por m²) são ajustados com fatores que tornam a amostra homogênea.';
    const lines = doc.splitTextToSize(methodText, contentWidth);
    lines.forEach((line: string) => {
      doc.text(line, margin, yPos);
      yPos += 7;
    });
    yPos += 5;

    const chauvenetText = 'O saneamento dos valores da amostra deve ser feito utilizando-se o Critério Excludente de Chauvenet e o tratamento estatístico deve fundamentar-se na Teoria Estatística das Pequenas Amostras (n<30) com a distribuição t de Student com confiança de 80%, consoante com a Norma Brasileira.';
    const chauvenetLines = doc.splitTextToSize(chauvenetText, contentWidth);
    chauvenetLines.forEach((line: string) => {
      doc.text(line, margin, yPos);
      yPos += 7;
    });
    yPos += 10;

    if (factors.length > 0) {
      addSection('A amostra desta avaliação foi tratada com os seguintes fatores:');
      factors.forEach((factor, idx) => {
        addLine(`F${idx + 1}: ${factor.name}`);
      });
      yPos += 10;
    }

    addSection('Imóveis amostrados para comparação:');
    const validComparables = comparables.filter(c => c.area > 0 && c.value > 0);
    validComparables.forEach((comp, idx) => {
      addLine(`Imóvel ${idx + 1}:`, 12, 'left', true);
      addLine(comp.description || 'Descrição não informada');
      addLine(`Área: ${formatNumber(comp.area)}m²`);
      addLine(`Valor: ${formatCurrency(comp.value)}`);
      const valuePerSqm = comp.value / comp.area;
      addLine(`Valor por metro quadrado: ${formatCurrency(valuePerSqm)}`);
      
      if (factors.length > 0) {
        factors.forEach((factor) => {
          const factorValue = comp.factors.find(f => f.factorId === factor.id)?.value || 1;
          addLine(`Fator de homogeneização ${factor.name}: ${formatNumber(factorValue, 2)}`);
        });
      }
      yPos += 5;
    });

    if (yPos > pageHeight - 60) {
      doc.addPage();
      yPos = margin;
    }

    addSection('Tabela de homogeneização:');
    const tableHeaders = ['Imóvel', 'R$/m²', ...factors.map((_, i) => `F${i + 1}`), 'R$/m² homog.'];
    const colWidth = contentWidth / tableHeaders.length;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    tableHeaders.forEach((header, i) => {
      doc.text(header, margin + i * colWidth + 2, yPos);
    });
    yPos += 8;

    doc.setFont('helvetica', 'normal');
    validComparables.forEach((comp, idx) => {
      const valuePerSqm = comp.value / comp.area;
      let homogenizedValue = valuePerSqm;
      factors.forEach((factor) => {
        const factorValue = comp.factors.find(f => f.factorId === factor.id)?.value || 1;
        homogenizedValue *= factorValue;
      });
      
      const rowData = [
        `${idx + 1}`,
        formatNumber(valuePerSqm, 2),
        ...factors.map((f) => formatNumber(comp.factors.find(cf => cf.factorId === f.id)?.value || 1, 2)),
        formatNumber(homogenizedValue, 2)
      ];
      
      rowData.forEach((data, i) => {
        doc.text(data, margin + i * colWidth + 2, yPos);
      });
      yPos += 7;
    });
    yPos += 10;

    const xiValues = validComparables.map(c => {
      let value = c.value / c.area;
      factors.forEach(f => {
        value *= c.factors.find(cf => cf.factorId === f.id)?.value || 1;
      });
      return value;
    });

    const mean = xiValues.reduce((a, b) => a + b, 0) / xiValues.length;
    const stdDev = Math.sqrt(xiValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (xiValues.length - 1));

    addSection('Valores homogeneizados (Xi), em R$/m²:');
    addLine('Média:', 12, 'left', true);
    addLine('X = ∑(Xi)/n');
    addLine(`X = ${formatNumber(mean, 2)}`);
    yPos += 5;

    addLine('Desvio padrão:', 12, 'left', true);
    addLine('S = √(∑(X - Xi)²)/(n-1)');
    addLine(`S = ${formatNumber(stdDev, 2)}`);
    yPos += 10;

    addSection('Verificação dos valores pelo Critério Excludente de Chauvenet:');
    const chauvenetDesc = 'O quociente entre o desvio (d) de cada amostra e o desvio padrão deve ser menor que o valor crítico (VC), fornecido pela tabela de Chauvenet.\nOu seja:\nd = |Xi - X|/S < VC';
    const descLines = doc.splitTextToSize(chauvenetDesc, contentWidth);
    descLines.forEach((line: string) => {
      doc.text(line, margin, yPos);
      yPos += 7;
    });
    yPos += 5;

    const chauvenetCriticalValues: { [key: number]: number } = {
      3: 1.38, 4: 1.53, 5: 1.65, 6: 1.73, 7: 1.80, 8: 1.86, 9: 1.92, 10: 1.96
    };
    const vc = chauvenetCriticalValues[validComparables.length] || 1.5;

    addLine(`Valor crítico para ${validComparables.length} amostras, pela Tabela de Chauvenet: VC = ${formatNumber(vc, 2)}`);
    yPos += 5;

    xiValues.forEach((xi, idx) => {
      const d = Math.abs(xi - mean) / stdDev;
      const isPertinent = d < vc;
      addLine(`Amostra ${idx + 1}: d = |${formatNumber(xi, 2)} - ${formatNumber(mean, 2)}| / ${formatNumber(stdDev, 2)} = ${formatNumber(d, 2)} ${isPertinent ? '<' : '>'} ${formatNumber(vc, 2)} ${isPertinent ? '(amostra pertinente)' : '(amostra excluída)'}`);
    });
    yPos += 10;

    addSection('Cálculo da amplitude do intervalo de confiança:');
    const confText = 'Os limites do intervalo de confiança (Li e Ls) são os extremos dentro dos quais, teoricamente, um valor tem 80% de chance de se encontrar.\nEles são determinados pelas fórmulas:\nLi = X - tc x S/√(n-1)\nLs = X + tc x S/√(n-1)';
    const confLines = doc.splitTextToSize(confText, contentWidth);
    confLines.forEach((line: string) => {
      doc.text(line, margin, yPos);
      yPos += 7;
    });
    yPos += 5;

    const tcValues: { [key: number]: number } = {
      2: 1.886, 3: 1.638, 4: 1.533, 5: 1.476, 6: 1.440, 7: 1.415, 8: 1.397, 9: 1.383
    };
    const tc = tcValues[validComparables.length - 1] || 1.4;
    const li = mean - tc * stdDev / Math.sqrt(validComparables.length - 1);
    const ls = mean + tc * stdDev / Math.sqrt(validComparables.length - 1);

    addLine('Limite inferior do intervalo de confiança (Li):');
    addLine(`Li = ${formatNumber(mean, 2)} - ${formatNumber(tc, 2)} x ${formatNumber(stdDev, 2)}/√(${validComparables.length} - 1) = ${formatNumber(li, 2)}`);
    yPos += 5;

    addLine('Limite superior do intervalo de confiança (Ls):');
    addLine(`Ls = ${formatNumber(mean, 2)} + ${formatNumber(tc, 2)} x ${formatNumber(stdDev, 2)}/√(${validComparables.length} - 1) = ${formatNumber(ls, 2)}`);
    yPos += 10;

    addSection('Cálculo do campo de arbítrio:');
    const arbText = 'Considerando-se a grande dilatação do intervalo de confiança, o campo de arbítrio será estipulado em aproximadamente 10% em torno da média.';
    const arbLines = doc.splitTextToSize(arbText, contentWidth);
    arbLines.forEach((line: string) => {
      doc.text(line, margin, yPos);
      yPos += 7;
    });
    yPos += 5;

    const arbLower = mean * 0.9;
    const arbUpper = mean * 1.1;
    addLine(`Campo de arbítrio: de ${formatCurrency(arbLower)} a ${formatCurrency(arbUpper)}`);
    yPos += 10;

    addSection('Resultado final:');
    addLine('Valor final = Valor unitário x área');
    if (result) {
      addLine(`Valor final = ${formatCurrency(result.valuePerSqm)} x ${formatNumber(targetProperty.area)} = ${formatCurrency(result.estimatedValue)}`);
      yPos += 10;
      addLine(`Valor do imóvel avaliando: ${formatCurrency(result.estimatedValue)}`, 14, 'center', true);
    }

    const fileName = `avalialaudo-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  if (step === 'setup') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CalcIcon className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">AVALIALAUDO</h2>
            <p className="text-gray-500">Configure os parâmetros para sua avaliação</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de imóveis comparáveis
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={numComparables}
                onChange={(e) => setNumComparables(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
              <p className="text-sm text-gray-500 mt-1">Recomendado: 3 a 5 imóveis</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de fatores de homogeneização
              </label>
              <input
                type="number"
                min="0"
                max="10"
                value={numFactors}
                onChange={(e) => setNumFactors(Math.max(0, Math.min(10, parseInt(e.target.value) || 0)))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
              <p className="text-sm text-gray-500 mt-1">Ex: localização, estado, acabamento...</p>
            </div>

            <button
              onClick={initializeFactors}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-4 rounded-lg font-semibold text-lg hover:opacity-90 transition"
            >
              Continuar
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'data') {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Home className="w-6 h-6 text-blue-500" />
            Imóvel a Avaliar
          </h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
              <textarea
                value={targetProperty.description}
                onChange={(e) => setTargetProperty(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                rows={3}
                placeholder="Ex: Apartamento 3 quartos, Vila Mariana"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Ruler className="w-4 h-4 inline mr-1" />
                Área (m²)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={targetProperty.area || ''}
                onChange={(e) => setTargetProperty(prev => ({ ...prev, area: parseFloat(e.target.value) || 0 }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="Ex: 75.5"
              />
            </div>
          </div>
        </div>

        {factors.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Fatores de Homogeneização</h3>
            <p className="text-sm text-gray-500 mb-4">
              Os fatores variam de 0.5 a 1.5. Valor 1 = padrão.
            </p>
            
            <div className="space-y-4">
              {factors.map((factor) => (
                <div key={factor.id} className="flex items-center gap-4">
                  <input
                    type="text"
                    value={factor.name}
                    onChange={(e) => updateFactorName(factor.id, e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="Nome do fator"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-green-500" />
            Imóveis Comparáveis
          </h3>
          
          <div className="space-y-8">
            {comparables.map((comp, idx) => (
              <div key={comp.id} className="border-t pt-6 first:border-t-0 first:pt-0">
                <h4 className="font-semibold text-gray-700 mb-4">Imóvel Comparável {idx + 1}</h4>
                
                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                    <input
                      type="text"
                      value={comp.description}
                      onChange={(e) => updateComparable(comp.id, 'description', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                      placeholder="Descrição"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Área (m²)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={comp.area || ''}
                      onChange={(e) => updateComparable(comp.id, 'area', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                      placeholder="Área"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <DollarSign className="w-4 h-4 inline mr-1" />
                      Valor (R$)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={comp.value || ''}
                      onChange={(e) => updateComparable(comp.id, 'value', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                      placeholder="Valor"
                    />
                  </div>
                </div>

                {factors.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-700 mb-3">Fatores para este imóvel:</p>
                    <div className="flex flex-wrap gap-4">
                      {factors.map((factor) => (
                        <div key={factor.id} className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">{factor.name}:</span>
                          <input
                            type="number"
                            min="0.5"
                            max="1.5"
                            step="0.05"
                            value={comp.factors.find(f => f.factorId === factor.id)?.value || 1}
                            onChange={(e) => updateComparableFactor(comp.id, factor.id, parseFloat(e.target.value) || 1)}
                            className="w-20 px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => setStep('setup')}
            className="flex-1 bg-gray-200 text-gray-700 py-4 rounded-lg font-semibold hover:bg-gray-300 transition"
          >
            Voltar
          </button>
          <button
            onClick={calculateAppraisal}
            className="flex-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-4 px-8 rounded-lg font-semibold text-lg hover:opacity-90 transition flex items-center justify-center gap-2"
          >
            <CalcIcon className="w-5 h-5" />
            Calcular Avaliação
          </button>
        </div>
      </div>
    );
  }

  if (step === 'result' && result) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl shadow-xl p-8 text-white">
          <div className="text-center">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Valor Estimado do Imóvel</h2>
            <p className="text-white/80 mb-6">Avaliação concluída com sucesso</p>
            
            <div className="text-5xl font-bold mb-2">
              {formatCurrency(result.estimatedValue)}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="font-bold text-gray-800 mb-4">Estatísticas da Amostra</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Valor médio por m²:</span>
                <span className="font-semibold">{formatCurrency(result.averageValuePerSqm)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Valor mediano por m²:</span>
                <span className="font-semibold">{formatCurrency(result.medianValuePerSqm)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Imóveis utilizados:</span>
                <span className="font-semibold text-green-600">{result.usedComparables.length}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="font-bold text-gray-800 mb-4">Critério de Chauvenet</h3>
            <p className="text-sm text-gray-500 mb-4">
              Valores discrepantes foram automaticamente excluídos da amostra.
            </p>
            {result.excludedComparables.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm font-medium text-orange-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  Imóveis excluídos:
                </p>
                <ul className="text-sm text-gray-600 space-y-1">
                  {result.excludedComparables.map((name, i) => (
                    <li key={i}>• {name || `Imóvel ${i + 1}`}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-sm text-green-600">Nenhum valor discrepante encontrado</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="font-bold text-gray-800 mb-4">Imóvel Avaliado</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600">
                <span className="font-medium">Descrição:</span> {targetProperty.description || 'Não informado'}
              </p>
            </div>
            <div>
              <p className="text-gray-600">
                <span className="font-medium">Área:</span> {targetProperty.area} m²
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={resetCalculator}
            className="flex-1 bg-gray-200 text-gray-700 py-4 rounded-lg font-semibold hover:bg-gray-300 transition"
          >
            Nova Avaliação
          </button>
          <button
            onClick={() => window.print()}
            className="flex-1 bg-blue-500 text-white py-4 rounded-lg font-semibold hover:bg-blue-600 transition"
          >
            Imprimir Relatório
          </button>
          <button
            onClick={generatePDF}
            className="flex-1 bg-emerald-500 text-white py-4 rounded-lg font-semibold hover:bg-emerald-600 transition flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            Baixar PDF
          </button>
        </div>
      </div>
    );
  }

  return null;
};
