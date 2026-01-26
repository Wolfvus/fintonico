-- Migration: Admin whitelist for auto-assigning super_admin + pro tier
-- Description: Ensures the admin email gets super_admin role and pro tier on profile creation

-- Update existing admin profile if it exists
UPDATE user_profiles
SET role = 'super_admin',
    subscription_tier = 'pro',
    subscription_updated_at = NOW(),
    updated_at = NOW()
WHERE email = 'omargro.mx@gmail.com';

-- Create trigger function to auto-assign admin role on new user profile creation
CREATE OR REPLACE FUNCTION assign_admin_on_profile_create()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Whitelist: auto-assign super_admin + pro for admin emails
  IF NEW.email = 'omargro.mx@gmail.com' THEN
    NEW.role = 'super_admin';
    NEW.subscription_tier = 'pro';
    NEW.subscription_updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS trigger_assign_admin_on_create ON user_profiles;

-- Create trigger for new profile inserts
CREATE TRIGGER trigger_assign_admin_on_create
BEFORE INSERT ON user_profiles
FOR EACH ROW
EXECUTE FUNCTION assign_admin_on_profile_create();

COMMENT ON FUNCTION assign_admin_on_profile_create() IS 'Auto-assigns super_admin role and pro tier to whitelisted admin emails';
