/**
 * Admin Page
 * Main admin panel with sub-navigation for Users, Financial Data, and System Config
 */

import { useState } from 'react';
import { Users, Database, Settings, Shield } from 'lucide-react';
import type { AdminSection } from '../../types/admin';
import { UsersSection } from './UsersSection';

export const AdminPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState<AdminSection>('users');

  const sections = [
    { id: 'users' as const, label: 'Users', icon: Users },
    { id: 'financial-data' as const, label: 'Financial Data', icon: Database },
    { id: 'system-config' as const, label: 'System Config', icon: Settings },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 py-2">
        <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
          <Shield className="w-6 h-6 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Admin Panel</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage users, data, and system configuration</p>
        </div>
      </div>

      {/* Sub Navigation */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeSection === section.id
                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <section.icon className="w-4 h-4" />
            {section.label}
          </button>
        ))}
      </div>

      {/* Section Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        {activeSection === 'users' && (
          <UsersSection />
        )}

        {activeSection === 'financial-data' && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">Financial Data</h3>
            <p className="text-sm">Financial data viewer coming soon...</p>
          </div>
        )}

        {activeSection === 'system-config' && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">System Configuration</h3>
            <p className="text-sm">System configuration coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
};
