import { useState, useRef, useEffect } from 'react';
import { Search, Bell, ChevronDown } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Trainee } from '@/types';

interface TopBarProps {
  onTraineeSelect: (trainee: Trainee) => void;
}

export function TopBar({ onTraineeSelect }: TopBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Trainee[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const delay = setTimeout(async () => {
      if (query.trim().length < 2) {
        setResults([]);
        return;
      }
      setLoading(true);
      const { data } = await supabase
        .from('trainees')
        .select('*')
        .or(`display_name.ilike.%${query}%,trainee_code.ilike.%${query}%`)
        .limit(8);
      setResults(data ?? []);
      setLoading(false);
    }, 200);
    return () => clearTimeout(delay);
  }, [query]);

  const handleSelect = (trainee: Trainee) => {
    onTraineeSelect(trainee);
    setQuery('');
    setResults([]);
    setShowResults(false);
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-30">
      {/* Search */}
      <div ref={searchRef} className="relative w-96">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search trainee by name or ID..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowResults(true);
          }}
          onFocus={() => setShowResults(true)}
          className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-400 focus:bg-white focus:border-transparent transition-all"
        />
        {showResults && (results.length > 0 || loading) && (
          <div className="absolute top-full mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-80 overflow-y-auto animate-slide-up z-50">
            {loading && (
              <div className="px-4 py-3 text-sm text-slate-500">Searching...</div>
            )}
            {!loading &&
              results.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleSelect(t)}
                  className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 transition-colors text-left border-b border-slate-100 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-800">{t.display_name}</p>
                    <p className="text-xs text-slate-500">{t.trainee_code} · {t.occupation}</p>
                  </div>
                  <span className="text-xs text-slate-400">{t.current_district}</span>
                </button>
              ))}
          </div>
        )}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-xs font-semibold text-amber-700">DEMO DATA</span>
        </div>

        <button className="relative p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        <div className="flex items-center gap-2.5 pl-4 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-navy-700 flex items-center justify-center text-white text-sm font-semibold">
            AD
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-slate-700">Admin User</p>
            <p className="text-xs text-slate-400">State Mission Director</p>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </div>
      </div>
    </header>
  );
}
