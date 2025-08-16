import React, { useState, useMemo } from 'react';
import { useExpenseStore } from '../../stores/expenseStore';
import { useIncomeStore } from '../../stores/incomeStore';
import { TrendingUp, TrendingDown, DollarSign, Target, AlertTriangle } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export const FinancialAnalysis: React.FC = () => {
  const [projectionYears, setProjectionYears] = useState(10);
  const { expenses } = useExpenseStore();
  const { incomes, getMonthlyTotal } = useIncomeStore();

  const monthlyIncome = getMonthlyTotal();
  const monthlyExpenses = useMemo(() => {
    const now = new Date();
    const currentMonthExpenses = expenses.filter(e => {
      const expenseDate = new Date(e.date);
      return expenseDate.getMonth() === now.getMonth() && 
             expenseDate.getFullYear() === now.getFullYear();
    });
    return currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const monthlySavings = monthlyIncome - monthlyExpenses;
  const savingsRate = monthlyIncome > 0 ? (monthlySavings / monthlyIncome) * 100 : 0;

  const expenseBreakdown = useMemo(() => {
    const breakdown = expenses.reduce((acc, expense) => {
      acc[expense.rating] = (acc[expense.rating] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    return [
      { name: 'Essential', value: breakdown.essential || 0, color: '#2FA5A9' },
      { name: 'Non-Essential', value: breakdown.non_essential || 0, color: '#EAB308' },
      { name: 'Luxury', value: breakdown.luxury || 0, color: '#DC2626' }
    ];
  }, [expenses]);

  const projectionData = useMemo(() => {
    const data = [];
    const annualSavings = monthlySavings * 12;
    const assumedReturnRate = 0.07;

    for (let year = 0; year <= projectionYears; year++) {
      if (year === 0) {
        data.push({
          year: `Year ${year}`,
          netWorth: 0,
          totalSaved: 0,
          projectedIncome: monthlyIncome * 12,
          projectedExpenses: monthlyExpenses * 12
        });
      } else {
        const totalSaved = annualSavings * year;
        const netWorth = annualSavings * (((1 + assumedReturnRate) ** year - 1) / assumedReturnRate);
        
        data.push({
          year: `Year ${year}`,
          netWorth: Math.round(netWorth),
          totalSaved: Math.round(totalSaved),
          projectedIncome: Math.round(monthlyIncome * 12 * (1.03 ** year)),
          projectedExpenses: Math.round(monthlyExpenses * 12 * (1.02 ** year))
        });
      }
    }
    return data;
  }, [monthlyIncome, monthlyExpenses, monthlySavings, projectionYears]);

  const financialHealthScore = useMemo(() => {
    let score = 0;
    
    if (savingsRate >= 20) score += 40;
    else if (savingsRate >= 10) score += 30;
    else if (savingsRate >= 5) score += 20;
    else if (savingsRate > 0) score += 10;
    
    const recurringIncomes = incomes.filter(i => i.frequency !== 'one-time').length;
    if (recurringIncomes >= 2) score += 30;
    else if (recurringIncomes === 1) score += 20;
    else score += 10;
    
    const essentialRatio = expenseBreakdown[0]?.value / (monthlyExpenses || 1);
    if (essentialRatio >= 0.7) score += 30;
    else if (essentialRatio >= 0.5) score += 20;
    else score += 10;
    
    return score;
  }, [savingsRate, incomes, expenseBreakdown, monthlyExpenses]);

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getHealthScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Improvement';
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Monthly Income</span>
            <TrendingUp className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            ${monthlyIncome.toFixed(2)}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Monthly Expenses</span>
            <TrendingDown className="w-4 h-4 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
            ${monthlyExpenses.toFixed(2)}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Monthly Savings</span>
            <DollarSign className="w-4 h-4 text-teal-600" />
          </div>
          <p className={`text-2xl font-bold ${monthlySavings >= 0 ? 'text-teal-600 dark:text-teal-400' : 'text-red-600 dark:text-red-400'}`}>
            ${monthlySavings.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {savingsRate.toFixed(1)}% savings rate
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Financial Health</span>
            <Target className="w-4 h-4 text-amber-600" />
          </div>
          <p className={`text-2xl font-bold ${getHealthScoreColor(financialHealthScore)}`}>
            {financialHealthScore}/100
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {getHealthScoreLabel(financialHealthScore)}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Income vs Expenses</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={[
              { name: 'Income', value: monthlyIncome, fill: '#10B981' },
              { name: 'Expenses', value: monthlyExpenses, fill: '#EF4444' },
              { name: 'Savings', value: Math.max(0, monthlySavings), fill: '#2FA5A9' }
            ]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
              <Bar dataKey="value" />
            </BarChart>
          </ResponsiveContainer>

          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={expenseBreakdown}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: $${(entry.value || 0).toFixed(0)}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {expenseBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Financial Projections</h3>
          <select
            value={projectionYears}
            onChange={(e) => setProjectionYears(Number(e.target.value))}
            className="px-3 py-1 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
          >
            <option value={5}>5 years</option>
            <option value={10}>10 years</option>
            <option value={15}>15 years</option>
            <option value={20}>20 years</option>
            <option value={30}>30 years</option>
          </select>
        </div>

        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={projectionData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
            <Legend />
            <Line type="monotone" dataKey="netWorth" stroke="#2FA5A9" name="Net Worth (7% returns)" strokeWidth={2} />
            <Line type="monotone" dataKey="totalSaved" stroke="#10B981" name="Total Saved" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {monthlySavings < 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <h4 className="font-semibold text-red-900 dark:text-red-200">Budget Alert</h4>
          </div>
          <p className="text-sm text-red-800 dark:text-red-300">
            You're spending ${Math.abs(monthlySavings).toFixed(2)} more than you earn each month.
          </p>
        </div>
      )}
    </div>
  );
};