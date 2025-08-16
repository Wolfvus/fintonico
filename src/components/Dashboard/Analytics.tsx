import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { Database } from '../../lib/supabase';

type Expense = Database['public']['Tables']['expenses']['Row'];

interface AnalyticsProps {
  expenses: Expense[] | undefined;
}

export const Analytics: React.FC<AnalyticsProps> = ({ expenses }) => {
  const categoryData = useMemo(() => {
    const categories = (expenses || []).reduce((acc, e) => {
      if (e.category) {
        acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
      }
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [expenses]);

  const topMerchants = useMemo(() => {
    const merchants = (expenses || []).reduce((acc, e) => {
      const merchant = e.what.split(' ')[0].toLowerCase();
      acc[merchant] = (acc[merchant] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(merchants)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [expenses]);

  const COLORS = ['#FCD535', '#0ECB81', '#F6465D', '#3861FB', '#B7BDC6', '#848E9C'];

  return (
    <div className="crypto-card">
      <h3 className="text-lg font-semibold mb-4">Analytics</h3>
      
      {categoryData.length > 0 ? (
        <div className="space-y-6">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0B0E11',
                    border: '1px solid #1E2329',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => `$${value.toFixed(2)}`}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  wrapperStyle={{ color: '#B7BDC6' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div>
            <h4 className="text-sm font-medium text-crypto-text-dim mb-2">Top Merchants</h4>
            <div className="space-y-1">
              {topMerchants.map((merchant) => (
                <div key={merchant.name} className="flex justify-between text-sm">
                  <span className="capitalize">{merchant.name}</span>
                  <span className="text-crypto-text-dim font-mono">{merchant.count}x</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-crypto-text-dim">
          No data to analyze yet
        </div>
      )}
    </div>
  );
};