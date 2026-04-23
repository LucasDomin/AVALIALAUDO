import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useCalculationStore } from '../store/calculationStore';
import { AppraisalCalculation } from '../types';
import { Calendar, DollarSign, FileText, Download, Eye, TrendingUp } from 'lucide-react';

export const History = () => {
  const { user } = useAuthStore();
  const { getUserCalculations } = useCalculationStore();
  const [selectedCalculation, setSelectedCalculation] = useState<AppraisalCalculation | null>(null);

  const calculations = user ? getUserCalculations(user.id) : [];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);

  const downloadAsJSON = (calculation: AppraisalCalculation) => {
    const dataStr = JSON.stringify(calculation, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `avalialaudo-${calculation.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (calculations.length === 0) {
    return (
      <div className="bg-gray-100 border border-gray-300 p-6 text-center">
        <FileText className="w-10 h-10 text-gray-500 mx-auto mb-3" />
        <h3 className="text-blue-900 text-xl font-bold uppercase mb-2">
          NENHUM CÁLCULO REGISTRADO
        </h3>
        <p className="text-gray-700">
          Você ainda não realizou avaliações de imóvel.
          Os resultados aparecerão automaticamente aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">

      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-gray-300 pb-3">
        <h2 className="text-blue-900 text-2xl font-bold flex items-center gap-2 uppercase">
          <TrendingUp className="w-6 h-6 text-orange-500" />
          MEUS CÁLCULOS
        </h2>
        <span className="text-gray-600 text-sm">
          Últimos {calculations.length}
        </span>
      </div>

      {/* LISTA */}
      <div className="space-y-3">
        {calculations.map((calc) => (
          <div
            key={calc.id}
            className="border border-gray-300 bg-gray-100 p-4"
          >
            <div className="flex justify-between gap-4">

              {/* INFO */}
              <div className="flex-1">
                <div className="text-gray-600 text-sm flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  {formatDate(calc.createdAt)}
                </div>

                <p className="text-gray-800 mb-1">
                  <span className="font-bold uppercase text-gray-900">IMÓVEL:</span>{' '}
                  {calc.targetProperty.description}
                </p>

                <p className="text-gray-600 text-sm mb-2">
                  Área: {calc.targetProperty.area} m² | Comparáveis: {calc.comparables.length}
                </p>

                <p className="text-green-700 text-xl font-bold">
                  {formatCurrency(calc.result.estimatedValue)}
                </p>
              </div>

              {/* AÇÕES */}
              <div className="flex flex-col gap-2">

                <button
                  onClick={() => setSelectedCalculation(calc)}
                  className="text-orange-600 font-bold uppercase text-sm border border-orange-500 px-3 py-1"
                >
                  VER DETALHES
                </button>

                <button
                  onClick={() => downloadAsJSON(calc)}
                  className="text-blue-900 font-bold uppercase text-sm border border-blue-900 px-3 py-1"
                >
                  DOWNLOAD JSON
                </button>

              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL */}
      {selectedCalculation && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4">

          <div className="bg-gray-100 border border-gray-300 max-w-2xl w-full p-6">

            <div className="flex justify-between mb-4 border-b border-gray-300 pb-2">
              <h3 className="text-blue-900 font-bold uppercase">
                DETALHES DA AVALIAÇÃO
              </h3>

              <button
                onClick={() => setSelectedCalculation(null)}
                className="text-gray-600 font-bold"
              >
                FECHAR
              </button>
            </div>

            <div className="space-y-4 text-gray-700">

              <div>
                <p className="font-bold uppercase text-gray-900">IMÓVEL</p>
                <p>{selectedCalculation.targetProperty.description}</p>
                <p>{selectedCalculation.targetProperty.area} m²</p>
              </div>

              <div>
                <p className="font-bold uppercase text-gray-900">VALOR FINAL</p>
                <p className="text-green-700 font-bold text-xl">
                  {formatCurrency(selectedCalculation.result.estimatedValue)}
                </p>
              </div>

              <div>
                <p className="font-bold uppercase text-gray-900">
                  COMPARÁVEIS
                </p>

                <ul className="list-disc pl-5">
                  {selectedCalculation.comparables.map((c, i) => (
                    <li key={c.id}>
                      {i + 1}. {c.description} — {formatCurrency(c.value)}
                    </li>
                  ))}
                </ul>
              </div>

            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => downloadAsJSON(selectedCalculation)}
                className="bg-orange-500 text-white font-bold uppercase px-4 py-2"
              >
                DOWNLOAD JSON
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};