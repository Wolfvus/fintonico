import i18n from '../i18n';

export const formatDate = (dateString: string): string => {
  // Parse the date as local time to avoid timezone issues
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day); // month is 0-indexed

  return date.toLocaleDateString(i18n.language, {
    day: 'numeric',
    month: 'short',
    year: '2-digit',
  });
};

export { getTodayLocalString } from './dateUtils';

// Re-export getCurrentDate for convenience
export { getCurrentDate } from './dateUtils';

export const parseLocalDate = (dateString: string): Date => {
  // Parse the date as local time to avoid timezone issues
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day); // month is 0-indexed
};