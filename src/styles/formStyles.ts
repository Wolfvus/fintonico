export const formStyles = {
  input: {
    base: 'w-full px-3.5 py-2.5 sm:py-2 sm:px-3 border rounded-lg bg-white dark:bg-gray-700 transition-colors text-gray-900 dark:text-white focus:ring-1 text-base sm:text-sm min-h-[44px] sm:min-h-0',
    default: 'border-blue-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-gray-500 focus:ring-blue-200 dark:focus:ring-gray-600',
    green: 'border-blue-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-gray-500 focus:ring-blue-200 dark:focus:ring-gray-600',
    amber: 'border-blue-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-gray-500 focus:ring-blue-200 dark:focus:ring-gray-600',
  },
  
  label: {
    base: 'flex items-center gap-2 text-sm font-medium mb-2 text-gray-900 dark:text-gray-100',
  },
  
  button: {
    primary: 'w-full text-white font-medium py-3 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-sm min-h-[44px]',
    secondary: 'w-full text-gray-700 dark:text-gray-300 font-medium py-3 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-sm min-h-[44px]',
  },
  
  card: 'bg-blue-50 dark:bg-gray-800 rounded-xl shadow-lg border border-blue-200 dark:border-gray-700 p-6',
  
  error: 'text-xs mt-1 text-red-500',
};

export const getInputClassName = (variant: 'green' | 'amber' = 'green'): string => {
  return `${formStyles.input.base} ${formStyles.input[variant]}`;
};