import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      expenses: {
        Row: {
          id: string;
          user_id: string;
          what: string;
          amount: number;
          rating: 'essential' | 'non_essential' | 'luxury';
          date: string;
          category: string | null;
          subcategory: string | null;
          confidence: number | null;
          explanation: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          what: string;
          amount: number;
          rating: 'essential' | 'non_essential' | 'luxury';
          date?: string;
          category?: string | null;
          subcategory?: string | null;
          confidence?: number | null;
          explanation?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          what?: string;
          amount?: number;
          rating?: 'essential' | 'non_essential' | 'luxury';
          date?: string;
          category?: string | null;
          subcategory?: string | null;
          confidence?: number | null;
          explanation?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};