import express from 'express';
import { errorHandler } from '../middleware/errorHandler';
import accountsRouter from '../routes/accounts';
import reportsRouter from '../routes/reports';

/**
 * Creates a test Express app for route testing
 */
export function createTestApp() {
  const app = express();

  // Middleware
  app.use(express.json());

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '2.0.0-test',
    });
  });

  // API Routes
  app.use('/api/accounts', accountsRouter);
  app.use('/api/reports', reportsRouter);

  // Error handler
  app.use(errorHandler);

  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({
      error: 'Not found',
      code: 'NOT_FOUND',
    });
  });

  return app;
}
