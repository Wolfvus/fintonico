import React, { useState, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSnapshotStore, type NetWorthSnapshot } from '../../stores/snapshotStore';
import { useCurrencyStore } from '../../stores/currencyStore';
import { TrendingUp, TrendingDown, ChevronDown, ChevronUp, History, Calendar, BarChart3, LineChart as LineChartIcon } from 'lucide-react';

// Format month string (YYYY-MM) to display format (Jan 2025)
const formatMonth = (monthStr: string, locale: string): string => {
  const [year, month] = monthStr.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString(locale, { month: 'short', year: 'numeric' });
};

// Format month string to short format (Jan '25)
const formatMonthShort = (monthStr: string, locale: string): string => {
  const [year, month] = monthStr.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString(locale, { month: 'short' }) + " '" + String(year).slice(-2);
};

// Format large numbers compactly (e.g., 1.2M, 500K)
const formatCompactAmount = (amount: number): string => {
  const absAmount = Math.abs(amount);
  if (absAmount >= 1000000) {
    return (amount / 1000000).toFixed(1) + 'M';
  } else if (absAmount >= 1000) {
    return (amount / 1000).toFixed(0) + 'K';
  }
  return amount.toFixed(0);
};

// Chart display modes
type ChartMode = 'net-worth' | 'breakdown';

// Enhanced SVG Line Chart Component
interface LineChartProps {
  data: NetWorthSnapshot[];
  formatAmount: (amount: number) => string;
  mode: ChartMode;
}

const LineChart: React.FC<LineChartProps> = ({ data, formatAmount, mode }) => {
  const { t, i18n } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredPoint, setHoveredPoint] = useState<{ index: number; x: number; y: number } | null>(null);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 sm:h-56 md:h-64 text-gray-500 dark:text-gray-400 text-sm">
        {t('history.noHistoryChart')}
      </div>
    );
  }

  // Get all values based on mode
  const netWorthValues = data.map(d => d.netWorthBase);
  const assetValues = data.map(d => d.totalsByNature.asset);
  const liabilityValues = data.map(d => Math.abs(d.totalsByNature.liability));

  // Calculate min/max across all visible series
  let allValues: number[];
  if (mode === 'breakdown') {
    allValues = [...assetValues, ...liabilityValues, ...netWorthValues];
  } else {
    allValues = netWorthValues;
  }

  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);

  // Add 10% padding to range for visual breathing room
  const range = maxValue - minValue || 1;
  const paddedMin = minValue - range * 0.05;
  const paddedMax = maxValue + range * 0.05;
  const paddedRange = paddedMax - paddedMin;

  // Chart dimensions (using viewBox coordinates)
  const width = 100;
  const height = 60;
  const leftPadding = 12; // Space for Y-axis labels
  const rightPadding = 3;
  const topPadding = 4;
  const bottomPadding = 8; // Space for X-axis labels

  const chartWidth = width - leftPadding - rightPadding;
  const chartHeight = height - topPadding - bottomPadding;

  // Generate points for each series
  const generatePoints = (values: number[]) => {
    return values.map((value, i) => {
      const x = leftPadding + (i / Math.max(data.length - 1, 1)) * chartWidth;
      const y = topPadding + chartHeight - ((value - paddedMin) / paddedRange) * chartHeight;
      return { x, y, value };
    });
  };

  const netWorthPoints = generatePoints(netWorthValues);
  const assetPoints = generatePoints(assetValues);
  const liabilityPoints = generatePoints(liabilityValues);

  // Create SVG path from points
  const createPath = (points: { x: number; y: number }[]) => {
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  };

  // Create area fill path
  const createAreaPath = (points: { x: number; y: number }[]) => {
    const path = createPath(points);
    const baseY = topPadding + chartHeight;
    return `${path} L ${points[points.length - 1].x} ${baseY} L ${points[0].x} ${baseY} Z`;
  };

  // Determine net worth color based on trend
  const isPositiveTrend = data.length >= 2 && data[data.length - 1].netWorthBase >= data[0].netWorthBase;
  const netWorthColor = isPositiveTrend ? '#3b82f6' : '#8b5cf6'; // Blue or purple for net worth

  // Generate Y-axis labels (5 labels)
  const yAxisLabels = [];
  for (let i = 0; i <= 4; i++) {
    const value = paddedMin + (paddedRange * i) / 4;
    const y = topPadding + chartHeight - (i / 4) * chartHeight;
    yAxisLabels.push({ value, y });
  }

  // Generate X-axis labels (show more labels for longer ranges)
  const getXAxisLabels = () => {
    if (data.length <= 2) {
      return data.map((d, i) => ({
        label: formatMonthShort(d.monthEndLocal, i18n.language),
        x: leftPadding + (i / Math.max(data.length - 1, 1)) * chartWidth,
      }));
    }

    // For longer ranges, show ~4-6 evenly spaced labels
    const labelCount = Math.min(data.length, 6);
    const step = (data.length - 1) / (labelCount - 1);
    const labels = [];

    for (let i = 0; i < labelCount; i++) {
      const dataIndex = Math.round(i * step);
      labels.push({
        label: formatMonthShort(data[dataIndex].monthEndLocal, i18n.language),
        x: leftPadding + (dataIndex / Math.max(data.length - 1, 1)) * chartWidth,
      });
    }

    return labels;
  };

  const xAxisLabels = getXAxisLabels();

  // Handle mouse move for tooltip
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!containerRef.current) return;

    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * width;

    // Find closest point
    let closestIndex = 0;
    let closestDist = Infinity;

    netWorthPoints.forEach((p, i) => {
      const dist = Math.abs(p.x - svgX);
      if (dist < closestDist) {
        closestDist = dist;
        closestIndex = i;
      }
    });

    // Only show tooltip if we're within chart area
    if (svgX >= leftPadding && svgX <= leftPadding + chartWidth) {
      const tooltipX = (netWorthPoints[closestIndex].x / width) * rect.width;
      setHoveredPoint({
        index: closestIndex,
        x: tooltipX,
        y: e.clientY - rect.top,
      });
    } else {
      setHoveredPoint(null);
    }
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
  };

  return (
    <div className="relative" ref={containerRef}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-48 sm:h-56 md:h-64"
        preserveAspectRatio="xMidYMid meet"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Grid lines */}
        {yAxisLabels.map((label, i) => (
          <line
            key={i}
            x1={leftPadding}
            y1={label.y}
            x2={leftPadding + chartWidth}
            y2={label.y}
            stroke="currentColor"
            strokeOpacity={0.1}
            strokeWidth="0.2"
          />
        ))}

        {/* Y-axis labels */}
        {yAxisLabels.map((label, i) => (
          <text
            key={i}
            x={leftPadding - 1}
            y={label.y + 0.8}
            textAnchor="end"
            className="fill-gray-400 dark:fill-gray-500"
            fontSize="2.5"
          >
            {formatCompactAmount(label.value)}
          </text>
        ))}

        {/* X-axis labels */}
        {xAxisLabels.map((label, i) => (
          <text
            key={i}
            x={label.x}
            y={height - 1}
            textAnchor="middle"
            className="fill-gray-400 dark:fill-gray-500"
            fontSize="2.5"
          >
            {label.label}
          </text>
        ))}

        {/* Breakdown mode: show assets and liabilities */}
        {mode === 'breakdown' && (
          <>
            {/* Assets area and line */}
            <path d={createAreaPath(assetPoints)} fill="rgba(34, 197, 94, 0.15)" />
            <path
              d={createPath(assetPoints)}
              fill="none"
              stroke="#22c55e"
              strokeWidth="0.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Liabilities area and line */}
            <path d={createAreaPath(liabilityPoints)} fill="rgba(239, 68, 68, 0.15)" />
            <path
              d={createPath(liabilityPoints)}
              fill="none"
              stroke="#ef4444"
              strokeWidth="0.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        )}

        {/* Net worth area and line (always shown) */}
        <path
          d={createAreaPath(netWorthPoints)}
          fill={mode === 'breakdown' ? 'rgba(59, 130, 246, 0.1)' : (isPositiveTrend ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)')}
        />
        <path
          d={createPath(netWorthPoints)}
          fill="none"
          stroke={mode === 'breakdown' ? netWorthColor : (isPositiveTrend ? '#22c55e' : '#ef4444')}
          strokeWidth="0.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Hover indicator line */}
        {hoveredPoint !== null && (
          <line
            x1={netWorthPoints[hoveredPoint.index].x}
            y1={topPadding}
            x2={netWorthPoints[hoveredPoint.index].x}
            y2={topPadding + chartHeight}
            stroke="currentColor"
            strokeOpacity={0.3}
            strokeWidth="0.3"
            strokeDasharray="1,1"
          />
        )}

        {/* Data points on hover */}
        {hoveredPoint !== null && (
          <>
            {mode === 'breakdown' && (
              <>
                <circle
                  cx={assetPoints[hoveredPoint.index].x}
                  cy={assetPoints[hoveredPoint.index].y}
                  r="1"
                  fill="#22c55e"
                />
                <circle
                  cx={liabilityPoints[hoveredPoint.index].x}
                  cy={liabilityPoints[hoveredPoint.index].y}
                  r="1"
                  fill="#ef4444"
                />
              </>
            )}
            <circle
              cx={netWorthPoints[hoveredPoint.index].x}
              cy={netWorthPoints[hoveredPoint.index].y}
              r="1.2"
              fill={mode === 'breakdown' ? netWorthColor : (isPositiveTrend ? '#22c55e' : '#ef4444')}
            />
          </>
        )}
      </svg>

      {/* Tooltip */}
      {hoveredPoint !== null && (
        <div
          className="absolute pointer-events-none bg-gray-900 dark:bg-gray-700 text-white text-xs px-3 py-2 rounded-lg shadow-lg z-10 min-w-[120px]"
          style={{
            left: Math.min(Math.max(hoveredPoint.x, 60), containerRef.current ? containerRef.current.offsetWidth - 60 : hoveredPoint.x),
            top: 8,
            transform: 'translateX(-50%)',
          }}
        >
          <div className="font-semibold mb-1 border-b border-gray-700 dark:border-gray-600 pb-1">
            {formatMonth(data[hoveredPoint.index].monthEndLocal, i18n.language)}
          </div>
          {mode === 'breakdown' && (
            <>
              <div className="flex justify-between gap-3">
                <span className="text-green-400">{t('history.assetsTooltip')}</span>
                <span>{formatAmount(data[hoveredPoint.index].totalsByNature.asset)}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-red-400">{t('history.liabilitiesTooltip')}</span>
                <span>{formatAmount(Math.abs(data[hoveredPoint.index].totalsByNature.liability))}</span>
              </div>
            </>
          )}
          <div className="flex justify-between gap-3">
            <span className={mode === 'breakdown' ? 'text-blue-400' : ''}>{t('history.netWorthTooltip')}</span>
            <span className="font-medium">{formatAmount(data[hoveredPoint.index].netWorthBase)}</span>
          </div>
        </div>
      )}

      {/* Legend for breakdown mode */}
      {mode === 'breakdown' && (
        <div className="flex items-center justify-center gap-4 mt-2 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-green-500 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">{t('history.assetsHeader')}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-red-500 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">{t('history.liabilitiesHeader')}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-blue-500 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">{t('history.netWorthHeader')}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export const NetWorthHistory: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { getHistory } = useSnapshotStore();
  const { formatAmount } = useCurrencyStore();

  const [isExpanded, setIsExpanded] = useState(false);
  const [filterMonths, setFilterMonths] = useState<6 | 12 | 24 | 0>(12); // 0 = all
  const [chartMode, setChartMode] = useState<ChartMode>('net-worth');

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
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('history.netWorthHistory')}</h3>
          {history.length > 0 && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              ({history.length} {history.length === 1 ? t('history.month') : t('history.months')})
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
            <span className="text-sm text-gray-600 dark:text-gray-400">{t('history.show')}</span>
            {[
              { value: 6, label: t('history.sixMonths') },
              { value: 12, label: t('history.twelveMonths') },
              { value: 24, label: t('history.twentyFourMonths') },
              { value: 0, label: t('history.allTime') },
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
                <TrendingUp className="w-5 h-5 text-green-700 dark:text-green-400" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-700 dark:text-red-400" />
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
                {t('history.over')} {history.length} {history.length === 1 ? t('history.month') : t('history.months')}
              </span>
            </div>
          )}

          {/* Chart */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            {/* Chart mode toggle */}
            <div className="flex items-center justify-end gap-1 mb-2">
              <button
                onClick={() => setChartMode('net-worth')}
                className={`p-1.5 rounded-md transition-colors ${
                  chartMode === 'net-worth'
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                title="Net Worth only"
              >
                <LineChartIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setChartMode('breakdown')}
                className={`p-1.5 rounded-md transition-colors ${
                  chartMode === 'breakdown'
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                title="Assets, Liabilities & Net Worth"
              >
                <BarChart3 className="w-4 h-4" />
              </button>
            </div>
            <LineChart data={history} formatAmount={formatAmount} mode={chartMode} />
          </div>

          {/* Table */}
          {history.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400">{t('history.monthHeader')}</th>
                    <th className="text-right py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400">{t('history.netWorthHeader')}</th>
                    <th className="text-right py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400">{t('history.assetsHeader')}</th>
                    <th className="text-right py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400">{t('history.liabilitiesHeader')}</th>
                    <th className="text-right py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400">{t('history.changeHeader')}</th>
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
                          {formatMonth(snapshot.monthEndLocal, i18n.language)}
                        </td>
                        <td className={`py-2 px-3 text-right font-medium ${
                          snapshot.netWorthBase >= 0
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-red-700 dark:text-red-400'
                        }`}>
                          {formatAmount(snapshot.netWorthBase)}
                        </td>
                        <td className="py-2 px-3 text-right text-green-700 dark:text-green-400">
                          {formatAmount(snapshot.totalsByNature.asset)}
                        </td>
                        <td className="py-2 px-3 text-right text-red-700 dark:text-red-400">
                          {formatAmount(snapshot.totalsByNature.liability)}
                        </td>
                        <td className="py-2 px-3 text-right">
                          {change !== null ? (
                            <span className={`inline-flex items-center gap-1 ${
                              change >= 0
                                ? 'text-green-700 dark:text-green-400'
                                : 'text-red-700 dark:text-red-400'
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
              <p>{t('history.noHistory')}</p>
              <p className="text-sm mt-1">{t('history.snapshotsAuto')}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
