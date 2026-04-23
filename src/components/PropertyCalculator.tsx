import { useState } from 'react';
import jsPDF from 'jspdf';
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle,
} from 'docx';
import { saveAs } from 'file-saver';
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
        factors: newFactors.map(f => ({ factorId: f.id, value: 1 })),
      }))
    );

    setStep('data');
  };

  const calculateAppraisal = () => {
    const valid = comparables.filter(c => c.area > 0 && c.value > 0);
    if (!valid.length) return alert('PREENCHA OS DADOS CORRETAMENTE');

    const values = valid.map(c => c.value / c.area);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;

    const estimated = avg * targetProperty.area;

    const final = {
      estimatedValue: estimated,
      valuePerSqm: avg,
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

  return (
    <div className="flex min-h-screen bg-gray-100 text-gray-800">

      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-gray-300 p-6">
        <h1 className="text-blue-900 font-bold text-lg mb-8">
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
                <label className="text-sm font-semibold uppercase text-gray-700">
                  Imóveis comparáveis
                </label>
                <input
                  type="number"
                  value={numComparables}
                  onChange={e => setNumComparables(+e.target.value)}
                  className="w-full border border-gray-400 p-2 mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-semibold uppercase text-gray-700">
                  Fatores
                </label>
                <input
                  type="number"
                  value={numFactors}
                  onChange={e => setNumFactors(+e.target.value)}
                  className="w-full border border-gray-400 p-2 mt-1"
                />
              </div>

              <button
                onClick={initializeFactors}
                className="bg-orange-600 text-white px-6 py-3 uppercase font-bold"
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

              <div>
                <label className="uppercase text-sm font-bold">Descrição do imóvel</label>
                <textarea
                  className="w-full border border-gray-400 p-2 mt-1"
                  value={targetProperty.description}
                  onChange={e =>
                    setTargetProperty({ ...targetProperty, description: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="uppercase text-sm font-bold">Área (m²)</label>
                <input
                  type="number"
                  className="w-full border border-gray-400 p-2 mt-1"
                  value={targetProperty.area}
                  onChange={e =>
                    setTargetProperty({ ...targetProperty, area: +e.target.value })
                  }
                />
              </div>

              <button
                onClick={calculateAppraisal}
                className="bg-orange-600 text-white px-6 py-3 uppercase font-bold"
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

            <div className="border border-gray-400 p-6 max-w-xl">

              <p className="uppercase font-bold text-sm text-gray-700">
                Valor estimado
              </p>

              <p className="text-3xl font-bold text-orange-600 mt-2">
                R$ {result.estimatedValue.toFixed(2)}
              </p>

              <p className="mt-4 text-sm text-gray-600">
                Valor por m²: R$ {result.valuePerSqm.toFixed(2)}
              </p>

            </div>

            <div className="mt-6 flex gap-4">
              <button
                onClick={() => setStep('setup')}
                className="border border-gray-500 px-4 py-2 uppercase"
              >
                NOVO CÁLCULO
              </button>

              <button
                onClick={() => window.print()}
                className="bg-orange-600 text-white px-4 py-2 uppercase font-bold"
              >
                IMPRIMIR
              </button>

              <button
                onClick={() => {}}
                className="bg-orange-600 text-white px-4 py-2 uppercase font-bold flex items-center gap-2"
              >
                <Download size={16} />
                PDF
              </button>

              <button
                className="bg-orange-600 text-white px-4 py-2 uppercase font-bold flex items-center gap-2"
              >
                <FileType2 size={16} />
                WORD
              </button>
            </div>

          </div>
        )}

      </main>
    </div>
  );
};