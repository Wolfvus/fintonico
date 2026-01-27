/**
 * Admin Types
 * Type definitions for Super Admin Panel functionality
 */

// User roles for role-based access control
export type UserRole = 'super_admin' | 'admin' | 'user';

// Subscription tiers for feature gating
export type SubscriptionTier = 'freemium' | 'pro';

// User profile with role and status
export interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  role: UserRole;
  subscriptionTier: SubscriptionTier;
  subscriptionUpdatedAt?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// System configuration entry
export interface SystemConfig {
  id: string;
  key: string;
  value: unknown;
  description?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

// Admin audit log entry
export interface AdminAuditLog {
  id: string;
  adminUserId: string;
  action: string;
  targetUserId?: string;
  targetResource?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

// User profile with additional financial data for admin views
export interface UserWithFinancials extends UserProfile {
  accountCount?: number;
  expenseCount?: number;
  incomeCount?: number;
  ledgerAccountCount?: number;
  snapshotCount?: number;
  totalNetWorth?: number;
  lastActivity?: string;
}

// System config keys enum for type safety
export type SystemConfigKey =
  | 'default_currency'
  | 'supported_currencies'
  | 'expense_categories'
  | 'income_frequencies'
  | 'account_types';

// Typed system config values
export interface SystemConfigValues {
  default_currency: string;
  supported_currencies: string[];
  expense_categories: string[];
  income_frequencies: string[];
  account_types: string[];
}

// Admin action types for audit logging
export type AdminAction =
  | 'user.update'
  | 'user.role_change'
  | 'user.toggle_active'
  | 'user.tier_change'
  | 'config.update'
  | 'data.view'
  | 'data.export';

// Update user request
export interface UpdateUserRequest {
  displayName?: string;
  role?: UserRole;
  subscriptionTier?: SubscriptionTier;
  isActive?: boolean;
}

// Admin panel section identifiers
export type AdminSection = 'users' | 'financial-data' | 'system-config' | 'audit-log';

// Financial data tab identifiers
export type FinancialDataTab = 'accounts' | 'expenses' | 'incomes' | 'ledger-accounts' | 'snapshots';

// User counts summary
export interface UserCounts {
  total: number;
  byRole: Record<UserRole, number>;
  byTier: Record<SubscriptionTier, number>;
}
