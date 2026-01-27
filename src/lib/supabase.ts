import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase credentials not found. Running in offline mode. ' +
      'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env for full functionality.'
  );
}

export const supabase = createClient<Database>(
  supabaseUrl || 'http://localhost:54321',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);

// Untyped client for operations where TypeScript inference fails
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabaseUntyped = supabase as any;

/**
 * Get the current user from the local session (no network request).
 * Use this instead of supabase.auth.getUser() which makes an HTTP call.
 * Supabase RLS enforces user isolation via the JWT token already.
 */
export async function getSessionUser() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error('Not authenticated');
  return session.user;
}

export type { Database };
