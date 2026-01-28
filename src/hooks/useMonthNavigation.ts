import { useState, useCallback, useMemo } from 'react';
import { getCurrentDate } from '../utils/dateUtils';

interface MonthNavigationResult {
  /** The currently selected date */
  selectedDate: Date;
  /** Navigate to previous or next month */
  navigateMonth: (direction: 'prev' | 'next') => void;
  /** Navigate to previous or next year */
  navigateYear: (direction: 'prev' | 'next') => void;
  /** Formatted month string (e.g., "December 2025") */
  formattedMonth: string;
  /** Month string in YYYY-MM format (e.g., "2025-12") */
  monthString: string;
  /** Whether the selected month is the current month */
  isCurrentMonth: boolean;
  /** Reset to current month */
  goToCurrentMonth: () => void;
  /** Set to a specific date */
  setSelectedDate: (date: Date) => void;
  /** Get start of the selected month */
  startOfMonth: Date;
  /** Get end of the selected month */
  endOfMonth: Date;
}

/**
 * Custom hook for month navigation functionality.
 * Encapsulates month/year navigation state and helpers.
 *
 * @param initialDate - Optional initial date (defaults to current date)
 * @returns Object with navigation state and handlers
 */
export function useMonthNavigation(initialDate?: Date): MonthNavigationResult {
  const [selectedDate, setSelectedDate] = useState(initialDate ?? getCurrentDate());

  const navigateMonth = useCallback((direction: 'prev' | 'next') => {
    setSelectedDate(current => {
      const newDate = new Date(current);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  }, []);

  const navigateYear = useCallback((direction: 'prev' | 'next') => {
    setSelectedDate(current => {
      const newDate = new Date(current);
      if (direction === 'prev') {
        newDate.setFullYear(newDate.getFullYear() - 1);
      } else {
        newDate.setFullYear(newDate.getFullYear() + 1);
      }
      return newDate;
    });
  }, []);

  const goToCurrentMonth = useCallback(() => {
    setSelectedDate(getCurrentDate());
  }, []);

  const formattedMonth = useMemo(() => {
    return selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [selectedDate]);

  const monthString = useMemo(() => {
    return `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}`;
  }, [selectedDate]);

  const isCurrentMonth = useMemo(() => {
    const now = getCurrentDate();
    return selectedDate.getFullYear() === now.getFullYear() &&
           selectedDate.getMonth() === now.getMonth();
  }, [selectedDate]);

  const startOfMonth = useMemo(() => {
    return new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
  }, [selectedDate]);

  const endOfMonth = useMemo(() => {
    return new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0, 23, 59, 59);
  }, [selectedDate]);

  return {
    selectedDate,
    navigateMonth,
    navigateYear,
    formattedMonth,
    monthString,
    isCurrentMonth,
    goToCurrentMonth,
    setSelectedDate,
    startOfMonth,
    endOfMonth,
  };
}
