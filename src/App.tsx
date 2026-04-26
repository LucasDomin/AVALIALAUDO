import { type ChangeEvent, type FormEvent, useMemo, useState } from "react";
import { calcularAvaliacao, type ComparativoInput, type DadosAvaliacao, type ResultadoAvaliacao } from "./domain/calculo";
import { dataHoraBR, moedaBR, numeroBR, somenteDigitos } from "./domain/formatacao";
import { gerarRelatorio } from "./domain/relatorio";
import { exportarPdf, exportarWord } from "./services/documentExport";
import {
  buscarUsuarioPorEmail,
  cadastrarUsuario,
  definirSessao,
  encerrarSessao,
  obterHistorico,
  obterSessao,
  salvarNoHistorico,
  type HistoricoItem,
  type Usuario,
} from "./services/storage";

type Aba = "avaliacao" | "historico" | "usuario";

type EstadoFormulario = DadosAvaliacao;

const comparativosIniciais: ComparativoInput[] = [
  { id: "comp_1", descricao: "Comparativo 1", area: 100, valor: 360000, f1: 0.9, f2: 1, f3: 1 },
  { id: "comp_2", descricao: "Comparativo 2", area: 120, valor: 438000, f1: 0.95, f2: 0.98, f3: 1 },
  { id: "comp_3", descricao: "Comparativo 3", area: 95, valor: 345000, f1: 0.92, f2: 1.02, f3: 1 },
];

const formularioInicial: EstadoFormulario = {
  avaliando: {
    descricao: "Imóvel residencial avaliando",
    area: 110,
  },
  comparativos: comparativosIniciais,
  valorUnitarioAdotado: undefined,
};

const menu: Array<{ id: Aba; label: string }> = [
  { id: "avaliacao", label: "AVALIAÇÃO" },
  { id: "historico", label: "HISTÓRICO" },
  { id: "usuario", label: "USUÁRIO" },
];

function novoComparativo(): ComparativoInput {
  return {
    id: `comp_${Date.now()}`,
    descricao: "",
    area: 0,
    valor: 0,
    f1: 1,
    f2: 1,
    f3: 1,
  };
}

function campoNumero(evento: ChangeEvent<HTMLInputElement>) {
  const valor = Number(evento.target.value);
  return Number.isFinite(valor) ? valor : 0;
}

function relatorioDoResultado(dados: DadosAvaliacao, resultado: ResultadoAvaliacao, usuario: Usuario) {
  return gerarRelatorio(dados, resultado, {
    nome: usuario.nome,
    email: usuario.email,
    celular: usuario.celular,
  });
}

function AcessoInicial({ onAutenticado }: { onAutenticado: (usuario: Usuario) => void }) {
  const [modo, setModo] = useState<"cadastro" | "login">("cadastro");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [celular, setCelular] = useState("");
  const [erro, setErro] = useState("");

  function entrar(usuario: Usuario) {
    definirSessao(usuario);
    onAutenticado(usuario);
  }

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro("");

    if (!email.includes("@")) {
      setErro("Informe um e-mail válido.");
      return;
    }

    if (modo === "login") {
      const usuario = buscarUsuarioPorEmail(email);

      if (!usuario) {
        setErro("Nenhum usuário local foi encontrado para este e-mail.");
        return;
      }

      entrar(usuario);
      return;
    }

    if (!nome.trim() || somenteDigitos(celular).length < 10) {
      setErro("Informe nome, e-mail e celular para criar o cadastro.");
      return;
    }

    const usuario = cadastrarUsuario({ nome: nome.trim(), email: email.trim(), celular: celular.trim() });
    entrar(usuario);
  }

  return (
    <div className="min-h-screen bg-[#eef0f2] text-[#333333]">
      <div className="grid min-h-screen grid-cols-1 md:grid-cols-[280px_1fr]">
        <aside className="border-r border-[#c8ccd0] bg-white p-8">
          <p className="text-sm font-bold uppercase tracking-wide text-[#e06600]">SISTEMA TÉCNICO</p>
          <h1 className="mt-6 text-3xl font-bold leading-tight text-[#0f2d4d]">Avaliação Imobiliária</h1>
          <nav className="mt-10 space-y-5 text-sm font-bold uppercase tracking-wide text-[#e06600]">
            <p>CADASTRO</p>
            <p>LOGIN</p>
            <p>HISTÓRICO ISOLADO</p>
            <p>PDF E WORD</p>
          </nav>
        </aside>
        <main className="px-6 py-10 md:px-14 lg:px-20">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-wide text-[#e06600]">ACESSO DO USUÁRIO</p>
            <h2 className="mt-3 text-4xl font-bold leading-tight text-[#0f2d4d]">Avalia Laudo Master</h2>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-[#333333]">
              Ambiente <strong>gratuito e seguro</strong>, replicando o rigor da NBR 14653 com tratamento por fatores e Chauvenet, em uma interface limpa, sem anúncios externos.
            </p>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-[#333333]">
              Somos referência em avaliação imobiliária há anos. Alunos e profissionais confiam nos nossos critérios técnicos.
            </p>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-[#333333]">
              Seus dados ficam armazenados apenas neste navegador, isolados por usuário. Os últimos três cálculos são preservados automaticamente e a estrutura já está preparada para evoluir com segurança para banco de dados quando você decidir.
            </p>

            <div className="mt-10 border-t border-[#c8ccd0] pt-8">
              <div className="flex gap-6 text-sm font-bold uppercase tracking-wide">
                <button className={modo === "cadastro" ? "text-[#e06600]" : "text-[#333333]"} type="button" onClick={() => setModo("cadastro")}>
                  CRIAR CADASTRO
                </button>
                <button className={modo === "login" ? "text-[#e06600]" : "text-[#333333]"} type="button" onClick={() => setModo("login")}>
                  ENTRAR
                </button>
              </div>

              <form className="mt-8 grid gap-5" onSubmit={enviar}>
                {modo === "cadastro" && (
                  <label className="grid gap-2 text-sm font-bold uppercase tracking-wide text-[#0f2d4d]">
                    Nome
                    <input className="border border-[#aeb4ba] bg-white px-3 py-3 font-normal normal-case text-[#333333] outline-none" value={nome} onChange={(evento) => setNome(evento.target.value)} />
                  </label>
                )}
                <label className="grid gap-2 text-sm font-bold uppercase tracking-wide text-[#0f2d4d]">
                  Email
                  <input className="border border-[#aeb4ba] bg-white px-3 py-3 font-normal normal-case text-[#333333] outline-none" type="email" value={email} onChange={(evento) => setEmail(evento.target.value)} />
                </label>
                {modo === "cadastro" && (
                  <label className="grid gap-2 text-sm font-bold uppercase tracking-wide text-[#0f2d4d]">
                    Celular
                    <input className="border border-[#aeb4ba] bg-white px-3 py-3 font-normal normal-case text-[#333333] outline-none" value={celular} onChange={(evento) => setCelular(evento.target.value)} />
                  </label>
                )}

                {erro && <p className="border-l-4 border-[#e06600] pl-4 text-sm font-bold uppercase text-[#333333]">{erro}</p>}

                <button className="w-fit border border-[#e06600] bg-[#e06600] px-6 py-3 text-sm font-bold uppercase tracking-wide text-white" type="submit">
                  {modo === "cadastro" ? "CRIAR E ENTRAR" : "ENTRAR NO SISTEMA"}
                </button>
                <button className="w-fit border border-[#aeb4ba] px-6 py-3 text-sm font-bold uppercase tracking-wide text-[#333333]" type="button" disabled>
                  ENTRAR COM GOOGLE: OAUTH PREPARADO
                </button>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function LinhaResumo({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="grid gap-1 border-t border-[#c8ccd0] py-3 md:grid-cols-[260px_1fr]">
      <dt className="text-sm font-bold uppercase tracking-wide text-[#0f2d4d]">{rotulo}</dt>
      <dd className="text-[#333333]">{valor}</dd>
    </div>
  );
}

function ResultadoTecnico({ resultado }: { resultado: ResultadoAvaliacao }) {
  return (
    <section className="mt-10 border-t-2 border-[#0f2d4d] pt-8">
      <p className="text-sm font-bold uppercase tracking-wide text-[#e06600]">RESULTADO CALCULADO</p>
      <h2 className="mt-2 text-3xl font-bold text-[#0f2d4d]">Tratamento estatístico final</h2>

      <dl className="mt-6">
        <LinhaResumo rotulo="Média inicial" valor={moedaBR(resultado.estatisticaInicial.media)} />
        <LinhaResumo rotulo="Desvio padrão inicial" valor={moedaBR(resultado.estatisticaInicial.desvioPadrao)} />
        <LinhaResumo rotulo="Valor crítico Chauvenet" valor={numeroBR(resultado.valorCriticoChauvenet, 4)} />
        <LinhaResumo rotulo="Amostras mantidas" valor={`${resultado.estatisticaFinal.n} de ${resultado.estatisticaInicial.n}`} />
        <LinhaResumo rotulo="Média final" valor={moedaBR(resultado.estatisticaFinal.media)} />
        <LinhaResumo rotulo="Desvio padrão final" valor={moedaBR(resultado.estatisticaFinal.desvioPadrao)} />
        <LinhaResumo rotulo="Intervalo 80%" valor={`${moedaBR(resultado.intervalo80.limiteInferior)} a ${moedaBR(resultado.intervalo80.limiteSuperior)}`} />
        <LinhaResumo rotulo="Campo de arbítrio" valor={`${moedaBR(resultado.campoArbitrio.minimo)} a ${moedaBR(resultado.campoArbitrio.maximo)}`} />
        <LinhaResumo rotulo="Valor unitário adotado" valor={`${moedaBR(resultado.valorUnitarioAdotado)} por m²`} />
        <LinhaResumo rotulo="Valor final" valor={moedaBR(resultado.valorFinal)} />
      </dl>

      <div className="mt-8 overflow-x-auto">
        <h3 className="text-xl font-bold text-[#0f2d4d]">Tabela de homogeneização</h3>
        <table className="mt-4 w-full min-w-[860px] border-collapse text-left text-sm">
          <thead>
            <tr className="text-[#0f2d4d]">
              <th className="border border-[#aeb4ba] px-3 py-2">Imóvel</th>
              <th className="border border-[#aeb4ba] px-3 py-2">Área</th>
              <th className="border border-[#aeb4ba] px-3 py-2">Valor</th>
              <th className="border border-[#aeb4ba] px-3 py-2">R$/m²</th>
              <th className="border border-[#aeb4ba] px-3 py-2">F1</th>
              <th className="border border-[#aeb4ba] px-3 py-2">F2</th>
              <th className="border border-[#aeb4ba] px-3 py-2">F3</th>
              <th className="border border-[#aeb4ba] px-3 py-2">Vh</th>
            </tr>
          </thead>
          <tbody>
            {resultado.amostras.map((amostra) => (
              <tr key={amostra.id}>
                <td className="border border-[#aeb4ba] px-3 py-2">{amostra.descricao}</td>
                <td className="border border-[#aeb4ba] px-3 py-2">{numeroBR(amostra.area)} m²</td>
                <td className="border border-[#aeb4ba] px-3 py-2">{moedaBR(amostra.valor)}</td>
                <td className="border border-[#aeb4ba] px-3 py-2">{moedaBR(amostra.valorM2)}</td>
                <td className="border border-[#aeb4ba] px-3 py-2">{numeroBR(amostra.f1, 3)}</td>
                <td className="border border-[#aeb4ba] px-3 py-2">{numeroBR(amostra.f2, 3)}</td>
                <td className="border border-[#aeb4ba] px-3 py-2">{numeroBR(amostra.f3, 3)}</td>
                <td className="border border-[#aeb4ba] px-3 py-2 font-bold">{moedaBR(amostra.valorHomogeneizado)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8 overflow-x-auto">
        <h3 className="text-xl font-bold text-[#0f2d4d]">Critério de Chauvenet</h3>
        <table className="mt-4 w-full min-w-[620px] border-collapse text-left text-sm">
          <thead>
            <tr className="text-[#0f2d4d]">
              <th className="border border-[#aeb4ba] px-3 py-2">Imóvel</th>
              <th className="border border-[#aeb4ba] px-3 py-2">Xi</th>
              <th className="border border-[#aeb4ba] px-3 py-2">d</th>
              <th className="border border-[#aeb4ba] px-3 py-2">VC</th>
              <th className="border border-[#aeb4ba] px-3 py-2">Situação</th>
            </tr>
          </thead>
          <tbody>
            {resultado.chauvenet.map((amostra) => (
              <tr key={amostra.id}>
                <td className="border border-[#aeb4ba] px-3 py-2">{amostra.descricao}</td>
                <td className="border border-[#aeb4ba] px-3 py-2">{moedaBR(amostra.valorHomogeneizado)}</td>
                <td className="border border-[#aeb4ba] px-3 py-2">{numeroBR(amostra.d, 4)}</td>
                <td className="border border-[#aeb4ba] px-3 py-2">{numeroBR(resultado.valorCriticoChauvenet, 4)}</td>
                <td className="border border-[#aeb4ba] px-3 py-2 font-bold uppercase text-[#e06600]">{amostra.mantida ? "Mantida" : "Excluída"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {resultado.observacoes.length > 0 && (
        <div className="mt-8 border-t border-[#c8ccd0] pt-5">
          <h3 className="text-xl font-bold text-[#0f2d4d]">Observações</h3>
          {resultado.observacoes.map((observacao) => (
            <p className="mt-2 text-[#333333]" key={observacao}>
              {observacao}
            </p>
          ))}
        </div>
      )}
    </section>
  );
}

function App() {
  const [usuario, setUsuario] = useState<Usuario | null>(() => obterSessao());
  const [aba, setAba] = useState<Aba>("avaliacao");
  const [formulario, setFormulario] = useState<EstadoFormulario>(formularioInicial);
  const [resultado, setResultado] = useState<ResultadoAvaliacao | null>(null);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [historico, setHistorico] = useState<HistoricoItem[]>(() => (usuario ? obterHistorico(usuario.id) : []));

  const relatorioAtual = useMemo(() => {
    if (!usuario || !resultado) return null;
    return relatorioDoResultado(formulario, resultado, usuario);
  }, [formulario, resultado, usuario]);

  if (!usuario) {
    return (
      <AcessoInicial
        onAutenticado={(novoUsuario) => {
          setUsuario(novoUsuario);
          setHistorico(obterHistorico(novoUsuario.id));
        }}
      />
    );
  }

  const usuarioAtivo = usuario;

  function atualizarAvaliando(campo: "descricao" | "area", valor: string | number) {
    setFormulario((atual) => ({
      ...atual,
      avaliando: {
        ...atual.avaliando,
        [campo]: valor,
      },
    }));
  }

  function atualizarComparativo(id: string, campo: keyof ComparativoInput, valor: string | number) {
    setFormulario((atual) => ({
      ...atual,
      comparativos: atual.comparativos.map((comparativo) => (comparativo.id === id ? { ...comparativo, [campo]: valor } : comparativo)),
    }));
  }

  function calcularESalvar(evento?: FormEvent<HTMLFormElement>) {
    evento?.preventDefault();
    setErro("");
    setMensagem("");

    try {
      const calculado = calcularAvaliacao(formulario);
      setResultado(calculado);
      const atualizado = salvarNoHistorico(usuarioAtivo.id, formulario, calculado);
      setHistorico(atualizado);
      setMensagem("CÁLCULO REALIZADO E SALVO NO HISTÓRICO LOCAL.");
    } catch (error) {
      setResultado(null);
      setErro(error instanceof Error ? error.message : "Não foi possível calcular a avaliação.");
    }
  }

  function carregarHistorico(item: HistoricoItem) {
    setFormulario(item.dadosEntrada);
    setResultado(item.resultadosCalculados);
    setAba("avaliacao");
    setMensagem("CÁLCULO DO HISTÓRICO CARREGADO PARA VISUALIZAÇÃO.");
    setErro("");
  }

  function baixarPdfAtual() {
    if (relatorioAtual) exportarPdf(relatorioAtual);
  }

  function baixarWordAtual() {
    if (relatorioAtual) void exportarWord(relatorioAtual);
  }

  function exportarItemHistorico(item: HistoricoItem, tipo: "pdf" | "word") {
    const relatorio = relatorioDoResultado(item.dadosEntrada, item.resultadosCalculados, usuarioAtivo);
    if (tipo === "pdf") exportarPdf(relatorio);
    if (tipo === "word") void exportarWord(relatorio);
  }

  return (
    <div className="min-h-screen bg-[#eef0f2] font-sans text-[#333333]">
      <div className="grid min-h-screen grid-cols-1 md:grid-cols-[280px_1fr]">
        <aside className="border-r border-[#c8ccd0] bg-white p-8">
          <p className="text-sm font-bold uppercase tracking-wide text-[#e06600]">LAUDO IMOBILIÁRIO</p>
          <h1 className="mt-5 text-3xl font-bold leading-tight text-[#0f2d4d]">Avaliação Técnica</h1>
          <p className="mt-4 text-sm leading-6 text-[#333333]">Método comparativo direto com tratamento por fatores, histórico local e exportação profissional.</p>
          <nav className="mt-10 grid gap-5 text-left text-sm font-bold uppercase tracking-wide">
            {menu.map((item) => (
              <button className={aba === item.id ? "text-left text-[#e06600]" : "text-left text-[#333333]"} key={item.id} type="button" onClick={() => setAba(item.id)}>
                {item.label}
              </button>
            ))}
          </nav>
          <div className="mt-12 border-t border-[#c8ccd0] pt-6 text-sm">
            <p className="font-bold uppercase tracking-wide text-[#0f2d4d]">Usuário ativo</p>
            <p className="mt-2">{usuario.nome}</p>
            <p>{usuario.email}</p>
            <button
              className="mt-5 text-sm font-bold uppercase tracking-wide text-[#e06600]"
              type="button"
              onClick={() => {
                encerrarSessao();
                setUsuario(null);
              }}
            >
              SAIR
            </button>
          </div>
        </aside>

        <main className="px-5 py-8 md:px-10 lg:px-14">
          {aba === "avaliacao" && (
            <form className="max-w-6xl" onSubmit={calcularESalvar}>
              <p className="text-sm font-bold uppercase tracking-wide text-[#e06600]">MOTOR DE CÁLCULO</p>
              <h2 className="mt-2 text-4xl font-bold leading-tight text-[#0f2d4d]">Avaliação por comparação direta com tratamento por fatores</h2>
              <p className="mt-5 max-w-4xl text-lg leading-8">
                Informe o imóvel avaliando e os comparativos. O sistema calcula valor por metro quadrado, valor homogeneizado, média, desvio padrão amostral, Chauvenet, intervalo de confiança de 80%, campo de arbítrio e valor final.
              </p>

              <section className="mt-10 border-t border-[#c8ccd0] pt-8">
                <h3 className="text-2xl font-bold text-[#0f2d4d]">Imóvel avaliando</h3>
                <div className="mt-5 grid gap-5 md:grid-cols-[1fr_220px]">
                  <label className="grid gap-2 text-sm font-bold uppercase tracking-wide text-[#0f2d4d]">
                    Descrição
                    <input className="border border-[#aeb4ba] bg-white px-3 py-3 font-normal normal-case text-[#333333] outline-none" value={formulario.avaliando.descricao} onChange={(evento) => atualizarAvaliando("descricao", evento.target.value)} />
                  </label>
                  <label className="grid gap-2 text-sm font-bold uppercase tracking-wide text-[#0f2d4d]">
                    Área em m²
                    <input className="border border-[#aeb4ba] bg-white px-3 py-3 font-normal text-[#333333] outline-none" min="0" step="0.01" type="number" value={formulario.avaliando.area} onChange={(evento) => atualizarAvaliando("area", campoNumero(evento))} />
                  </label>
                </div>
              </section>

              <section className="mt-10 border-t border-[#c8ccd0] pt-8">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                  <div>
                    <h3 className="text-2xl font-bold text-[#0f2d4d]">Imóveis comparativos</h3>
                    <p className="mt-2 max-w-3xl leading-7">F1 representa oferta, F2 representa localização e F3 representa topografia. Use valores positivos para manter a amostra válida.</p>
                  </div>
                  <button className="w-fit border border-[#e06600] px-5 py-3 text-sm font-bold uppercase tracking-wide text-[#e06600]" type="button" onClick={() => setFormulario((atual) => ({ ...atual, comparativos: [...atual.comparativos, novoComparativo()] }))}>
                    ADICIONAR COMPARATIVO
                  </button>
                </div>

                <div className="mt-6 overflow-x-auto">
                  <table className="w-full min-w-[980px] border-collapse text-left text-sm">
                    <thead>
                      <tr className="text-[#0f2d4d]">
                        <th className="border border-[#aeb4ba] px-3 py-2">Descrição</th>
                        <th className="border border-[#aeb4ba] px-3 py-2">Área</th>
                        <th className="border border-[#aeb4ba] px-3 py-2">Valor</th>
                        <th className="border border-[#aeb4ba] px-3 py-2">F1</th>
                        <th className="border border-[#aeb4ba] px-3 py-2">F2</th>
                        <th className="border border-[#aeb4ba] px-3 py-2">F3</th>
                        <th className="border border-[#aeb4ba] px-3 py-2">Ação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formulario.comparativos.map((comparativo) => (
                        <tr key={comparativo.id}>
                          <td className="border border-[#aeb4ba] px-2 py-2">
                            <input className="w-full bg-white px-2 py-2 outline-none" value={comparativo.descricao} onChange={(evento) => atualizarComparativo(comparativo.id, "descricao", evento.target.value)} />
                          </td>
                          <td className="border border-[#aeb4ba] px-2 py-2">
                            <input className="w-28 bg-white px-2 py-2 outline-none" min="0" step="0.01" type="number" value={comparativo.area} onChange={(evento) => atualizarComparativo(comparativo.id, "area", campoNumero(evento))} />
                          </td>
                          <td className="border border-[#aeb4ba] px-2 py-2">
                            <input className="w-36 bg-white px-2 py-2 outline-none" min="0" step="0.01" type="number" value={comparativo.valor} onChange={(evento) => atualizarComparativo(comparativo.id, "valor", campoNumero(evento))} />
                          </td>
                          <td className="border border-[#aeb4ba] px-2 py-2">
                            <input className="w-24 bg-white px-2 py-2 outline-none" min="0" step="0.001" type="number" value={comparativo.f1} onChange={(evento) => atualizarComparativo(comparativo.id, "f1", campoNumero(evento))} />
                          </td>
                          <td className="border border-[#aeb4ba] px-2 py-2">
                            <input className="w-24 bg-white px-2 py-2 outline-none" min="0" step="0.001" type="number" value={comparativo.f2} onChange={(evento) => atualizarComparativo(comparativo.id, "f2", campoNumero(evento))} />
                          </td>
                          <td className="border border-[#aeb4ba] px-2 py-2">
                            <input className="w-24 bg-white px-2 py-2 outline-none" min="0" step="0.001" type="number" value={comparativo.f3} onChange={(evento) => atualizarComparativo(comparativo.id, "f3", campoNumero(evento))} />
                          </td>
                          <td className="border border-[#aeb4ba] px-3 py-2">
                            <button
                              className="font-bold uppercase tracking-wide text-[#e06600]"
                              type="button"
                              onClick={() => setFormulario((atual) => ({ ...atual, comparativos: atual.comparativos.filter((item) => item.id !== comparativo.id) }))}
                            >
                              REMOVER
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="mt-10 border-t border-[#c8ccd0] pt-8">
                <h3 className="text-2xl font-bold text-[#0f2d4d]">Valor unitário adotado</h3>
                <p className="mt-2 max-w-3xl leading-7">Deixe em branco para adotar automaticamente a média final. Caso informe um valor, o sistema mantém o cálculo e sinaliza se estiver fora do campo de arbítrio de 10%.</p>
                <label className="mt-5 grid max-w-sm gap-2 text-sm font-bold uppercase tracking-wide text-[#0f2d4d]">
                  R$/m² adotado
                  <input
                    className="border border-[#aeb4ba] bg-white px-3 py-3 font-normal text-[#333333] outline-none"
                    min="0"
                    step="0.01"
                    type="number"
                    value={formulario.valorUnitarioAdotado ?? ""}
                    onChange={(evento) => setFormulario((atual) => ({ ...atual, valorUnitarioAdotado: evento.target.value ? campoNumero(evento) : undefined }))}
                  />
                </label>
              </section>

              <div className="mt-10 flex flex-wrap gap-4 border-t border-[#c8ccd0] pt-8">
                <button className="border border-[#e06600] bg-[#e06600] px-6 py-3 text-sm font-bold uppercase tracking-wide text-white" type="submit">
                  CALCULAR E SALVAR
                </button>
                <button
                  className="border border-[#aeb4ba] px-6 py-3 text-sm font-bold uppercase tracking-wide text-[#333333]"
                  type="button"
                  onClick={() => {
                    setFormulario(formularioInicial);
                    setResultado(null);
                    setErro("");
                    setMensagem("");
                  }}
                >
                  LIMPAR PARA NOVO CÁLCULO
                </button>
                <button className="border border-[#e06600] px-6 py-3 text-sm font-bold uppercase tracking-wide text-[#e06600] disabled:border-[#aeb4ba] disabled:text-[#7a7f87]" disabled={!relatorioAtual} type="button" onClick={baixarPdfAtual}>
                  BAIXAR PDF
                </button>
                <button className="border border-[#e06600] px-6 py-3 text-sm font-bold uppercase tracking-wide text-[#e06600] disabled:border-[#aeb4ba] disabled:text-[#7a7f87]" disabled={!relatorioAtual} type="button" onClick={baixarWordAtual}>
                  BAIXAR WORD
                </button>
              </div>

              {mensagem && <p className="mt-6 border-l-4 border-[#e06600] pl-4 text-sm font-bold uppercase tracking-wide text-[#333333]">{mensagem}</p>}
              {erro && <p className="mt-6 border-l-4 border-[#e06600] pl-4 text-sm font-bold uppercase tracking-wide text-[#333333]">{erro}</p>}
              {resultado && <ResultadoTecnico resultado={resultado} />}
            </form>
          )}

          {aba === "historico" && (
            <section className="max-w-5xl">
              <p className="text-sm font-bold uppercase tracking-wide text-[#e06600]">ÚLTIMOS 3 CÁLCULOS</p>
              <h2 className="mt-2 text-4xl font-bold text-[#0f2d4d]">Histórico isolado do usuário</h2>
              <p className="mt-5 max-w-3xl text-lg leading-8">Cada usuário possui armazenamento próprio. Os dados salvos incluem entrada e resultados calculados; os documentos são gerados novamente no momento do download.</p>

              <div className="mt-10 border-t border-[#c8ccd0]">
                {historico.length === 0 && <p className="py-8 text-[#333333]">Nenhum cálculo salvo ainda.</p>}
                {historico.map((item) => (
                  <div className="border-b border-[#c8ccd0] py-6" key={item.id}>
                    <p className="text-sm font-bold uppercase tracking-wide text-[#e06600]">{dataHoraBR(item.criadoEm)}</p>
                    <h3 className="mt-2 text-2xl font-bold text-[#0f2d4d]">{item.titulo}</h3>
                    <p className="mt-2">
                      Valor final: <strong>{moedaBR(item.resultadosCalculados.valorFinal)}</strong>
                    </p>
                    <div className="mt-5 flex flex-wrap gap-4">
                      <button className="font-bold uppercase tracking-wide text-[#e06600]" type="button" onClick={() => carregarHistorico(item)}>
                        VISUALIZAR NOVAMENTE
                      </button>
                      <button className="font-bold uppercase tracking-wide text-[#e06600]" type="button" onClick={() => exportarItemHistorico(item, "pdf")}>
                        BAIXAR PDF
                      </button>
                      <button className="font-bold uppercase tracking-wide text-[#e06600]" type="button" onClick={() => exportarItemHistorico(item, "word")}>
                        BAIXAR WORD
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {aba === "usuario" && (
            <section className="max-w-4xl">
              <p className="text-sm font-bold uppercase tracking-wide text-[#e06600]">DADOS DO AMBIENTE</p>
              <h2 className="mt-2 text-4xl font-bold text-[#0f2d4d]">Usuário e isolamento</h2>
              <dl className="mt-8">
                <LinhaResumo rotulo="Nome" valor={usuario.nome} />
                <LinhaResumo rotulo="Email" valor={usuario.email} />
                <LinhaResumo rotulo="Celular" valor={usuario.celular} />
                <LinhaResumo rotulo="Cadastro" valor={dataHoraBR(usuario.criadoEm)} />
                <LinhaResumo rotulo="Histórico" valor={`${historico.length} cálculo(s) salvos, limite operacional de 3`} />
                <LinhaResumo rotulo="OAuth Google" valor="Fluxo preparado no código, sem conexão externa ativa nesta versão" />
                <LinhaResumo rotulo="Coleta Hotmart Sends" valor="Estrutura preparada no código, sem disparo externo ativo nesta versão" />
              </dl>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;