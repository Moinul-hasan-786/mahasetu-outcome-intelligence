import { useState, useEffect } from 'react';
import { Search, Filter, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { StatusBadge } from '@/components/StatusBadge';
import { formatDate } from '@/lib/constants';
import type { Trainee, OutcomeStateRecord } from '@/types';

interface TraineeListProps {
  onTraineeSelect: (trainee: Trainee) => void;
}

type FilterState = 'all' | 'verified' | 'review_required' | 'undetermined';

export function TraineeList({ onTraineeSelect }: TraineeListProps) {
  const [trainees, setTrainees] = useState<Trainee[]>([]);
  const [outcomes, setOutcomes] = useState<Record<string, OutcomeStateRecord>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterState>('all');

  useEffect(() => {
    (async () => {
      const { data: tData } = await supabase.from('trainees').select('*').order('display_name');
      if (!tData) {
        setLoading(false);
        return;
      }
      setTrainees(tData);

      const { data: oData } = await supabase
        .from('outcome_states')
        .select('*')
        .order('as_of_date', { ascending: false })
        .order('updated_at', { ascending: false });

      if (oData) {
        const latestMap: Record<string, OutcomeStateRecord> = {};
        for (const o of oData) {
          if (!latestMap[o.trainee_id]) latestMap[o.trainee_id] = o;
        }
        setOutcomes(latestMap);
      }
      setLoading(false);
    })();
  }, []);

  const filtered = trainees.filter((t) => {
    const matchesSearch =
      search.length === 0 ||
      t.display_name.toLowerCase().includes(search.toLowerCase()) ||
      t.trainee_code.toLowerCase().includes(search.toLowerCase());

    const latestOutcome = outcomes[t.id];
    const matchesFilter =
      filter === 'all' || (latestOutcome && latestOutcome.state === filter);

    return matchesSearch && matchesFilter;
  });

  const filterOptions: { value: FilterState; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'verified', label: 'Verified' },
    { value: 'review_required', label: 'Review Required' },
    { value: 'undetermined', label: 'Undetermined' },
  ];

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-navy-800">Trainees</h1>
        <p className="text-sm text-slate-500 mt-1">
          {trainees.length} synthetic records · Click any trainee to view full profile
        </p>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or trainee ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === opt.value
                  ? 'bg-navy-700 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Name</th>
              <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Trainee ID</th>
              <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3 hidden md:table-cell">Occupation</th>
              <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3 hidden lg:table-cell">District</th>
              <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3 hidden lg:table-cell">Updated</th>
              <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Outcome</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-slate-100">
                  <td colSpan={7} className="px-4 py-4">
                    <div className="h-8 rounded bg-slate-50 animate-pulse" />
                  </td>
                </tr>
              ))
            ) : (
              filtered.map((t) => {
                const outcome = outcomes[t.id];
                return (
                  <tr
                    key={t.id}
                    onClick={() => onTraineeSelect(t)}
                    className="border-b border-slate-100 last:border-0 table-row-hover"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-navy-100 flex items-center justify-center text-navy-700 font-semibold text-xs shrink-0">
                          {t.display_name.split(' ').map((n) => n[0]).join('')}
                        </div>
                        <span className="text-sm font-medium text-slate-800">{t.display_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500 font-mono">{t.trainee_code}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 hidden md:table-cell">{t.occupation}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 hidden lg:table-cell">{t.current_district}</td>
                    <td className="px-4 py-3 text-sm text-slate-500 hidden lg:table-cell">
                      {outcome ? formatDate(outcome.as_of_date) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {outcome ? <StatusBadge status={outcome.state} /> : <span className="text-xs text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ArrowRight className="w-4 h-4 text-slate-300 inline" />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        {!loading && filtered.length === 0 && (
          <div className="px-4 py-12 text-center text-sm text-slate-400">
            No trainees found matching your filters.
          </div>
        )}
      </div>
    </div>
  );
}
