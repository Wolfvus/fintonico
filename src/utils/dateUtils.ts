import { useDateOverrideStore } from '../stores/dateOverrideStore';
import { useAuthStore } from '../stores/authStore';

/**
 * Get current date — respects admin time travel override in dev mode.
 */
export const getCurrentDate = (): Date => {
  const isDevMode = useAuthStore.getState().isDevMode;
  if (!isDevMode) {
    return new Date();
  }

  const { overrideDate, isActive } = useDateOverrideStore.getState();
  return (isActive && overrideDate) ? new Date(overrideDate) : new Date();
};

/**
 * Get today as YYYY-MM-DD string — respects override.
 */
export const getTodayLocalString = (): string => {
  const today = getCurrentDate();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
