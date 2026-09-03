import { useState, useEffect } from 'react';
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ArrowRight,
  Building2,
  MapPin,
  TrendingUp,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import {
  DASHBOARD_METRICS,
  DEMO_CURRENT_DATE,
  DISTRICT_DATA,
  PROVIDER_DATA,
  getOverviewDistribution,
  getOverviewMetrics,
} from '@/lib/constants';
import { StatusBadge } from '@/components/StatusBadge';
import type { Trainee, OutcomeStateRecord } from '@/types';

interface OverviewProps {
  onTraineeSelect: (trainee: Trainee) => void;
  onNavigate: (page: string) => void;
}

interface ReviewQueueItem {
  trainee: Trainee;
  outcome: OutcomeStateRecord;
}

export function Overview({ onTraineeSelect, onNavigate }: OverviewProps) {
  const [reviewQueue, setReviewQueue] = useState<ReviewQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [rahulVerified, setRahulVerified] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: allOutcomes } = await supabase
        .from('outcome_states')
        .select('*')
        .order('as_of_date', { ascending: false })
        .order('updated_at', { ascending: false });

      const latestOutcomes: Record<string, OutcomeStateRecord> = {};
      (allOutcomes ?? []).forEach((outcome) => {
        if (!latestOutcomes[outcome.trainee_id]) latestOutcomes[outcome.trainee_id] = outcome;
      });

      const rahulLatest = latestOutcomes['11111111-1111-1111-1111-111111111111'];
      setRahulVerified(rahulLatest?.state === 'verified');

      const outcomes = Object.values(latestOutcomes).filter((outcome) => outcome.state === 'review_required');
      if (outcomes.length === 0) {
        setLoading(false);
        return;
      }

      const traineeIds = outcomes.map((o) => o.trainee_id);
      const { data: trainees } = await supabase
        .from('trainees')
        .select('*')
        .in('id', traineeIds);

      const items: ReviewQueueItem[] = [];
      for (const o of outcomes) {
        const t = trainees?.find((t) => t.id === o.trainee_id);
        if (t) items.push({ trainee: t, outcome: o });
      }
      setReviewQueue(items);
      setLoading(false);
    })();
  }, []);

  const metrics = getOverviewMetrics(rahulVerified);
  const outcomeDistribution = getOverviewDistribution(rahulVerified);

  const kpiCards = [
    {
      label: 'Total Tracked',
      value: metrics.total_tracked,
      icon: Users,
      color: 'text-navy-700',
      bg: 'bg-navy-50',
      border: 'border-navy-200',
    },
    {
      label: 'Verified Outcomes',
      value: metrics.verified,
      icon: CheckCircle2,
      color: 'text-emerald-700',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
    },
    {
      label: 'Review Required',
      value: metrics.review_required,
      icon: AlertTriangle,
      color: 'text-amber-700',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
    },
    {
      label: 'Undetermined',
      value: metrics.undetermined,
      icon: HelpCircle,
      color: 'text-slate-600',
      bg: 'bg-slate-100',
      border: 'border-slate-300',
    },
  ];

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-800">Overview</h1>
          <p className="text-sm text-slate-500 mt-1">
            State-level outcome intelligence dashboard · Updated {new Date(DEMO_CURRENT_DATE).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-xs font-semibold text-amber-700">DEMO ENVIRONMENT</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className={`card p-5 ${kpi.border}`}>
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2.5 rounded-lg ${kpi.bg}`}>
                  <Icon className={`w-5 h-5 ${kpi.color}`} />
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-800 tabular-nums">
                {kpi.value.toLocaleString('en-IN')}
              </p>
              <p className="text-sm text-slate-500 mt-1">{kpi.label}</p>
            </div>
          );
        })}
      </div>

      {/* Outcome Distribution + Review Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Distribution */}
        <div className="card p-5 lg:col-span-1">
          <h2 className="text-sm font-semibold text-navy-800 mb-4">Outcome Distribution</h2>
          <div className="space-y-4">
            {outcomeDistribution.map((d) => {
              const pct = ((d.value / metrics.total_tracked) * 100).toFixed(1);
              return (
                <div key={d.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-slate-600">{d.label}</span>
                    <span className="text-sm font-semibold text-slate-800 tabular-nums">
                      {d.value.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, backgroundColor: d.color }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{pct}% of total</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Review Queue */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-navy-800">Recent Review Queue</h2>
            <button
              onClick={() => onNavigate('followup')}
              className="text-xs font-medium text-navy-600 hover:text-navy-800 flex items-center gap-1 transition-colors"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 rounded-lg bg-slate-50 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {reviewQueue.map(({ trainee, outcome }) => (
                <button
                  key={trainee.id}
                  onClick={() => onTraineeSelect(trainee)}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 card-hover text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-navy-100 flex items-center justify-center text-navy-700 font-semibold text-sm shrink-0">
                      {trainee.display_name.split(' ').map((n) => n[0]).join('')}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{trainee.display_name}</p>
                      <p className="text-xs text-slate-500">
                        {trainee.trainee_code} · {trainee.occupation} · {trainee.current_district}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 hidden sm:block">
                      {new Date(outcome.as_of_date).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                      })}
                    </span>
                    <StatusBadge status={outcome.state} />
                    <ArrowRight className="w-4 h-4 text-slate-300" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* District + Provider tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* District monitoring */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-4 h-4 text-navy-600" />
            <h2 className="text-sm font-semibold text-navy-800">District Monitoring</h2>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left text-xs font-medium text-slate-500 pb-2">District</th>
                <th className="text-right text-xs font-medium text-slate-500 pb-2">Review %</th>
                <th className="text-right text-xs font-medium text-slate-500 pb-2">Undet. %</th>
                <th className="text-right text-xs font-medium text-slate-500 pb-2">Follow-up</th>
              </tr>
            </thead>
            <tbody>
              {DISTRICT_DATA.map((d) => (
                <tr key={d.district} className="border-b border-slate-100 last:border-0">
                  <td className="py-2.5 text-sm font-medium text-slate-700">{d.district}</td>
                  <td className="py-2.5 text-sm text-right tabular-nums">
                    <span className={d.reviewRate > 20 ? 'text-amber-600 font-semibold' : 'text-slate-600'}>
                      {d.reviewRate}%
                    </span>
                  </td>
                  <td className="py-2.5 text-sm text-right tabular-nums text-slate-600">
                    {d.undeterminedRate}%
                  </td>
                  <td className="py-2.5 text-sm text-right tabular-nums text-slate-600">
                    {d.followUpCompletion}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Provider monitoring */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-4 h-4 text-navy-600" />
            <h2 className="text-sm font-semibold text-navy-800">
              Provider Monitoring
              <span className="ml-2 text-xs font-normal text-slate-400">(context view, not a ranking)</span>
            </h2>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left text-xs font-medium text-slate-500 pb-2">Provider</th>
                <th className="text-right text-xs font-medium text-slate-500 pb-2">Cohort</th>
                <th className="text-right text-xs font-medium text-slate-500 pb-2">Reported</th>
                <th className="text-right text-xs font-medium text-slate-500 pb-2">Verified</th>
                <th className="text-right text-xs font-medium text-slate-500 pb-2">Review %</th>
              </tr>
            </thead>
            <tbody>
              {PROVIDER_DATA.map((p) => (
                <tr key={p.provider} className="border-b border-slate-100 last:border-0">
                  <td className="py-2.5 text-sm font-medium text-slate-700">{p.provider}</td>
                  <td className="py-2.5 text-sm text-right tabular-nums text-slate-600">
                    {p.cohort.toLocaleString('en-IN')}
                  </td>
                  <td className="py-2.5 text-sm text-right tabular-nums text-slate-600">
                    {p.reported.toLocaleString('en-IN')}
                  </td>
                  <td className="py-2.5 text-sm text-right tabular-nums text-slate-600">
                    {p.verified.toLocaleString('en-IN')}
                  </td>
                  <td className="py-2.5 text-sm text-right tabular-nums">
                    <span className={p.reviewRate > 20 ? 'text-amber-600 font-semibold' : 'text-slate-600'}>
                      {p.reviewRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-slate-100 border border-slate-200">
        <TrendingUp className="w-4 h-4 text-slate-400 shrink-0" />
        <p className="text-xs text-slate-500">
          Dashboard metrics are synthetic aggregate values for demonstration and update consistently during the Rahul Sharma workflow.
        </p>
      </div>
    </div>
  );
}
