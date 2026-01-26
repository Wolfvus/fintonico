import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';
import type { UserProfile, UserRole, SubscriptionTier } from '../types/admin';
import { canImport, canExport, canAccessFeature, type Feature } from '../utils/featureAccess';

// Dev mode configuration
const DEV_MODE = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_DEV_MODE === 'true';
export const DEV_TOKEN = 'dev-token-fintonico';

// Admin whitelist: these emails get super_admin + pro automatically
const ADMIN_EMAILS = ['omargro.mx@gmail.com'];

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

// Dev mode user profile with super_admin role and pro tier for testing
const DEV_USER_PROFILE: UserProfile = {
  id: 'test-user-00000000-0000-0000-0000-000000000001',
  email: 'admin@fintonico.com',
  displayName: 'Dev Admin',
  role: 'super_admin',
  subscriptionTier: 'pro',
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

interface AuthState {
  user: User | null;
  session: Session | null;
  userProfile: UserProfile | null;
  loading: boolean;
  error: string | null;
  isDevMode: boolean;
  signInWithMagicLink: (email: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  checkUser: () => Promise<void>;
  fetchUserProfile: () => Promise<void>;
  clearError: () => void;
  // Role helper methods
  getRole: () => UserRole;
  isAdmin: () => boolean;
  isSuperAdmin: () => boolean;
  canAccessAdmin: () => boolean;
  // Subscription tier helper methods
  getSubscriptionTier: () => SubscriptionTier;
  canImport: () => boolean;
  canExport: () => boolean;
  canAccessFeature: (feature: Feature) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  userProfile: null,
  loading: true,
  error: null,
  isDevMode: DEV_MODE,

  signInWithMagicLink: async (email: string) => {
    set({ loading: true, error: null });

    // Dev mode: sign in instantly
    if (DEV_MODE) {
      console.log('[DEV MODE] Magic link sign-in as test user');
      set({
        user: DEV_USER,
        session: DEV_SESSION,
        userProfile: DEV_USER_PROFILE,
        loading: false,
        error: null,
      });
      localStorage.setItem('fintonico-dev-session', 'true');
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}`,
        },
      });

      if (error) {
        set({ error: error.message, loading: false });
        throw error;
      }

      // Magic link sent successfully - user clicks link in email to complete sign-in
      set({ loading: false, error: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send magic link';
      set({ error: message, loading: false });
      throw err;
    }
  },

  signInWithGoogle: async () => {
    set({ loading: true, error: null });

    // Dev mode: just sign in as test user
    if (DEV_MODE) {
      console.log('[DEV MODE] Google sign-in -> signing in as test user');
      set({
        user: DEV_USER,
        session: DEV_SESSION,
        userProfile: DEV_USER_PROFILE,
        loading: false,
        error: null,
      });
      localStorage.setItem('fintonico-dev-session', 'true');
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        set({ error: error.message, loading: false });
        throw error;
      }

      // Note: The actual sign-in happens via redirect, so loading stays true
      // until the redirect completes and checkUser is called
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Google sign in failed';
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
        userProfile: null,
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
        userProfile: null,
        loading: false,
        error: null,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign out failed';
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
          userProfile: DEV_USER_PROFILE,
          loading: false,
          error: null,
        });
        return;
      }
      set({ user: null, session: null, userProfile: null, loading: false });
      return;
    }

    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        set({ user: null, session: null, userProfile: null, loading: false, error: error.message });
        return;
      }

      set({
        user: session?.user ?? null,
        session: session,
        loading: false,
        error: null,
      });

      // Fetch user profile if we have a session
      if (session) {
        await get().fetchUserProfile();
      }

      // Set up auth state change listener
      supabase.auth.onAuthStateChange(async (_event, session) => {
        set({
          user: session?.user ?? null,
          session: session,
        });
        if (session) {
          await get().fetchUserProfile();
        } else {
          set({ userProfile: null });
        }
      });
    } catch {
      set({ user: null, session: null, userProfile: null, loading: false });
    }
  },

  fetchUserProfile: async () => {
    const { user } = get();
    if (!user) {
      set({ userProfile: null });
      return;
    }

    const isWhitelistedAdmin = ADMIN_EMAILS.includes(user.email || '');

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Failed to fetch user profile:', error);
        // Create a default profile if not found
        set({
          userProfile: {
            id: user.id,
            email: user.email || '',
            role: isWhitelistedAdmin ? 'super_admin' : 'user',
            subscriptionTier: isWhitelistedAdmin ? 'pro' : 'freemium',
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        });
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const row = data as any;
      set({
        userProfile: {
          id: row.id,
          email: row.email,
          displayName: row.display_name,
          role: row.role as UserRole,
          subscriptionTier: (row.subscription_tier as SubscriptionTier) || 'freemium',
          subscriptionUpdatedAt: row.subscription_updated_at,
          isActive: row.is_active,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        },
      });
    } catch (err) {
      console.error('Error fetching user profile:', err);
    }
  },

  clearError: () => set({ error: null }),

  // Role helper methods
  getRole: () => {
    const { userProfile } = get();
    return userProfile?.role || 'user';
  },

  isAdmin: () => {
    const { userProfile } = get();
    return userProfile?.role === 'admin' || userProfile?.role === 'super_admin';
  },

  isSuperAdmin: () => {
    const { userProfile } = get();
    return userProfile?.role === 'super_admin';
  },

  canAccessAdmin: () => {
    const { userProfile } = get();
    return userProfile?.role === 'admin' || userProfile?.role === 'super_admin';
  },

  // Subscription tier helper methods
  getSubscriptionTier: () => {
    const { userProfile } = get();
    return userProfile?.subscriptionTier || 'freemium';
  },

  canImport: () => {
    const { userProfile } = get();
    return canImport(userProfile?.subscriptionTier || 'freemium');
  },

  canExport: () => {
    const { userProfile } = get();
    return canExport(userProfile?.subscriptionTier || 'freemium');
  },

  canAccessFeature: (feature: Feature) => {
    const { userProfile } = get();
    return canAccessFeature(userProfile?.subscriptionTier || 'freemium', feature);
  },
}));
