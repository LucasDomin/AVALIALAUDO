import { create } from 'zustand';
import { User } from '../types';
import { sendUserData, initiateGoogleLogin } from '../services/api';

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => boolean;
  register: (name: string, email: string, phone: string, password: string) => boolean;
  logout: () => void;
  loginWithGoogle: () => void;
}

const STORAGE_KEY = 'app_users';
const CURRENT_USER_KEY = 'current_user';

const getStoredUsers = (): User[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

const getCurrentUser = (): User | null => {
  const stored = localStorage.getItem(CURRENT_USER_KEY);
  return stored ? JSON.parse(stored) : null;
};

export const useAuthStore = create<AuthStore>((set) => ({
  user: getCurrentUser(),
  isAuthenticated: !!getCurrentUser(),

  login: (email: string, _password: string) => {
    const users = getStoredUsers();
    const user = users.find(u => u.email === email);

    if (user) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      set({ user, isAuthenticated: true });

      // ── Captação de lead no login ──────────────────────────────
      sendUserData({ name: user.name, email: user.email, phone: user.phone });

      return true;
    }
    return false;
  },

  register: (name: string, email: string, phone: string, _password: string) => {
    const users = getStoredUsers();

    if (users.find(u => u.email === email)) {
      return false;
    }

    const newUser: User = {
      id: Date.now().toString(),
      name,
      email,
      phone,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));

    set({ user: newUser, isAuthenticated: true });

    // ── Captação de lead no cadastro ───────────────────────────
    sendUserData({ name, email, phone });

    return true;
  },

  logout: () => {
    localStorage.removeItem(CURRENT_USER_KEY);
    set({ user: null, isAuthenticated: false });
  },

  loginWithGoogle: () => {
    // ── Chama o fluxo OAuth do Google ─────────────────────────
    // Para ativar: preencha googleAuthConfig.clientId em src/services/api.ts
    // Consulte o arquivo TUTORIAL_INTEGRAÇÕES.md para o passo a passo completo.
    initiateGoogleLogin();
  },
}));
