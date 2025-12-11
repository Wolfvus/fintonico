import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createTestApp } from '../testApp';
import { NotFoundError, BadRequestError } from '../../middleware/errorHandler';

// Mock the auth middleware to bypass authentication
vi.mock('../../middleware/auth', () => ({
  authMiddleware: vi.fn((req: any, _res: any, next: any) => {
    req.userId = 'test-user-123';
    next();
  }),
}));

// Mock the validation middleware to simplify testing
vi.mock('../../middleware/validation', () => ({
  validate: () => (_req: any, _res: any, next: any) => next(),
  validateQuery: () => (_req: any, _res: any, next: any) => next(),
  validateParams: () => (_req: any, _res: any, next: any) => next(),
  paginationSchema: { extend: () => ({}) },
  idParamSchema: {},
}));

// Mock the account service
vi.mock('../../services', () => ({
  accountService: {
    getAccounts: vi.fn(),
    getAccountById: vi.fn(),
    createAccount: vi.fn(),
    updateAccount: vi.fn(),
    deleteAccount: vi.fn(),
    getAccountBalance: vi.fn(),
  },
}));

import { accountService } from '../../services';

describe('Accounts API Routes', () => {
  const app = createTestApp();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET /api/accounts', () => {
    it('returns paginated list of accounts', async () => {
      const mockResponse = {
        data: [
          { id: '1', name: 'Cash', code: '1000', type: 'asset' },
          { id: '2', name: 'Bank', code: '1100', type: 'asset' },
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 2,
          totalPages: 1,
        },
      };

      vi.mocked(accountService.getAccounts).mockResolvedValue(mockResponse);

      const res = await request(app).get('/api/accounts');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.pagination.total).toBe(2);
      expect(accountService.getAccounts).toHaveBeenCalledWith('test-user-123', expect.any(Object));
    });

    it('filters by account type', async () => {
      const mockResponse = {
        data: [{ id: '1', name: 'Cash', code: '1000', type: 'asset' }],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      };

      vi.mocked(accountService.getAccounts).mockResolvedValue(mockResponse);

      const res = await request(app).get('/api/accounts?type=asset');

      expect(res.status).toBe(200);
      expect(accountService.getAccounts).toHaveBeenCalledWith(
        'test-user-123',
        expect.objectContaining({ type: 'asset' })
      );
    });

    // Note: Validation is tested separately in middleware tests
    // This test is skipped because we mock validation middleware
  });

  describe('GET /api/accounts/:id', () => {
    it('returns a single account', async () => {
      const mockAccount = {
        id: 'acc-123',
        name: 'Cash',
        code: '1000',
        type: 'asset',
        currency: 'MXN',
      };

      vi.mocked(accountService.getAccountById).mockResolvedValue(mockAccount as any);

      const res = await request(app).get('/api/accounts/acc-123');

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Cash');
      expect(accountService.getAccountById).toHaveBeenCalledWith('test-user-123', 'acc-123');
    });

    it('returns 404 for non-existent account', async () => {
      vi.mocked(accountService.getAccountById).mockRejectedValue(
        new NotFoundError('Account', 'nonexistent')
      );

      const res = await request(app).get('/api/accounts/nonexistent');

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/accounts', () => {
    it('creates a new account', async () => {
      const newAccount = {
        name: 'Savings',
        code: '1200',
        type: 'asset',
        currency: 'MXN',
      };

      const mockCreatedAccount = {
        id: 'new-acc-id',
        ...newAccount,
        is_active: true,
        user_id: 'test-user-123',
      };

      vi.mocked(accountService.createAccount).mockResolvedValue(mockCreatedAccount as any);

      const res = await request(app).post('/api/accounts').send(newAccount);

      expect(res.status).toBe(201);
      expect(res.body.id).toBe('new-acc-id');
      expect(res.body.name).toBe('Savings');
    });

    // Note: Validation is tested separately in middleware tests
  });

  describe('PUT /api/accounts/:id', () => {
    it('updates an existing account', async () => {
      const mockUpdatedAccount = {
        id: 'acc-123',
        name: 'Updated Cash',
        code: '1000',
        type: 'asset',
        currency: 'MXN',
      };

      vi.mocked(accountService.updateAccount).mockResolvedValue(mockUpdatedAccount as any);

      const res = await request(app).put('/api/accounts/acc-123').send({
        name: 'Updated Cash',
      });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Updated Cash');
      expect(accountService.updateAccount).toHaveBeenCalledWith(
        'test-user-123',
        'acc-123',
        expect.objectContaining({ name: 'Updated Cash' })
      );
    });
  });

  describe('DELETE /api/accounts/:id', () => {
    it('deletes an account without postings', async () => {
      vi.mocked(accountService.deleteAccount).mockResolvedValue(undefined);

      const res = await request(app).delete('/api/accounts/acc-123');

      expect(res.status).toBe(204);
      expect(accountService.deleteAccount).toHaveBeenCalledWith('test-user-123', 'acc-123');
    });

    it('returns error when account has postings', async () => {
      vi.mocked(accountService.deleteAccount).mockRejectedValue(
        new BadRequestError('Cannot delete account with existing transactions')
      );

      const res = await request(app).delete('/api/accounts/acc-123');

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/accounts/:id/balance', () => {
    it('returns account balance', async () => {
      const mockBalance = {
        account_id: 'acc-123',
        balance_cents: 150000,
        currency: 'MXN',
        as_of_date: '2025-12-01',
      };

      vi.mocked(accountService.getAccountBalance).mockResolvedValue(mockBalance);

      const res = await request(app).get('/api/accounts/acc-123/balance');

      expect(res.status).toBe(200);
      expect(res.body.balance_cents).toBe(150000);
    });

    it('accepts asOfDate query parameter', async () => {
      const mockBalance = {
        account_id: 'acc-123',
        balance_cents: 100000,
        currency: 'MXN',
        as_of_date: '2025-11-01',
      };

      vi.mocked(accountService.getAccountBalance).mockResolvedValue(mockBalance);

      const res = await request(app).get('/api/accounts/acc-123/balance?asOfDate=2025-11-01');

      expect(res.status).toBe(200);
      expect(accountService.getAccountBalance).toHaveBeenCalledWith(
        'test-user-123',
        'acc-123',
        '2025-11-01'
      );
    });
  });
});
