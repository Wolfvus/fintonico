// Hook that calculates start and end dates based on view mode (month, year, custom)
import { useMemo } from 'react';

interface DateRangeParams {
  viewMode: 'month' | 'year' | 'custom';
  selectedDate: Date;
  customStartDate: string;
  customEndDate: string;
}

interface DateRangeResult {
  startDate: Date;
  endDate: Date;
}

export const useDateRange = ({
  viewMode,
  selectedDate,
  customStartDate,
  customEndDate
}: DateRangeParams): DateRangeResult => {
  return useMemo(() => {
    let startDate: Date;
    let endDate: Date;
    
    if (viewMode === 'month') {
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth();
      startDate = new Date(year, month, 1);
      endDate = new Date(year, month + 1, 0, 23, 59, 59);
    } else if (viewMode === 'year') {
      const year = selectedDate.getFullYear();
      startDate = new Date(year, 0, 1);
      endDate = new Date(year, 11, 31, 23, 59, 59);
    } else {
      startDate = customStartDate ? new Date(customStartDate) : new Date();
      endDate = customEndDate ? new Date(customEndDate) : new Date();
    }
    
    return { startDate, endDate };
  }, [viewMode, selectedDate, customStartDate, customEndDate]);
};