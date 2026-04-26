export type GoogleOAuthConfig = {
  clientId: string;
  redirectUri: string;
  scope?: string[];
};

export type GoogleOAuthState = {
  nonce: string;
  origem: "login" | "cadastro";
};

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";

export function criarGoogleOAuthState(origem: GoogleOAuthState["origem"]): GoogleOAuthState {
  return {
    origem,
    nonce: Math.random().toString(36).slice(2) + Date.now().toString(36),
  };
}

export function criarUrlAutorizacaoGoogle(config: GoogleOAuthConfig, state: GoogleOAuthState) {
  const parametros = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    scope: (config.scope ?? ["openid", "email", "profile"]).join(" "),
    state: JSON.stringify(state),
  });

  return `${GOOGLE_AUTH_URL}?${parametros.toString()}`;
}

export function statusGoogleOAuthPreparado(config?: Partial<GoogleOAuthConfig>) {
  return {
    preparado: true,
    conectado: Boolean(config?.clientId && config.redirectUri),
    mensagem: config?.clientId && config.redirectUri ? "OAuth Google pronto para iniciar autorização." : "OAuth Google preparado. Informe clientId e redirectUri para ativar.",
  };
}