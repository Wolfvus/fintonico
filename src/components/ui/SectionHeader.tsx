// Section header component with title and optional right-side content (actions, buttons)
import React from 'react';

interface SectionHeaderProps {
  title: string;
  right?: React.ReactNode;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, right, className = '' }) => {
  return (
    <div className={`flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
      {right && <div>{right}</div>}
    </div>
  );
};