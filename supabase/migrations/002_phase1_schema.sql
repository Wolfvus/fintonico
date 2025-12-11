-- Phase 1: Database Schema & Authentication
-- Expand schema for full double-entry accounting system

-- ============================================
-- ACCOUNTS TABLE
-- User-defined accounts (cash, bank, credit cards, etc.)
-- ============================================
CREATE TABLE IF NOT EXISTS public.accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('asset', 'liability', 'equity', 'income', 'expense')),
  code TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'MXN',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, code)
);

CREATE INDEX idx_accounts_user_id ON public.accounts(user_id);
CREATE INDEX idx_accounts_type ON public.accounts(type);
CREATE INDEX idx_accounts_code ON public.accounts(user_id, code);

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own accounts"
  ON public.accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own accounts"
  ON public.accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own accounts"
  ON public.accounts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own accounts"
  ON public.accounts FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_accounts_updated_at
  BEFORE UPDATE ON public.accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- TRANSACTIONS TABLE
-- Double-entry transactions (header)
-- ============================================
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  memo TEXT,
  transaction_type TEXT CHECK (transaction_type IN ('income', 'expense', 'transfer', 'adjustment')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_date ON public.transactions(date);
CREATE INDEX idx_transactions_type ON public.transactions(transaction_type);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions"
  ON public.transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions"
  ON public.transactions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions"
  ON public.transactions FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- POSTINGS TABLE
-- Individual debits/credits within a transaction
-- ============================================
CREATE TABLE IF NOT EXISTS public.postings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE NOT NULL,
  account_id UUID REFERENCES public.accounts(id) ON DELETE RESTRICT NOT NULL,
  amount_cents BIGINT NOT NULL,
  currency TEXT NOT NULL,
  is_debit BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_postings_transaction_id ON public.postings(transaction_id);
CREATE INDEX idx_postings_account_id ON public.postings(account_id);

-- RLS through transaction ownership
ALTER TABLE public.postings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view postings of their transactions"
  ON public.postings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.transactions t
      WHERE t.id = postings.transaction_id
      AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create postings for their transactions"
  ON public.postings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.transactions t
      WHERE t.id = postings.transaction_id
      AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update postings of their transactions"
  ON public.postings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.transactions t
      WHERE t.id = postings.transaction_id
      AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete postings of their transactions"
  ON public.postings FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.transactions t
      WHERE t.id = postings.transaction_id
      AND t.user_id = auth.uid()
    )
  );

-- ============================================
-- INCOME TABLE
-- Income entries linked to transactions
-- ============================================
CREATE TABLE IF NOT EXISTS public.income (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  amount_cents BIGINT NOT NULL CHECK (amount_cents > 0),
  currency TEXT NOT NULL DEFAULT 'MXN',
  date DATE NOT NULL,
  category TEXT,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_interval TEXT CHECK (recurrence_interval IN ('weekly', 'biweekly', 'monthly', 'yearly')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_income_user_id ON public.income(user_id);
CREATE INDEX idx_income_date ON public.income(date);
CREATE INDEX idx_income_category ON public.income(category);

ALTER TABLE public.income ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own income"
  ON public.income FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own income"
  ON public.income FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own income"
  ON public.income FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own income"
  ON public.income FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_income_updated_at
  BEFORE UPDATE ON public.income
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- UPDATE EXPENSES TABLE
-- Add transaction_id link
-- ============================================
ALTER TABLE public.expenses
ADD COLUMN IF NOT EXISTS transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_expenses_transaction_id ON public.expenses(transaction_id);

-- ============================================
-- EXCHANGE RATES TABLE
-- Store historical exchange rates
-- ============================================
CREATE TABLE IF NOT EXISTS public.exchange_rates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  from_currency TEXT NOT NULL,
  to_currency TEXT NOT NULL,
  rate DECIMAL(20, 10) NOT NULL CHECK (rate > 0),
  fetched_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(from_currency, to_currency, (fetched_at::date))
);

CREATE INDEX idx_exchange_rates_currencies ON public.exchange_rates(from_currency, to_currency);
CREATE INDEX idx_exchange_rates_date ON public.exchange_rates(fetched_at);

-- Exchange rates are public (no RLS needed, read by all authenticated users)
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view exchange rates"
  ON public.exchange_rates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role can insert exchange rates"
  ON public.exchange_rates FOR INSERT
  TO service_role
  WITH CHECK (true);

-- ============================================
-- DEFAULT ACCOUNTS SEED FUNCTION
-- Creates default chart of accounts for new users
-- ============================================
CREATE OR REPLACE FUNCTION public.seed_default_accounts()
RETURNS TRIGGER AS $$
BEGIN
  -- Asset accounts
  INSERT INTO public.accounts (user_id, name, type, code, currency) VALUES
    (NEW.id, 'Cash', 'asset', '1000', 'MXN'),
    (NEW.id, 'Bank Account', 'asset', '1100', 'MXN'),
    (NEW.id, 'Savings', 'asset', '1200', 'MXN'),
    (NEW.id, 'Investments', 'asset', '1300', 'MXN');

  -- Liability accounts
  INSERT INTO public.accounts (user_id, name, type, code, currency) VALUES
    (NEW.id, 'Credit Card', 'liability', '2000', 'MXN'),
    (NEW.id, 'Loans', 'liability', '2100', 'MXN');

  -- Equity accounts
  INSERT INTO public.accounts (user_id, name, type, code, currency) VALUES
    (NEW.id, 'Opening Balance', 'equity', '3000', 'MXN'),
    (NEW.id, 'Retained Earnings', 'equity', '3100', 'MXN');

  -- Income accounts
  INSERT INTO public.accounts (user_id, name, type, code, currency) VALUES
    (NEW.id, 'Salary', 'income', '4000', 'MXN'),
    (NEW.id, 'Freelance Income', 'income', '4100', 'MXN'),
    (NEW.id, 'Investment Income', 'income', '4200', 'MXN'),
    (NEW.id, 'Other Income', 'income', '4900', 'MXN');

  -- Expense accounts
  INSERT INTO public.accounts (user_id, name, type, code, currency) VALUES
    (NEW.id, 'Essential - Housing', 'expense', '5000', 'MXN'),
    (NEW.id, 'Essential - Utilities', 'expense', '5010', 'MXN'),
    (NEW.id, 'Essential - Groceries', 'expense', '5020', 'MXN'),
    (NEW.id, 'Essential - Transportation', 'expense', '5030', 'MXN'),
    (NEW.id, 'Essential - Healthcare', 'expense', '5040', 'MXN'),
    (NEW.id, 'Non-Essential - Dining', 'expense', '5100', 'MXN'),
    (NEW.id, 'Non-Essential - Entertainment', 'expense', '5110', 'MXN'),
    (NEW.id, 'Non-Essential - Shopping', 'expense', '5120', 'MXN'),
    (NEW.id, 'Luxury - Travel', 'expense', '5200', 'MXN'),
    (NEW.id, 'Luxury - Premium Services', 'expense', '5210', 'MXN');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to seed accounts on new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.seed_default_accounts();

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to validate transaction balance (debits = credits)
CREATE OR REPLACE FUNCTION public.validate_transaction_balance(p_transaction_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_debit_total BIGINT;
  v_credit_total BIGINT;
BEGIN
  SELECT
    COALESCE(SUM(CASE WHEN is_debit THEN amount_cents ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN NOT is_debit THEN amount_cents ELSE 0 END), 0)
  INTO v_debit_total, v_credit_total
  FROM public.postings
  WHERE transaction_id = p_transaction_id;

  RETURN v_debit_total = v_credit_total;
END;
$$ LANGUAGE plpgsql;

-- Function to get account balance as of a date
CREATE OR REPLACE FUNCTION public.get_account_balance(
  p_account_id UUID,
  p_as_of_date DATE DEFAULT CURRENT_DATE
)
RETURNS BIGINT AS $$
DECLARE
  v_balance BIGINT;
  v_account_type TEXT;
BEGIN
  SELECT type INTO v_account_type FROM public.accounts WHERE id = p_account_id;

  SELECT COALESCE(SUM(
    CASE
      WHEN v_account_type IN ('asset', 'expense') THEN
        CASE WHEN p.is_debit THEN p.amount_cents ELSE -p.amount_cents END
      ELSE
        CASE WHEN p.is_debit THEN -p.amount_cents ELSE p.amount_cents END
    END
  ), 0)
  INTO v_balance
  FROM public.postings p
  JOIN public.transactions t ON t.id = p.transaction_id
  WHERE p.account_id = p_account_id
  AND t.date <= p_as_of_date;

  RETURN v_balance;
END;
$$ LANGUAGE plpgsql;
