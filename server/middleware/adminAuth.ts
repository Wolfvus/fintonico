import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../types';
import { supabaseAdmin } from '../lib/supabase';

// Test user for local development (when DEV_MODE=true)
const TEST_USER_PROFILE = {
  id: 'test-user-00000000-0000-0000-0000-000000000001',
  email: 'admin@fintonico.com',
  role: 'super_admin',
  is_active: true,
};

const DEV_MODE = process.env.DEV_MODE === 'true' || !process.env.VITE_SUPABASE_URL;

/**
 * Middleware to require admin or super_admin role
 */
export async function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Dev mode: allow access
    if (DEV_MODE) {
      (req as any).userProfile = TEST_USER_PROFILE;
      console.log('[DEV MODE] Admin access granted (super_admin)');
      next();
      return;
    }

    // Must be authenticated first
    if (!req.userId) {
      res.status(401).json({
        error: 'Unauthorized',
        code: 'NOT_AUTHENTICATED',
      });
      return;
    }

    // Fetch user profile
    const { data: profile, error } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('id', req.userId)
      .single();

    if (error || !profile) {
      res.status(403).json({
        error: 'Forbidden',
        code: 'PROFILE_NOT_FOUND',
      });
      return;
    }

    // Check if user is admin or super_admin
    if (!['admin', 'super_admin'].includes(profile.role)) {
      res.status(403).json({
        error: 'Forbidden',
        code: 'INSUFFICIENT_PERMISSIONS',
        message: 'Admin access required',
      });
      return;
    }

    // Check if user is active
    if (!profile.is_active) {
      res.status(403).json({
        error: 'Forbidden',
        code: 'ACCOUNT_INACTIVE',
        message: 'Account is inactive',
      });
      return;
    }

    // Attach profile to request
    (req as any).userProfile = profile;
    next();
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'ADMIN_AUTH_ERROR',
    });
  }
}

/**
 * Middleware to require super_admin role
 */
export async function requireSuperAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Dev mode: allow access
    if (DEV_MODE) {
      (req as any).userProfile = TEST_USER_PROFILE;
      console.log('[DEV MODE] Super admin access granted');
      next();
      return;
    }

    // Must be authenticated first
    if (!req.userId) {
      res.status(401).json({
        error: 'Unauthorized',
        code: 'NOT_AUTHENTICATED',
      });
      return;
    }

    // Fetch user profile
    const { data: profile, error } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('id', req.userId)
      .single();

    if (error || !profile) {
      res.status(403).json({
        error: 'Forbidden',
        code: 'PROFILE_NOT_FOUND',
      });
      return;
    }

    // Check if user is super_admin
    if (profile.role !== 'super_admin') {
      res.status(403).json({
        error: 'Forbidden',
        code: 'INSUFFICIENT_PERMISSIONS',
        message: 'Super admin access required',
      });
      return;
    }

    // Check if user is active
    if (!profile.is_active) {
      res.status(403).json({
        error: 'Forbidden',
        code: 'ACCOUNT_INACTIVE',
        message: 'Account is inactive',
      });
      return;
    }

    // Attach profile to request
    (req as any).userProfile = profile;
    next();
  } catch (error) {
    console.error('Super admin auth middleware error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'SUPER_ADMIN_AUTH_ERROR',
    });
  }
}
