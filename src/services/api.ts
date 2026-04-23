// ============================================================
// SERVIÇO DE INTEGRAÇÕES EXTERNAS - AVALIALAUDO
// ============================================================

// ─────────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────────

export interface UserLeadData {
  name: string;
  email: string;
  phone: string;
}

// ─────────────────────────────────────────────────────────────
// CONFIGURAÇÃO HOTMARTSENDS
// Preencha TOKEN e FLOW_ID quando for integrar.
// ─────────────────────────────────────────────────────────────

const hotmartSendsConfig = {
  token: '',          // << COLE SEU TOKEN HOTMARTSENDS AQUI
  flowId: '',         // << COLE O ID DO FLUXO/LISTA AQUI
  endpoint: 'https://api.hotmart.com/smart-contacts/v1/contacts', // endpoint padrão
};

// ─────────────────────────────────────────────────────────────
// CONFIGURAÇÃO LEADLOVERS (mantida como alternativa)
// ─────────────────────────────────────────────────────────────

const leadLoversConfig = {
  token: '',          // << COLE SEU TOKEN LEADLOVERS AQUI
  endpoint: 'https://api.leadlovers.com/v1/leads',
};

// ─────────────────────────────────────────────────────────────
// FUNÇÃO PRINCIPAL: sendUserData
// Chame esta função após cadastro ou login bem-sucedido.
// Ela tenta HotmartSends primeiro; se não configurado, tenta LeadLovers.
// ─────────────────────────────────────────────────────────────

export const sendUserData = async (
  userData: UserLeadData
): Promise<{ success: boolean; message: string }> => {
  console.log('[sendUserData] Dados recebidos:', userData);

  // ── Tenta HotmartSends ──────────────────────────────────
  if (hotmartSendsConfig.token && hotmartSendsConfig.flowId) {
    try {
      const response = await fetch(hotmartSendsConfig.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${hotmartSendsConfig.token}`,
        },
        body: JSON.stringify({
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
          flow_id: hotmartSendsConfig.flowId,
          // Campos adicionais opcionais:
          // tags: ['avalialaudo', 'lead'],
          // source: 'avalialaudo-web',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('[HotmartSends] Lead enviado com sucesso:', data);
        return { success: true, message: 'Lead enviado ao HotmartSends com sucesso.' };
      } else {
        const err = await response.text();
        console.warn('[HotmartSends] Erro na resposta:', err);
      }
    } catch (error) {
      console.error('[HotmartSends] Erro na requisição:', error);
    }
  }

  // ── Tenta LeadLovers (fallback) ─────────────────────────
  if (leadLoversConfig.token) {
    try {
      const response = await fetch(leadLoversConfig.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${leadLoversConfig.token}`,
        },
        body: JSON.stringify({
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('[LeadLovers] Lead enviado com sucesso:', data);
        return { success: true, message: 'Lead enviado ao LeadLovers com sucesso.' };
      } else {
        const err = await response.text();
        console.warn('[LeadLovers] Erro na resposta:', err);
      }
    } catch (error) {
      console.error('[LeadLovers] Erro na requisição:', error);
    }
  }

  // ── Nenhuma integração configurada ainda ────────────────
  console.log('[sendUserData] Nenhuma integração ativa. Configure token e flowId em api.ts.');
  return {
    success: false,
    message: 'Integração pendente de configuração (token não definido).',
  };
};

// ─────────────────────────────────────────────────────────────
// UTILITÁRIOS DE CONFIGURAÇÃO
// Use para definir tokens dinamicamente se necessário
// ─────────────────────────────────────────────────────────────

export const setHotmartSendsToken = (token: string, flowId: string): void => {
  hotmartSendsConfig.token = token;
  hotmartSendsConfig.flowId = flowId;
};

export const setLeadLoversToken = (token: string): void => {
  leadLoversConfig.token = token;
};

export const setLeadLoversEndpoint = (endpoint: string): void => {
  leadLoversConfig.endpoint = endpoint;
};

// ─────────────────────────────────────────────────────────────
// ESTRUTURA PARA LOGIN COM GOOGLE (OAuth 2.0)
// Preencha CLIENT_ID quando for integrar.
// ─────────────────────────────────────────────────────────────

export const googleAuthConfig = {
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID as string,
  redirectUri: window.location.origin + '/auth/google/callback',
  scope: 'openid email profile',
};

/**
 * Inicia o fluxo de login com Google (OAuth 2.0 Implicit Flow).
 * Será chamado quando o botão "Entrar com Google" for clicado.
 * Para ativar: preencha googleAuthConfig.clientId acima.
 */
export const initiateGoogleLogin = (): void => {
  if (!googleAuthConfig.clientId) {
    console.warn('[Google Auth] CLIENT_ID não configurado em api.ts');
    alert(
      'Login com Google ainda não configurado.\n' +
      'Consulte o tutorial em TUTORIAL_INTEGRAÇÕES.md para ativar.'
    );
    return;
  }

  const params = new URLSearchParams({
    client_id: googleAuthConfig.clientId,
    redirect_uri: googleAuthConfig.redirectUri,
    response_type: 'token id_token',
    scope: googleAuthConfig.scope,
    nonce: Math.random().toString(36).substring(2),
  });

  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
};
