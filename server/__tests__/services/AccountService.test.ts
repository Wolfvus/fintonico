import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AccountService } from '../../services/AccountService';
import { NotFoundError, BadRequestError, ConflictError } from '../../middleware/errorHandler';

// Mock the supabase client
vi.mock('../../lib/supabase', () => ({
  supabaseAdmin: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      single: vi.fn(),
    })),
    rpc: vi.fn(),
  },
}));

import { supabaseAdmin } from '../../lib/supabase';

describe('AccountService', () => {
  let accountService: AccountService;
  const mockUserId = 'user-123';
  const mockAccountId = 'account-456';

  beforeEach(() => {
    accountService = new AccountService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getAccounts', () => {
    it('returns paginated accounts for a user', async () => {
      const mockAccounts = [
        { id: '1', name: 'Cash', code: '1000', type: 'asset', user_id: mockUserId },
        { id: '2', name: 'Bank', code: '1100', type: 'asset', user_id: mockUserId },
      ];

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: mockAccounts,
          error: null,
          count: 2,
        }),
      };

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any);

      const result = await accountService.getAccounts(mockUserId);

      expect(result.data).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(20);
    });

    it('filters accounts by type', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: [{ id: '1', name: 'Cash', type: 'asset' }],
          error: null,
          count: 1,
        }),
      };

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any);

      await accountService.getAccounts(mockUserId, { type: 'asset' });

      expect(mockQuery.eq).toHaveBeenCalledWith('type', 'asset');
    });

    it('filters accounts by is_active status', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
      };

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any);

      await accountService.getAccounts(mockUserId, { is_active: true });

      expect(mockQuery.eq).toHaveBeenCalledWith('is_active', true);
    });
  });

  describe('getAccountById', () => {
    it('returns an account by ID', async () => {
      const mockAccount = { id: mockAccountId, name: 'Cash', code: '1000', user_id: mockUserId };

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockAccount, error: null }),
      };

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any);

      const result = await accountService.getAccountById(mockUserId, mockAccountId);

      expect(result).toEqual(mockAccount);
    });

    it('throws NotFoundError when account does not exist', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'Not found' },
        }),
      };

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any);

      await expect(accountService.getAccountById(mockUserId, 'nonexistent')).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe('createAccount', () => {
    it('creates a new account', async () => {
      const mockCreatedAccount = {
        id: 'new-account-id',
        name: 'Savings',
        code: '1200',
        type: 'asset',
        currency: 'MXN',
        user_id: mockUserId,
      };

      // Mock getAccountByCode to return null (no duplicate)
      const mockSelectQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
      };

      // Mock insert
      const mockInsertQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockCreatedAccount, error: null }),
      };

      vi.mocked(supabaseAdmin.from)
        .mockReturnValueOnce(mockSelectQuery as any) // For getAccountByCode check
        .mockReturnValueOnce(mockInsertQuery as any); // For insert

      const result = await accountService.createAccount(mockUserId, {
        name: 'Savings',
        code: '1200',
        type: 'asset',
        currency: 'MXN',
      });

      expect(result.name).toBe('Savings');
      expect(result.code).toBe('1200');
    });

    it('throws ConflictError when account code already exists', async () => {
      const existingAccount = { id: 'existing-id', code: '1200' };

      const mockSelectQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: existingAccount, error: null }),
      };

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockSelectQuery as any);

      await expect(
        accountService.createAccount(mockUserId, {
          name: 'Duplicate',
          code: '1200',
          type: 'asset',
          currency: 'MXN',
        })
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('updateAccount', () => {
    it('updates an existing account', async () => {
      const mockAccount = { id: mockAccountId, name: 'Cash', code: '1000', user_id: mockUserId };
      const mockUpdatedAccount = { ...mockAccount, name: 'Updated Cash' };

      const mockSelectQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockAccount, error: null }),
      };

      const mockUpdateQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockUpdatedAccount, error: null }),
      };

      vi.mocked(supabaseAdmin.from)
        .mockReturnValueOnce(mockSelectQuery as any) // For getAccountById verification
        .mockReturnValueOnce(mockUpdateQuery as any); // For update

      const result = await accountService.updateAccount(mockUserId, mockAccountId, {
        name: 'Updated Cash',
      });

      expect(result.name).toBe('Updated Cash');
    });
  });

  describe('deleteAccount', () => {
    it('deletes an account without postings', async () => {
      const mockAccount = { id: mockAccountId, name: 'Cash', user_id: mockUserId };

      // Mock getAccountById
      const mockSelectQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockAccount, error: null }),
      };

      // Mock postings count check
      const mockCountQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ count: 0, error: null }),
      };

      // Mock delete - needs chained eq calls
      const mockDeleteQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      };
      // Make the last eq return the final result
      mockDeleteQuery.eq.mockImplementation(() => ({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }));

      vi.mocked(supabaseAdmin.from)
        .mockReturnValueOnce(mockSelectQuery as any) // For getAccountById
        .mockReturnValueOnce(mockCountQuery as any) // For postings count
        .mockReturnValueOnce(mockDeleteQuery as any); // For delete

      await expect(accountService.deleteAccount(mockUserId, mockAccountId)).resolves.not.toThrow();
    });

    it('throws BadRequestError when account has postings', async () => {
      const mockAccount = { id: mockAccountId, name: 'Cash', user_id: mockUserId };

      // Mock getAccountById
      const mockSelectQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockAccount, error: null }),
      };

      // Mock postings count check - has postings
      const mockCountQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ count: 5, error: null }),
      };

      vi.mocked(supabaseAdmin.from)
        .mockReturnValueOnce(mockSelectQuery as any)
        .mockReturnValueOnce(mockCountQuery as any);

      await expect(accountService.deleteAccount(mockUserId, mockAccountId)).rejects.toThrow(
        BadRequestError
      );
    });
  });

  describe('deactivateAccount', () => {
    it('sets is_active to false', async () => {
      const mockAccount = { id: mockAccountId, is_active: true, user_id: mockUserId };
      const mockDeactivated = { ...mockAccount, is_active: false };

      const mockSelectQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockAccount, error: null }),
      };

      const mockUpdateQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockDeactivated, error: null }),
      };

      vi.mocked(supabaseAdmin.from)
        .mockReturnValueOnce(mockSelectQuery as any)
        .mockReturnValueOnce(mockUpdateQuery as any);

      const result = await accountService.deactivateAccount(mockUserId, mockAccountId);

      expect(result.is_active).toBe(false);
    });
  });

  describe('reactivateAccount', () => {
    it('sets is_active to true', async () => {
      const mockAccount = { id: mockAccountId, is_active: false, user_id: mockUserId };
      const mockReactivated = { ...mockAccount, is_active: true };

      const mockSelectQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockAccount, error: null }),
      };

      const mockUpdateQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockReactivated, error: null }),
      };

      vi.mocked(supabaseAdmin.from)
        .mockReturnValueOnce(mockSelectQuery as any)
        .mockReturnValueOnce(mockUpdateQuery as any);

      const result = await accountService.reactivateAccount(mockUserId, mockAccountId);

      expect(result.is_active).toBe(true);
    });
  });

  describe('getAccountBalance', () => {
    it('returns account balance using database function', async () => {
      const mockAccount = {
        id: mockAccountId,
        name: 'Cash',
        currency: 'MXN',
        user_id: mockUserId,
      };

      const mockSelectQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockAccount, error: null }),
      };

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockSelectQuery as any);
      vi.mocked(supabaseAdmin.rpc).mockResolvedValue({ data: 150000, error: null });

      const result = await accountService.getAccountBalance(mockUserId, mockAccountId, '2025-12-01');

      expect(result.balance_cents).toBe(150000);
      expect(result.currency).toBe('MXN');
      expect(result.as_of_date).toBe('2025-12-01');
    });
  });

  describe('seedDefaultAccounts', () => {
    it('creates default chart of accounts', async () => {
      const mockInsertedAccounts = [
        { id: '1', name: 'Cash', code: '1000', type: 'asset' },
        { id: '2', name: 'Bank Account', code: '1100', type: 'asset' },
        // ... more accounts
      ];

      const mockInsertQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({ data: mockInsertedAccounts, error: null }),
      };

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockInsertQuery as any);

      const result = await accountService.seedDefaultAccounts(mockUserId);

      expect(mockInsertQuery.insert).toHaveBeenCalled();
      expect(result).toEqual(mockInsertedAccounts);
    });
  });
});
