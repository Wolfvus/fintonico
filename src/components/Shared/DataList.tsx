import React, { useState, useMemo } from 'react';
import { Filter, ChevronLeft, ChevronRight, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { parseLocalDate } from '../../utils/dateFormat';

export interface DataItem {
  id: string;
  date?: string;
  [key: string]: any; // Allow any additional properties
}

export interface DataListProps<T extends DataItem> {
  title: string;
  items: T[];
  renderItem: (item: T, onDelete?: (id: string) => void) => React.ReactNode;
  onDelete?: (id: string) => void;
  loading?: boolean;
  showFilters?: boolean;
  emptyMessage?: string;
  enableDateFilter?: boolean;
  enableSorting?: boolean;
  sortOptions?: Array<{ value: string; label: string; sortFn?: (a: T, b: T) => number }>;
  filterOptions?: Array<{ value: string; label: string; filterFn?: (item: T) => boolean }>;
}

export const DataList = <T extends DataItem>({
  title,
  items,
  renderItem,
  onDelete,
  loading = false,
  showFilters = true,
  emptyMessage = "No items yet",
  enableDateFilter = true,
  enableSorting = true,
  sortOptions = [
    { value: 'date', label: 'By Date' },
    { value: 'amount', label: 'By Amount' }
  ],
  filterOptions = []
}: DataListProps<T>) => {
  const [filter, setFilter] = useState<string>('custom-month');
  const [sortBy, setSortBy] = useState<string>('date');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);
  const [lastItemCount, setLastItemCount] = useState(items.length);

  // Auto-switch to current month when new items are added
  React.useEffect(() => {
    if (enableDateFilter && items.length > lastItemCount) {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      const hasRecentItem = items.some(item => item.date === todayStr);
      
      if (hasRecentItem && filter === 'custom-month') {
        const currentMonthYear = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
        const selectedMonthYear = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}`;
        
        if (currentMonthYear !== selectedMonthYear) {
          setSelectedDate(new Date(today.getFullYear(), today.getMonth(), 1));
        }
      }
    }
    setLastItemCount(items.length);
  }, [items.length, lastItemCount, filter, selectedDate, enableDateFilter]);

  // Navigation functions
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    setSelectedDate(newDate);
  };

  const goToCurrentMonth = () => {
    setSelectedDate(new Date());
  };

  // Format month label
  const getMonthLabel = () => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;
  };

  const filteredAndSortedItems = useMemo(() => {
    let filtered = [...items];

    // Apply date filter
    if (enableDateFilter && filter !== 'all') {
      const now = new Date();
      
      // Calculate week boundaries (Monday to Sunday, ending at 11:59:59 PM Sunday)
      const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1; // If Sunday, go back 6 days to Monday
      
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - daysFromMonday);
      startOfWeek.setHours(0, 0, 0, 0); // Start at 12:00:00 AM Monday
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6); // Monday + 6 days = Sunday
      endOfWeek.setHours(23, 59, 59, 999); // End at 11:59:59 PM Sunday
      
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      
      // For custom month, use selectedDate
      const startOfSelectedMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      const endOfSelectedMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0, 23, 59, 59);

      filtered = items.filter(item => {
        if (!item.date) return true;
        
        const itemDate = parseLocalDate(item.date);
        if (filter === 'this-week') {
          return itemDate >= startOfWeek && itemDate <= endOfWeek;
        } else if (filter === 'custom-month') {
          return itemDate >= startOfSelectedMonth && itemDate <= endOfSelectedMonth;
        } else if (filter === 'this-year') {
          return itemDate >= startOfYear;
        }
        return true;
      });
    }

    // Apply custom filter options
    const selectedFilterOption = filterOptions.find(option => option.value === filter);
    if (selectedFilterOption && selectedFilterOption.filterFn) {
      filtered = filtered.filter(selectedFilterOption.filterFn);
    }

    // Sort
    if (enableSorting) {
      const selectedSortOption = sortOptions.find(option => option.value === sortBy);
      if (selectedSortOption && selectedSortOption.sortFn) {
        filtered.sort(selectedSortOption.sortFn);
      } else {
        // Default sorting
        filtered.sort((a, b) => {
          if (sortBy === 'date' && a.date && b.date) {
            return parseLocalDate(b.date).getTime() - parseLocalDate(a.date).getTime();
          }
          return 0;
        });
      }
    }

    return filtered;
  }, [items, filter, sortBy, selectedDate, enableDateFilter, enableSorting, sortOptions, filterOptions]);

  if (loading) {
    return (
      <div className="bg-blue-50 dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-gray-700 shadow-lg">
        <div className="p-4">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const defaultDateFilterOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'this-year', label: 'This Year' },
    { value: 'custom-month', label: 'Select Month' },
    { value: 'this-week', label: 'This Week' }
  ];

  const availableFilterOptions = enableDateFilter 
    ? [...defaultDateFilterOptions, ...filterOptions]
    : filterOptions;

  return (
    <div className="bg-blue-50 dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-gray-700 shadow-lg">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
            
            {showFilters && (enableDateFilter || enableSorting || filterOptions.length > 0) && (
              <div className="flex items-center gap-2">
                {/* Desktop: Show filters inline */}
                <div className="hidden sm:flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-400" />
                  {availableFilterOptions.length > 0 && (
                    <select
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                      className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-blue-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                    >
                      {availableFilterOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  )}
                  {enableSorting && (
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-blue-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                    >
                      {sortOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Mobile: Show collapsible filters button */}
                <button
                  onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
                  className="sm:hidden flex items-center gap-1 px-3 py-2 bg-blue-100 dark:bg-gray-700 hover:bg-blue-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                  <Filter className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filters</span>
                  {isFiltersExpanded ? (
                    <ChevronUp className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Mobile: Expandable Filters Panel */}
          {showFilters && isFiltersExpanded && (
            <div className="sm:hidden bg-blue-50 dark:bg-gray-700 rounded-lg p-3 space-y-3">
              {availableFilterOptions.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Filter</label>
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="w-full text-base border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                  >
                    {availableFilterOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {enableSorting && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full text-base border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                  >
                    {sortOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Month Navigation - Show when custom-month is selected */}
          {showFilters && enableDateFilter && filter === 'custom-month' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between bg-blue-100 dark:bg-gray-700 rounded-lg p-3">
                <button
                  onClick={() => navigateMonth('prev')}
                  className="p-1.5 rounded-lg hover:bg-blue-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
                
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {getMonthLabel()}
                  </span>
                </div>
                
                <button
                  onClick={() => navigateMonth('next')}
                  className="p-1.5 rounded-lg hover:bg-blue-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
                
                {/* Today button - show if not current month */}
                {(selectedDate.getMonth() !== new Date().getMonth() || selectedDate.getFullYear() !== new Date().getFullYear()) && (
                  <button
                    onClick={goToCurrentMonth}
                    className="ml-2 px-3 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                  >
                    Current
                  </button>
                )}
              </div>
              
              {/* Info message when viewing past month */}
              {(selectedDate.getMonth() !== new Date().getMonth() || selectedDate.getFullYear() !== new Date().getFullYear()) && (
                <div className="text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Viewing {getMonthLabel()} • New items will auto-switch to current month
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* List */}
      <div className="p-3">
        {filteredAndSortedItems.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
            {emptyMessage}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredAndSortedItems.map((item) => (
              <div key={item.id}>
                {renderItem(item, onDelete)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};