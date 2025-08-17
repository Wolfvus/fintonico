export const formStyles = {
  input: {
    base: 'w-full px-3 py-2 border rounded-lg bg-slate-100 dark:bg-gray-700 transition-colors text-gray-900 dark:text-white focus:ring-1',
    default: 'border-slate-300 dark:border-gray-600 focus:border-slate-400 dark:focus:border-gray-500 focus:ring-slate-200 dark:focus:ring-gray-600',
    green: 'border-slate-300 dark:border-gray-600 focus:border-slate-400 dark:focus:border-gray-500 focus:ring-slate-200 dark:focus:ring-gray-600',
    amber: 'border-slate-300 dark:border-gray-600 focus:border-slate-400 dark:focus:border-gray-500 focus:ring-slate-200 dark:focus:ring-gray-600',
  },
  
  label: {
    base: 'flex items-center gap-2 text-sm font-medium mb-2 text-gray-900 dark:text-gray-100',
  },
  
  button: {
    primary: 'w-full text-white font-medium py-3 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600',
    secondary: 'w-full text-gray-700 dark:text-gray-300 font-medium py-3 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600',
  },
  
  card: 'bg-slate-100 dark:bg-gray-800 rounded-xl shadow-lg border border-slate-300 dark:border-gray-700 p-6',
  
  error: 'text-xs mt-1 text-red-500',
};

export const getInputClassName = (variant: 'green' | 'amber' = 'green'): string => {
  return `${formStyles.input.base} ${formStyles.input[variant]}`;
};