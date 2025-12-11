import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../src/types/database';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn(
    'Supabase credentials not found. Set VITE_SUPABASE_URL and SUPABASE_SERVICE_KEY in .env'
  );
}

// Service client for server-side operations (bypasses RLS)
export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Create a client with user's JWT for RLS-protected queries
export function createUserClient(accessToken: string) {
  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
