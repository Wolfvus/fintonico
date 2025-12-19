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
const createExpenseSchema = z.object({
  what: z.string().min(1, 'Description is required').max(255),
  amount: z.number().positive('Amount must be positive'),
  rating: z.enum(['essential', 'non_essential', 'luxury']),
  date: z.string().date(),
  category: z.string().max(100).optional(),
  subcategory: z.string().max(100).optional(),
  funding_account_id: z.string().uuid().optional(),
  expense_account_id: z.string().uuid().optional(),
});

const updateExpenseSchema = z.object({
  what: z.string().min(1).max(255).optional(),
  amount: z.number().positive().optional(),
  rating: z.enum(['essential', 'non_essential', 'luxury']).optional(),
  date: z.string().date().optional(),
  category: z.string().max(100).optional(),
  subcategory: z.string().max(100).optional(),
});

const listExpensesQuerySchema = paginationSchema.merge(dateRangeSchema).extend({
  rating: z.enum(['essential', 'non_essential', 'luxury']).optional(),
  category: z.string().optional(),
});

// Helper: Keyword-based categorization (fallback)
function categorizeExpenseByKeyword(description: string) {
  const lower = description.toLowerCase();

  if (lower.includes('coffee') || lower.includes('starbucks') || lower.includes('dunkin')) {
    return { category: 'Food & Dining', subcategory: 'Coffee & Tea', confidence: 0.95, explanation: 'Detected coffee-related keyword' };
  }
  if (lower.includes('uber') || lower.includes('lyft') || lower.includes('taxi')) {
    return { category: 'Transportation', subcategory: 'Ride Share', confidence: 0.95, explanation: 'Detected ride-sharing service' };
  }
  if (lower.includes('amazon') || lower.includes('walmart') || lower.includes('target')) {
    return { category: 'Shopping', subcategory: 'General', confidence: 0.85, explanation: 'Detected retail store' };
  }
  if (lower.includes('restaurant') || lower.includes('food') || lower.includes('lunch') || lower.includes('dinner')) {
    return { category: 'Food & Dining', subcategory: 'Restaurants', confidence: 0.9, explanation: 'Detected food-related keyword' };
  }
  if (lower.includes('rent') || lower.includes('mortgage')) {
    return { category: 'Bills & Utilities', subcategory: 'Rent/Mortgage', confidence: 0.95, explanation: 'Detected housing payment' };
  }
  if (lower.includes('gym') || lower.includes('fitness')) {
    return { category: 'Healthcare', subcategory: 'Fitness', confidence: 0.9, explanation: 'Detected fitness-related keyword' };
  }
  if (lower.includes('electric') || lower.includes('gas') || lower.includes('water') || lower.includes('utility')) {
    return { category: 'Bills & Utilities', subcategory: 'Utilities', confidence: 0.9, explanation: 'Detected utility payment' };
  }
  if (lower.includes('grocery') || lower.includes('supermarket') || lower.includes('market')) {
    return { category: 'Food & Dining', subcategory: 'Groceries', confidence: 0.9, explanation: 'Detected grocery store' };
  }

  return { category: 'Other', subcategory: 'Miscellaneous', confidence: 0.5, explanation: 'Could not determine specific category' };
}

// GET /api/expenses - List expenses
router.get(
  '/',
  authMiddleware,
  validateQuery(listExpensesQuerySchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { page, limit, startDate, endDate, rating, category } = req.query as any;
      const offset = (page - 1) * limit;

      let query = supabaseAdmin
        .from('expenses')
        .select('*', { count: 'exact' })
        .eq('user_id', req.userId)
        .order('date', { ascending: false });

      if (startDate) {
        query = query.gte('date', startDate);
      }

      if (endDate) {
        query = query.lte('date', endDate);
      }

      if (rating) {
        query = query.eq('rating', rating);
      }

      if (category) {
        query = query.eq('category', category);
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

// GET /api/expenses/:id - Get single expense
router.get(
  '/:id',
  authMiddleware,
  validateParams(idParamSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const { data, error } = await supabaseAdmin
        .from('expenses')
        .select('*, transactions(*, postings(*))')
        .eq('id', id)
        .eq('user_id', req.userId)
        .single();

      if (error && error.code === 'PGRST116') {
        throw new NotFoundError('Expense', id);
      }
      if (error) throw error;

      res.json(data);
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/expenses - Create expense with optional transaction
router.post(
  '/',
  authMiddleware,
  validate(createExpenseSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { funding_account_id, expense_account_id, ...expenseData } = req.body;
      let transactionId: string | null = null;

      // Convert amount to cents for transaction
      const amountCents = Math.round(expenseData.amount * 100);

      // If accounts provided, create a double-entry transaction
      if (funding_account_id && expense_account_id) {
        // Verify accounts belong to user
        const { data: accounts, error: accountsError } = await supabaseAdmin
          .from('accounts')
          .select('id, type')
          .in('id', [funding_account_id, expense_account_id])
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
            date: expenseData.date,
            description: `Expense: ${expenseData.what}`,
            transaction_type: 'expense',
          })
          .select()
          .single();

        if (txError) throw txError;
        transactionId = transaction.id;

        // Create postings (debit expense, credit asset/liability)
        const { error: postingsError } = await supabaseAdmin.from('postings').insert([
          {
            transaction_id: transactionId,
            account_id: expense_account_id,
            amount_cents: amountCents,
            currency: 'MXN',
            is_debit: true,
          },
          {
            transaction_id: transactionId,
            account_id: funding_account_id,
            amount_cents: amountCents,
            currency: 'MXN',
            is_debit: false,
          },
        ]);

        if (postingsError) {
          // Rollback transaction
          await supabaseAdmin.from('transactions').delete().eq('id', transactionId);
          throw postingsError;
        }
      }

      // Create expense entry
      const { data, error } = await supabaseAdmin
        .from('expenses')
        .insert({
          ...expenseData,
          user_id: req.userId,
          transaction_id: transactionId,
        })
        .select()
        .single();

      if (error) {
        // Rollback transaction if expense creation fails
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

// POST /api/expenses/:id/categorize - AI categorization
router.post(
  '/:id/categorize',
  authMiddleware,
  validateParams(idParamSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      // Get the expense
      const { data: expense, error: findError } = await supabaseAdmin
        .from('expenses')
        .select('what')
        .eq('id', id)
        .eq('user_id', req.userId)
        .single();

      if (findError && findError.code === 'PGRST116') {
        throw new NotFoundError('Expense', id);
      }
      if (findError) throw findError;

      // Categorize using keyword matching (can be extended with AI later)
      const categorization = categorizeExpenseByKeyword(expense.what);

      // Update the expense
      const { data, error } = await supabaseAdmin
        .from('expenses')
        .update({
          category: categorization.category,
          subcategory: categorization.subcategory,
          confidence: categorization.confidence,
          explanation: categorization.explanation,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      res.json({
        ...categorization,
        expense: data,
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/expenses/:id - Update expense
router.put(
  '/:id',
  authMiddleware,
  validateParams(idParamSchema),
  validate(updateExpenseSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      // Verify expense exists and belongs to user
      const { data: existing, error: findError } = await supabaseAdmin
        .from('expenses')
        .select('id, transaction_id')
        .eq('id', id)
        .eq('user_id', req.userId)
        .single();

      if (findError && findError.code === 'PGRST116') {
        throw new NotFoundError('Expense', id);
      }
      if (findError) throw findError;

      // Update expense
      const { data, error } = await supabaseAdmin
        .from('expenses')
        .update(req.body)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // If amount changed and there's a linked transaction, update postings
      if (req.body.amount && existing.transaction_id) {
        const amountCents = Math.round(req.body.amount * 100);
        const { error: postingsError } = await supabaseAdmin
          .from('postings')
          .update({ amount_cents: amountCents })
          .eq('transaction_id', existing.transaction_id);

        if (postingsError) throw postingsError;
      }

      res.json(data);
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/expenses/:id - Delete expense
router.delete(
  '/:id',
  authMiddleware,
  validateParams(idParamSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      // Get expense to check for linked transaction
      const { data: expense, error: findError } = await supabaseAdmin
        .from('expenses')
        .select('transaction_id')
        .eq('id', id)
        .eq('user_id', req.userId)
        .single();

      if (findError && findError.code === 'PGRST116') {
        throw new NotFoundError('Expense', id);
      }
      if (findError) throw findError;

      // Delete expense
      const { error } = await supabaseAdmin
        .from('expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Delete linked transaction if exists
      if (expense.transaction_id) {
        await supabaseAdmin
          .from('transactions')
          .delete()
          .eq('id', expense.transaction_id);
      }

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

export default router;
