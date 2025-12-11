import { Router, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import type { AuthenticatedRequest } from '../types';
import { authMiddleware } from '../middleware/auth';
import { validateQuery } from '../middleware/validation';
import { reportService } from '../services';

const router = Router();

// Query schema for reports
const reportQuerySchema = z.object({
  asOfDate: z.string().date().optional(),
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
});

// GET /api/reports/trial-balance
router.get(
  '/trial-balance',
  authMiddleware as any,
  validateQuery(reportQuerySchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await reportService.getTrialBalance(
        req.userId,
        req.query.asOfDate as string
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/reports/balance-sheet
router.get(
  '/balance-sheet',
  authMiddleware as any,
  validateQuery(reportQuerySchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await reportService.getBalanceSheet(
        req.userId,
        req.query.asOfDate as string
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/reports/income-statement
router.get(
  '/income-statement',
  authMiddleware as any,
  validateQuery(reportQuerySchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await reportService.getIncomeStatement(
        req.userId,
        req.query.startDate as string,
        req.query.endDate as string
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/reports/account-balances
router.get(
  '/account-balances',
  authMiddleware as any,
  validateQuery(reportQuerySchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await reportService.getAccountBalances(
        req.userId,
        req.query.asOfDate as string
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/reports/net-worth
router.get(
  '/net-worth',
  authMiddleware as any,
  validateQuery(reportQuerySchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await reportService.getNetWorth(
        req.userId,
        req.query.asOfDate as string
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/reports/cashflow
router.get(
  '/cashflow',
  authMiddleware as any,
  validateQuery(reportQuerySchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await reportService.getCashflow(
        req.userId,
        req.query.startDate as string,
        req.query.endDate as string
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
