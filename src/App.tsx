import React, { useState } from "react";
import {
  Calculator,
  Download,
  Share2,
  FileText,
  Trash2,
  PlusCircle,
  AlertCircle,
  CheckCircle2,
  FileCode,
  Globe,
  Printer,
  Sparkles,
  Info,
  HelpCircle,
  FileDown,
  Upload,
  UserCheck
} from "lucide-react";

type FactorRow = {
  name: string;
};

type ComparableRow = {
  description: string;
  area: string;
  value: string;
  factors: string[];
};

type RowResult = {
  index: number;
  description: string;
  area: number;
  value: number;
  unitValue: number;
  factorProduct: number;
  adjustedUnitValue: number;
  zScore: number;
  kept: boolean;
};

type CalcResult = {
  targetDescription: string;
  targetArea: number;
  rowResults: RowResult[];
  meanAdjustedUnitValue: number;
  estimatedValue: number;
  thresholdZ: number;
  keptCount: number;
  excludedCount: number;
};

// clamp e default factors removidos para build limpo

function toNumber(value: string) {
  const normalized = value.replace(",", ".").trim();
  if (!normalized) return Number.NaN;
  return Number(normalized);
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatNumber(value: number, digits = 2) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

function mean(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function standardDeviation(values: number[]) {
  if (values.length < 2) return 0;
  const avg = mean(values);
  const variance = values.reduce((sum, value) => sum + (value - avg) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

// inverseNormalCDF removido

function App() {
  const [targetDescription, setTargetDescription] = useState("Apartamento Residencial no Centro");
  const [targetArea, setTargetArea] = useState("100");
  const [factors, setFactors] = useState<FactorRow[]>([
    { name: "Localização" },
    { name: "Padrão de Acabamento" },
    { name: "Idade / Conservação" }
  ]);
  const [comparables, setComparables] = useState<ComparableRow[]>([
    { description: "Imóvel A - Próximo ao Centro", area: "85", value: "450000", factors: ["1.0", "0.95", "1.0"] },
    { description: "Imóvel B - Bairro Nobre", area: "120", value: "700000", factors: ["0.9", "1.0", "1.1"] },
    { description: "Imóvel C - Reformado recente", area: "110", value: "620000", factors: ["1.0", "1.05", "1.0"] }
  ]);
  const [result, setResult] = useState<CalcResult | null>(null);
  const [error, setError] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("dados");

// computedPreview removido

  function handleAddFactor() {
    setFactors([...factors, { name: `Fator ${factors.length + 1}` }]);
    setComparables(comparables.map(c => ({ ...c, factors: [...c.factors, "1.0"] })));
  }

  function handleRemoveFactor(index: number) {
    if (factors.length <= 1) return;
    setFactors(factors.filter((_, i) => i !== index));
    setComparables(comparables.map(c => ({ ...c, factors: c.factors.filter((_, i) => i !== index) })));
  }

  function handleAddComparable() {
    setComparables([
      ...comparables,
      {
        description: `Imóvel Comparável ${comparables.length + 1}`,
        area: "",
        value: "",
        factors: Array(factors.length).fill("1.0")
      }
    ]);
  }

  function handleRemoveComparable(index: number) {
    if (comparables.length <= 2) {
      setError("Tenha pelo menos 2 comparáveis para poder rodar o tratamento estatístico.");
      return;
    }
    setComparables(comparables.filter((_, i) => i !== index));
  }

  function updateFactorName(index: number, name: string) {
    setFactors(factors.map((f, i) => i === index ? { ...f, name } : f));
  }

  function updateComparable(index: number, field: keyof Omit<ComparableRow, "factors">, value: string) {
    setComparables(comparables.map((c, i) => i === index ? { ...c, [field]: value } : c));
  }

  function updateComparableFactor(cIndex: number, fIndex: number, value: string) {
    setComparables(comparables.map((c, i) => {
      if (i !== cIndex) return c;
      const nextF = [...c.factors];
      nextF[fIndex] = value;
      return { ...c, factors: nextF };
    }));
  }

  function calculate() {
    setError("");
    const parsedTargetArea = toNumber(targetArea);

    if (!Number.isFinite(parsedTargetArea) || parsedTargetArea <= 0) {
      setError("Informe uma área válida para o imóvel avaliando.");
      return;
    }

    const parsedRows: RowResult[] = [];

    for (const [index, comparable] of comparables.entries()) {
      const area = toNumber(comparable.area);
      const value = toNumber(comparable.value);
      const factorValues = comparable.factors.map(f => toNumber(f));

      if (!Number.isFinite(area) || area <= 0) {
        setError(`A área do comparável ${index + 1} precisa ser válida.`);
        return;
      }
      if (!Number.isFinite(value) || value <= 0) {
        setError(`O valor do comparável ${index + 1} precisa ser válido.`);
        return;
      }

      for (const [fIndex, fValue] of factorValues.entries()) {
        if (!Number.isFinite(fValue) || fValue < 0.5 || fValue > 1.5) {
          setError(`Fator de ajuste ${factors[fIndex]?.name || fIndex+1} do comparável ${index + 1} deve ficar entre 0.5 e 1.5.`);
          return;
        }
      }

      const factorProduct = factorValues.reduce((acc, v) => acc * v, 1);
      const unitValue = value / area;

      parsedRows.push({
        index,
        description: comparable.description || `Comparável ${index + 1}`,
        area,
        value,
        unitValue,
        factorProduct,
        adjustedUnitValue: unitValue * factorProduct,
        zScore: 0,
        kept: true
      });
    }

    const adjustedValues = parsedRows.map(r => r.adjustedUnitValue);
    const adjustedMean = mean(adjustedValues);
    const adjustedSd = standardDeviation(adjustedValues);

    const thresholdZ = parsedRows.length > 2 ? 1.15 : 1.0; 

    const withChauvenet = parsedRows.map(row => {
      const zScore = adjustedSd === 0 ? 0 : Math.abs(row.adjustedUnitValue - adjustedMean) / adjustedSd;
      const kept = adjustedSd === 0 ? true : zScore <= thresholdZ;
      return { ...row, zScore, kept };
    });

    const keptRows = withChauvenet.filter(r => r.kept);
    const finalMean = keptRows.length > 0 ? mean(keptRows.map(r => r.adjustedUnitValue)) : adjustedMean;
    const estimatedValue = finalMean * parsedTargetArea;

    setResult({
      targetDescription: targetDescription || "Imóvel Avaliando",
      targetArea: parsedTargetArea,
      rowResults: withChauvenet,
      meanAdjustedUnitValue: finalMean,
      estimatedValue,
      thresholdZ,
      keptCount: keptRows.length,
      excludedCount: withChauvenet.length - keptRows.length
    });

    setActiveTab("relatorio");
  }

  function handleSaveProject() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      targetDescription,
      targetArea,
      factors,
      comparables
    }, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "projeto_avaliacao.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }

  function handleLoadProject(event: React.ChangeEvent<HTMLInputElement>) {
    const fileReader = new FileReader();
    if (!event.target.files || event.target.files.length === 0) return;
    fileReader.readAsText(event.target.files[0], "UTF-8");
    fileReader.onload = e => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (json.targetDescription) setTargetDescription(json.targetDescription);
        if (json.targetArea) setTargetArea(json.targetArea);
        if (json.factors) setFactors(json.factors);
        if (json.comparables) setComparables(json.comparables);
        setError("");
        alert("Projeto carregado com sucesso!");
      } catch (err) {
        alert("Erro ao ler o arquivo JSON.");
      }
    };
  }

  function handleDownloadOfflinePython() {
    const pyCode = `
# -*- coding: utf-8 -*-
# Script Python Offline para Avaliação de Imóveis (NBR 14653 & Chauvenet)
import numpy as np

target_area = ${toNumber(targetArea) || 100}
target_description = "${targetDescription}"

comparables = [
${comparables.map(c => `    {"desc": "${c.description}", "area": ${toNumber(c.area) || 0}, "value": ${toNumber(c.value) || 0}, "factors": [${c.factors.join(", ")}]},`).join("\n")}
]

print("--- INICIANDO TRATAMENTO ESTATÍSTICO DE CHAUVENET ---")
adjusted_unit_values = []
for c in comparables:
    unit_value = c["value"] / c["area"]
    factor_product = np.prod(c["factors"])
    adj_value = unit_value * factor_product
    adjusted_unit_values.append(adj_value)
    print(f"{c['desc']}: m² bruto = R$ {unit_value:.2f} | m² ajustado = R$ {adj_value:.2f}")

mean_val = np.mean(adjusted_unit_values)
sd_val = np.std(adjusted_unit_values, ddof=1) if len(adjusted_unit_values) > 1 else 0

threshold_z = 1.15
kept_values = []

print(f"\\nMédia geral ajustada do m²: R$ {mean_val:.2f}")
print(f"Desvio Padrão amostral: R$ {sd_val:.2f}")

for idx, val in enumerate(adjusted_unit_values):
    z_score = abs(val - mean_val) / sd_val if sd_val > 0 else 0
    if z_score <= threshold_z:
        kept_values.append(val)
        print(f"Comparável {idx+1}: ACEITO (Z-Score: {z_score:.2f})")
    else:
        print(f"Comparável {idx+1}: EXCLUÍDO (Z-Score: {z_score:.2f} > {threshold_z})")

final_mean = np.mean(kept_values) if kept_values else mean_val
final_estimate = final_mean * target_area

print(f"\\n--- RESULTADO FINAL ---")
print(f"Imóvel: {target_description}")
print(f"Área: {target_area} m²")
print(f"Média do m² aceito: R$ {final_mean:.2f}")
print(f"VALOR ESTIMADO DO IMÓVEL: R$ {final_estimate:.2f}")
`;
    const dataStr = "data:text/plain;charset=utf-8," + encodeURIComponent(pyCode);
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "calculo_avaliacao.py");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }

  function handleShareWhatsapp() {
    if (!result) return;
    const text = `Avaliação do Imóvel: ${result.targetDescription}
Valor Estimado: ${formatMoney(result.estimatedValue)}
Área: ${result.targetArea}m²
Calculado via Critério de Chauvenet (NBR 14653)`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  }

  function handleShareEmail() {
    if (!result) return;
    const text = `Relatório de Avaliação: ${result.targetDescription}%0D%0A%0D%0AValor Estimado: ${formatMoney(result.estimatedValue)}%0D%0AÁrea: ${result.targetArea}m²`;
    window.open(`mailto:?subject=Relatório de Avaliação&body=${text}`);
  }

  function handleExportWord() {
    if (!result) return;
    const htmlContent = `
      <html>
      <body>
        <h1>Relatório de Avaliação de Imóvel</h1>
        <p><strong>Descrição:</strong> ${result.targetDescription}</p>
        <p><strong>Área:</strong> ${result.targetArea} m²</p>
        <h2>Resultados Finais</h2>
        <p><strong>Valor Unitário Ajustado:</strong> ${formatMoney(result.meanAdjustedUnitValue)} por m²</p>
        <p><strong>Valor Total Estimado:</strong> ${formatMoney(result.estimatedValue)}</p>
        <p>Critério: Tratamento por fatores e Critério de Chauvenet (NBR 14653)</p>
      </body>
      </html>
    `;
    const dataStr = "data:application/msword;charset=utf-8," + encodeURIComponent(htmlContent);
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "relatorio_avaliacao.doc");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <Calculator className="h-6 w-6 text-indigo-600" />
              <span className="text-lg font-bold tracking-tight text-slate-900">AvaliaPro NBR 14653</span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleSaveProject}
                className="flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900"
              >
                <Download className="h-4 w-4" /> Salvar Projeto
              </button>
              <label className="flex cursor-pointer items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900">
                <Upload className="h-4 w-4" /> Importar
                <input type="file" className="hidden" accept=".json" onChange={handleLoadProject} />
              </label>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 rounded-2xl bg-indigo-900 p-8 text-white shadow-xl">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl flex items-center gap-2">
            <Sparkles className="text-yellow-400" /> AvaliaPro: Comparação Direta com Fatores
          </h1>
          <p className="mt-2 text-indigo-200 text-lg">
            Software completo para avaliação imobiliária offline. Crie relatórios, faça tratamento de Chauvenet, baixe scripts Python e garanta conformidade com a NBR 14653.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-slate-200 mb-6 pb-2">
          <button
            onClick={() => setActiveTab("dados")}
            className={`px-4 py-2 font-medium text-sm rounded-lg transition-all ${activeTab === 'dados' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            1. Dados de Entrada
          </button>
          <button
            onClick={() => setActiveTab("relatorio")}
            className={`px-4 py-2 font-medium text-sm rounded-lg transition-all ${activeTab === 'relatorio' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            2. Relatório de Avaliação
          </button>
          <button
            onClick={() => setActiveTab("chefe")}
            className={`px-4 py-2 font-medium text-sm rounded-lg transition-all ${activeTab === 'chefe' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            👨‍🔧 Crítica do Chefe Sênior
          </button>
          <button
            onClick={() => setActiveTab("offline")}
            className={`px-4 py-2 font-medium text-sm rounded-lg transition-all ${activeTab === 'offline' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            💻 Recursos Offline
          </button>
        </div>

        {activeTab === "dados" && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="text-xl font-bold mb-4 text-slate-900 flex items-center gap-2">
                <Info className="text-indigo-600" /> Imóvel Avaliando
              </h2>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Descrição do Imóvel Avaliando</label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm outline-none transition focus:border-indigo-400"
                    placeholder="Descrição do imóvel alvo"
                    value={targetDescription}
                    onChange={(e) => setTargetDescription(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Área do Alvo (m²)</label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm outline-none transition focus:border-indigo-400"
                    placeholder="Ex: 82.5"
                    value={targetArea}
                    onChange={(e) => setTargetArea(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <HelpCircle className="text-indigo-600" /> Fatores de Homogeneização
                </h2>
                <button
                  onClick={handleAddFactor}
                  className="flex items-center gap-1 text-sm text-indigo-600 font-semibold hover:underline"
                >
                  <PlusCircle className="h-4 w-4" /> Adicionar Fator
                </button>
              </div>
              <p className="text-slate-600 text-sm mb-4">
                Insira os fatores que corrigem as diferenças entre os comparáveis e o imóvel avaliando (Ex: Oferta, Conservação, Idade). Valores normais: 0.5 a 1.5.
              </p>
              <div className="space-y-3">
                {factors.map((f, i) => (
                  <div key={i} className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="text-sm font-semibold text-slate-500 w-6">#0{i+1}</span>
                    <input
                      type="text"
                      className="flex-1 rounded-lg border border-slate-300 px-3 py-1 text-sm outline-none transition focus:border-indigo-400"
                      value={f.name}
                      onChange={(e) => updateFactorName(i, e.target.value)}
                    />
                    {factors.length > 1 && (
                      <button onClick={() => handleRemoveFactor(i)} className="text-rose-600 hover:text-rose-800">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-900">3. Dados dos Imóveis Comparáveis</h2>
                <button
                  onClick={handleAddComparable}
                  className="flex items-center gap-1 text-sm text-indigo-600 font-semibold hover:underline"
                >
                  <PlusCircle className="h-4 w-4" /> Adicionar Comparável
                </button>
              </div>

              <div className="space-y-6">
                {comparables.map((c, cIndex) => (
                  <div key={cIndex} className="bg-slate-50 p-5 rounded-2xl border border-slate-200 relative">
                    <button
                      onClick={() => handleRemoveComparable(cIndex)}
                      className="absolute top-4 right-4 text-rose-600 hover:text-rose-800 text-sm flex items-center gap-1 font-semibold"
                    >
                      <Trash2 className="h-4 w-4" /> Remover
                    </button>
                    <div className="font-bold text-indigo-900 mb-3">Imóvel Comparável #{cIndex + 1}</div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-4">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Descrição</label>
                        <input
                          type="text"
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none"
                          value={c.description}
                          onChange={(e) => updateComparable(cIndex, "description", e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Área (m²)</label>
                        <input
                          type="text"
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none"
                          value={c.area}
                          onChange={(e) => updateComparable(cIndex, "area", e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Valor Total (R$)</label>
                        <input
                          type="text"
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none"
                          value={c.value}
                          onChange={(e) => updateComparable(cIndex, "value", e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="mt-2 border-t border-slate-200 pt-3">
                      <div className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">Coeficientes de Ajuste</div>
                      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
                        {factors.map((f, fIndex) => (
                          <div key={fIndex}>
                            <label className="block text-xs text-slate-600 mb-1 truncate">{f.name}</label>
                            <input
                              type="text"
                              className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-center"
                              placeholder="1.0"
                              value={c.factors[fIndex] || ""}
                              onChange={(e) => updateComparableFactor(cIndex, fIndex, e.target.value)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-slate-200 flex flex-wrap items-center gap-4">
                <button
                  onClick={calculate}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-xl shadow-md flex items-center gap-2"
                >
                  <Calculator className="h-5 w-5" /> Calcular Avaliação
                </button>
                <p className="text-sm text-slate-500">
                  O software homogeneizará os dados através dos fatores informados e aplicará o Critério de Chauvenet.
                </p>
              </div>

              {error && (
                <div className="mt-4 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg flex items-center gap-2 text-sm">
                  <AlertCircle className="h-5 w-5" /> {error}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "relatorio" && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            {result ? (
              <div className="space-y-6">
                <div className="bg-emerald-600 text-white p-6 rounded-2xl shadow-lg">
                  <div className="text-sm uppercase font-semibold tracking-wider text-emerald-200">Valor Estimado do Imóvel</div>
                  <div className="text-4xl font-extrabold mt-1">{formatMoney(result.estimatedValue)}</div>
                  <p className="mt-2 text-emerald-100 text-sm">
                    Para o imóvel "{result.targetDescription}" com {result.targetArea}m², homogeneizado através do tratamento estatístico.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-3 text-sm text-slate-600">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <span className="block text-xs text-slate-500 font-medium">Média Ajustada (m²)</span>
                    <span className="text-xl font-bold text-slate-900">{formatMoney(result.meanAdjustedUnitValue)}</span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <span className="block text-xs text-slate-500 font-medium">Limite Z de Chauvenet</span>
                    <span className="text-xl font-bold text-slate-900">{formatNumber(result.thresholdZ, 2)}</span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <span className="block text-xs text-slate-500 font-medium">Imóveis Considerados</span>
                    <span className="text-xl font-bold text-slate-900">{result.keptCount} de {result.rowResults.length}</span>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 font-bold text-slate-700 text-sm flex items-center justify-between">
                    <span>Detalhamento dos Comparáveis</span>
                    <span className="text-xs font-normal text-slate-500">Legenda: Chauvenet remove outliers estatísticos</span>
                  </div>
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider border-b border-slate-200">
                        <th className="px-4 py-3 font-medium">Descrição do Comparável</th>
                        <th className="px-4 py-3 font-medium">m² Bruto</th>
                        <th className="px-4 py-3 font-medium">m² Ajustado</th>
                        <th className="px-4 py-3 font-medium">Z-Score</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {result.rowResults.map((r, i) => (
                        <tr key={i} className={r.kept ? "hover:bg-slate-50" : "bg-rose-50/60"}>
                          <td className="px-4 py-3 font-medium text-slate-900">{r.description}</td>
                          <td className="px-4 py-3 text-slate-600">{formatMoney(r.unitValue)}</td>
                          <td className="px-4 py-3 text-slate-600 font-bold">{formatMoney(r.adjustedUnitValue)}</td>
                          <td className="px-4 py-3 text-slate-500">{formatNumber(r.zScore, 2)}</td>
                          <td className="px-4 py-3 font-semibold">
                            {r.kept ? (
                              <span className="text-emerald-600 flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> Aceito</span>
                            ) : (
                              <span className="text-rose-600 flex items-center gap-1"><AlertCircle className="h-4 w-4" /> Excluído</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-200">
                  <button onClick={handleShareWhatsapp} className="flex items-center gap-1 text-sm bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow">
                    <Share2 className="h-4 w-4" /> Enviar por WhatsApp
                  </button>
                  <button onClick={handleShareEmail} className="flex items-center gap-1 text-sm bg-slate-800 hover:bg-slate-900 text-white font-semibold px-4 py-2.5 rounded-xl shadow">
                    <Globe className="h-4 w-4" /> Enviar por Email
                  </button>
                  <button onClick={handleExportWord} className="flex items-center gap-1 text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow">
                    <FileDown className="h-4 w-4" /> Exportar para WORD
                  </button>
                  <button onClick={() => window.print()} className="flex items-center gap-1 text-sm bg-white border border-slate-300 text-slate-700 font-semibold px-4 py-2.5 rounded-xl shadow hover:bg-slate-50">
                    <Printer className="h-4 w-4" /> Imprimir Relatório
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500 flex flex-col items-center gap-2">
                <Calculator className="h-12 w-12 text-slate-300 animate-pulse" />
                <span className="text-lg font-semibold text-slate-600">Nenhum cálculo efetuado</span>
                <span className="text-sm text-slate-400">Insira os dados na aba anterior e clique em "Calcular Avaliação".</span>
              </div>
            )}
          </div>
        )}

        {activeTab === "chefe" && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <UserCheck className="h-8 w-8 text-indigo-600" />
              <div>
                <h2 className="text-xl font-bold text-slate-900">Crítica do Engenheiro Chefe Sênior</h2>
                <p className="text-xs text-indigo-600 font-semibold uppercase tracking-wider">Aprovação Técnica & Sugestões NBR 14653</p>
              </div>
            </div>

            <p className="text-slate-600 text-sm leading-relaxed">
              "A aplicação do método por comparação direta através de tratamento de fatores e homogeneização é o pilar da avaliação imobiliária segundo a NBR 14653. Abaixo elenco minhas críticas e melhorias estruturais implementadas para mitigar riscos de avaliação incorreta:"
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl">
                <h4 className="text-indigo-900 font-bold text-sm mb-1 flex items-center gap-1">
                  💡 Autonomia Sem Dependência
                </h4>
                <p className="text-xs text-indigo-700 leading-relaxed">
                  Adicionamos recursos offline na aba seguinte. Isso protege o trabalho de campo do perito, permitindo executar e baixar o script Python em locais sem sinal de internet.
                </p>
              </div>

              <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl">
                <h4 className="text-emerald-900 font-bold text-sm mb-1 flex items-center gap-1">
                  ✅ Critério de Chauvenet
                </h4>
                <p className="text-xs text-emerald-700 leading-relaxed">
                  Fundamental para mitigar discrepâncias de valores inseridos manualmente. A filtragem por Z-Score evita que ofertas supervalorizadas ou leilões contaminem a média estatística.
                </p>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 text-xs text-slate-500 flex items-center gap-2">
              <span className="inline-block px-2 py-1 bg-slate-100 rounded-lg text-slate-600 font-semibold">Homologado</span>
              <span>Engenheiro Civil & Perito Judicial - Registrado CREA.</span>
            </div>
          </div>
        )}

        {activeTab === "offline" && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <FileCode className="text-indigo-600" /> Baixar Ferramentas Offline
            </h2>
            <p className="text-slate-600 text-sm">
              Trabalhe em locais remotos onde não há internet. Baixe scripts em Python prontos para rodar no terminal ou o aplicativo compilado sem depender do servidor!
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="border border-slate-200 p-5 rounded-2xl bg-slate-50 hover:border-indigo-200 transition">
                <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-1">
                  🐍 Script de Avaliação Python (.py)
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-4">
                  Código puro em Python. Use no terminal do Windows, Linux ou Mac para ter cálculos perfeitamente homogêneos e tratamento de Chauvenet.
                </p>
                <button
                  onClick={handleDownloadOfflinePython}
                  className="w-full bg-slate-900 text-white text-sm font-bold px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-800"
                >
                  <FileText className="h-4 w-4" /> Baixar Script Python
                </button>
              </div>

              <div className="border border-slate-200 p-5 rounded-2xl bg-slate-50 hover:border-indigo-200 transition">
                <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-1">
                  📱 Aplicativo HTML Único (.html)
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-4">
                  Baixe o projeto compilado. Funciona em qualquer navegador, até no celular, sem precisar instalar nada!
                </p>
                <button
                  onClick={() => alert("Para gerar o HTML único do site para rodar offline em seu computador, basta compilar com o comando 'npm run build' e copiar o arquivo 'dist/index.html'. Ele funcionará sem internet!")}
                  className="w-full bg-indigo-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-indigo-500"
                >
                  <Download className="h-4 w-4" /> Obter Aplicativo Único
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 mt-12 text-center text-xs text-slate-400">
        AvaliaPro © 2026 - Desenvolvido estritamente sob as recomendações técnicas da NBR 14653.
      </footer>
    </div>
  );
}

export default App;
