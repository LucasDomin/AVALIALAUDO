import type { Usuario } from "../services/storage";

export type HotmartSendsEvento = "cadastro" | "login" | "calculo_realizado" | "exportacao_pdf" | "exportacao_word";

export type HotmartSendsPayload = {
  evento: HotmartSendsEvento;
  usuario: Pick<Usuario, "id" | "nome" | "email" | "celular">;
  consentimento?: boolean;
  metadados?: Record<string, string | number | boolean>;
};

export type HotmartSendsConfig = {
  token?: string;
  endpoint: string;
  listaId?: string;
  origem?: string;
};

export type HotmartSendsResultado = {
  enviado: boolean;
  status?: number;
  enfileirado: boolean;
  mensagem: string;
};

export type HotmartSendsStatus = {
  configurado: boolean;
  endpoint: string;
  listaId?: string;
  origem: string;
  filaPendente: number;
  ultimoEnvioEm?: string;
  ultimoErro?: string;
};

type HotmartSendsFilaItem = {
  id: string;
  criadoEm: string;
  payload: HotmartSendsPayload;
};

const FILA_KEY = "hotmart_sends_fila";
const ULTIMO_ENVIO_KEY = "hotmart_sends_ultimo_envio";
const ULTIMO_ERRO_KEY = "hotmart_sends_ultimo_erro";

function storageDisponivel() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
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

function lerTexto(chave: string) {
  if (!storageDisponivel()) return "";
  return window.localStorage.getItem(chave) ?? "";
}

function salvarTexto(chave: string, valor: string) {
  if (!storageDisponivel()) return;
  window.localStorage.setItem(chave, valor);
}

function envString(chave: string) {
  const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};
  return env[chave] ?? "";
}

function criarId() {
  return `hs_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function obterConfigHotmartSends(): HotmartSendsConfig | null {
  const endpoint = envString("VITE_HOTMART_SENDS_ENDPOINT") || lerTexto("hotmart_sends_endpoint");
  if (!endpoint) return null;

  return {
    endpoint,
    token: envString("VITE_HOTMART_SENDS_TOKEN") || lerTexto("hotmart_sends_token") || undefined,
    listaId: envString("VITE_HOTMART_SENDS_LISTA_ID") || lerTexto("hotmart_sends_lista_id") || undefined,
    origem: envString("VITE_HOTMART_SENDS_ORIGEM") || lerTexto("hotmart_sends_origem") || "Calculadora Laudo Master",
  };
}

function obterFila() {
  return lerJson<HotmartSendsFilaItem[]>(FILA_KEY, []);
}

function salvarFila(fila: HotmartSendsFilaItem[]) {
  salvarJson(FILA_KEY, fila.slice(-50));
}

function enfileirar(payload: HotmartSendsPayload) {
  const fila = obterFila();
  salvarFila([...fila, { id: criarId(), criadoEm: new Date().toISOString(), payload }]);
}

export function criarPayloadHotmartSends(payload: HotmartSendsPayload) {
  const config = obterConfigHotmartSends();

  return {
    event: payload.evento,
    contact: {
      name: payload.usuario.nome,
      email: payload.usuario.email,
      phone: payload.usuario.celular,
      external_id: payload.usuario.id,
    },
    consent: Boolean(payload.consentimento),
    list_id: config?.listaId,
    source: config?.origem ?? "Calculadora Laudo Master",
    metadata: payload.metadados ?? {},
  };
}

async function enviarHotmartSends(payload: HotmartSendsPayload, config: HotmartSendsConfig) {
  const body = criarPayloadHotmartSends(payload);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (config.token) {
    headers.Authorization = `Bearer ${config.token}`;
  }

  const resposta = await fetch(config.endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    keepalive: true,
  });

  if (!resposta.ok) {
    throw new Error(`Hotmart Sends respondeu com status ${resposta.status}.`);
  }

  salvarTexto(ULTIMO_ENVIO_KEY, new Date().toISOString());
  salvarTexto(ULTIMO_ERRO_KEY, "");

  return resposta.status;
}

export async function registrarEventoHotmartSends(payload: HotmartSendsPayload): Promise<HotmartSendsResultado> {
  const config = obterConfigHotmartSends();

  if (!config) {
    enfileirar(payload);
    salvarTexto(ULTIMO_ERRO_KEY, "Endpoint Hotmart Sends não configurado.");

    return {
      enviado: false,
      enfileirado: true,
      mensagem: "Endpoint Hotmart Sends não configurado. Evento salvo na fila local.",
    };
  }

  try {
    const status = await enviarHotmartSends(payload, config);
    return {
      enviado: true,
      status,
      enfileirado: false,
      mensagem: "Evento enviado para Hotmart Sends.",
    };
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : "Falha ao enviar evento para Hotmart Sends.";
    enfileirar(payload);
    salvarTexto(ULTIMO_ERRO_KEY, mensagem);

    return {
      enviado: false,
      enfileirado: true,
      mensagem,
    };
  }
}

export async function reenviarFilaHotmartSends() {
  const config = obterConfigHotmartSends();
  if (!config) return { enviados: 0, pendentes: obterFila().length, mensagem: "Endpoint Hotmart Sends não configurado." };

  const fila = obterFila();
  const pendentes: HotmartSendsFilaItem[] = [];
  let enviados = 0;

  for (const item of fila) {
    try {
      await enviarHotmartSends(item.payload, config);
      enviados += 1;
    } catch {
      pendentes.push(item);
    }
  }

  salvarFila(pendentes);
  return { enviados, pendentes: pendentes.length, mensagem: `${enviados} evento(s) reenviado(s).` };
}

export function obterStatusHotmartSends(): HotmartSendsStatus {
  const config = obterConfigHotmartSends();
  return {
    configurado: Boolean(config?.endpoint),
    endpoint: config?.endpoint ?? "",
    listaId: config?.listaId,
    origem: config?.origem ?? "Calculadora Laudo Master",
    filaPendente: obterFila().length,
    ultimoEnvioEm: lerTexto(ULTIMO_ENVIO_KEY) || undefined,
    ultimoErro: lerTexto(ULTIMO_ERRO_KEY) || undefined,
  };
}