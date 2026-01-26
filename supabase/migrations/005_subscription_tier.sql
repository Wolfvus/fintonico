-- Migration: Add subscription tier to user_profiles
-- Description: Implements a two-tier subscription system (freemium/pro) with feature gating

-- Add subscription_tier column to user_profiles
ALTER TABLE user_profiles
ADD COLUMN subscription_tier TEXT NOT NULL DEFAULT 'freemium'
CHECK (subscription_tier IN ('freemium', 'pro'));

-- Add subscription_updated_at timestamp
ALTER TABLE user_profiles
ADD COLUMN subscription_updated_at TIMESTAMPTZ;

-- Create index for subscription tier queries
CREATE INDEX idx_user_profiles_subscription_tier ON user_profiles(subscription_tier);

-- Create function to check if user has pro tier
CREATE OR REPLACE FUNCTION has_pro_tier(p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = p_user_id
    AND subscription_tier = 'pro'
    AND is_active = true
  );
$$;

-- Create function to get user's subscription tier
CREATE OR REPLACE FUNCTION get_subscription_tier(p_user_id UUID DEFAULT auth.uid())
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT subscription_tier FROM user_profiles WHERE id = p_user_id),
    'freemium'
  );
$$;

-- RLS Policy: Only super_admin can update subscription_tier
-- First, drop any existing policies that might conflict
DROP POLICY IF EXISTS "super_admin_can_update_subscription" ON user_profiles;

-- Create policy allowing super_admin to update subscription tier
CREATE POLICY "super_admin_can_update_subscription" ON user_profiles
FOR UPDATE
USING (
  -- User must be a super_admin
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND role = 'super_admin'
  )
)
WITH CHECK (
  -- Only super_admin can change subscription_tier
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND role = 'super_admin'
  )
);

-- Trigger to update subscription_updated_at when tier changes
CREATE OR REPLACE FUNCTION update_subscription_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.subscription_tier IS DISTINCT FROM NEW.subscription_tier THEN
    NEW.subscription_updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_subscription_timestamp ON user_profiles;

CREATE TRIGGER trigger_update_subscription_timestamp
BEFORE UPDATE ON user_profiles
FOR EACH ROW
EXECUTE FUNCTION update_subscription_timestamp();

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION has_pro_tier(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_subscription_tier(UUID) TO authenticated;

-- Comment on columns
COMMENT ON COLUMN user_profiles.subscription_tier IS 'User subscription tier: freemium (default) or pro';
COMMENT ON COLUMN user_profiles.subscription_updated_at IS 'Timestamp when subscription tier was last changed';
