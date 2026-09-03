import { useState, useEffect } from 'react';
import { TrendingUp, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { StatusBadge } from '@/components/StatusBadge';
import { STATE_META, formatDate } from '@/lib/constants';
import type { Trainee, OutcomeStateRecord } from '@/types';

interface OutcomesProps {
  onTraineeSelect: (trainee: Trainee) => void;
}

export function Outcomes({ onTraineeSelect }: OutcomesProps) {
  const [items, setItems] = useState<{ trainee: Trainee; outcome: OutcomeStateRecord }[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    (async () => {
      const { data: outcomes } = await supabase
        .from('outcome_states')
        .select('*')
        .order('as_of_date', { ascending: false })
        .order('updated_at', { ascending: false });

      if (!outcomes) {
        setLoading(false);
        return;
      }

      const latestMap: Record<string, OutcomeStateRecord> = {};
      for (const o of outcomes) {
        if (!latestMap[o.trainee_id]) latestMap[o.trainee_id] = o;
      }

      const traineeIds = Object.keys(latestMap);
      const { data: trainees } = await supabase.from('trainees').select('*').in('id', traineeIds);

      const result: { trainee: Trainee; outcome: OutcomeStateRecord }[] = [];
      for (const [tid, outcome] of Object.entries(latestMap)) {
        const t = trainees?.find((t) => t.id === tid);
        if (t) result.push({ trainee: t, outcome });
      }
      setItems(result);
      setLoading(false);
    })();
  }, []);

  const filtered = filter === 'all' ? items : items.filter((i) => i.outcome.state === filter);

  const counts: Record<string, number> = {};
  items.forEach((i) => {
    counts[i.outcome.state] = (counts[i.outcome.state] ?? 0) + 1;
  });

  const filterOptions = ['all', 'verified', 'review_required', 'undetermined'];

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-navy-800">Outcomes</h1>
        <p className="text-sm text-slate-500 mt-1">
          Current livelihood outcome states across all tracked trainees
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {['verified', 'review_required', 'undetermined', 'placed'].map((state) => {
          const meta = STATE_META[state];
          if (!meta) return null;
          const Icon = meta.icon;
          return (
            <div key={state} className={`card p-4 ${meta.border}`}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-1.5 rounded-lg ${meta.bg}`}>
                  <Icon className={`w-4 h-4 ${meta.color}`} />
                </div>
                <span className="text-xs font-medium text-slate-500">{meta.label}</span>
              </div>
              <p className="text-2xl font-bold text-slate-800 tabular-nums">{counts[state] ?? 0}</p>
            </div>
          );
        })}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-slate-400" />
        {filterOptions.map((opt) => (
          <button
            key={opt}
            onClick={() => setFilter(opt)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
              filter === opt
                ? 'bg-navy-700 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {opt === 'all' ? 'All' : STATE_META[opt]?.label ?? opt}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Trainee</th>
              <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3 hidden md:table-cell">Occupation</th>
              <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3 hidden lg:table-cell">District</th>
              <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Outcome</th>
              <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3 hidden sm:table-cell">As of</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(4)].map((_, i) => (
                <tr key={i} className="border-b border-slate-100">
                  <td colSpan={6} className="px-4 py-4">
                    <div className="h-8 rounded bg-slate-50 animate-pulse" />
                  </td>
                </tr>
              ))
            ) : (
              filtered.map(({ trainee, outcome }) => (
                <tr
                  key={trainee.id}
                  onClick={() => onTraineeSelect(trainee)}
                  className="border-b border-slate-100 last:border-0 table-row-hover"
                >
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-slate-800">{trainee.display_name}</p>
                    <p className="text-xs text-slate-500">{trainee.trainee_code}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 hidden md:table-cell">{trainee.occupation}</td>
                  <td className="px-4 py-3 text-sm text-slate-600 hidden lg:table-cell">{trainee.current_district}</td>
                  <td className="px-4 py-3"><StatusBadge status={outcome.state} /></td>
                  <td className="px-4 py-3 text-sm text-slate-500 hidden sm:table-cell">{formatDate(outcome.as_of_date)}</td>
                  <td className="px-4 py-3 text-right">
                    <ArrowRight className="w-4 h-4 text-slate-300 inline" />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
