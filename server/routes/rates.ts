import { Router, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import type { AuthenticatedRequest } from '../types';
import { authMiddleware } from '../middleware/auth';
import { validateQuery } from '../middleware/validation';
import { ratesService } from '../services';

const router = Router();

// Query schema
const ratesQuerySchema = z.object({
  date: z.string().date().optional(),
  from: z.string().length(3).optional(),
  to: z.string().length(3).optional(),
});

const convertQuerySchema = z.object({
  amount: z.coerce.number(),
  from: z.string().length(3),
  to: z.string().length(3),
});

// GET /api/rates - Get current exchange rates
router.get(
  '/',
  authMiddleware,
  validateQuery(ratesQuerySchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await ratesService.getRates(req.query as any);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/rates/refresh - Fetch and store fresh rates
router.post(
  '/refresh',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await ratesService.refreshRates();
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/rates/convert - Convert amount between currencies
router.get(
  '/convert',
  authMiddleware,
  validateQuery(convertQuerySchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { amount, from, to } = req.query as any;
      const result = await ratesService.convert(amount, from, to);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/rates/currencies - Get supported currencies
router.get(
  '/currencies',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.json({
        supported: ratesService.getSupportedCurrencies(),
        base: ratesService.getBaseCurrency(),
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
