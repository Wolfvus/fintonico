import React from 'react';
import { type LucideIcon } from 'lucide-react';
import { formStyles } from '../../styles/formStyles';

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
  inputClassName = formStyles.input.base
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = maxLength ? e.target.value.slice(0, maxLength) : e.target.value;
    onChange(newValue);
  };

  return (
    <div className={className}>
      <label className={formStyles.label.base}>
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
        <p className={formStyles.error}>{error}</p>
      )}
    </div>
  );
};