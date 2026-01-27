/**
 * Admin Service
 * API service for admin panel operations
 */

import { supabase } from '../lib/supabase';
import type {
  UserProfile,
  UserRole,
  SubscriptionTier,
  SystemConfig,
  AdminAuditLog,
  UpdateUserRequest,
  AdminAction,
  UserCounts,
} from '../types/admin';
import type { Account, Expense, Income, LedgerAccount } from '../types';
import type { NetWorthSnapshot, AccountSnapshot } from '../stores/snapshotStore';

export const adminService = {
  // ============================================
  // User Management
  // ============================================

  async getUsers(): Promise<UserProfile[]> {
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
      subscriptionTier: (row.subscription_tier as SubscriptionTier) || 'freemium',
      subscriptionUpdatedAt: row.subscription_updated_at,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  },

  async getUser(userId: string): Promise<UserProfile | null> {
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
      subscriptionTier: (row.subscription_tier as SubscriptionTier) || 'freemium',
      subscriptionUpdatedAt: row.subscription_updated_at,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },

  async updateUser(userId: string, updates: UpdateUserRequest): Promise<UserProfile> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase
      .from('user_profiles') as any)
      .update({
        ...(updates.displayName !== undefined && { display_name: updates.displayName }),
        ...(updates.role !== undefined && { role: updates.role }),
        ...(updates.subscriptionTier !== undefined && { subscription_tier: updates.subscriptionTier }),
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

  async setUserRole(userId: string, role: UserRole): Promise<UserProfile> {
    return this.updateUser(userId, { role });
  },

  async setUserTier(userId: string, subscriptionTier: SubscriptionTier): Promise<UserProfile> {
    return this.updateUser(userId, { subscriptionTier });
  },

  async toggleUserActive(userId: string): Promise<UserProfile> {
    const user = await this.getUser(userId);
    if (!user) throw new Error('User not found');

    return this.updateUser(userId, { isActive: !user.isActive });
  },

  async getUserCounts(): Promise<UserCounts> {
    const users = await this.getUsers();
    const counts: UserCounts = {
      total: users.length,
      byRole: { super_admin: 0, admin: 0, user: 0 },
      byTier: { freemium: 0, pro: 0 },
    };
    for (const u of users) {
      counts.byRole[u.role]++;
      counts.byTier[u.subscriptionTier]++;
    }
    return counts;
  },

  // ============================================
  // User Financial Data Access
  // ============================================

  async getUserAccounts(userId: string): Promise<Account[]> {
    const { data, error } = await supabase
      .from('net_worth_accounts')
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
      type: row.account_type,
      currency: row.currency,
      balance: Number(row.balance),
      excludeFromTotal: row.exclude_from_total,
      recurringDueDate: row.recurring_due_date,
      isPaidThisMonth: row.is_paid_this_month,
      lastPaidDate: row.last_paid_date,
      estimatedYield: row.estimated_yield ? Number(row.estimated_yield) : undefined,
      minMonthlyPayment: row.min_monthly_payment ? Number(row.min_monthly_payment) : undefined,
      paymentToAvoidInterest: row.payment_to_avoid_interest ? Number(row.payment_to_avoid_interest) : undefined,
      lastUpdated: row.last_updated,
    }));
  },

  async getUserExpenses(userId: string): Promise<Expense[]> {
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
      recurring: row.recurring || false,
    }));
  },

  async getUserIncomes(userId: string): Promise<Income[]> {
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
      amount: Number(row.amount),
      currency: row.currency,
      frequency: row.frequency || 'one-time',
      date: row.date,
      created_at: row.created_at,
    }));
  },

  async getUserLedgerAccounts(userId: string): Promise<LedgerAccount[]> {
    const { data, error } = await supabase
      .from('ledger_accounts')
      .select('*')
      .eq('user_id', userId)
      .order('name', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch user ledger accounts: ${error.message}`);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data as any[]).map((row) => ({
      id: row.id,
      name: row.name,
      accountNumber: row.account_number,
      clabe: row.clabe,
      normalBalance: row.normal_balance,
      isActive: row.is_active,
    }));
  },

  async getUserSnapshots(userId: string): Promise<NetWorthSnapshot[]> {
    const { data, error } = await supabase
      .from('net_worth_snapshots')
      .select('*, account_snapshots(*)')
      .eq('user_id', userId)
      .order('month_end_local', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch user snapshots: ${error.message}`);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data as any[]).map((row) => ({
      id: row.id,
      monthEndLocal: row.month_end_local,
      netWorthBase: Number(row.net_worth_base),
      totalsByNature: {
        asset: Number(row.total_assets),
        liability: Number(row.total_liabilities),
        income: 0,
        expense: 0,
        equity: 0,
      },
      accountSnapshots: row.account_snapshots?.map((as: Record<string, unknown>) => ({
        accountId: as.id as string,
        balance: Number(as.balance),
        balanceBase: Number(as.balance_base),
        accountName: as.account_name as string,
        accountType: as.account_type as string,
        currency: as.currency as string,
        nature: as.nature as 'asset' | 'liability',
      })) as AccountSnapshot[] || [],
      createdAt: row.created_at,
    }));
  },

  // ============================================
  // System Configuration
  // ============================================

  async getSystemConfig(): Promise<SystemConfig[]> {
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
