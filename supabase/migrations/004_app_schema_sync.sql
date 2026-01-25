-- Phase 23: App Schema Sync
-- Aligns Supabase schema with current TypeScript types
-- Migration: 004_app_schema_sync.sql

-- ============================================
-- 1. UPDATE EXPENSES TABLE
-- Add missing columns, fix rating constraint
-- ============================================

-- Add currency column (default MXN for existing data)
ALTER TABLE public.expenses
ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'MXN';

-- Add recurring column
ALTER TABLE public.expenses
ADD COLUMN IF NOT EXISTS recurring BOOLEAN DEFAULT false;

-- Fix rating constraint: 'non_essential' → 'discretionary'
-- First, update any existing data
UPDATE public.expenses SET rating = 'discretionary' WHERE rating = 'non_essential';

-- Drop old constraint and add new one
ALTER TABLE public.expenses DROP CONSTRAINT IF EXISTS expenses_rating_check;
ALTER TABLE public.expenses ADD CONSTRAINT expenses_rating_check
  CHECK (rating IN ('essential', 'discretionary', 'luxury'));

-- Create index for currency filtering
CREATE INDEX IF NOT EXISTS idx_expenses_currency ON public.expenses(currency);
CREATE INDEX IF NOT EXISTS idx_expenses_recurring ON public.expenses(recurring);

-- ============================================
-- 2. UPDATE INCOME TABLE
-- Fix amount type, add frequency column
-- ============================================

-- Add amount column as decimal (alongside amount_cents for migration)
ALTER TABLE public.income
ADD COLUMN IF NOT EXISTS amount DECIMAL(12, 2);

-- Migrate existing data from cents to decimal
UPDATE public.income SET amount = amount_cents / 100.0 WHERE amount IS NULL AND amount_cents IS NOT NULL;

-- Set default for new records
ALTER TABLE public.income ALTER COLUMN amount SET DEFAULT 0;

-- Add frequency column with correct values
ALTER TABLE public.income
ADD COLUMN IF NOT EXISTS frequency TEXT NOT NULL DEFAULT 'one-time';

-- Add constraint for frequency values
ALTER TABLE public.income DROP CONSTRAINT IF EXISTS income_frequency_check;
ALTER TABLE public.income ADD CONSTRAINT income_frequency_check
  CHECK (frequency IN ('one-time', 'weekly', 'bi-weekly', 'monthly'));

-- Migrate recurrence_interval to frequency
UPDATE public.income SET frequency =
  CASE
    WHEN is_recurring = false THEN 'one-time'
    WHEN recurrence_interval = 'weekly' THEN 'weekly'
    WHEN recurrence_interval = 'biweekly' THEN 'bi-weekly'
    WHEN recurrence_interval = 'monthly' THEN 'monthly'
    WHEN recurrence_interval = 'yearly' THEN 'monthly' -- No yearly in app, default to monthly
    ELSE 'one-time'
  END
WHERE frequency = 'one-time' AND (is_recurring = true OR recurrence_interval IS NOT NULL);

-- Create index for frequency
CREATE INDEX IF NOT EXISTS idx_income_frequency ON public.income(frequency);

-- ============================================
-- 3. CREATE NET_WORTH_ACCOUNTS TABLE
-- For tracking personal assets and liabilities
-- ============================================
CREATE TABLE IF NOT EXISTS public.net_worth_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('cash', 'bank', 'exchange', 'investment', 'property', 'loan', 'credit-card', 'mortgage', 'other')),
  currency TEXT NOT NULL DEFAULT 'MXN',
  balance DECIMAL(14, 2) NOT NULL DEFAULT 0,
  exclude_from_total BOOLEAN DEFAULT false,
  due_date TEXT, -- ISO date string for one-time due dates
  recurring_due_date INTEGER CHECK (recurring_due_date >= 1 AND recurring_due_date <= 31), -- Day of month
  is_paid_this_month BOOLEAN DEFAULT false,
  last_paid_date TEXT, -- ISO date string
  estimated_yield DECIMAL(5, 2), -- Percentage (e.g., 5.50 for 5.5%)
  last_updated TEXT, -- ISO date string
  -- Liability-specific fields
  min_monthly_payment DECIMAL(12, 2),
  payment_to_avoid_interest DECIMAL(12, 2),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_net_worth_accounts_user_id ON public.net_worth_accounts(user_id);
CREATE INDEX idx_net_worth_accounts_type ON public.net_worth_accounts(type);
CREATE INDEX idx_net_worth_accounts_currency ON public.net_worth_accounts(currency);

ALTER TABLE public.net_worth_accounts ENABLE ROW LEVEL SECURITY;

-- User policies
CREATE POLICY "Users can view their own net worth accounts"
  ON public.net_worth_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own net worth accounts"
  ON public.net_worth_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own net worth accounts"
  ON public.net_worth_accounts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own net worth accounts"
  ON public.net_worth_accounts FOR DELETE
  USING (auth.uid() = user_id);

-- Admin policies
CREATE POLICY "Admins can view all net worth accounts"
  ON public.net_worth_accounts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid() AND up.role IN ('super_admin', 'admin')
    )
  );

CREATE TRIGGER update_net_worth_accounts_updated_at
  BEFORE UPDATE ON public.net_worth_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 4. CREATE LEDGER_ACCOUNTS TABLE
-- Chart of Accounts (bank account reference info)
-- ============================================
CREATE TABLE IF NOT EXISTS public.ledger_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  account_number TEXT,
  clabe TEXT, -- Mexican bank account identifier (18 digits)
  normal_balance TEXT NOT NULL DEFAULT 'debit' CHECK (normal_balance IN ('debit', 'credit')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, name)
);

CREATE INDEX idx_ledger_accounts_user_id ON public.ledger_accounts(user_id);
CREATE INDEX idx_ledger_accounts_name ON public.ledger_accounts(user_id, name);
CREATE INDEX idx_ledger_accounts_active ON public.ledger_accounts(is_active);

ALTER TABLE public.ledger_accounts ENABLE ROW LEVEL SECURITY;

-- User policies
CREATE POLICY "Users can view their own ledger accounts"
  ON public.ledger_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own ledger accounts"
  ON public.ledger_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ledger accounts"
  ON public.ledger_accounts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ledger accounts"
  ON public.ledger_accounts FOR DELETE
  USING (auth.uid() = user_id);

-- Admin policies
CREATE POLICY "Admins can view all ledger accounts"
  ON public.ledger_accounts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid() AND up.role IN ('super_admin', 'admin')
    )
  );

CREATE TRIGGER update_ledger_accounts_updated_at
  BEFORE UPDATE ON public.ledger_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 5. CREATE NET_WORTH_SNAPSHOTS TABLE
-- Monthly net worth history with account breakdowns
-- ============================================
CREATE TABLE IF NOT EXISTS public.net_worth_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  month_end_local TEXT NOT NULL, -- YYYY-MM format
  net_worth_base DECIMAL(14, 2) NOT NULL, -- Total in base currency
  total_assets DECIMAL(14, 2) NOT NULL DEFAULT 0,
  total_liabilities DECIMAL(14, 2) NOT NULL DEFAULT 0,
  base_currency TEXT NOT NULL DEFAULT 'MXN',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, month_end_local)
);

CREATE INDEX idx_net_worth_snapshots_user_id ON public.net_worth_snapshots(user_id);
CREATE INDEX idx_net_worth_snapshots_month ON public.net_worth_snapshots(month_end_local);

ALTER TABLE public.net_worth_snapshots ENABLE ROW LEVEL SECURITY;

-- User policies
CREATE POLICY "Users can view their own snapshots"
  ON public.net_worth_snapshots FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own snapshots"
  ON public.net_worth_snapshots FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own snapshots"
  ON public.net_worth_snapshots FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own snapshots"
  ON public.net_worth_snapshots FOR DELETE
  USING (auth.uid() = user_id);

-- Admin policies
CREATE POLICY "Admins can view all snapshots"
  ON public.net_worth_snapshots FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid() AND up.role IN ('super_admin', 'admin')
    )
  );

-- ============================================
-- 6. CREATE ACCOUNT_SNAPSHOTS TABLE
-- Per-account breakdown within each net worth snapshot
-- ============================================
CREATE TABLE IF NOT EXISTS public.account_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  snapshot_id UUID REFERENCES public.net_worth_snapshots(id) ON DELETE CASCADE NOT NULL,
  account_id UUID, -- NULL if account was deleted
  account_name TEXT NOT NULL, -- Preserved even if account deleted
  account_type TEXT NOT NULL,
  nature TEXT NOT NULL CHECK (nature IN ('asset', 'liability')),
  currency TEXT NOT NULL,
  balance DECIMAL(14, 2) NOT NULL, -- Original currency
  balance_base DECIMAL(14, 2) NOT NULL, -- Converted to base currency
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_account_snapshots_snapshot_id ON public.account_snapshots(snapshot_id);
CREATE INDEX idx_account_snapshots_account_id ON public.account_snapshots(account_id);

ALTER TABLE public.account_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS through snapshot ownership
CREATE POLICY "Users can view their account snapshots"
  ON public.account_snapshots FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.net_worth_snapshots s
      WHERE s.id = account_snapshots.snapshot_id
      AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their account snapshots"
  ON public.account_snapshots FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.net_worth_snapshots s
      WHERE s.id = account_snapshots.snapshot_id
      AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their account snapshots"
  ON public.account_snapshots FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.net_worth_snapshots s
      WHERE s.id = account_snapshots.snapshot_id
      AND s.user_id = auth.uid()
    )
  );

-- Admin policies
CREATE POLICY "Admins can view all account snapshots"
  ON public.account_snapshots FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid() AND up.role IN ('super_admin', 'admin')
    )
  );

-- ============================================
-- 7. HELPER FUNCTION: Get account nature from type
-- ============================================
CREATE OR REPLACE FUNCTION public.get_account_nature(p_type TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN CASE
    WHEN p_type IN ('cash', 'bank', 'exchange', 'investment', 'property') THEN 'asset'
    WHEN p_type IN ('loan', 'credit-card', 'mortgage') THEN 'liability'
    ELSE 'asset' -- Default for 'other'
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- 8. HELPER FUNCTION: Calculate user net worth
-- ============================================
CREATE OR REPLACE FUNCTION public.calculate_user_net_worth(p_user_id UUID)
RETURNS TABLE (
  total_assets DECIMAL(14, 2),
  total_liabilities DECIMAL(14, 2),
  net_worth DECIMAL(14, 2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(CASE WHEN public.get_account_nature(nwa.type) = 'asset' AND NOT nwa.exclude_from_total THEN nwa.balance ELSE 0 END), 0) as total_assets,
    COALESCE(SUM(CASE WHEN public.get_account_nature(nwa.type) = 'liability' AND NOT nwa.exclude_from_total THEN ABS(nwa.balance) ELSE 0 END), 0) as total_liabilities,
    COALESCE(SUM(CASE
      WHEN nwa.exclude_from_total THEN 0
      WHEN public.get_account_nature(nwa.type) = 'asset' THEN nwa.balance
      ELSE nwa.balance -- Liabilities are stored as negative
    END), 0) as net_worth
  FROM public.net_worth_accounts nwa
  WHERE nwa.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
