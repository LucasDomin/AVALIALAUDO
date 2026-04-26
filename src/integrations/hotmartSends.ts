import type { Usuario } from "../services/storage";

export type HotmartSendsEvento = "cadastro" | "calculo_realizado" | "exportacao_pdf" | "exportacao_word";

export type HotmartSendsPayload = {
  evento: HotmartSendsEvento;
  usuario: Pick<Usuario, "id" | "nome" | "email" | "celular">;
  consentimento?: boolean;
  metadados?: Record<string, string | number | boolean>;
};

export type HotmartSendsConfig = {
  token: string;
  endpoint: string;
  listaId?: string;
  origem?: string;
};

export function criarPayloadHotmartSends(payload: HotmartSendsPayload) {
  return {
    event: payload.evento,
    contact: {
      name: payload.usuario.nome,
      email: payload.usuario.email,
      phone: payload.usuario.celular,
      external_id: payload.usuario.id,
    },
    consent: Boolean(payload.consentimento),
    metadata: payload.metadados ?? {},
  };
}

export async function prepararEnvioHotmartSends(payload: HotmartSendsPayload, config?: HotmartSendsConfig) {
  const body = criarPayloadHotmartSends(payload);

  if (!config?.token || !config.endpoint) {
    return {
      preparado: true,
      conectado: false,
      body,
      mensagem: "Estrutura preparada. O envio real será habilitado quando endpoint e token Hotmart Sends forem informados.",
    };
  }

  return {
    preparado: true,
    conectado: false,
    body,
    mensagem: "Configuração detectada, mas o envio externo permanece bloqueado até a etapa de ativação explícita.",
  };
}