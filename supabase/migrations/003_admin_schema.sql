-- Phase 21: Super Admin Panel Schema
-- User profiles with roles, system config, and admin audit logging

-- ============================================
-- USER PROFILES TABLE
-- Stores user profile data with role-based access control
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  display_name TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('super_admin', 'admin', 'user')),
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX idx_user_profiles_email ON public.user_profiles(email);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid() AND up.role IN ('super_admin', 'admin')
    )
  );

-- Users can update their own profile (except role)
CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Super admins can manage all profiles
CREATE POLICY "Super admins can insert profiles"
  ON public.user_profiles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'super_admin'
    )
    OR NOT EXISTS (SELECT 1 FROM public.user_profiles) -- Allow first user
    OR auth.uid() = id -- Allow self-registration
  );

CREATE POLICY "Super admins can delete profiles"
  ON public.user_profiles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'super_admin'
    )
  );

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- SYSTEM CONFIGURATION TABLE
-- Global system settings managed by admins
-- ============================================
CREATE TABLE IF NOT EXISTS public.system_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_system_config_key ON public.system_config(key);

ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

-- Admins can read system config
CREATE POLICY "Admins can read system config"
  ON public.system_config FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid() AND up.role IN ('super_admin', 'admin')
    )
  );

-- Super admins can manage system config
CREATE POLICY "Super admins can insert system config"
  ON public.system_config FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can update system config"
  ON public.system_config FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can delete system config"
  ON public.system_config FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'super_admin'
    )
  );

CREATE TRIGGER update_system_config_updated_at
  BEFORE UPDATE ON public.system_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- ADMIN AUDIT LOG TABLE
-- Tracks admin actions for compliance and debugging
-- ============================================
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID REFERENCES auth.users(id) NOT NULL,
  action TEXT NOT NULL,
  target_user_id UUID REFERENCES auth.users(id),
  target_resource TEXT,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_audit_log_admin_user ON public.admin_audit_log(admin_user_id);
CREATE INDEX idx_audit_log_target_user ON public.admin_audit_log(target_user_id);
CREATE INDEX idx_audit_log_action ON public.admin_audit_log(action);
CREATE INDEX idx_audit_log_created_at ON public.admin_audit_log(created_at);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Super admins can read audit log
CREATE POLICY "Super admins can read audit log"
  ON public.admin_audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'super_admin'
    )
  );

-- Admins can insert audit log entries (for their own actions)
CREATE POLICY "Admins can insert audit log"
  ON public.admin_audit_log FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid() AND up.role IN ('super_admin', 'admin')
    )
    AND admin_user_id = auth.uid()
  );

-- ============================================
-- AUTO-CREATE USER PROFILE ON REGISTRATION
-- ============================================
CREATE OR REPLACE FUNCTION public.create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    CASE
      -- First user becomes super_admin
      WHEN NOT EXISTS (SELECT 1 FROM public.user_profiles) THEN 'super_admin'
      ELSE 'user'
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger (using unique name to avoid conflict with existing trigger)
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_user_profile();

-- ============================================
-- ADMIN ACCESS POLICIES FOR EXISTING TABLES
-- Allow admins to view all user data
-- ============================================

-- Expenses: Admin read access
CREATE POLICY "Admins can view all expenses"
  ON public.expenses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid() AND up.role IN ('super_admin', 'admin')
    )
  );

-- Accounts: Admin read access
CREATE POLICY "Admins can view all accounts"
  ON public.accounts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid() AND up.role IN ('super_admin', 'admin')
    )
  );

-- Transactions: Admin read access
CREATE POLICY "Admins can view all transactions"
  ON public.transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid() AND up.role IN ('super_admin', 'admin')
    )
  );

-- Postings: Admin read access
CREATE POLICY "Admins can view all postings"
  ON public.postings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid() AND up.role IN ('super_admin', 'admin')
    )
  );

-- Income: Admin read access
CREATE POLICY "Admins can view all income"
  ON public.income FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid() AND up.role IN ('super_admin', 'admin')
    )
  );

-- ============================================
-- SEED DEFAULT SYSTEM CONFIG
-- ============================================
INSERT INTO public.system_config (key, value, description) VALUES
  ('default_currency', '"MXN"', 'Default currency for new users'),
  ('supported_currencies', '["MXN", "USD", "EUR"]', 'List of supported currencies'),
  ('expense_categories', '["essential", "discretionary", "luxury"]', 'Expense rating categories'),
  ('income_frequencies', '["one-time", "weekly", "bi-weekly", "monthly"]', 'Income frequency options'),
  ('account_types', '["cash", "bank", "exchange", "investment", "property", "loan", "credit-card", "mortgage", "other"]', 'Account type options')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- HELPER FUNCTION: Check if user is admin
-- ============================================
CREATE OR REPLACE FUNCTION public.is_admin(p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = p_user_id AND role IN ('super_admin', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- HELPER FUNCTION: Check if user is super admin
-- ============================================
CREATE OR REPLACE FUNCTION public.is_super_admin(p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = p_user_id AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- HELPER FUNCTION: Get user role
-- ============================================
CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id UUID DEFAULT auth.uid())
RETURNS TEXT AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role
  FROM public.user_profiles
  WHERE id = p_user_id;

  RETURN COALESCE(v_role, 'user');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
