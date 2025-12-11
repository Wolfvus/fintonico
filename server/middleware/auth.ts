import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../types';
import { supabaseAdmin } from '../lib/supabase';

// Test user for local development (when DEV_MODE=true)
const TEST_USER = {
  id: 'test-user-00000000-0000-0000-0000-000000000001',
  email: 'admin@fintonico.com',
  aud: 'authenticated',
  role: 'authenticated',
  created_at: new Date().toISOString(),
  app_metadata: {},
  user_metadata: {},
};

const DEV_MODE = process.env.DEV_MODE === 'true' || !process.env.VITE_SUPABASE_URL;
const DEV_TOKEN = 'dev-token-fintonico';

export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'Unauthorized',
        code: 'MISSING_TOKEN',
      });
      return;
    }

    const token = authHeader.substring(7);

    // Dev mode: accept hardcoded token
    if (DEV_MODE && token === DEV_TOKEN) {
      req.user = TEST_USER as any;
      req.userId = TEST_USER.id;
      console.log('[DEV MODE] Authenticated as test user');
      next();
      return;
    }

    // Production: validate with Supabase
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      res.status(401).json({
        error: 'Unauthorized',
        code: 'INVALID_TOKEN',
      });
      return;
    }

    req.user = user;
    req.userId = user.id;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'AUTH_ERROR',
    });
  }
}
