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
import { supabaseAdmin } from '../lib/supabase';
import { NotFoundError, BadRequestError } from '../middleware/errorHandler';

const router = Router();

// Validation schemas
const createIncomeSchema = z.object({
  source: z.string().min(1, 'Source is required').max(255),
  amount_cents: z.number().int().positive('Amount must be positive'),
  currency: z.string().length(3).default('MXN'),
  date: z.string().date(),
  category: z.string().max(100).optional(),
  is_recurring: z.boolean().default(false),
  recurrence_interval: z.enum(['weekly', 'biweekly', 'monthly', 'yearly']).optional(),
  deposit_account_id: z.string().uuid().optional(),
  income_account_id: z.string().uuid().optional(),
});

const updateIncomeSchema = z.object({
  source: z.string().min(1).max(255).optional(),
  amount_cents: z.number().int().positive().optional(),
  currency: z.string().length(3).optional(),
  date: z.string().date().optional(),
  category: z.string().max(100).optional(),
  is_recurring: z.boolean().optional(),
  recurrence_interval: z.enum(['weekly', 'biweekly', 'monthly', 'yearly']).optional().nullable(),
});

const listIncomeQuerySchema = paginationSchema.merge(dateRangeSchema).extend({
  category: z.string().optional(),
  is_recurring: z.coerce.boolean().optional(),
});

// GET /api/income - List income entries
router.get(
  '/',
  authMiddleware as any,
  validateQuery(listIncomeQuerySchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { page, limit, startDate, endDate, category, is_recurring } = req.query as any;
      const offset = (page - 1) * limit;

      let query = supabaseAdmin
        .from('income')
        .select('*', { count: 'exact' })
        .eq('user_id', req.userId)
        .order('date', { ascending: false });

      if (startDate) {
        query = query.gte('date', startDate);
      }

      if (endDate) {
        query = query.lte('date', endDate);
      }

      if (category) {
        query = query.eq('category', category);
      }

      if (is_recurring !== undefined) {
        query = query.eq('is_recurring', is_recurring);
      }

      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      res.json({
        data: data || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/income/:id - Get single income entry
router.get(
  '/:id',
  authMiddleware as any,
  validateParams(idParamSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const { data, error } = await supabaseAdmin
        .from('income')
        .select('*, transactions(*, postings(*))')
        .eq('id', id)
        .eq('user_id', req.userId)
        .single();

      if (error && error.code === 'PGRST116') {
        throw new NotFoundError('Income', id);
      }
      if (error) throw error;

      res.json(data);
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/income - Create income with optional transaction
router.post(
  '/',
  authMiddleware as any,
  validate(createIncomeSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { deposit_account_id, income_account_id, ...incomeData } = req.body;
      let transactionId: string | null = null;

      // If accounts provided, create a double-entry transaction
      if (deposit_account_id && income_account_id) {
        // Verify accounts belong to user
        const { data: accounts, error: accountsError } = await supabaseAdmin
          .from('accounts')
          .select('id, type')
          .in('id', [deposit_account_id, income_account_id])
          .eq('user_id', req.userId);

        if (accountsError) throw accountsError;

        if (!accounts || accounts.length !== 2) {
          throw new BadRequestError('One or more accounts not found');
        }

        // Create transaction
        const { data: transaction, error: txError } = await supabaseAdmin
          .from('transactions')
          .insert({
            user_id: req.userId,
            date: incomeData.date,
            description: `Income: ${incomeData.source}`,
            transaction_type: 'income',
          })
          .select()
          .single();

        if (txError) throw txError;
        transactionId = transaction.id;

        // Create postings (debit asset, credit income)
        const { error: postingsError } = await supabaseAdmin.from('postings').insert([
          {
            transaction_id: transactionId,
            account_id: deposit_account_id,
            amount_cents: incomeData.amount_cents,
            currency: incomeData.currency,
            is_debit: true,
          },
          {
            transaction_id: transactionId,
            account_id: income_account_id,
            amount_cents: incomeData.amount_cents,
            currency: incomeData.currency,
            is_debit: false,
          },
        ]);

        if (postingsError) {
          // Rollback transaction
          await supabaseAdmin.from('transactions').delete().eq('id', transactionId);
          throw postingsError;
        }
      }

      // Create income entry
      const { data, error } = await supabaseAdmin
        .from('income')
        .insert({
          ...incomeData,
          user_id: req.userId,
          transaction_id: transactionId,
        })
        .select()
        .single();

      if (error) {
        // Rollback transaction if income creation fails
        if (transactionId) {
          await supabaseAdmin.from('transactions').delete().eq('id', transactionId);
        }
        throw error;
      }

      res.status(201).json(data);
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/income/:id - Update income
router.put(
  '/:id',
  authMiddleware as any,
  validateParams(idParamSchema),
  validate(updateIncomeSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      // Verify income exists and belongs to user
      const { data: existing, error: findError } = await supabaseAdmin
        .from('income')
        .select('id, transaction_id')
        .eq('id', id)
        .eq('user_id', req.userId)
        .single();

      if (findError && findError.code === 'PGRST116') {
        throw new NotFoundError('Income', id);
      }
      if (findError) throw findError;

      // Update income
      const { data, error } = await supabaseAdmin
        .from('income')
        .update(req.body)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // If amount changed and there's a linked transaction, update postings
      if (req.body.amount_cents && existing.transaction_id) {
        const { error: postingsError } = await supabaseAdmin
          .from('postings')
          .update({ amount_cents: req.body.amount_cents })
          .eq('transaction_id', existing.transaction_id);

        if (postingsError) throw postingsError;
      }

      res.json(data);
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/income/:id - Delete income
router.delete(
  '/:id',
  authMiddleware as any,
  validateParams(idParamSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      // Get income to check for linked transaction
      const { data: income, error: findError } = await supabaseAdmin
        .from('income')
        .select('transaction_id')
        .eq('id', id)
        .eq('user_id', req.userId)
        .single();

      if (findError && findError.code === 'PGRST116') {
        throw new NotFoundError('Income', id);
      }
      if (findError) throw findError;

      // Delete income (transaction will cascade if linked)
      const { error } = await supabaseAdmin
        .from('income')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Delete linked transaction if exists
      if (income.transaction_id) {
        await supabaseAdmin
          .from('transactions')
          .delete()
          .eq('id', income.transaction_id);
      }

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

export default router;
