import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

// Dev mode configuration
const DEV_MODE = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_DEV_MODE === 'true';
export const DEV_TOKEN = 'dev-token-fintonico';

const DEV_USER: User = {
  id: 'test-user-00000000-0000-0000-0000-000000000001',
  email: 'admin@fintonico.com',
  aud: 'authenticated',
  role: 'authenticated',
  created_at: new Date().toISOString(),
  app_metadata: {},
  user_metadata: {},
} as User;

const DEV_SESSION: Session = {
  access_token: DEV_TOKEN,
  refresh_token: 'dev-refresh-token',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: 'bearer',
  user: DEV_USER,
} as Session;

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  isDevMode: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  checkUser: () => Promise<void>;
  clearError: () => void;
  getAccessToken: () => string | null;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  loading: true,
  error: null,
  isDevMode: DEV_MODE,

  signIn: async (email: string, password: string) => {
    set({ loading: true, error: null });

    // Dev mode: accept admin/admin or any valid-looking credentials
    if (DEV_MODE) {
      if ((email === 'admin' && password === 'admin') || (email.includes('@') && password.length >= 1)) {
        console.log('[DEV MODE] Signing in as test user');
        set({
          user: DEV_USER,
          session: DEV_SESSION,
          loading: false,
          error: null,
        });
        localStorage.setItem('fintonico-dev-session', 'true');
        return;
      }
      set({ error: 'Invalid credentials. Try admin/admin', loading: false });
      throw new Error('Invalid credentials');
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        set({ error: error.message, loading: false });
        throw error;
      }

      set({
        user: data.user,
        session: data.session,
        loading: false,
        error: null,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign in failed';
      set({ error: message, loading: false });
      throw err;
    }
  },

  signUp: async (email: string, password: string) => {
    set({ loading: true, error: null });

    // Dev mode: just sign them in
    if (DEV_MODE) {
      console.log('[DEV MODE] Sign up -> signing in as test user');
      set({
        user: DEV_USER,
        session: DEV_SESSION,
        loading: false,
        error: null,
      });
      localStorage.setItem('fintonico-dev-session', 'true');
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        set({ error: error.message, loading: false });
        throw error;
      }

      // If email confirmation is required, user will be null until confirmed
      if (data.user && !data.session) {
        set({
          user: null,
          session: null,
          loading: false,
          error: null,
        });
        return;
      }

      set({
        user: data.user,
        session: data.session,
        loading: false,
        error: null,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign up failed';
      set({ error: message, loading: false });
      throw err;
    }
  },

  signOut: async () => {
    set({ loading: true, error: null });

    // Dev mode: just clear state
    if (DEV_MODE) {
      console.log('[DEV MODE] Signing out');
      localStorage.removeItem('fintonico-dev-session');
      set({
        user: null,
        session: null,
        loading: false,
        error: null,
      });
      return;
    }

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        set({ error: error.message, loading: false });
        throw error;
      }

      set({
        user: null,
        session: null,
        loading: false,
        error: null,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign out failed';
      set({ error: message, loading: false });
      throw err;
    }
  },

  resetPassword: async (email: string) => {
    set({ loading: true, error: null });

    // Dev mode: no-op
    if (DEV_MODE) {
      console.log('[DEV MODE] Password reset requested for:', email);
      set({ loading: false, error: null });
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        set({ error: error.message, loading: false });
        throw error;
      }

      set({ loading: false, error: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Password reset failed';
      set({ error: message, loading: false });
      throw err;
    }
  },

  updatePassword: async (newPassword: string) => {
    set({ loading: true, error: null });

    // Dev mode: no-op
    if (DEV_MODE) {
      console.log('[DEV MODE] Password update requested');
      set({ loading: false, error: null });
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        set({ error: error.message, loading: false });
        throw error;
      }

      set({ loading: false, error: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Password update failed';
      set({ error: message, loading: false });
      throw err;
    }
  },

  checkUser: async () => {
    set({ loading: true });

    // Dev mode: check localStorage for existing session
    if (DEV_MODE) {
      const hasDevSession = localStorage.getItem('fintonico-dev-session');
      if (hasDevSession) {
        console.log('[DEV MODE] Restoring dev session');
        set({
          user: DEV_USER,
          session: DEV_SESSION,
          loading: false,
          error: null,
        });
        return;
      }
      set({ user: null, session: null, loading: false });
      return;
    }

    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        set({ user: null, session: null, loading: false, error: error.message });
        return;
      }

      set({
        user: session?.user ?? null,
        session: session,
        loading: false,
        error: null,
      });

      // Set up auth state change listener
      supabase.auth.onAuthStateChange((_event, session) => {
        set({
          user: session?.user ?? null,
          session: session,
        });
      });
    } catch {
      set({ user: null, session: null, loading: false });
    }
  },

  clearError: () => {
    set({ error: null });
  },

  getAccessToken: () => {
    const state = get();
    return state.session?.access_token ?? null;
  },
}));
