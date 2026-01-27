/**
 * Audit Log Section
 * Admin panel section for viewing admin audit log entries
 */

import { useEffect, useState } from 'react';
import { RefreshCw, ChevronDown, ChevronRight, AlertCircle, ClipboardList } from 'lucide-react';
import { useAdminStore } from '../../stores/adminStore';
import type { AdminAuditLog } from '../../types/admin';

const ACTION_OPTIONS = [
  { value: '', label: 'All Actions' },
  { value: 'user.update', label: 'User Update' },
  { value: 'user.role_change', label: 'Role Change' },
  { value: 'user.toggle_active', label: 'Toggle Active' },
  { value: 'user.tier_change', label: 'Tier Change' },
  { value: 'config.update', label: 'Config Update' },
  { value: 'data.view', label: 'Data View' },
  { value: 'data.export', label: 'Data Export' },
];

const LIMIT_OPTIONS = [25, 50, 100];

const getActionBadge = (action: string) => {
  const styles: Record<string, string> = {
    'user.update': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    'user.role_change': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    'user.toggle_active': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    'user.tier_change': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    'config.update': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    'data.view': 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    'data.export': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[action] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}>
      {action}
    </span>
  );
};

export const AuditLogSection: React.FC = () => {
  const { auditLog, auditLoading, auditError, users, fetchAuditLog, fetchUsers } = useAdminStore();
  const [actionFilter, setActionFilter] = useState('');
  const [limit, setLimit] = useState(50);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  useEffect(() => {
    fetchAuditLog({ action: actionFilter || undefined, limit });
  }, [fetchAuditLog, actionFilter, limit]);

  useEffect(() => {
    if (users.length === 0) {
      fetchUsers();
    }
  }, [users.length, fetchUsers]);

  const resolveEmail = (userId?: string) => {
    if (!userId) return '-';
    const user = users.find(u => u.id === userId);
    return user?.email || userId.slice(0, 8) + '...';
  };

  const handleRefresh = () => {
    fetchAuditLog({ action: actionFilter || undefined, limit });
  };

  const toggleRow = (id: string) => {
    setExpandedRow(prev => prev === id ? null : id);
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="flex gap-3">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            {ACTION_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            {LIMIT_OPTIONS.map(n => (
              <option key={n} value={n}>Show {n}</option>
            ))}
          </select>
        </div>
        <button
          onClick={handleRefresh}
          disabled={auditLoading}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${auditLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Error State */}
      {auditError && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {auditError}
        </div>
      )}

      {/* Loading State */}
      {auditLoading && auditLog.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--color-primary)' }}></div>
        </div>
      ) : auditLog.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No audit log entries found</p>
        </div>
      ) : (
        /* Audit Log Table */
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="w-8 py-3 px-2"></th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Date/Time</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Admin</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Action</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Target User</th>
              </tr>
            </thead>
            <tbody>
              {auditLog.map((entry: AdminAuditLog) => (
                <>
                  <tr
                    key={entry.id}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                    onClick={() => toggleRow(entry.id)}
                  >
                    <td className="py-3 px-2 text-gray-400">
                      {entry.details ? (
                        expandedRow === entry.id ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )
                      ) : null}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {new Date(entry.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                      {resolveEmail(entry.adminUserId)}
                    </td>
                    <td className="py-3 px-4">
                      {getActionBadge(entry.action)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                      {resolveEmail(entry.targetUserId)}
                    </td>
                  </tr>
                  {expandedRow === entry.id && entry.details && (
                    <tr key={`${entry.id}-details`} className="border-b border-gray-100 dark:border-gray-800">
                      <td colSpan={5} className="px-6 py-3 bg-gray-50 dark:bg-gray-900">
                        <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap overflow-x-auto">
                          {JSON.stringify(entry.details, null, 2)}
                        </pre>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
