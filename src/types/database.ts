export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      accounts: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          type: 'asset' | 'liability' | 'equity' | 'income' | 'expense';
          code: string;
          currency: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          type: 'asset' | 'liability' | 'equity' | 'income' | 'expense';
          code: string;
          currency?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          type?: 'asset' | 'liability' | 'equity' | 'income' | 'expense';
          code?: string;
          currency?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          description: string;
          memo: string | null;
          transaction_type: 'income' | 'expense' | 'transfer' | 'adjustment' | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          description: string;
          memo?: string | null;
          transaction_type?: 'income' | 'expense' | 'transfer' | 'adjustment' | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          description?: string;
          memo?: string | null;
          transaction_type?: 'income' | 'expense' | 'transfer' | 'adjustment' | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      postings: {
        Row: {
          id: string;
          transaction_id: string;
          account_id: string;
          amount_cents: number;
          currency: string;
          is_debit: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          transaction_id: string;
          account_id: string;
          amount_cents: number;
          currency: string;
          is_debit: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          transaction_id?: string;
          account_id?: string;
          amount_cents?: number;
          currency?: string;
          is_debit?: boolean;
          created_at?: string;
        };
      };
      income: {
        Row: {
          id: string;
          user_id: string;
          transaction_id: string | null;
          source: string;
          amount_cents: number;
          currency: string;
          date: string;
          category: string | null;
          is_recurring: boolean;
          recurrence_interval: 'weekly' | 'biweekly' | 'monthly' | 'yearly' | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          transaction_id?: string | null;
          source: string;
          amount_cents: number;
          currency?: string;
          date: string;
          category?: string | null;
          is_recurring?: boolean;
          recurrence_interval?: 'weekly' | 'biweekly' | 'monthly' | 'yearly' | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          transaction_id?: string | null;
          source?: string;
          amount_cents?: number;
          currency?: string;
          date?: string;
          category?: string | null;
          is_recurring?: boolean;
          recurrence_interval?: 'weekly' | 'biweekly' | 'monthly' | 'yearly' | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      expenses: {
        Row: {
          id: string;
          user_id: string;
          transaction_id: string | null;
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
          transaction_id?: string | null;
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
          transaction_id?: string | null;
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
      exchange_rates: {
        Row: {
          id: string;
          from_currency: string;
          to_currency: string;
          rate: number;
          fetched_at: string;
        };
        Insert: {
          id?: string;
          from_currency: string;
          to_currency: string;
          rate: number;
          fetched_at?: string;
        };
        Update: {
          id?: string;
          from_currency?: string;
          to_currency?: string;
          rate?: number;
          fetched_at?: string;
        };
      };
    };
    Functions: {
      validate_transaction_balance: {
        Args: { p_transaction_id: string };
        Returns: boolean;
      };
      get_account_balance: {
        Args: { p_account_id: string; p_as_of_date?: string };
        Returns: number;
      };
    };
  };
};

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];
