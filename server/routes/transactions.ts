import { Router, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import type { AuthenticatedRequest } from '../types';
import { authMiddleware } from '../middleware/auth';
import {
  validate,
  validateParams,
  validateQuery,
  idParamSchema,
  paginationSchema,
  dateRangeSchema,
} from '../middleware/validation';
import { transactionService } from '../services';

const router = Router();

// Validation schemas
const postingSchema = z.object({
  account_id: z.string().uuid(),
  amount_cents: z.number().int().positive(),
  currency: z.string().length(3),
  is_debit: z.boolean(),
});

const createTransactionSchema = z.object({
  date: z.string().date(),
  description: z.string().min(1, 'Description is required').max(255),
  memo: z.string().max(500).optional(),
  transaction_type: z.enum(['income', 'expense', 'transfer', 'adjustment']).optional(),
  postings: z.array(postingSchema).min(2, 'At least 2 postings required'),
});

const updateTransactionSchema = z.object({
  date: z.string().date().optional(),
  description: z.string().min(1).max(255).optional(),
  memo: z.string().max(500).optional(),
  transaction_type: z.enum(['income', 'expense', 'transfer', 'adjustment']).optional(),
  postings: z.array(postingSchema).min(2).optional(),
});

const listTransactionsQuerySchema = paginationSchema.merge(dateRangeSchema).extend({
  type: z.enum(['income', 'expense', 'transfer', 'adjustment']).optional(),
  account_id: z.string().uuid().optional(),
});

// GET /api/transactions - List transactions
router.get(
  '/',
  authMiddleware as any,
  validateQuery(listTransactionsQuerySchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await transactionService.getTransactions(req.userId, req.query as any);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/transactions/:id - Get single transaction with postings
router.get(
  '/:id',
  authMiddleware as any,
  validateParams(idParamSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const transaction = await transactionService.getTransactionById(req.userId, req.params.id);
      res.json(transaction);
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/transactions - Create transaction with postings
router.post(
  '/',
  authMiddleware as any,
  validate(createTransactionSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const transaction = await transactionService.createTransaction(req.userId, req.body);
      res.status(201).json(transaction);
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/transactions/:id - Update transaction
router.put(
  '/:id',
  authMiddleware as any,
  validateParams(idParamSchema),
  validate(updateTransactionSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const transaction = await transactionService.updateTransaction(
        req.userId,
        req.params.id,
        req.body
      );
      res.json(transaction);
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/transactions/:id - Delete transaction
router.delete(
  '/:id',
  authMiddleware as any,
  validateParams(idParamSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      await transactionService.deleteTransaction(req.userId, req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

export default router;
