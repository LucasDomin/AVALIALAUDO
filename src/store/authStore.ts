import { create } from 'zustand';
import { User } from '../types';

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => boolean;
  register: (name: string, email: string, phone: string, password: string) => boolean;
  logout: () => void;
  loginWithGoogle: () => void;
}

// Mock users stored in localStorage
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
    // For demo purposes, we'll just check if user exists
    // In real app, password would be hashed and verified
    const users = getStoredUsers();
    const user = users.find(u => u.email === email);
    
    if (user) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      set({ user, isAuthenticated: true });
      return true;
    }
    return false;
  },

  register: (name: string, email: string, phone: string, _password: string) => {
    const users = getStoredUsers();
    
    // Check if email already exists
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
    return true;
  },

  logout: () => {
    localStorage.removeItem(CURRENT_USER_KEY);
    set({ user: null, isAuthenticated: false });
  },

  loginWithGoogle: () => {
    // Placeholder for Google OAuth integration
    // To be implemented with actual Google OAuth flow
    console.log('Google login - to be implemented');
  },
}));
