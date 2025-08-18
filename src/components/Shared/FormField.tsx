import React from 'react';
import { type LucideIcon } from 'lucide-react';

interface FormFieldProps {
  label: string;
  icon: LucideIcon;
  type?: 'text' | 'date';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  error?: string;
  autoFocus?: boolean;
  className?: string;
  inputClassName?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  icon: Icon,
  type = 'text',
  value,
  onChange,
  placeholder,
  maxLength,
  error,
  autoFocus = false,
  className = "",
  inputClassName = "w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 transition-colors text-gray-900 dark:text-white border-blue-300 dark:border-gray-600 focus:border-gray-400 dark:focus:border-gray-500 focus:ring-1 focus:ring-gray-200 dark:focus:ring-gray-600"
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = maxLength ? e.target.value.slice(0, maxLength) : e.target.value;
    onChange(newValue);
  };

  return (
    <div className={className}>
      <label className="flex items-center gap-2 text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
        <Icon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={handleChange}
        className={inputClassName}
        placeholder={placeholder}
        maxLength={maxLength}
        autoFocus={autoFocus}
      />
      {error && (
        <p className="text-xs mt-1 text-red-500">{error}</p>
      )}
    </div>
  );
};