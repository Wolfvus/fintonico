/**
 * Financial Data Section
 * Admin panel section for viewing user financial data
 */

import { useState, useEffect } from 'react';
import { Download, Search, BookOpen, Wallet, DollarSign, RefreshCw, List, Camera } from 'lucide-react';
import { useAdminStore } from '../../stores/adminStore';
import type { UserProfile } from '../../types/admin';
import type { Account, Expense, Income, LedgerAccount } from '../../types';
import type { NetWorthSnapshot } from '../../stores/snapshotStore';

type DataTab = 'accounts' | 'expenses' | 'incomes' | 'ledger-accounts' | 'snapshots';

export const FinancialDataSection: React.FC = () => {
  const {
    users,
    selectedUser,
    selectedUserData,
    usersLoading,
    fetchUsers,
    selectUser,
    fetchUserData,
    clearUserData,
  } = useAdminStore();

  const [activeTab, setActiveTab] = useState<DataTab>('accounts');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (users.length === 0) {
      fetchUsers();
    }
  }, [users.length, fetchUsers]);

  useEffect(() => {
    if (selectedUser) {
      fetchUserData(selectedUser.id);
    }
  }, [selectedUser, fetchUserData]);

  const handleUserSelect = (userId: string) => {
    if (!userId) {
      selectUser(null);
      clearUserData();
      return;
    }
    const user = users.find(u => u.id === userId);
    if (user) {
      selectUser(user);
    }
  };

  const userAccounts = selectedUserData?.accounts || [];
  const userExpenses = selectedUserData?.expenses || [];
  const userIncomes = selectedUserData?.incomes || [];
  const userLedgerAccounts = selectedUserData?.ledgerAccounts || [];
  const userSnapshots = selectedUserData?.snapshots || [];

  const tabs = [
    { id: 'accounts' as const, label: 'Net Worth', icon: BookOpen, count: userAccounts.length },
    { id: 'expenses' as const, label: 'Expenses', icon: Wallet, count: userExpenses.length },
    { id: 'incomes' as const, label: 'Incomes', icon: DollarSign, count: userIncomes.length },
    { id: 'ledger-accounts' as const, label: 'Ledger', icon: List, count: userLedgerAccounts.length },
    { id: 'snapshots' as const, label: 'Snapshots', icon: Camera, count: userSnapshots.length },
  ];

  const exportToCSV = (data: Record<string, unknown>[], filename: string) => {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row =>
        headers.map(header => {
          const value = row[header];
          const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value ?? '');
          return `"${stringValue.replace(/"/g, '""')}"`;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleExport = () => {
    switch (activeTab) {
      case 'accounts':
        exportToCSV(userAccounts as unknown as Record<string, unknown>[], 'accounts');
        break;
      case 'expenses':
        exportToCSV(userExpenses as unknown as Record<string, unknown>[], 'expenses');
        break;
      case 'incomes':
        exportToCSV(userIncomes as unknown as Record<string, unknown>[], 'incomes');
        break;
      case 'ledger-accounts':
        exportToCSV(userLedgerAccounts as unknown as Record<string, unknown>[], 'ledger-accounts');
        break;
      case 'snapshots':
        exportToCSV(userSnapshots as unknown as Record<string, unknown>[], 'snapshots');
        break;
    }
  };

  const handleRefresh = () => {
    if (selectedUser) {
      fetchUserData(selectedUser.id);
    }
  };

  const filteredAccounts = userAccounts.filter((account: Account) =>
    account.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredExpenses = userExpenses.filter((expense: Expense) =>
    expense.what?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.rating?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredIncomes = userIncomes.filter((income: Income) =>
    income.source?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    income.frequency?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredLedgerAccounts = userLedgerAccounts.filter((account: LedgerAccount) =>
    account.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.accountNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSnapshots = userSnapshots.filter((snapshot: NetWorthSnapshot) =>
    snapshot.monthEndLocal?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* User Selector */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Select User
          </label>
          <select
            value={selectedUser?.id || ''}
            onChange={(e) => handleUserSelect(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="">Choose a user...</option>
            {users.map((user: UserProfile) => (
              <option key={user.id} value={user.id}>
                {user.email} {user.displayName ? `(${user.displayName})` : ''}
              </option>
            ))}
          </select>
        </div>
        {selectedUser && (
          <div className="flex items-end gap-2">
            <button
              onClick={handleRefresh}
              disabled={usersLoading}
              className="p-2 text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400 transition-colors border border-gray-200 dark:border-gray-700 rounded-lg"
              title="Refresh data"
            >
              <RefreshCw className={`w-5 h-5 ${usersLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        )}
      </div>

      {!selectedUser ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Select a user to view their financial data</p>
        </div>
      ) : (
        <>
          {/* Selected User Info */}
          <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Viewing data for: <span className="font-medium text-gray-900 dark:text-white">{selectedUser.email}</span>
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                <span className="px-1.5 py-0.5 text-xs rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Loading State */}
          {usersLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--color-primary)' }}></div>
            </div>
          ) : (
            <>
              {/* Accounts Tab */}
              {activeTab === 'accounts' && (
                <div className="overflow-x-auto">
                  {filteredAccounts.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      No accounts found
                    </div>
                  ) : (
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Name</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Type</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Balance</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Currency</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Last Updated</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAccounts.map((account: Account) => (
                          <tr key={account.id} className="border-b border-gray-100 dark:border-gray-800">
                            <td className="py-3 px-4 text-gray-900 dark:text-white">{account.name}</td>
                            <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{account.type}</td>
                            <td className="py-3 px-4 text-right font-mono text-gray-900 dark:text-white">
                              {account.balance?.toLocaleString() ?? '0'}
                            </td>
                            <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{account.currency}</td>
                            <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">
                              {account.lastUpdated ? new Date(account.lastUpdated).toLocaleDateString() : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* Expenses Tab */}
              {activeTab === 'expenses' && (
                <div className="overflow-x-auto">
                  {filteredExpenses.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      No expenses found
                    </div>
                  ) : (
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Date</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">What</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Rating</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Amount</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Currency</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredExpenses.map((expense: Expense) => (
                          <tr key={expense.id} className="border-b border-gray-100 dark:border-gray-800">
                            <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">
                              {new Date(expense.date).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4 text-gray-900 dark:text-white">{expense.what}</td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                                {expense.rating}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-red-600 dark:text-red-400">
                              -{expense.amount?.toLocaleString() ?? '0'}
                            </td>
                            <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{expense.currency}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* Incomes Tab */}
              {activeTab === 'incomes' && (
                <div className="overflow-x-auto">
                  {filteredIncomes.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      No incomes found
                    </div>
                  ) : (
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Date</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Source</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Frequency</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Amount</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Currency</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredIncomes.map((income: Income) => (
                          <tr key={income.id} className="border-b border-gray-100 dark:border-gray-800">
                            <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">
                              {new Date(income.date).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4 text-gray-900 dark:text-white">{income.source}</td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                                {income.frequency}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-green-600 dark:text-green-400">
                              +{income.amount?.toLocaleString() ?? '0'}
                            </td>
                            <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{income.currency}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* Ledger Accounts Tab */}
              {activeTab === 'ledger-accounts' && (
                <div className="overflow-x-auto">
                  {filteredLedgerAccounts.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      No ledger accounts found
                    </div>
                  ) : (
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Name</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Account #</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">CLABE</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Normal Balance</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Active</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredLedgerAccounts.map((account: LedgerAccount) => (
                          <tr key={account.id} className="border-b border-gray-100 dark:border-gray-800">
                            <td className="py-3 px-4 text-gray-900 dark:text-white">{account.name}</td>
                            <td className="py-3 px-4 font-mono text-sm text-gray-600 dark:text-gray-400">
                              {account.accountNumber || '-'}
                            </td>
                            <td className="py-3 px-4 font-mono text-sm text-gray-600 dark:text-gray-400">
                              {account.clabe || '-'}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                account.normalBalance === 'debit'
                                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                  : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                              }`}>
                                {account.normalBalance}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                account.isActive
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                              }`}>
                                {account.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* Snapshots Tab */}
              {activeTab === 'snapshots' && (
                <div className="overflow-x-auto">
                  {filteredSnapshots.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      No snapshots found
                    </div>
                  ) : (
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Month</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Net Worth</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Assets</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Liabilities</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Created</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSnapshots.map((snapshot: NetWorthSnapshot) => (
                          <tr key={snapshot.id || snapshot.monthEndLocal} className="border-b border-gray-100 dark:border-gray-800">
                            <td className="py-3 px-4 text-gray-900 dark:text-white font-medium">
                              {snapshot.monthEndLocal}
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-gray-900 dark:text-white">
                              {snapshot.netWorthBase?.toLocaleString() ?? '0'}
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-green-600 dark:text-green-400">
                              {snapshot.totalsByNature?.asset?.toLocaleString() ?? '0'}
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-red-600 dark:text-red-400">
                              {snapshot.totalsByNature?.liability?.toLocaleString() ?? '0'}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">
                              {snapshot.createdAt ? new Date(snapshot.createdAt).toLocaleDateString() : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};
