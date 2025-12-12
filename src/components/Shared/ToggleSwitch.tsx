import React from 'react';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  ariaLabel?: string;
  size?: 'sm' | 'md';
  disabled?: boolean;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  label,
  ariaLabel,
  size = 'md',
  disabled = false
}) => {
  const sizeClasses = {
    sm: {
      track: 'w-8 h-4',
      thumb: 'w-3 h-3',
      translate: 'translate-x-4'
    },
    md: {
      track: 'w-11 h-6',
      thumb: 'w-5 h-5',
      translate: 'translate-x-5'
    }
  };

  const classes = sizeClasses[size];

  return (
    <label className={`flex items-center gap-2 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          aria-label={ariaLabel ?? label}
          className="sr-only"
        />
        <div
          className={`${classes.track} ${
            checked
              ? 'bg-[var(--color-primary)]'
              : 'bg-[var(--color-border-light)]'
          } rounded-full transition-all duration-200 ${
            disabled ? 'opacity-50' : ''
          }`}
        />
        <div
          className={`${classes.thumb} bg-white rounded-full shadow-lg transform transition-all duration-200 absolute top-0.5 left-0.5 ${
            checked ? classes.translate : 'translate-x-0'
          }`}
        />
      </div>
      {label && (
        <span className={`text-sm font-medium ${disabled ? 'text-muted' : 'text-primary'}`}>
          {label}
        </span>
      )}
    </label>
  );
};
