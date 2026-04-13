const BRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function App() {
  const valorMedio = 6101
  const valorMediano = 6203
  const area = 81
  const valorTotal = 154323

  return (
    <div className="min-h-screen">
      {/* HEADER - ALTERAÇÃO 1: AVALIALAUDO */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 grid place-items-center text-white">⌂</div>
            <span className="font-bold text-lg text-slate-800">AVALIALAUDO</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-600">
            <button className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700">Calculadora</button>
            <span>Histórico</span>
            <div className="w-8 h-8 rounded-full bg-blue-600"></div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 md:p-6 space-y-4">
        {/* CARD VERDE - ALTERAÇÃO 3: VALOR POR M² REMOVIDO */}
        <div className="bg-green-500 text-white rounded-2xl p-8 text-center shadow-lg">
          <h1 className="text-2xl font-semibold">Valor Estimado do Imóvel</h1>
          <p className="opacity-90 mt-1">Avaliação concluída com sucesso</p>
          <p className="text-5xl font-bold mt-6">{BRL(valorTotal)}</p>
          {/* LINHA ABAIXO FOI REMOVIDA PARA CORRIGIR A DIVERGÊNCIA */}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm border">
            <h3 className="font-semibold text-slate-800">Estatísticas da Amostra</h3>
            <div className="mt-4 space-y-2 text-slate-700">
              <div className="flex justify-between"><span>Valor médio por m²:</span><span className="font-semibold">{BRL(valorMedio)}</span></div>
              <div className="flex justify-between"><span>Valor mediano por m²:</span><span className="font-semibold">{BRL(valorMediano)}</span></div>
              <div className="flex justify-between"><span>Imóveis utilizados:</span><span className="font-semibold">3</span></div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border">
            <h3 className="font-semibold text-slate-800">Critério de Chauvenet</h3>
            <p className="text-sm text-slate-600 mt-2">Valores discrepantes foram automaticamente excluídos da amostra.</p>
            <p className="text-green-600 text-sm mt-4 font-medium">Nenhum valor discrepante encontrado</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border">
          <h3 className="font-semibold text-slate-800">Imóvel Avaliado</h3>
          <div className="mt-2 flex justify-between text-slate-600">
            <span>Descrição: Apartamento Rua Bahia</span>
            <span>Área: {area} m²</span>
          </div>
        </div>

        {/* FATORES - ALTERAÇÃO 2: COLUNA "ALVO" REMOVIDA */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border">
          <h3 className="font-semibold text-slate-800">Fatores de Homogeneização</h3>
          <p className="text-sm text-slate-500 mt-1">Os fatores variam de 0.5 a 1.5. Valor 1 = padrão.</p>
          <div className="mt-4 space-y-3">
            <div className="border rounded-lg px-4 py-2.5">Localização</div>
            <div className="border rounded-lg px-4 py-2.5">Acabamento</div>
            <div className="border rounded-lg px-4 py-2.5">Estado de conservação</div>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button className="flex-1 bg-gray-200 py-3 rounded-xl font-medium">Nova Avaliação</button>
          <button className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-medium">Imprimir Relatório</button>
          <button className="flex-1 bg-green-600 text-white py-3 rounded-xl font-medium">Baixar PDF</button>
        </div>
      </main>
    </div>
  )
}