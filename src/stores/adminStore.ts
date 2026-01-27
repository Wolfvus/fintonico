/**
 * Admin Store
 * Zustand store for admin panel state management
 */

import { create } from 'zustand';
import { adminService } from '../services/adminService';
import type {
  UserProfile,
  UserRole,
  SubscriptionTier,
  SystemConfig,
  AdminAuditLog,
  UpdateUserRequest,
  UserWithFinancials,
  AdminAction,
  UserCounts,
} from '../types/admin';
import type { Account, Expense, Income, LedgerAccount } from '../types';
import type { NetWorthSnapshot } from './snapshotStore';

interface AdminState {
  // User management
  users: UserProfile[];
  selectedUser: UserProfile | null;
  selectedUserData: {
    accounts: Account[];
    expenses: Expense[];
    incomes: Income[];
    ledgerAccounts: LedgerAccount[];
    snapshots: NetWorthSnapshot[];
  } | null;
  usersLoading: boolean;
  usersError: string | null;
  userCounts: UserCounts | null;

  // System config
  systemConfig: SystemConfig[];
  configLoading: boolean;
  configError: string | null;

  // Audit log
  auditLog: AdminAuditLog[];
  auditLoading: boolean;
  auditError: string | null;

  // Actions
  // User management
  fetchUsers: () => Promise<void>;
  fetchUser: (userId: string) => Promise<UserProfile | null>;
  updateUser: (userId: string, updates: UpdateUserRequest) => Promise<void>;
  setUserRole: (userId: string, role: UserRole) => Promise<void>;
  setUserTier: (userId: string, tier: SubscriptionTier) => Promise<void>;
  toggleUserActive: (userId: string) => Promise<void>;
  selectUser: (user: UserProfile | null) => void;

  // User data viewing
  fetchUserData: (userId: string) => Promise<void>;
  clearUserData: () => void;

  // System config
  fetchSystemConfig: () => Promise<void>;
  updateSystemConfig: (key: string, value: unknown) => Promise<void>;
  getConfigValue: <T>(key: string) => T | undefined;

  // Audit
  fetchAuditLog: (options?: { action?: string; limit?: number }) => Promise<void>;
  logAction: (action: AdminAction, details?: Record<string, unknown>) => Promise<void>;

  // Utilities
  clearErrors: () => void;
  getUserWithFinancials: (userId: string) => Promise<UserWithFinancials | null>;
}

export const useAdminStore = create<AdminState>((set, get) => ({
  // Initial state
  users: [],
  selectedUser: null,
  selectedUserData: null,
  usersLoading: false,
  usersError: null,
  userCounts: null,

  systemConfig: [],
  configLoading: false,
  configError: null,

  auditLog: [],
  auditLoading: false,
  auditError: null,

  // User management actions
  fetchUsers: async () => {
    set({ usersLoading: true, usersError: null });
    try {
      const users = await adminService.getUsers();

      // Compute counts from fetched users
      const userCounts: UserCounts = {
        total: users.length,
        byRole: { super_admin: 0, admin: 0, user: 0 },
        byTier: { freemium: 0, pro: 0 },
      };
      for (const u of users) {
        userCounts.byRole[u.role]++;
        userCounts.byTier[u.subscriptionTier]++;
      }

      set({ users, userCounts, usersLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch users';
      set({ usersError: message, usersLoading: false });
    }
  },

  fetchUser: async (userId: string) => {
    try {
      return await adminService.getUser(userId);
    } catch (err) {
      console.error('Failed to fetch user:', err);
      return null;
    }
  },

  updateUser: async (userId: string, updates: UpdateUserRequest) => {
    set({ usersLoading: true, usersError: null });
    try {
      const updatedUser = await adminService.updateUser(userId, updates);

      // Log the action
      await get().logAction('user.update', {
        targetUserId: userId,
        updates,
      });

      // Update local state
      set((state) => ({
        users: state.users.map((u) => (u.id === userId ? updatedUser : u)),
        selectedUser: state.selectedUser?.id === userId ? updatedUser : state.selectedUser,
        usersLoading: false,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update user';
      set({ usersError: message, usersLoading: false });
      throw err;
    }
  },

  setUserRole: async (userId: string, role: UserRole) => {
    try {
      await adminService.setUserRole(userId, role);

      // Log the action
      await get().logAction('user.role_change', {
        targetUserId: userId,
        newRole: role,
      });

      // Refresh users
      await get().fetchUsers();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to set user role';
      set({ usersError: message });
      throw err;
    }
  },

  setUserTier: async (userId: string, tier: SubscriptionTier) => {
    try {
      await adminService.setUserTier(userId, tier);

      // Log the action
      await get().logAction('user.tier_change', {
        targetUserId: userId,
        newTier: tier,
      });

      // Refresh users
      await get().fetchUsers();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to set user subscription tier';
      set({ usersError: message });
      throw err;
    }
  },

  toggleUserActive: async (userId: string) => {
    try {
      await adminService.toggleUserActive(userId);

      // Log the action
      await get().logAction('user.toggle_active', { targetUserId: userId });

      // Refresh users
      await get().fetchUsers();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to toggle user status';
      set({ usersError: message });
      throw err;
    }
  },

  selectUser: (user: UserProfile | null) => {
    set({ selectedUser: user });
    if (!user) {
      set({ selectedUserData: null });
    }
  },

  // User data viewing
  fetchUserData: async (userId: string) => {
    set({ usersLoading: true, usersError: null });
    try {
      const [accounts, expenses, incomes, ledgerAccounts, snapshots] = await Promise.all([
        adminService.getUserAccounts(userId),
        adminService.getUserExpenses(userId),
        adminService.getUserIncomes(userId),
        adminService.getUserLedgerAccounts(userId),
        adminService.getUserSnapshots(userId),
      ]);

      // Log the action
      await get().logAction('data.view', {
        targetUserId: userId,
        dataTypes: ['accounts', 'expenses', 'incomes', 'ledgerAccounts', 'snapshots'],
      });

      set({
        selectedUserData: { accounts, expenses, incomes, ledgerAccounts, snapshots },
        usersLoading: false,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch user data';
      set({ usersError: message, usersLoading: false });
    }
  },

  clearUserData: () => {
    set({ selectedUserData: null });
  },

  // System config actions
  fetchSystemConfig: async () => {
    set({ configLoading: true, configError: null });
    try {
      const config = await adminService.getSystemConfig();
      set({ systemConfig: config, configLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch system config';
      set({ configError: message, configLoading: false });
    }
  },

  updateSystemConfig: async (key: string, value: unknown) => {
    set({ configLoading: true, configError: null });
    try {
      // Get current user ID for audit
      const { useAuthStore } = await import('./authStore');
      const adminUserId = useAuthStore.getState().user?.id || 'unknown';

      await adminService.updateSystemConfig(key, value, adminUserId);

      // Log the action
      await get().logAction('config.update', {
        key,
        value,
      });

      // Refresh config
      await get().fetchSystemConfig();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update config';
      set({ configError: message, configLoading: false });
      throw err;
    }
  },

  getConfigValue: <T>(key: string): T | undefined => {
    const config = get().systemConfig.find((c) => c.key === key);
    return config?.value as T | undefined;
  },

  // Audit log actions
  fetchAuditLog: async (options?: { action?: string; limit?: number }) => {
    set({ auditLoading: true, auditError: null });
    try {
      const log = await adminService.getAuditLog({
        action: options?.action,
        limit: options?.limit || 100,
      });
      set({ auditLog: log, auditLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch audit log';
      set({ auditError: message, auditLoading: false });
    }
  },

  logAction: async (action: AdminAction, details?: Record<string, unknown>) => {
    try {
      const { useAuthStore } = await import('./authStore');
      const adminUserId = useAuthStore.getState().user?.id;
      if (!adminUserId) return;

      await adminService.logAction(adminUserId, action, {
        targetUserId: details?.targetUserId as string,
        targetResource: details?.targetResource as string,
        data: details,
      });
    } catch (err) {
      console.error('Failed to log admin action:', err);
    }
  },

  // Utilities
  clearErrors: () => {
    set({ usersError: null, configError: null, auditError: null });
  },

  getUserWithFinancials: async (userId: string): Promise<UserWithFinancials | null> => {
    const user = await get().fetchUser(userId);
    if (!user) return null;

    try {
      const [accounts, expenses, incomes, ledgerAccounts, snapshots] = await Promise.all([
        adminService.getUserAccounts(userId),
        adminService.getUserExpenses(userId),
        adminService.getUserIncomes(userId),
        adminService.getUserLedgerAccounts(userId),
        adminService.getUserSnapshots(userId),
      ]);

      // Calculate total net worth
      const totalNetWorth = accounts.reduce((sum, acc) => sum + acc.balance, 0);

      return {
        ...user,
        accountCount: accounts.length,
        expenseCount: expenses.length,
        incomeCount: incomes.length,
        ledgerAccountCount: ledgerAccounts.length,
        snapshotCount: snapshots.length,
        totalNetWorth,
      };
    } catch {
      return user;
    }
  },
}));
