import { Router, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import type { AuthenticatedRequest } from '../types';
import { authMiddleware } from '../middleware/auth';
import { validate, validateParams, validateQuery, idParamSchema, paginationSchema } from '../middleware/validation';
import { accountService } from '../services';

const router = Router();

// Validation schemas
const createAccountSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  type: z.enum(['asset', 'liability', 'equity', 'income', 'expense']),
  code: z.string().min(1, 'Code is required').max(20),
  currency: z.string().length(3).default('MXN'),
  is_active: z.boolean().default(true),
});

const updateAccountSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  type: z.enum(['asset', 'liability', 'equity', 'income', 'expense']).optional(),
  code: z.string().min(1).max(20).optional(),
  currency: z.string().length(3).optional(),
  is_active: z.boolean().optional(),
});

const listAccountsQuerySchema = paginationSchema.extend({
  type: z.enum(['asset', 'liability', 'equity', 'income', 'expense']).optional(),
  is_active: z.coerce.boolean().optional(),
});

// GET /api/accounts - List all accounts for user
router.get(
  '/',
  authMiddleware,
  validateQuery(listAccountsQuerySchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await accountService.getAccounts(req.userId, req.query as any);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/accounts/:id - Get single account
router.get(
  '/:id',
  authMiddleware,
  validateParams(idParamSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const account = await accountService.getAccountById(req.userId, req.params.id);
      res.json(account);
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/accounts - Create account
router.post(
  '/',
  authMiddleware,
  validate(createAccountSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const account = await accountService.createAccount(req.userId, req.body);
      res.status(201).json(account);
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/accounts/:id - Update account
router.put(
  '/:id',
  authMiddleware,
  validateParams(idParamSchema),
  validate(updateAccountSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const account = await accountService.updateAccount(req.userId, req.params.id, req.body);
      res.json(account);
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/accounts/:id - Delete account
router.delete(
  '/:id',
  authMiddleware,
  validateParams(idParamSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      await accountService.deleteAccount(req.userId, req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/accounts/:id/balance - Get account balance
router.get(
  '/:id/balance',
  authMiddleware,
  validateParams(idParamSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const balance = await accountService.getAccountBalance(
        req.userId,
        req.params.id,
        req.query.asOfDate as string
      );
      res.json(balance);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
