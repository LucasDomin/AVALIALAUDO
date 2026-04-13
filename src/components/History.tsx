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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const downloadAsJSON = (calculation: AppraisalCalculation) => {
    const dataStr = JSON.stringify(calculation, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `avalialaudo-${calculation.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (calculations.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Nenhum cálculo ainda</h3>
        <p className="text-gray-500">
          Você ainda não realizou nenhuma avaliação de imóvel.
          <br />
          Os seus cálculos aparecerão aqui automaticamente.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <TrendingUp className="w-6 h-6" />
          Meus Cálculos
        </h2>
        <span className="text-sm text-gray-500">
          Últimos {calculations.length} cálculos
        </span>
      </div>

      <div className="grid gap-4">
        {calculations.map((calc) => (
          <div
            key={calc.id}
            className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                  <Calendar className="w-4 h-4" />
                  {formatDate(calc.createdAt)}
                </div>
                <p className="text-gray-700 mb-2">
                  <span className="font-medium">Imóvel:</span> {calc.targetProperty.description}
                </p>
                <p className="text-gray-600 text-sm mb-3">
                  Área: {calc.targetProperty.area} m² | {calc.comparables.length} imóveis comparáveis
                </p>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-500" />
                  <span className="text-xl font-bold text-green-600">
                    {formatCurrency(calc.result.estimatedValue)}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => setSelectedCalculation(calc)}
                  className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition"
                  title="Ver detalhes"
                >
                  <Eye className="w-5 h-5" />
                </button>
                <button
                  onClick={() => downloadAsJSON(calc)}
                  className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition"
                  title="Baixar JSON"
                >
                  <Download className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de detalhes */}
      {selectedCalculation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">Detalhes da Avaliação</h3>
              <button
                onClick={() => setSelectedCalculation(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-700 mb-3">Imóvel Avaliado</h4>
                <p className="text-gray-600">
                  <span className="font-medium">Descrição:</span> {selectedCalculation.targetProperty.description}
                </p>
                <p className="text-gray-600">
                  <span className="font-medium">Área:</span> {selectedCalculation.targetProperty.area} m²
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-700 mb-3">Resultado Final</h4>
                <p className="text-2xl font-bold text-green-600 mb-2">
                  {formatCurrency(selectedCalculation.result.estimatedValue)}
                </p>
                <p className="text-gray-600">
                  Valor por m²: {formatCurrency(selectedCalculation.result.valuePerSqm)}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-700 mb-3">Imóveis Comparáveis Utilizados</h4>
                <ul className="space-y-2">
                  {selectedCalculation.comparables.map((comp, idx) => (
                    <li key={comp.id} className="text-gray-600">
                      {idx + 1}. {comp.description} - {formatCurrency(comp.value)}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => downloadAsJSON(selectedCalculation)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Baixar JSON
              </button>
              <button
                onClick={() => setSelectedCalculation(null)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
