/**
 * Admin Store
 * Zustand store for admin panel state management
 */

import { create } from 'zustand';
import { adminService } from '../services/adminService';
import type {
  UserProfile,
  UserRole,
  SystemConfig,
  AdminAuditLog,
  CreateUserRequest,
  UpdateUserRequest,
  UserWithFinancials,
  AdminAction,
} from '../types/admin';
import type { Account, Expense, Income } from '../types';

interface AdminState {
  // User management
  users: UserProfile[];
  selectedUser: UserProfile | null;
  selectedUserData: {
    accounts: Account[];
    expenses: Expense[];
    incomes: Income[];
  } | null;
  usersLoading: boolean;
  usersError: string | null;

  // System config
  systemConfig: SystemConfig[];
  configLoading: boolean;
  configError: string | null;

  // Audit log
  auditLog: AdminAuditLog[];
  auditLoading: boolean;

  // Actions
  // User management
  fetchUsers: () => Promise<void>;
  fetchUser: (userId: string) => Promise<UserProfile | null>;
  createUser: (request: CreateUserRequest) => Promise<UserProfile>;
  updateUser: (userId: string, updates: UpdateUserRequest) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  setUserRole: (userId: string, role: UserRole) => Promise<void>;
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
  fetchAuditLog: (options?: { limit?: number }) => Promise<void>;
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

  systemConfig: [],
  configLoading: false,
  configError: null,

  auditLog: [],
  auditLoading: false,

  // User management actions
  fetchUsers: async () => {
    set({ usersLoading: true, usersError: null });
    try {
      const users = await adminService.getUsers();
      set({ users, usersLoading: false });
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

  createUser: async (request: CreateUserRequest) => {
    set({ usersLoading: true, usersError: null });
    try {
      const newUser = await adminService.createUser(request);

      // Log the action
      await get().logAction('user.create', {
        targetUserId: newUser.id,
        email: newUser.email,
        role: newUser.role,
      });

      // Refresh users list
      await get().fetchUsers();

      return newUser;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create user';
      set({ usersError: message, usersLoading: false });
      throw err;
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

  deleteUser: async (userId: string) => {
    set({ usersLoading: true, usersError: null });
    try {
      await adminService.deleteUser(userId);

      // Log the action
      await get().logAction('user.delete', { targetUserId: userId });

      // Update local state
      set((state) => ({
        users: state.users.filter((u) => u.id !== userId),
        selectedUser: state.selectedUser?.id === userId ? null : state.selectedUser,
        selectedUserData: state.selectedUser?.id === userId ? null : state.selectedUserData,
        usersLoading: false,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete user';
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
      const [accounts, expenses, incomes] = await Promise.all([
        adminService.getUserAccounts(userId),
        adminService.getUserExpenses(userId),
        adminService.getUserIncomes(userId),
      ]);

      // Log the action
      await get().logAction('data.view', {
        targetUserId: userId,
        dataTypes: ['accounts', 'expenses', 'incomes'],
      });

      set({
        selectedUserData: { accounts, expenses, incomes },
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
  fetchAuditLog: async (options?: { limit?: number }) => {
    set({ auditLoading: true });
    try {
      const log = await adminService.getAuditLog({ limit: options?.limit || 100 });
      set({ auditLog: log, auditLoading: false });
    } catch (err) {
      console.error('Failed to fetch audit log:', err);
      set({ auditLoading: false });
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
    set({ usersError: null, configError: null });
  },

  getUserWithFinancials: async (userId: string): Promise<UserWithFinancials | null> => {
    const user = await get().fetchUser(userId);
    if (!user) return null;

    try {
      const [accounts, expenses, incomes] = await Promise.all([
        adminService.getUserAccounts(userId),
        adminService.getUserExpenses(userId),
        adminService.getUserIncomes(userId),
      ]);

      // Calculate total net worth
      const totalNetWorth = accounts.reduce((sum, acc) => sum + acc.balance, 0);

      return {
        ...user,
        accountCount: accounts.length,
        expenseCount: expenses.length,
        incomeCount: incomes.length,
        totalNetWorth,
      };
    } catch {
      return user;
    }
  },
}));
