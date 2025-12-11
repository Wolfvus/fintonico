// Form styles using CSS custom properties for consistent theming
// These classes leverage the design tokens defined in index.css

export const formStyles = {
  input: {
    // Uses CSS variables: --color-surface-card, --color-border, --color-text-primary, --color-border-focus
    base: 'w-full px-3.5 py-2.5 sm:py-2 sm:px-3 rounded-lg transition-colors text-base sm:text-sm min-h-[44px] sm:min-h-0 input',
  },

  label: {
    // Uses CSS variable: --color-text-primary
    base: 'flex items-center gap-2 text-sm font-medium mb-2 text-primary',
  },

  button: {
    // Uses CSS variables: --color-primary, --color-primary-hover
    primary: 'w-full font-medium py-3 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm min-h-[44px] btn-primary',
    // Uses CSS variables: --color-surface-elevated, --color-text-primary, --color-border
    secondary: 'w-full font-medium py-3 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm min-h-[44px] btn-secondary',
  },

  // Uses CSS variables: --color-surface-card, --color-border
  card: 'card rounded-xl shadow-lg p-6',

  // Uses CSS variable: --color-error
  error: 'text-xs mt-1 text-error',
};
