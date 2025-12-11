import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import middleware
import { errorHandler } from './middleware/errorHandler';

// Import routes
import accountsRouter from './routes/accounts';
import transactionsRouter from './routes/transactions';
import incomeRouter from './routes/income';
import expensesRouter from './routes/expenses';
import reportsRouter from './routes/reports';
import ratesRouter from './routes/rates';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check (no auth required)
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
  });
});

// API Routes
app.use('/api/accounts', accountsRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/income', incomeRouter);
app.use('/api/expenses', expensesRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/rates', ratesRouter);

// Error handler (must be last)
app.use(errorHandler);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    error: 'Not found',
    code: 'NOT_FOUND',
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log('  GET  /api/health');
  console.log('  GET  /api/accounts');
  console.log('  POST /api/accounts');
  console.log('  GET  /api/accounts/:id');
  console.log('  PUT  /api/accounts/:id');
  console.log('  DELETE /api/accounts/:id');
  console.log('  GET  /api/accounts/:id/balance');
  console.log('  GET  /api/transactions');
  console.log('  POST /api/transactions');
  console.log('  GET  /api/transactions/:id');
  console.log('  PUT  /api/transactions/:id');
  console.log('  DELETE /api/transactions/:id');
  console.log('  GET  /api/income');
  console.log('  POST /api/income');
  console.log('  GET  /api/income/:id');
  console.log('  PUT  /api/income/:id');
  console.log('  DELETE /api/income/:id');
  console.log('  GET  /api/expenses');
  console.log('  POST /api/expenses');
  console.log('  GET  /api/expenses/:id');
  console.log('  PUT  /api/expenses/:id');
  console.log('  DELETE /api/expenses/:id');
  console.log('  POST /api/expenses/:id/categorize');
  console.log('  GET  /api/reports/trial-balance');
  console.log('  GET  /api/reports/balance-sheet');
  console.log('  GET  /api/reports/income-statement');
  console.log('  GET  /api/reports/account-balances');
  console.log('  GET  /api/rates');
  console.log('  POST /api/rates/refresh');
  console.log('  GET  /api/rates/convert');
});
