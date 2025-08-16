import React, { useMemo, useState } from 'react';
import { Scissors, Filter } from 'lucide-react';
import type { Database } from '../../lib/supabase';

type Expense = Database['public']['Tables']['expenses']['Row'];

interface CutCandidatesProps {
  expenses: Expense[] | undefined;
}

export const CutCandidates: React.FC<CutCandidatesProps> = ({ expenses }) => {
  const [filterRating, setFilterRating] = useState<'all' | 'non_essential' | 'luxury'>('all');

  const candidates = useMemo(() => {
    const filtered = (expenses || []).filter(e => {
      if (filterRating === 'all') {
        return e.rating === 'non_essential' || e.rating === 'luxury';
      }
      return e.rating === filterRating;
    });

    const grouped = filtered.reduce((acc, e) => {
      const key = e.category || e.what;
      if (!acc[key]) {
        acc[key] = {
          name: key,
          total: 0,
          count: 0,
          items: [],
        };
      }
      acc[key].total += Number(e.amount);
      acc[key].count += 1;
      acc[key].items.push(e);
      return acc;
    }, {} as Record<string, { name: string; total: number; count: number; items: Expense[] }>);

    return Object.values(grouped)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [expenses, filterRating]);

  const totalSavings = useMemo(() => {
    return candidates.reduce((sum, c) => sum + c.total, 0);
  }, [candidates]);

  return (
    <div className="crypto-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Scissors className="w-5 h-5 text-crypto-danger" />
          <h3 className="text-lg font-semibold">Cut Candidates</h3>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-crypto-text-dim" />
          <select
            value={filterRating}
            onChange={(e) => setFilterRating(e.target.value as 'all' | 'non_essential' | 'luxury')}
            className="crypto-select text-sm"
          >
            <option value="all">All Non-Essential</option>
            <option value="non_essential">Non-Essential Only</option>
            <option value="luxury">Luxury Only</option>
          </select>
        </div>
      </div>

      {candidates.length > 0 ? (
        <div className="space-y-3">
          <div className="bg-crypto-danger/10 border border-crypto-danger/30 rounded-lg p-3">
            <p className="text-sm text-crypto-danger">
              Potential Monthly Savings:
              <span className="font-bold font-mono ml-2">${totalSavings.toFixed(2)}</span>
            </p>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {candidates.map((candidate) => (
              <div
                key={candidate.name}
                className="bg-crypto-darker border border-crypto-border rounded-lg p-3 hover:border-crypto-danger/50 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{candidate.name}</p>
                    <p className="text-xs text-crypto-text-dim mt-1">
                      {candidate.count} {candidate.count === 1 ? 'expense' : 'expenses'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold text-crypto-danger">
                      ${candidate.total.toFixed(2)}
                    </p>
                    <p className="text-xs text-crypto-text-dim">
                      avg ${(candidate.total / candidate.count).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-crypto-text-dim">
          No cut candidates found
        </div>
      )}
    </div>
  );
};