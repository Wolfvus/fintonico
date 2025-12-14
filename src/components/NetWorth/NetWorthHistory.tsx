import React, { useState, useMemo } from 'react';
import { useSnapshotStore, type NetWorthSnapshot } from '../../stores/snapshotStore';
import { useCurrencyStore } from '../../stores/currencyStore';
import { TrendingUp, TrendingDown, ChevronDown, ChevronUp, History, Calendar } from 'lucide-react';

// Format month string (YYYY-MM) to display format (Jan 2025)
const formatMonth = (monthStr: string): string => {
  const [year, month] = monthStr.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

// Simple SVG Line Chart Component
interface LineChartProps {
  data: NetWorthSnapshot[];
  formatAmount: (amount: number) => string;
}

const LineChart: React.FC<LineChartProps> = ({ data, formatAmount }) => {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500 dark:text-gray-400 text-sm">
        No history data available
      </div>
    );
  }

  const values = data.map(d => d.netWorthBase);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue || 1;

  // Chart dimensions
  const width = 100;
  const height = 50;
  const padding = 5;

  // Generate path points
  const points = data.map((d, i) => {
    const x = padding + (i / Math.max(data.length - 1, 1)) * (width - 2 * padding);
    const y = height - padding - ((d.netWorthBase - minValue) / range) * (height - 2 * padding);
    return { x, y, data: d };
  });

  // Create SVG path
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  // Create area fill path
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

  // Determine color based on trend
  const isPositiveTrend = data.length >= 2 && data[data.length - 1].netWorthBase >= data[0].netWorthBase;
  const strokeColor = isPositiveTrend ? '#22c55e' : '#ef4444';
  const fillColor = isPositiveTrend ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)';

  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-48" preserveAspectRatio="none">
        {/* Area fill */}
        <path d={areaD} fill={fillColor} />

        {/* Line */}
        <path
          d={pathD}
          fill="none"
          stroke={strokeColor}
          strokeWidth="0.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={hoveredPoint === i ? 1.5 : 1}
            fill={strokeColor}
            className="cursor-pointer transition-all"
            onMouseEnter={() => setHoveredPoint(i)}
            onMouseLeave={() => setHoveredPoint(null)}
          />
        ))}
      </svg>

      {/* Tooltip */}
      {hoveredPoint !== null && (
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 bg-gray-900 dark:bg-gray-700 text-white text-xs px-2 py-1 rounded shadow-lg">
          <div className="font-medium">{formatMonth(points[hoveredPoint].data.monthEndLocal)}</div>
          <div>{formatAmount(points[hoveredPoint].data.netWorthBase)}</div>
        </div>
      )}

      {/* X-axis labels */}
      <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
        {data.length > 0 && <span>{formatMonth(data[0].monthEndLocal)}</span>}
        {data.length > 1 && <span>{formatMonth(data[data.length - 1].monthEndLocal)}</span>}
      </div>
    </div>
  );
};

export const NetWorthHistory: React.FC = () => {
  const { getHistory } = useSnapshotStore();
  const { formatAmount } = useCurrencyStore();

  const [isExpanded, setIsExpanded] = useState(false);
  const [filterMonths, setFilterMonths] = useState<6 | 12 | 24 | 0>(12); // 0 = all

  // Get filtered history
  const history = useMemo(() => {
    if (filterMonths === 0) {
      return getHistory();
    }

    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - filterMonths + 1, 1);
    const startMonth = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;

    return getHistory(startMonth);
  }, [getHistory, filterMonths]);

  // Calculate change from first to last
  const periodChange = useMemo(() => {
    if (history.length < 2) return null;

    const first = history[0];
    const last = history[history.length - 1];
    const change = last.netWorthBase - first.netWorthBase;
    const percentChange = first.netWorthBase !== 0
      ? (change / Math.abs(first.netWorthBase)) * 100
      : 0;

    return { change, percentChange };
  }, [history]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors rounded-t-lg"
      >
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Net Worth History</h3>
          {history.length > 0 && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              ({history.length} {history.length === 1 ? 'month' : 'months'})
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 pt-0 space-y-4">
          {/* Filter buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Show:</span>
            {[
              { value: 6, label: '6 months' },
              { value: 12, label: '12 months' },
              { value: 24, label: '24 months' },
              { value: 0, label: 'All time' },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setFilterMonths(value as typeof filterMonths)}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  filterMonths === value
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Period summary */}
          {periodChange && (
            <div className={`flex items-center gap-2 p-3 rounded-lg ${
              periodChange.change >= 0
                ? 'bg-green-50 dark:bg-green-900/20'
                : 'bg-red-50 dark:bg-red-900/20'
            }`}>
              {periodChange.change >= 0 ? (
                <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
              )}
              <span className={`font-medium ${
                periodChange.change >= 0
                  ? 'text-green-700 dark:text-green-300'
                  : 'text-red-700 dark:text-red-300'
              }`}>
                {periodChange.change >= 0 ? '+' : ''}{formatAmount(periodChange.change)}
                <span className="opacity-75 ml-1">
                  ({periodChange.percentChange >= 0 ? '+' : ''}{periodChange.percentChange.toFixed(1)}%)
                </span>
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                over {history.length} {history.length === 1 ? 'month' : 'months'}
              </span>
            </div>
          )}

          {/* Chart */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <LineChart data={history} formatAmount={formatAmount} />
          </div>

          {/* Table */}
          {history.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400">Month</th>
                    <th className="text-right py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400">Net Worth</th>
                    <th className="text-right py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400">Assets</th>
                    <th className="text-right py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400">Liabilities</th>
                    <th className="text-right py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400">Change</th>
                  </tr>
                </thead>
                <tbody>
                  {[...history].reverse().map((snapshot, index, arr) => {
                    const prevSnapshot = arr[index + 1];
                    const change = prevSnapshot
                      ? snapshot.netWorthBase - prevSnapshot.netWorthBase
                      : null;

                    return (
                      <tr
                        key={snapshot.monthEndLocal}
                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      >
                        <td className="py-2 px-3 text-gray-900 dark:text-white font-medium">
                          {formatMonth(snapshot.monthEndLocal)}
                        </td>
                        <td className={`py-2 px-3 text-right font-medium ${
                          snapshot.netWorthBase >= 0
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {formatAmount(snapshot.netWorthBase)}
                        </td>
                        <td className="py-2 px-3 text-right text-green-600 dark:text-green-400">
                          {formatAmount(snapshot.totalsByNature.asset)}
                        </td>
                        <td className="py-2 px-3 text-right text-red-600 dark:text-red-400">
                          {formatAmount(snapshot.totalsByNature.liability)}
                        </td>
                        <td className="py-2 px-3 text-right">
                          {change !== null ? (
                            <span className={`inline-flex items-center gap-1 ${
                              change >= 0
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}>
                              {change >= 0 ? (
                                <TrendingUp className="w-3 h-3" />
                              ) : (
                                <TrendingDown className="w-3 h-3" />
                              )}
                              {change >= 0 ? '+' : ''}{formatAmount(change)}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {history.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No history data yet</p>
              <p className="text-sm mt-1">Snapshots are created automatically each month</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
