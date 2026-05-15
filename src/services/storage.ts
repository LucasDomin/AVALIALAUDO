import type { DadosAvaliacao, ResultadoAvaliacao } from "../domain/calculo";
import { enviarLeadHotmart } from "./hotmart";

export type Usuario = {
  id: string;
  nome: string;
  email: string;
  celular: string;
  criadoEm: string;
};

export type HistoricoItem = {
  id: string;
  criadoEm: string;
  titulo: string;
  dadosEntrada: DadosAvaliacao;
  resultadosCalculados: ResultadoAvaliacao;
};

const USERS_KEY = "avaliacao_usuarios";
const SESSION_KEY = "avaliacao_sessao";
const HISTORY_PREFIX = "avaliacao_historico_";

function storageDisponivel() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function criarId(prefixo: string) {
  return `${prefixo}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function lerJson<T>(chave: string, fallback: T): T {
  if (!storageDisponivel()) return fallback;

  const bruto = window.localStorage.getItem(chave);
  if (!bruto) return fallback;

  try {
    return JSON.parse(bruto) as T;
  } catch {
    return fallback;
  }
}

function salvarJson<T>(chave: string, valor: T) {
  if (!storageDisponivel()) return;
  window.localStorage.setItem(chave, JSON.stringify(valor));
}

export function listarUsuarios() {
  return lerJson<Usuario[]>(USERS_KEY, []);
}

export function cadastrarUsuario(dados: Omit<Usuario, "id" | "criadoEm">) {
  const usuarios = listarUsuarios();
  const existente = usuarios.find((u) => u.email.toLowerCase() === dados.email.toLowerCase());

  if (existente) return existente;

  const usuario: Usuario = {
    ...dados,
    id: criarId("usuario"),
    criadoEm: new Date().toISOString(),
  };

  salvarJson(USERS_KEY, [...usuarios, usuario]);

  void enviarLeadHotmart({
    nome: usuario.nome,
    email: usuario.email,
    celular: usuario.celular,
  });

  return usuario;
}

export function buscarUsuarioPorEmail(email: string) {
  return listarUsuarios().find((usuario) => usuario.email.toLowerCase() === email.toLowerCase()) ?? null;
}

export function definirSessao(usuario: Usuario) {
  salvarJson(SESSION_KEY, usuario);
}

export function obterSessao() {
  return lerJson<Usuario | null>(SESSION_KEY, null);
}

export function encerrarSessao() {
  if (!storageDisponivel()) return;
  window.localStorage.removeItem(SESSION_KEY);
}

export function obterHistorico(usuarioId: string) {
  return lerJson<HistoricoItem[]>(`${HISTORY_PREFIX}${usuarioId}`, []);
}

export function salvarNoHistorico(usuarioId: string, dadosEntrada: DadosAvaliacao, resultadosCalculados: ResultadoAvaliacao) {
  const historico = obterHistorico(usuarioId);
  const item: HistoricoItem = {
    id: criarId("calc"),
    criadoEm: new Date().toISOString(),
    titulo: dadosEntrada.avaliando.descricao,
    dadosEntrada,
    resultadosCalculados,
  };

  const atualizado = [item, ...historico].slice(0, 3);
  salvarJson(`${HISTORY_PREFIX}${usuarioId}`, atualizado);
  return atualizado;
}