-- Migration: Fix infinite recursion in user_profiles RLS policies
-- Problem: Policies on user_profiles reference user_profiles itself, causing infinite loop
-- Solution: Use SECURITY DEFINER functions to check roles without triggering RLS

-- ============================================
-- 1. Create helper functions (bypass RLS)
-- ============================================

-- Function to get current user's role without triggering RLS
CREATE OR REPLACE FUNCTION public.auth_user_role()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()),
    'user'
  );
$$;

-- Function to check if current user is admin (super_admin or admin)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid()
    AND role IN ('super_admin', 'admin')
  );
$$;

-- Function to check if current user is super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid()
    AND role = 'super_admin'
  );
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.auth_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;

-- ============================================
-- 2. Fix user_profiles policies (remove self-referencing queries)
-- ============================================

-- Drop ALL existing policies on user_profiles to start clean
DROP POLICY IF EXISTS "Users can view their own profile or admins can view all" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Super admins can delete profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "super_admin_can_update_subscription" ON public.user_profiles;

-- Recreate SELECT: users see own profile, admins see all
CREATE POLICY "Users can view own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.user_profiles FOR SELECT
  USING (public.is_admin());

-- Recreate INSERT: allow self-registration and trigger-based creation
CREATE POLICY "Allow profile creation"
  ON public.user_profiles FOR INSERT
  WITH CHECK (
    auth.uid() = id
    OR NOT EXISTS (SELECT 1 FROM public.user_profiles LIMIT 1)
  );

-- Recreate UPDATE: users update own profile, super_admin can update any
CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Super admins can update any profile"
  ON public.user_profiles FOR UPDATE
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- Recreate DELETE: super_admin only
CREATE POLICY "Super admins can delete profiles"
  ON public.user_profiles FOR DELETE
  USING (public.is_super_admin());

-- ============================================
-- 3. Fix admin policies on DATA tables (use functions instead of subqueries)
-- ============================================

-- Fix expenses admin policy
DROP POLICY IF EXISTS "Admins can view all expenses" ON public.expenses;
CREATE POLICY "Admins can view all expenses"
  ON public.expenses FOR SELECT
  USING (public.is_admin());

-- Fix net_worth_accounts admin policy
DROP POLICY IF EXISTS "Admins can view all net worth accounts" ON public.net_worth_accounts;
CREATE POLICY "Admins can view all net worth accounts"
  ON public.net_worth_accounts FOR SELECT
  USING (public.is_admin());

-- Fix ledger_accounts admin policy
DROP POLICY IF EXISTS "Admins can view all ledger accounts" ON public.ledger_accounts;
CREATE POLICY "Admins can view all ledger accounts"
  ON public.ledger_accounts FOR SELECT
  USING (public.is_admin());

-- Fix net_worth_snapshots admin policy
DROP POLICY IF EXISTS "Admins can view all snapshots" ON public.net_worth_snapshots;
CREATE POLICY "Admins can view all snapshots"
  ON public.net_worth_snapshots FOR SELECT
  USING (public.is_admin());

-- Fix account_snapshots admin policy
DROP POLICY IF EXISTS "Admins can view all account snapshots" ON public.account_snapshots;
CREATE POLICY "Admins can view all account snapshots"
  ON public.account_snapshots FOR SELECT
  USING (public.is_admin());

-- Fix income admin policy (if exists)
DROP POLICY IF EXISTS "Admins can view all income" ON public.income;
CREATE POLICY "Admins can view all income"
  ON public.income FOR SELECT
  USING (public.is_admin());

-- ============================================
-- 4. Fix admin audit log policies
-- ============================================
DROP POLICY IF EXISTS "Super admins can view audit log" ON public.admin_audit_log;
CREATE POLICY "Super admins can view audit log"
  ON public.admin_audit_log FOR SELECT
  USING (public.is_super_admin());

DROP POLICY IF EXISTS "Admins can log their own actions" ON public.admin_audit_log;
CREATE POLICY "Admins can log their own actions"
  ON public.admin_audit_log FOR INSERT
  WITH CHECK (
    public.is_admin()
    AND admin_user_id = auth.uid()
  );

-- ============================================
-- 5. Fix system_config policies
-- ============================================
DROP POLICY IF EXISTS "Admins can view system config" ON public.system_config;
CREATE POLICY "Admins can view system config"
  ON public.system_config FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Super admins can update system config" ON public.system_config;
CREATE POLICY "Super admins can update system config"
  ON public.system_config FOR UPDATE
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "Super admins can insert system config" ON public.system_config;
CREATE POLICY "Super admins can insert system config"
  ON public.system_config FOR INSERT
  WITH CHECK (public.is_super_admin());
