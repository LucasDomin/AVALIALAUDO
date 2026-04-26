import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useCalculationStore } from '../store/calculationStore';
import { Factor, ComparableProperty, TargetProperty } from '../types';
import { Download, FileType2 } from 'lucide-react';

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
  const [result, setResult] = useState<any>(null);

  const initializeFactors = () => {
    const newFactors: Factor[] = Array.from({ length: numFactors }, (_, i) => ({
      id: `factor-${i}`,
      name: `FATOR ${i + 1}`,
      weight: 1,
    }));

    setFactors(newFactors);

    setComparables(
      Array.from({ length: numComparables }, (_, i) => ({
        id: `comp-${i}`,
        description: '',
        area: 0,
        value: 0,
        factors: newFactors.map(f => ({
          factorId: f.id,
          value: 1,
        })),
      }))
    );

    setStep('data');
  };

  // ==============================
  // CÁLCULO (CHAUVENET SIMPLIFICADO + FATORES)
  // ==============================
  const calculateAppraisal = () => {
    const valid = comparables.filter(c => c.area > 0 && c.value > 0);

    if (!valid.length) {
      alert('PREENCHA OS DADOS CORRETAMENTE');
      return;
    }

    // valor por m² com fatores
    const normalized = valid.map(c => {
      const base = c.value / c.area;

      const factorMultiplier =
        c.factors?.reduce((acc, f) => acc * (f.value || 1), 1) || 1;

      return base * factorMultiplier;
    });

    // média
    const mean =
      normalized.reduce((a, b) => a + b, 0) / normalized.length;

    // desvio padrão
    const variance =
      normalized.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) /
      normalized.length;

    const stdDev = Math.sqrt(variance);

    // filtro tipo Chauvenet (simplificado)
    const filtered = normalized.filter(v => {
      const deviation = Math.abs(v - mean) / stdDev;
      return deviation <= 2;
    });

    const finalValues = filtered.length ? filtered : normalized;

    // média final
    const finalMean =
      finalValues.reduce((a, b) => a + b, 0) / finalValues.length;

    const estimated = finalMean * targetProperty.area;

    const final = {
      estimatedValue: estimated,
      valuePerSqm: finalMean,
    };

    setResult(final);

    addCalculation({
      userId: user!.id,
      targetProperty,
      comparables: valid,
      factors,
      result: final,
    });

    setStep('result');
  };

  // ==============================
  // UI
  // ==============================
  return (
    <div className="flex min-h-screen bg-gray-100 text-gray-800">

      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r p-6">
        <h1 className="font-bold text-lg text-blue-900 mb-8">
          AVALIALAUDO
        </h1>

        <nav className="flex flex-col gap-4 text-sm font-semibold">
          <button onClick={() => setStep('setup')} className="text-left uppercase text-orange-600">
            CONFIGURAÇÃO
          </button>
          <button onClick={() => setStep('data')} className="text-left uppercase text-orange-600">
            DADOS
          </button>
          <button onClick={() => setStep('result')} className="text-left uppercase text-orange-600">
            RESULTADO
          </button>
        </nav>
      </aside>

      {/* CONTEÚDO */}
      <main className="flex-1 p-10">

        {/* SETUP */}
        {step === 'setup' && (
          <div>
            <h2 className="text-blue-900 text-2xl font-bold mb-6">
              CONFIGURAÇÃO DO CÁLCULO
            </h2>

            <div className="space-y-6 max-w-xl">

              <div>
                <label>Imóveis comparáveis</label>
                <input
                  type="number"
                  value={numComparables}
                  onChange={e => setNumComparables(+e.target.value)}
                  className="w-full border p-2"
                />
              </div>

              <div>
                <label>Fatores</label>
                <input
                  type="number"
                  value={numFactors}
                  onChange={e => setNumFactors(+e.target.value)}
                  className="w-full border p-2"
                />
              </div>

              <button
                onClick={initializeFactors}
                className="bg-orange-600 text-white px-6 py-3 font-bold"
              >
                CONTINUAR
              </button>

            </div>
          </div>
        )}

        {/* DATA */}
        {step === 'data' && (
          <div>
            <h2 className="text-blue-900 text-2xl font-bold mb-6">
              INSERÇÃO DE DADOS
            </h2>

            <div className="space-y-6 max-w-3xl">

              <textarea
                placeholder="Descrição do imóvel"
                value={targetProperty.description}
                onChange={e =>
                  setTargetProperty({
                    ...targetProperty,
                    description: e.target.value,
                  })
                }
                className="w-full border p-2"
              />

              <input
                type="number"
                placeholder="Área"
                value={targetProperty.area}
                onChange={e =>
                  setTargetProperty({
                    ...targetProperty,
                    area: +e.target.value,
                  })
                }
                className="w-full border p-2"
              />

              <button
                onClick={calculateAppraisal}
                className="bg-orange-600 text-white px-6 py-3 font-bold"
              >
                CALCULAR
              </button>

            </div>
          </div>
        )}

        {/* RESULTADO */}
        {step === 'result' && result && (
          <div>
            <h2 className="text-blue-900 text-2xl font-bold mb-6">
              RESULTADO
            </h2>

            <div className="border p-6 max-w-xl">
              <p className="font-bold">Valor estimado</p>

              <p className="text-3xl text-orange-600 font-bold">
                R$ {result.estimatedValue.toFixed(2)}
              </p>

              <p className="mt-4">
                Valor por m²: R$ {result.valuePerSqm.toFixed(2)}
              </p>
            </div>

            <div className="mt-6 flex gap-4">
              <button onClick={() => setStep('setup')}>
                NOVO CÁLCULO
              </button>

              <button onClick={() => window.print()}>
                IMPRIMIR
              </button>

              <button>
                <Download size={16} /> PDF
              </button>

              <button>
                <FileType2 size={16} /> WORD
              </button>
            </div>

          </div>
        )}

      </main>
    </div>
  );
};