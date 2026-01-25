export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type AccountType = 'cash' | 'bank' | 'exchange' | 'investment' | 'property' | 'loan' | 'credit-card' | 'mortgage' | 'other';
export type ExpenseRating = 'essential' | 'discretionary' | 'luxury';
export type IncomeFrequency = 'one-time' | 'weekly' | 'bi-weekly' | 'monthly';
export type AccountNature = 'asset' | 'liability';

export type Database = {
  public: {
    Tables: {
      // Double-entry accounting accounts (from migration 002)
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
      // Net Worth accounts (from migration 004)
      net_worth_accounts: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          type: AccountType;
          currency: string;
          balance: number;
          exclude_from_total: boolean;
          due_date: string | null;
          recurring_due_date: number | null;
          is_paid_this_month: boolean;
          last_paid_date: string | null;
          estimated_yield: number | null;
          last_updated: string | null;
          min_monthly_payment: number | null;
          payment_to_avoid_interest: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          type: AccountType;
          currency?: string;
          balance?: number;
          exclude_from_total?: boolean;
          due_date?: string | null;
          recurring_due_date?: number | null;
          is_paid_this_month?: boolean;
          last_paid_date?: string | null;
          estimated_yield?: number | null;
          last_updated?: string | null;
          min_monthly_payment?: number | null;
          payment_to_avoid_interest?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          type?: AccountType;
          currency?: string;
          balance?: number;
          exclude_from_total?: boolean;
          due_date?: string | null;
          recurring_due_date?: number | null;
          is_paid_this_month?: boolean;
          last_paid_date?: string | null;
          estimated_yield?: number | null;
          last_updated?: string | null;
          min_monthly_payment?: number | null;
          payment_to_avoid_interest?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      // Ledger accounts / Chart of Accounts (from migration 004)
      ledger_accounts: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          account_number: string | null;
          clabe: string | null;
          normal_balance: 'debit' | 'credit';
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          account_number?: string | null;
          clabe?: string | null;
          normal_balance?: 'debit' | 'credit';
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          account_number?: string | null;
          clabe?: string | null;
          normal_balance?: 'debit' | 'credit';
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      // Net Worth Snapshots (from migration 004)
      net_worth_snapshots: {
        Row: {
          id: string;
          user_id: string;
          month_end_local: string;
          net_worth_base: number;
          total_assets: number;
          total_liabilities: number;
          base_currency: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          month_end_local: string;
          net_worth_base: number;
          total_assets?: number;
          total_liabilities?: number;
          base_currency?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          month_end_local?: string;
          net_worth_base?: number;
          total_assets?: number;
          total_liabilities?: number;
          base_currency?: string;
          created_at?: string;
        };
      };
      // Account Snapshots (from migration 004)
      account_snapshots: {
        Row: {
          id: string;
          snapshot_id: string;
          account_id: string | null;
          account_name: string;
          account_type: string;
          nature: AccountNature;
          currency: string;
          balance: number;
          balance_base: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          snapshot_id: string;
          account_id?: string | null;
          account_name: string;
          account_type: string;
          nature: AccountNature;
          currency: string;
          balance: number;
          balance_base: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          snapshot_id?: string;
          account_id?: string | null;
          account_name?: string;
          account_type?: string;
          nature?: AccountNature;
          currency?: string;
          balance?: number;
          balance_base?: number;
          created_at?: string;
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
      // Updated income table (migration 004)
      income: {
        Row: {
          id: string;
          user_id: string;
          transaction_id: string | null;
          source: string;
          amount: number;
          amount_cents: number; // Legacy, kept for migration
          currency: string;
          date: string;
          frequency: IncomeFrequency;
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
          amount: number;
          amount_cents?: number;
          currency?: string;
          date: string;
          frequency?: IncomeFrequency;
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
          amount?: number;
          amount_cents?: number;
          currency?: string;
          date?: string;
          frequency?: IncomeFrequency;
          category?: string | null;
          is_recurring?: boolean;
          recurrence_interval?: 'weekly' | 'biweekly' | 'monthly' | 'yearly' | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      // Updated expenses table (migration 004)
      expenses: {
        Row: {
          id: string;
          user_id: string;
          transaction_id: string | null;
          what: string;
          amount: number;
          currency: string;
          rating: ExpenseRating;
          recurring: boolean;
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
          currency?: string;
          rating: ExpenseRating;
          recurring?: boolean;
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
          currency?: string;
          rating?: ExpenseRating;
          recurring?: boolean;
          date?: string;
          category?: string | null;
          subcategory?: string | null;
          confidence?: number | null;
          explanation?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      // Updated exchange_rates table (migration 004)
      exchange_rates: {
        Row: {
          id: string;
          from_currency: string;
          to_currency: string;
          rate: number;
          rate_date: string;
          fetched_at: string;
        };
        Insert: {
          id?: string;
          from_currency: string;
          to_currency: string;
          rate: number;
          rate_date?: string;
          fetched_at?: string;
        };
        Update: {
          id?: string;
          from_currency?: string;
          to_currency?: string;
          rate?: number;
          rate_date?: string;
          fetched_at?: string;
        };
      };
      // User profiles (from migration 003)
      user_profiles: {
        Row: {
          id: string;
          email: string;
          display_name: string | null;
          role: 'super_admin' | 'admin' | 'user';
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          display_name?: string | null;
          role?: 'super_admin' | 'admin' | 'user';
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          display_name?: string | null;
          role?: 'super_admin' | 'admin' | 'user';
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      // System config (from migration 003)
      system_config: {
        Row: {
          id: string;
          key: string;
          value: Json;
          description: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          value: Json;
          description?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          key?: string;
          value?: Json;
          description?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      // Admin audit log (from migration 003)
      admin_audit_log: {
        Row: {
          id: string;
          admin_user_id: string;
          action: string;
          target_user_id: string | null;
          target_resource: string | null;
          details: Json | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          admin_user_id: string;
          action: string;
          target_user_id?: string | null;
          target_resource?: string | null;
          details?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          admin_user_id?: string;
          action?: string;
          target_user_id?: string | null;
          target_resource?: string | null;
          details?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
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
      get_account_nature: {
        Args: { p_type: string };
        Returns: string;
      };
      calculate_user_net_worth: {
        Args: { p_user_id: string };
        Returns: { total_assets: number; total_liabilities: number; net_worth: number }[];
      };
      is_admin: {
        Args: { p_user_id?: string };
        Returns: boolean;
      };
      is_super_admin: {
        Args: { p_user_id?: string };
        Returns: boolean;
      };
      get_user_role: {
        Args: { p_user_id?: string };
        Returns: string;
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
