// Tab navigation component with icon support and responsive design
import React from 'react';

interface TabItem {
  value: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface TabsProps {
  value: string;
  onChange: (value: string) => void;
  items: TabItem[];
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ value, onChange, items, className = '' }) => {
  return (
    <div className={`border-b border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="flex">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = value === item.value;
          
          return (
            <button
              key={item.value}
              onClick={() => onChange(item.value)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                {Icon && <Icon className="w-4 h-4" />}
                <span className="hidden sm:inline">{item.label}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};