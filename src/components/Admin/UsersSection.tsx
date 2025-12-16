/**
 * Users Section
 * Admin panel section for managing users
 */

import { useEffect, useState } from 'react';
import { Search, Plus, Edit2, Trash2, Shield, User as UserIcon, CheckCircle, XCircle } from 'lucide-react';
import { useAdminStore } from '../../stores/adminStore';
import { useAuthStore } from '../../stores/authStore';
import type { UserProfile, UserRole } from '../../types/admin';
import { UserDetailModal } from './UserDetailModal';
import { CreateUserModal } from './CreateUserModal';

export const UsersSection: React.FC = () => {
  const { users, loadingUsers, errorUsers, fetchUsers, deleteUser } = useAdminStore();
  const { isSuperAdmin } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const canManageUsers = isSuperAdmin();

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

  const handleDelete = async (userId: string) => {
    await deleteUser(userId);
    setShowDeleteConfirm(null);
  };

  if (loadingUsers) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--color-primary)' }}></div>
      </div>
    );
  }

  if (errorUsers) {
    return (
      <div className="text-center py-12 text-red-500">
        <p>Error loading users: {errorUsers}</p>
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
      {/* Header with Search and Create */}
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
        {canManageUsers && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create User
          </button>
        )}
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">User</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Role</th>
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
                  {user.isActive ? (
                    <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm">Active</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
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
                    {canManageUsers && (
                      <button
                        onClick={() => setShowDeleteConfirm(user.id)}
                        className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                        title="Delete user"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
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

      {/* Create User Modal */}
      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Delete User</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete this user? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
