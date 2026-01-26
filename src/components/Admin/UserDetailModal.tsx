/**
 * User Detail Modal
 * Modal for viewing and editing user details
 */

import { useState } from 'react';
import { X, Save, Shield, Crown } from 'lucide-react';
import { useAdminStore } from '../../stores/adminStore';
import { useAuthStore } from '../../stores/authStore';
import type { UserProfile, UserRole, SubscriptionTier } from '../../types/admin';

interface UserDetailModalProps {
  user: UserProfile;
  onClose: () => void;
}

export const UserDetailModal: React.FC<UserDetailModalProps> = ({ user, onClose }) => {
  const { updateUser, setUserRole, setUserTier } = useAdminStore();
  const { isSuperAdmin, user: currentUser } = useAuthStore();
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [role, setRole] = useState<UserRole>(user.role);
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>(user.subscriptionTier || 'freemium');
  const [isActive, setIsActive] = useState(user.isActive);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canManageRoles = isSuperAdmin();
  const canManageTier = isSuperAdmin();
  const isCurrentUser = currentUser?.id === user.id;

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      // Update user profile
      await updateUser(user.id, {
        displayName: displayName || undefined,
        isActive,
      });

      // Update role if changed and user has permission
      if (role !== user.role && canManageRoles) {
        await setUserRole(user.id, role);
      }

      // Update subscription tier if changed and user has permission
      if (subscriptionTier !== (user.subscriptionTier || 'freemium') && canManageTier) {
        await setUserTier(user.id, subscriptionTier);
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-lg w-full mx-4 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Edit User</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Email (read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 cursor-not-allowed"
            />
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter display name"
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              disabled={!canManageRoles || isCurrentUser}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-gray-900 disabled:cursor-not-allowed"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
            {isCurrentUser && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                You cannot change your own role
              </p>
            )}
            {!canManageRoles && !isCurrentUser && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Only Super Admins can change roles
              </p>
            )}
          </div>

          {/* Subscription Tier */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <span className="flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-yellow-500" />
                Subscription Tier
              </span>
            </label>
            <select
              value={subscriptionTier}
              onChange={(e) => setSubscriptionTier(e.target.value as SubscriptionTier)}
              disabled={!canManageTier}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-gray-900 disabled:cursor-not-allowed"
            >
              <option value="freemium">Freemium (Free)</option>
              <option value="pro">Pro (Premium)</option>
            </select>
            {!canManageTier && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Only Super Admins can change subscription tier
              </p>
            )}
            {user.subscriptionUpdatedAt && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Last changed: {new Date(user.subscriptionUpdatedAt).toLocaleString()}
              </p>
            )}
          </div>

          {/* Active Status */}
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                disabled={isCurrentUser}
                className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 disabled:cursor-not-allowed"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Account is active
              </span>
            </label>
            {isCurrentUser && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 ml-7">
                You cannot deactivate your own account
              </p>
            )}
          </div>

          {/* Timestamps */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Created: {new Date(user.createdAt).toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Updated: {new Date(user.updatedAt).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
