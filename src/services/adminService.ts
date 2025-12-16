/**
 * Admin Service
 * API service for admin panel operations
 */

import { supabase } from '../lib/supabase';
import type {
  UserProfile,
  UserRole,
  SystemConfig,
  AdminAuditLog,
  CreateUserRequest,
  UpdateUserRequest,
  AdminAction,
} from '../types/admin';
import type { Account, Expense, Income } from '../types';

// Dev mode configuration
const DEV_MODE = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_DEV_MODE === 'true';

// Mock data for dev mode
const MOCK_USERS: UserProfile[] = [
  {
    id: 'test-user-00000000-0000-0000-0000-000000000001',
    email: 'admin@fintonico.com',
    displayName: 'Dev Admin',
    role: 'super_admin',
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'test-user-00000000-0000-0000-0000-000000000002',
    email: 'user@example.com',
    displayName: 'Test User',
    role: 'user',
    isActive: true,
    createdAt: '2025-01-15T00:00:00Z',
    updatedAt: '2025-01-15T00:00:00Z',
  },
];

const MOCK_SYSTEM_CONFIG: SystemConfig[] = [
  { id: '1', key: 'default_currency', value: 'MXN', description: 'Default currency for new users', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: '2', key: 'supported_currencies', value: ['MXN', 'USD', 'EUR'], description: 'List of supported currencies', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: '3', key: 'expense_categories', value: ['essential', 'discretionary', 'luxury'], description: 'Expense rating categories', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: '4', key: 'income_frequencies', value: ['one-time', 'weekly', 'bi-weekly', 'monthly'], description: 'Income frequency options', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: '5', key: 'account_types', value: ['cash', 'bank', 'exchange', 'investment', 'property', 'loan', 'credit-card', 'mortgage', 'other'], description: 'Account type options', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
];

export const adminService = {
  // ============================================
  // User Management
  // ============================================

  async getUsers(): Promise<UserProfile[]> {
    if (DEV_MODE) {
      return MOCK_USERS;
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch users: ${error.message}`);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data as any[]).map((row) => ({
      id: row.id,
      email: row.email,
      displayName: row.display_name,
      role: row.role as UserRole,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  },

  async getUser(userId: string): Promise<UserProfile | null> {
    if (DEV_MODE) {
      return MOCK_USERS.find((u) => u.id === userId) || null;
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to fetch user: ${error.message}`);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row = data as any;
    return {
      id: row.id,
      email: row.email,
      displayName: row.display_name,
      role: row.role as UserRole,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },

  async createUser(request: CreateUserRequest): Promise<UserProfile> {
    if (DEV_MODE) {
      const newUser: UserProfile = {
        id: `test-user-${Date.now()}`,
        email: request.email,
        displayName: request.displayName,
        role: request.role || 'user',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      MOCK_USERS.push(newUser);
      return newUser;
    }

    // Create auth user first
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: request.email,
      password: request.password,
      email_confirm: true,
    });

    if (authError) {
      throw new Error(`Failed to create user: ${authError.message}`);
    }

    // Update profile with role if specified
    if (request.role && request.role !== 'user') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: profileError } = await (supabase
        .from('user_profiles') as any)
        .update({
          role: request.role,
          display_name: request.displayName,
        })
        .eq('id', authData.user.id);

      if (profileError) {
        console.error('Failed to update profile role:', profileError);
      }
    }

    // Fetch the created profile
    const profile = await this.getUser(authData.user.id);
    if (!profile) {
      throw new Error('Failed to fetch created user profile');
    }

    return profile;
  },

  async updateUser(userId: string, updates: UpdateUserRequest): Promise<UserProfile> {
    if (DEV_MODE) {
      const userIndex = MOCK_USERS.findIndex((u) => u.id === userId);
      if (userIndex === -1) throw new Error('User not found');

      MOCK_USERS[userIndex] = {
        ...MOCK_USERS[userIndex],
        ...(updates.displayName !== undefined && { displayName: updates.displayName }),
        ...(updates.role !== undefined && { role: updates.role }),
        ...(updates.isActive !== undefined && { isActive: updates.isActive }),
        updatedAt: new Date().toISOString(),
      };
      return MOCK_USERS[userIndex];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase
      .from('user_profiles') as any)
      .update({
        ...(updates.displayName !== undefined && { display_name: updates.displayName }),
        ...(updates.role !== undefined && { role: updates.role }),
        ...(updates.isActive !== undefined && { is_active: updates.isActive }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }

    const profile = await this.getUser(userId);
    if (!profile) {
      throw new Error('Failed to fetch updated user profile');
    }

    return profile;
  },

  async deleteUser(userId: string): Promise<void> {
    if (DEV_MODE) {
      const index = MOCK_USERS.findIndex((u) => u.id === userId);
      if (index !== -1) {
        MOCK_USERS.splice(index, 1);
      }
      return;
    }

    const { error } = await supabase.auth.admin.deleteUser(userId);

    if (error) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  },

  async setUserRole(userId: string, role: UserRole): Promise<UserProfile> {
    return this.updateUser(userId, { role });
  },

  async toggleUserActive(userId: string): Promise<UserProfile> {
    const user = await this.getUser(userId);
    if (!user) throw new Error('User not found');

    return this.updateUser(userId, { isActive: !user.isActive });
  },

  // ============================================
  // User Financial Data Access
  // ============================================

  async getUserAccounts(userId: string): Promise<Account[]> {
    if (DEV_MODE) {
      // Return empty array in dev mode - user data is in localStorage
      return [];
    }

    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch user accounts: ${error.message}`);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data as any[]).map((row) => ({
      id: row.id,
      name: row.name,
      type: row.type,
      currency: row.currency,
      balance: row.balance,
      excludeFromTotal: row.exclude_from_total,
      lastUpdated: row.updated_at,
    }));
  },

  async getUserExpenses(userId: string): Promise<Expense[]> {
    if (DEV_MODE) {
      return [];
    }

    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch user expenses: ${error.message}`);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data as any[]).map((row) => ({
      id: row.id,
      what: row.what,
      amount: Number(row.amount),
      currency: row.currency || 'MXN',
      rating: row.rating,
      date: row.date,
      created_at: row.created_at,
      recurring: row.is_recurring,
    }));
  },

  async getUserIncomes(userId: string): Promise<Income[]> {
    if (DEV_MODE) {
      return [];
    }

    const { data, error } = await supabase
      .from('income')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch user incomes: ${error.message}`);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data as any[]).map((row) => ({
      id: row.id,
      source: row.source,
      amount: Number(row.amount_cents) / 100,
      currency: row.currency,
      frequency: row.recurrence_interval || 'one-time',
      date: row.date,
      created_at: row.created_at,
    }));
  },

  // ============================================
  // System Configuration
  // ============================================

  async getSystemConfig(): Promise<SystemConfig[]> {
    if (DEV_MODE) {
      return MOCK_SYSTEM_CONFIG;
    }

    const { data, error } = await supabase
      .from('system_config')
      .select('*')
      .order('key');

    if (error) {
      throw new Error(`Failed to fetch system config: ${error.message}`);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data as any[]).map((row) => ({
      id: row.id,
      key: row.key,
      value: row.value,
      description: row.description,
      updatedBy: row.updated_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  },

  async getConfigValue<T>(key: string): Promise<T | null> {
    if (DEV_MODE) {
      const config = MOCK_SYSTEM_CONFIG.find((c) => c.key === key);
      return config?.value as T | null;
    }

    const { data, error } = await supabase
      .from('system_config')
      .select('value')
      .eq('key', key)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to fetch config: ${error.message}`);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data as any).value as T;
  },

  async updateSystemConfig(key: string, value: unknown, adminUserId: string): Promise<void> {
    if (DEV_MODE) {
      const index = MOCK_SYSTEM_CONFIG.findIndex((c) => c.key === key);
      if (index !== -1) {
        MOCK_SYSTEM_CONFIG[index] = {
          ...MOCK_SYSTEM_CONFIG[index],
          value,
          updatedBy: adminUserId,
          updatedAt: new Date().toISOString(),
        };
      }
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase
      .from('system_config') as any)
      .update({
        value,
        updated_by: adminUserId,
        updated_at: new Date().toISOString(),
      })
      .eq('key', key);

    if (error) {
      throw new Error(`Failed to update config: ${error.message}`);
    }
  },

  // ============================================
  // Audit Logging
  // ============================================

  async logAction(
    adminUserId: string,
    action: AdminAction,
    details?: {
      targetUserId?: string;
      targetResource?: string;
      data?: Record<string, unknown>;
    }
  ): Promise<void> {
    if (DEV_MODE) {
      console.log('[DEV MODE] Admin action logged:', { adminUserId, action, details });
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('admin_audit_log') as any).insert({
      admin_user_id: adminUserId,
      action,
      target_user_id: details?.targetUserId,
      target_resource: details?.targetResource,
      details: details?.data,
    });

    if (error) {
      console.error('Failed to log admin action:', error);
    }
  },

  async getAuditLog(options?: {
    adminUserId?: string;
    targetUserId?: string;
    action?: string;
    limit?: number;
  }): Promise<AdminAuditLog[]> {
    if (DEV_MODE) {
      return [];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: any = supabase
      .from('admin_audit_log')
      .select('*')
      .order('created_at', { ascending: false });

    if (options?.adminUserId) {
      query = query.eq('admin_user_id', options.adminUserId);
    }
    if (options?.targetUserId) {
      query = query.eq('target_user_id', options.targetUserId);
    }
    if (options?.action) {
      query = query.eq('action', options.action);
    }
    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch audit log: ${error.message}`);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data as any[]).map((row) => ({
      id: row.id,
      adminUserId: row.admin_user_id,
      action: row.action,
      targetUserId: row.target_user_id,
      targetResource: row.target_resource,
      details: row.details,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      createdAt: row.created_at,
    }));
  },
};
