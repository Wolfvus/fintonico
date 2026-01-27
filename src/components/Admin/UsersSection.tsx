/**
 * Users Section
 * Admin panel section for managing users
 */

import { useEffect, useState } from 'react';
import { Search, Edit2, Shield, User as UserIcon, CheckCircle, XCircle, Crown, Users } from 'lucide-react';
import { useAdminStore } from '../../stores/adminStore';
import type { UserProfile, UserRole, SubscriptionTier } from '../../types/admin';
import { UserDetailModal } from './UserDetailModal';

export const UsersSection: React.FC = () => {
  const { users, usersLoading, usersError, userCounts, fetchUsers } = useAdminStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getRoleBadge = (role: UserRole) => {
    const styles: Record<UserRole, string> = {
      super_admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
      admin: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      user: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    };
    const labels: Record<UserRole, string> = {
      super_admin: 'Super Admin',
      admin: 'Admin',
      user: 'User',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[role]}`}>
        {labels[role]}
      </span>
    );
  };

  const getTierBadge = (tier: SubscriptionTier) => {
    if (tier === 'pro') {
      return (
        <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
          <Crown className="w-3 h-3" />
          Pro
        </span>
      );
    }
    return (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
        Free
      </span>
    );
  };

  const activeCount = users.filter(u => u.isActive).length;
  const inactiveCount = users.length - activeCount;

  if (usersLoading && users.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--color-primary)' }}></div>
      </div>
    );
  }

  if (usersError) {
    return (
      <div className="text-center py-12 text-red-500">
        <p>Error loading users: {usersError}</p>
        <button
          onClick={() => fetchUsers()}
          className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      {userCounts && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span className="text-xs font-medium text-purple-600 dark:text-purple-400">Total Users</span>
            </div>
            <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{userCounts.total}</p>
          </div>
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400">By Role</span>
            </div>
            <div className="text-xs text-blue-700 dark:text-blue-300 space-y-0.5">
              <p>Super Admin: {userCounts.byRole.super_admin}</p>
              <p>Admin: {userCounts.byRole.admin}</p>
              <p>User: {userCounts.byRole.user}</p>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2 mb-1">
              <Crown className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="text-xs font-medium text-amber-600 dark:text-amber-400">By Tier</span>
            </div>
            <div className="text-xs text-amber-700 dark:text-amber-300 space-y-0.5">
              <p>Pro: {userCounts.byTier.pro}</p>
              <p>Free: {userCounts.byTier.freemium}</p>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="text-xs font-medium text-green-600 dark:text-green-400">Status</span>
            </div>
            <div className="text-xs text-green-700 dark:text-green-300 space-y-0.5">
              <p>Active: {activeCount}</p>
              <p>Inactive: {inactiveCount}</p>
            </div>
          </div>
        </div>
      )}

      {/* Header with Search */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">User</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Role</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Tier</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Created</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr
                key={user.id}
                className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      {user.role === 'super_admin' || user.role === 'admin' ? (
                        <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      ) : (
                        <UserIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {user.displayName || 'No name'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  {getRoleBadge(user.role)}
                </td>
                <td className="py-3 px-4">
                  {getTierBadge(user.subscriptionTier)}
                </td>
                <td className="py-3 px-4">
                  {user.isActive ? (
                    <span className="flex items-center gap-1 text-green-700 dark:text-green-400">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm">Active</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-red-700 dark:text-red-400">
                      <XCircle className="w-4 h-4" />
                      <span className="text-sm">Inactive</span>
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setSelectedUser(user)}
                      className="p-2 text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400 transition-colors"
                      title="Edit user"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <UserIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No users found</p>
        </div>
      )}

      {/* User Detail Modal */}
      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </div>
  );
};
