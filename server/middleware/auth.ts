import type { Request, Response, NextFunction, RequestHandler } from 'express';
import type { User } from '@supabase/supabase-js';
import { supabaseAdmin } from '../lib/supabase';

// Import type augmentation
import '../types/express';

// Test user for local development (when DEV_MODE=true)
const TEST_USER: User = {
  id: 'test-user-00000000-0000-0000-0000-000000000001',
  email: 'admin@fintonico.com',
  aud: 'authenticated',
  role: 'authenticated',
  created_at: new Date().toISOString(),
  app_metadata: {},
  user_metadata: {},
  updated_at: new Date().toISOString(),
  phone: '',
  confirmation_sent_at: undefined,
  confirmed_at: new Date().toISOString(),
  last_sign_in_at: new Date().toISOString(),
  factors: undefined,
  identities: undefined,
  is_anonymous: false,
};

const DEV_MODE = process.env.DEV_MODE === 'true' || !process.env.VITE_SUPABASE_URL;
const DEV_TOKEN = 'dev-token-fintonico';

/**
 * Authentication middleware that validates JWT tokens.
 * Attaches user and userId to the request object.
 */
export const authMiddleware: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
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
      req.user = TEST_USER;
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
};
